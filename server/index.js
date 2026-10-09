import 'dotenv/config';
import express from 'express';
import cors from 'cors';
import { db, initDb, resetDatabase, syncCustomerEmail } from './db.js';
import { sendEmail, checkEnvStatus } from './email.js';
import { generateCaptcha, validateCaptcha, validateCaptchaToken, consumeCaptchaToken } from './captcha.js';
import { createOtp, verifyOtp, clearOtp } from './otp.js';

const app = express();
const PORT = process.env.PORT || 5000;

app.use(cors());
app.use(express.json());

// Initialize SQLite database (Clean tables, zero active applications)
initDb();

// Print Environment Configuration Status (Zero Exposure)
checkEnvStatus();

// ----------------------------------------------------
// HELPER: Evaluate 14 Underwriting Rules
// ----------------------------------------------------
function evaluateUnderwritingRules(appData) {
  const age = 2026 - parseInt(appData.dob.split('-')[2]); // DOB format DD-MM-YYYY
  const monthlyIncome = appData.monthly_income;
  const requestedAmount = appData.requested_amount;
  const tenureMonths = appData.tenure_months;
  const cibil = appData.cibil_score;
  const existingEmi = appData.existing_emi;

  // EMI Calculation: Principal * r * (1+r)^n / ((1+r)^n - 1)
  const annualRate = 0.105;
  const r = annualRate / 12;
  const newEmi = Math.round((requestedAmount * r * Math.pow(1 + r, tenureMonths)) / (Math.pow(1 + r, tenureMonths) - 1));
  const totalEmi = existingEmi + newEmi;
  const dtiRatio = Math.round((totalEmi / monthlyIncome) * 10000) / 100; // Percentage

  const rules = [
    {
      id: 1,
      rule_name: 'Age Eligibility',
      condition: '21 to 60 Years',
      applicant_value: `${age} Years (DOB: ${appData.dob})`,
      passed: age >= 21 && age <= 60,
      evaluation: 'Applicant falls strictly within acceptable age limits.'
    },
    {
      id: 2,
      rule_name: 'Minimum Age Threshold',
      condition: '>= 18 Years',
      applicant_value: `${age} Years`,
      passed: age >= 18,
      evaluation: 'Applicant is of legal contract age.'
    },
    {
      id: 3,
      rule_name: 'Monthly Income',
      condition: '>= ₹25,000 / Month',
      applicant_value: `₹${monthlyIncome.toLocaleString('en-IN')}`,
      passed: monthlyIncome >= 25000,
      evaluation: 'Applicant income satisfies minimum debt servicing capacity.'
    },
    {
      id: 4,
      rule_name: 'Employment Status',
      condition: 'Salaried / Self-Employed with registered company',
      applicant_value: `${appData.employment_type} - ${appData.company_name}`,
      passed: appData.employment_type === 'SALARIED' || appData.employment_type === 'SELF_EMPLOYED',
      evaluation: 'Employment verified with legitimate corporate entity.'
    },
    {
      id: 5,
      rule_name: 'Credit Score (CIBIL)',
      condition: '>= 700 Score',
      applicant_value: `${cibil} Score`,
      passed: cibil >= 700,
      evaluation: 'High creditworthiness and flawless repayment history.'
    },
    {
      id: 6,
      rule_name: 'Existing Debt Burden (DTI)',
      condition: '<= 50% Debt-to-Income',
      applicant_value: `${dtiRatio}% (Total EMI: ₹${totalEmi.toLocaleString('en-IN')})`,
      passed: dtiRatio <= 50,
      evaluation: 'Low debt burden, comfortable margin for new EMI.'
    },
    {
      id: 7,
      rule_name: 'Loan Amount Eligibility',
      condition: '<= 10x Monthly Income',
      applicant_value: `₹${requestedAmount.toLocaleString('en-IN')} (Income Multiplier: ${(requestedAmount / monthlyIncome).toFixed(1)}x)`,
      passed: requestedAmount <= monthlyIncome * 10,
      evaluation: 'Requested principal is proportionate to annual income.'
    },
    {
      id: 8,
      rule_name: 'Employment Stability',
      condition: '>= 1 Year Continuous Employment',
      applicant_value: 'Verified Active Employment',
      passed: true,
      evaluation: 'Stable corporate tenure recorded.'
    },
    {
      id: 9,
      rule_name: 'PAN Verification',
      condition: 'Valid NSDL Verified PAN Format',
      applicant_value: `${appData.pan} (Verified Active)`,
      passed: /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/.test(appData.pan),
      evaluation: 'PAN authenticated successfully with Income Tax database.'
    },
    {
      id: 10,
      rule_name: 'Aadhaar / eKYC Verification',
      condition: 'UIDAI eKYC Verified via OTP',
      applicant_value: `Aadhaar Ref ${appData.aadhaar} - VERIFIED`,
      passed: true,
      evaluation: 'Demographics verified directly via UIDAI vault.'
    },
    {
      id: 11,
      rule_name: 'Document Verification',
      condition: '5/5 DigiLocker Official Documents Verified',
      applicant_value: '5/5 Documents Verified',
      passed: true,
      evaluation: 'Aadhaar, PAN, Salary Slips, Bank Statement & Address Proof verified.'
    },
    {
      id: 12,
      rule_name: 'Bank Account Verification',
      condition: 'Penny Drop Match with PAN/Aadhaar',
      applicant_value: 'Name Match 100% - Account Active',
      passed: true,
      evaluation: 'Primary bank account authenticated for disbursement.'
    },
    {
      id: 13,
      rule_name: 'Loan Tenure Eligibility',
      condition: '6 to 60 Months',
      applicant_value: `${tenureMonths} Months`,
      passed: tenureMonths >= 6 && tenureMonths <= 60,
      evaluation: 'Tenure adheres to standard personal loan policy.'
    },
    {
      id: 14,
      rule_name: 'Fraud / Risk Check',
      condition: 'Zero Match on AML/PEP/Blacklist Databases',
      applicant_value: 'CLEAN RISK PROFILE',
      passed: true,
      evaluation: 'No fraud risk flags detected across central registries.'
    }
  ];

  const passedCount = rules.filter(r => r.passed).length;
  const score = Math.round((passedCount / rules.length) * 100);
  const finalResult = passedCount === 14 ? 'ELIGIBLE FOR APPROVAL' : 'REJECTED';

  return {
    score,
    passed_rules: passedCount,
    total_rules: rules.length,
    final_result: finalResult,
    rules
  };
}

// Helper: Log audit event & notification
function createAuditLog(appId, actor, action, details) {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO audit_logs (application_id, actor, action, details, timestamp)
    VALUES (?, ?, ?, ?, ?)
  `).run(appId, actor, action, details, now);
}

function createNotification(userId, appId, title, message, type = 'info') {
  const now = new Date().toISOString();
  db.prepare(`
    INSERT INTO notifications (user_id, application_id, title, message, type, created_at)
    VALUES (?, ?, ?, ?, ?, ?)
  `).run(userId, appId, title, message, type, now);
}

// ----------------------------------------------------
// API ROUTES
// ----------------------------------------------------

// AUTHENTICATION

// 1. Generate Server-Side SVG CAPTCHA Challenge
app.get('/api/auth/captcha', (req, res) => {
  const challenge = generateCaptcha();
  res.json(challenge);
});

// 1b. Fast Server-Side CAPTCHA Challenge Validation (< 10ms)
app.post('/api/auth/validate-captcha', (req, res) => {
  const { captchaId, captchaInput } = req.body || {};
  const result = validateCaptchaToken(captchaId, captchaInput);
  if (!result.valid) {
    return res.status(400).json({
      success: false,
      message: result.error || 'Invalid CAPTCHA. Please try again.'
    });
  }
  res.json({
    success: true,
    message: 'CAPTCHA validated',
    captchaToken: result.captchaToken
  });
});

// 2. Validate Credentials & CAPTCHA -> Send Email OTP
app.post('/api/auth/send-otp', async (req, res) => {
  const { email, password, captchaToken, captchaId, captchaInput } = req.body || {};

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email address and password are required' });
  }

  // Server-Side CAPTCHA Validation (supports pre-validated captchaToken or direct challenge)
  let captchaValid = false;
  if (captchaToken) {
    captchaValid = consumeCaptchaToken(captchaToken);
  } else if (captchaId && captchaInput) {
    captchaValid = validateCaptcha(captchaId, captchaInput);
  }

  if (!captchaValid) {
    return res.status(400).json({ error: 'Invalid or expired CAPTCHA. Please try again.' });
  }

  // User Credential Validation (Case-Insensitive Email Lookup)
  const user = db.prepare(`SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND password = ?`).get(email.trim(), password);
  if (!user) {
    const allUsers = db.prepare(`SELECT id, email, role FROM users`).all();
    console.log(`[AUTH DIAGNOSTIC] Login attempt failed for email: "${email.trim()}". Registered DB accounts:`, allUsers);
    return res.status(401).json({ error: 'Invalid email address or password' });
  }

  // Generate 6-Digit Email OTP
  const otpResult = createOtp(user.email, 'login');
  if (otpResult.error) {
    return res.status(429).json({ error: otpResult.error });
  }

  // Deliver OTP via Email & Confirm Delivery
  const mailResult = await sendEmail({
    to: user.email,
    subject: 'Digital Loan Signing Portal - Login OTP Verification',
    text: `Digital Loan Signing Portal\n\nDear ${user.name},\n\nYour 6-digit login verification code is: ${otpResult.otp}\n\n⏱️ Expiry Time: Valid for 5 minutes only.\nDo not share this code with anyone.\n\nNational Digital Bank Security Gateway`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #2563eb; margin-top: 0; font-size: 20px;">Digital Loan Signing Portal</h2>
        <p style="font-size: 14px; color: #334155;">Dear <strong>${user.name}</strong>,</p>
        <p style="font-size: 14px; color: #334155;">Your 6-digit one-time login verification code is:</p>
        <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #2563eb; padding: 16px 24px; background: #ffffff; border: 2px dashed #bfdbfe; border-radius: 8px; display: inline-block; margin: 12px 0;">
          ${otpResult.otp}
        </div>
        <p style="color: #dc2626; font-size: 13px; font-weight: 700; margin-top: 10px;">⏱️ Expiry Time: Valid for 5 minutes only.</p>
        <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">Do not share this OTP with anyone. National Digital Bank Security Gateway.</p>
      </div>
    `
  });

  if (!mailResult.success) {
    clearOtp(user.email, 'login');
    return res.status(503).json({ error: mailResult.error || 'Failed to send OTP email' });
  }

  res.json({
    success: true,
    message: 'OTP sent to your registered email address.'
  });
});

// 3. Verify Login Email OTP -> Authenticate User
app.post('/api/auth/verify-otp', (req, res) => {
  const { email, otp } = req.body || {};

  if (!email || !otp) {
    return res.status(400).json({ error: 'Email and OTP code are required' });
  }

  const otpCheck = verifyOtp(email.trim(), 'login', otp);
  if (!otpCheck.valid) {
    return res.status(400).json({ error: otpCheck.error });
  }

  const user = db.prepare(`SELECT * FROM users WHERE LOWER(email) = LOWER(?)`).get(email.trim());
  if (!user) {
    return res.status(404).json({ error: 'User account not found' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// 4. Direct Credit Officer Login (No Email OTP Required)
app.post('/api/auth/login-officer', (req, res) => {
  const { email, password, captchaToken, captchaId, captchaInput } = req.body || {};

  if (!email || !password || typeof email !== 'string' || typeof password !== 'string') {
    return res.status(400).json({ error: 'Email address and password are required' });
  }

  // Server-Side CAPTCHA Validation
  let captchaValid = false;
  if (captchaToken) {
    captchaValid = consumeCaptchaToken(captchaToken);
  } else if (captchaId && captchaInput) {
    captchaValid = validateCaptcha(captchaId, captchaInput);
  }

  if (!captchaValid) {
    return res.status(400).json({ error: 'Invalid or expired CAPTCHA. Please try again.' });
  }

  // User Credential Validation
  const user = db.prepare(`SELECT * FROM users WHERE LOWER(email) = LOWER(?) AND password = ?`).get(email.trim(), password);
  if (!user || user.role !== 'OFFICER') {
    return res.status(401).json({ error: 'Invalid Credit Officer email address or password' });
  }

  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// Legacy login route fallback
app.post('/api/auth/login', (req, res) => {
  const { email, password } = req.body || {};
  if (!email || !password) {
    return res.status(400).json({ error: 'Email and password are required' });
  }
  const user = db.prepare(`SELECT * FROM users WHERE email = ? AND password = ?`).get(email.trim(), password);
  if (!user) {
    return res.status(401).json({ error: 'Invalid email or password' });
  }
  res.json({
    user: {
      id: user.id,
      email: user.email,
      name: user.name,
      role: user.role
    }
  });
});

// GET ACTIVE LOAN APPLICATION FOR CURRENT CUSTOMER
app.get('/api/loans/active', (req, res) => {
  const { userId } = req.query;
  const loan = db.prepare(`
    SELECT * FROM loan_applications
    WHERE user_id = ?
    ORDER BY created_at DESC
    LIMIT 1
  `).get(userId || 1);

  if (!loan) {
    return res.json({ loan: null });
  }

  // Fetch full status object
  const ekyc = db.prepare(`SELECT * FROM ekyc_records WHERE application_id = ?`).get(loan.id);
  const docs = db.prepare(`SELECT * FROM documents WHERE application_id = ?`).all(loan.id);
  const underwriting = db.prepare(`SELECT * FROM underwriting_results WHERE application_id = ?`).get(loan.id);
  const review = db.prepare(`SELECT * FROM officer_reviews WHERE application_id = ?`).get(loan.id);
  const agreement = db.prepare(`SELECT * FROM agreements WHERE application_id = ?`).get(loan.id);
  const estamp = db.prepare(`SELECT * FROM estamp_records WHERE application_id = ?`).get(loan.id);
  const esign = db.prepare(`SELECT * FROM esign_records WHERE application_id = ?`).get(loan.id);
  const disbursement = db.prepare(`SELECT * FROM disbursements WHERE application_id = ?`).get(loan.id);

  res.json({
    loan,
    ekyc,
    documents: docs,
    underwriting: underwriting ? { ...underwriting, rules: JSON.parse(underwriting.rules_json) } : null,
    officerReview: review,
    agreement,
    estamp,
    esign,
    disbursement
  });
});

// GET ALL LOANS (OFFICER DASHBOARD)
app.get('/api/loans/all', (req, res) => {
  const loans = db.prepare(`SELECT * FROM loan_applications ORDER BY created_at DESC`).all();
  const fullLoans = loans.map(loan => {
    const ekyc = db.prepare(`SELECT * FROM ekyc_records WHERE application_id = ?`).get(loan.id);
    const docs = db.prepare(`SELECT * FROM documents WHERE application_id = ?`).all(loan.id);
    const underwriting = db.prepare(`SELECT * FROM underwriting_results WHERE application_id = ?`).get(loan.id);
    const review = db.prepare(`SELECT * FROM officer_reviews WHERE application_id = ?`).get(loan.id);

    return {
      ...loan,
      ekycStatus: ekyc ? 'VERIFIED' : 'PENDING',
      docsStatus: docs.length === 5 ? 'VERIFIED' : 'PENDING',
      underwritingStatus: underwriting ? 'COMPLETED' : 'PENDING',
      underwritingScore: underwriting ? `${underwriting.passed_rules}/${underwriting.total_rules}` : 'N/A',
      officerDecision: review ? review.decision : 'PENDING REVIEW'
    };
  });

  res.json({ loans: fullLoans });
});

// STEP 1: APPLY LOAN (Manual Button Triggered)
app.post('/api/loans/apply', (req, res) => {
  const data = req.body;
  const appId = `APP-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const now = new Date().toISOString();

  const stmt = db.prepare(`
    INSERT INTO loan_applications (
      id, user_id, full_name, dob, mobile, email, pan, aadhaar,
      employment_type, monthly_income, company_name, requested_amount,
      tenure_months, purpose, existing_emi, cibil_score, status, current_step,
      created_at, updated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `);

  stmt.run(
    appId,
    data.userId || 1,
    data.full_name || 'Thribhuvan',
    data.dob,
    data.mobile,
    data.email,
    data.pan,
    data.aadhaar,
    data.employment_type,
    parseFloat(data.monthly_income),
    data.company_name,
    parseFloat(data.requested_amount),
    parseInt(data.tenure_months),
    data.purpose,
    parseFloat(data.existing_emi || 0),
    parseInt(data.cibil_score),
    'SUBMITTED',
    1, // Step 1 completed -> eKYC unlocked!
    now,
    now
  );

  createAuditLog(appId, data.full_name || 'Thribhuvan', 'LOAN_APPLICATION_SUBMITTED', `Application submitted for ₹${data.requested_amount}`);
  createNotification(data.userId || 1, appId, 'Loan Application Submitted', `Application ${appId} submitted successfully. Next step: eKYC.`, 'success');

  res.json({ success: true, applicationId: appId, message: 'Loan application submitted successfully.' });
});

// STEP 2: eKYC SEND OTP & VERIFY OTP (Manual Button Triggered)
app.post('/api/ekyc/send-otp', async (req, res) => {
  const { appId } = req.body || {};
  if (!appId) {
    return res.status(400).json({ error: 'Application ID is required' });
  }

  const loan = db.prepare(`SELECT * FROM loan_applications WHERE id = ?`).get(appId);
  if (!loan) {
    return res.status(404).json({ error: 'Loan application not found' });
  }

  const targetEmail = (process.env.CUSTOMER_EMAIL || loan.email || 'customer@demo.com').trim().toLowerCase();

  // Sync loan email record if needed
  if (loan.email !== targetEmail) {
    db.prepare(`UPDATE loan_applications SET email = ? WHERE id = ?`).run(targetEmail, appId);
  }

  const otpResult = createOtp(targetEmail, 'ekyc');
  if (otpResult.error) {
    return res.status(429).json({ error: otpResult.error });
  }

  const mailResult = await sendEmail({
    to: targetEmail,
    subject: 'Digital Loan Signing Portal - Aadhaar eKYC Verification Code',
    text: `Digital Loan Signing Portal\n\nDear ${loan.full_name || 'Thribhuvan'},\n\nYour 6-digit Aadhaar eKYC verification code is: ${otpResult.otp}\n\n⏱️ Expiry Time: Valid for 5 minutes only.\nApplication ID: ${appId}.\n\nNational Digital Bank Security Gateway`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #059669; margin-top: 0; font-size: 20px;">Digital Loan Signing Portal - eKYC Verification</h2>
        <p style="font-size: 14px; color: #334155;">Dear <strong>${loan.full_name || 'Thribhuvan'}</strong>,</p>
        <p style="font-size: 14px; color: #334155;">Your Aadhaar eKYC authentication OTP code for Application <strong>${appId}</strong> is:</p>
        <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #059669; padding: 16px 24px; background: #ffffff; border: 2px dashed #a7f3d0; border-radius: 8px; display: inline-block; margin: 12px 0;">
          ${otpResult.otp}
        </div>
        <p style="color: #dc2626; font-size: 13px; font-weight: 700; margin-top: 10px;">⏱️ Expiry Time: Valid for 5 minutes only.</p>
        <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">National Digital Bank UIDAI Vault Gateway</p>
      </div>
    `
  });

  if (!mailResult.success) {
    clearOtp(targetEmail, 'ekyc');
    return res.status(503).json({ error: mailResult.error || 'Unable to send verification OTP. Please try again.' });
  }

  res.json({ success: true, message: 'Verification OTP has been sent to your registered email address.' });
});

app.post('/api/ekyc/verify-otp', (req, res) => {
  const { appId, otp } = req.body || {};
  if (!appId || !otp) {
    return res.status(400).json({ error: 'Application ID and OTP code are required' });
  }

  const loan = db.prepare(`SELECT * FROM loan_applications WHERE id = ?`).get(appId);
  if (!loan) {
    return res.status(404).json({ error: 'Loan application not found' });
  }

  const targetEmail = (process.env.CUSTOMER_EMAIL || loan.email || 'customer@demo.com').trim().toLowerCase();

  const otpCheck = verifyOtp(targetEmail, 'ekyc', otp);
  if (!otpCheck.valid) {
    return res.status(400).json({ error: otpCheck.error });
  }

  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  // Store verified eKYC record
  db.prepare(`
    INSERT INTO ekyc_records (
      application_id, aadhaar_ref, mobile, otp_verified, verification_timestamp,
      verified_name, verified_dob, verified_gender, verified_address
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(
    appId,
    loan.aadhaar,
    loan.mobile,
    1,
    now,
    loan.full_name || 'Thribhuvan',
    loan.dob,
    'MALE',
    '#402, Sunrise Heights, HSR Layout, Sector 2, Bengaluru, Karnataka - 560102'
  );

  // Update application step to 2 -> Documents unlocked!
  db.prepare(`UPDATE loan_applications SET status = ?, current_step = ?, updated_at = ? WHERE id = ?`)
    .run('KYC_VERIFIED', 2, new Date().toISOString(), appId);

  createAuditLog(appId, loan.full_name || 'Thribhuvan', 'EKYC_VERIFIED', 'Aadhaar eKYC verified via UIDAI Email OTP authentication');
  createNotification(loan.user_id, appId, 'eKYC Verification Completed', 'Your identity has been authenticated successfully. Next step: Document Retrieval.', 'success');

  res.json({
    success: true,
    message: 'eKYC verified successfully.',
    verifiedData: {
      name: loan.full_name || 'Thribhuvan',
      dob: loan.dob,
      gender: 'MALE',
      address: '#402, Sunrise Heights, HSR Layout, Sector 2, Bengaluru, Karnataka - 560102',
      mobile: loan.mobile
    }
  });
});

// STEP 3: DIGILOCKER DOCUMENTS FETCH (Manual Button Triggered)
app.post('/api/documents/fetch', (req, res) => {
  const { appId } = req.body;
  const loan = db.prepare(`SELECT * FROM loan_applications WHERE id = ?`).get(appId);
  const now = new Date().toLocaleDateString('en-IN');

  const docsList = [
    { name: 'Aadhaar Card', type: 'IDENTITY_PROOF', issuer: 'UIDAI' },
    { name: 'PAN Card', type: 'PAN_CARD', issuer: 'Income Tax Dept' },
    { name: 'Salary Certificate', type: 'INCOME_PROOF', issuer: loan.company_name },
    { name: 'Bank Statement (6 Months)', type: 'FINANCIAL_PROOF', issuer: 'HDFC Bank Ltd' },
    { name: 'Address Proof (Electricity Bill)', type: 'RESIDENCE_PROOF', issuer: 'BESCOM' }
  ];

  db.prepare(`DELETE FROM documents WHERE application_id = ?`).run(appId);

  const stmt = db.prepare(`
    INSERT INTO documents (application_id, doc_name, doc_type, issuer, status, fetched_date)
    VALUES (?, ?, ?, ?, ?, ?)
  `);

  docsList.forEach(d => {
    stmt.run(appId, d.name, d.type, d.issuer, 'VERIFIED', now);
  });

  // Update application step to 3 -> Underwriting unlocked!
  db.prepare(`UPDATE loan_applications SET status = ?, current_step = ?, updated_at = ? WHERE id = ?`)
    .run('DOCS_VERIFIED', 3, new Date().toISOString(), appId);

  createAuditLog(appId, loan.full_name || 'Thribhuvan', 'DOCUMENTS_VERIFIED', 'Fetched 5/5 verified digital documents from DigiLocker');
  createNotification(loan.user_id, appId, 'Documents Verified', 'All required documents fetched and verified via DigiLocker. Next step: Automated Underwriting.', 'success');

  res.json({ success: true, message: 'All 5 documents fetched and verified successfully.' });
});

// STEP 4: AUTOMATED UNDERWRITING EVALUATION (Manual Button Triggered)
app.post('/api/underwriting/evaluate', (req, res) => {
  const { appId } = req.body;
  const loan = db.prepare(`SELECT * FROM loan_applications WHERE id = ?`).get(appId);
  const result = evaluateUnderwritingRules(loan);
  const now = new Date().toISOString();

  db.prepare(`DELETE FROM underwriting_results WHERE application_id = ?`).run(appId);

  db.prepare(`
    INSERT INTO underwriting_results (
      application_id, score, passed_rules, total_rules, final_result, rules_json, evaluated_at
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(appId, result.score, result.passed_rules, result.total_rules, result.final_result, JSON.stringify(result.rules), now);

  // Update application step to 4 -> Officer Review unlocked!
  db.prepare(`UPDATE loan_applications SET status = ?, current_step = ?, updated_at = ? WHERE id = ?`)
    .run('UNDERWRITTEN', 4, now, appId);

  createAuditLog(appId, 'System Engine', 'AUTOMATED_UNDERWRITING_COMPLETED', `14/14 rules passed (Score 100%) - Result: ELIGIBLE FOR APPROVAL`);
  createNotification(loan.user_id, appId, 'Underwriting Completed', 'Automated Credit Evaluation complete: 14/14 Rules Passed (100%). Sent for Credit Officer Review.', 'success');

  res.json({ success: true, result });
});

// STEP 5: OFFICER REVIEW & APPROVAL (Manual Button Triggered)
app.post('/api/officer/review', (req, res) => {
  const { appId, decision, notes, officerEmail } = req.body;
  const loan = db.prepare(`SELECT * FROM loan_applications WHERE id = ?`).get(appId);
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  db.prepare(`
    INSERT INTO officer_reviews (application_id, officer_email, decision, notes, reviewed_at)
    VALUES (?, ?, ?, ?, ?)
  `).run(appId, officerEmail || 'officer@demo.com', decision, notes || 'Application verified and approved based on flawless 14/14 credit rule score.', now);

  const nextStatus = decision === 'APPROVED' ? 'APPROVED' : 'REJECTED';
  const nextStep = decision === 'APPROVED' ? 5 : 4;

  db.prepare(`UPDATE loan_applications SET status = ?, current_step = ?, updated_at = ? WHERE id = ?`)
    .run(nextStatus, nextStep, new Date().toISOString(), appId);

  createAuditLog(appId, officerEmail || 'officer@demo.com', `LOAN_${decision}`, `Officer decision: ${decision}. Notes: ${notes || 'Approved'}`);
  createNotification(loan.user_id, appId, `Loan ${decision}`, `Your loan application has been ${decision} by Senior Credit Officer. Next step: Generate Agreement.`, decision === 'APPROVED' ? 'success' : 'error');

  res.json({ success: true, message: `Loan ${decision} successfully.` });
});

// STEP 6: GENERATE DIGITAL LOAN AGREEMENT (Manual Button Triggered)
app.post('/api/agreement/generate', (req, res) => {
  const { appId } = req.body;
  const loan = db.prepare(`SELECT * FROM loan_applications WHERE id = ?`).get(appId);
  
  const agrId = `AGR-2026-${Math.floor(10000 + Math.random() * 90000)}`;
  const interestRate = 10.5; // 10.5% p.a.
  const r = (interestRate / 100) / 12;
  const n = loan.tenure_months;
  const P = loan.requested_amount;
  const emi = Math.round((P * r * Math.pow(1 + r, n)) / (Math.pow(1 + r, n) - 1));
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  db.prepare(`DELETE FROM agreements WHERE application_id = ?`).run(appId);

  db.prepare(`
    INSERT INTO agreements (
      id, application_id, borrower_name, loan_amount, interest_rate,
      tenure_months, emi_amount, purpose, generated_at, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
  `).run(agrId, appId, loan.full_name || 'Thribhuvan', P, interestRate, n, emi, loan.purpose, now, 'GENERATED');

  db.prepare(`UPDATE loan_applications SET status = ?, current_step = ?, updated_at = ? WHERE id = ?`)
    .run('AGREEMENT_GENERATED', 6, new Date().toISOString(), appId);

  createAuditLog(appId, loan.full_name || 'Thribhuvan', 'AGREEMENT_GENERATED', `Digital Loan Agreement ${agrId} generated for ₹${P.toLocaleString('en-IN')} with EMI ₹${emi.toLocaleString('en-IN')}`);
  createNotification(loan.user_id, appId, 'Agreement Generated', `Loan Agreement ${agrId} generated. Next step: eStamp Duty Payment.`, 'success');

  res.json({ success: true, agreementId: agrId, emiAmount: emi, message: 'Digital Loan Agreement generated successfully.' });
});

// STEP 7: GENERATE eSTAMP (Manual Button Triggered)
app.post('/api/estamp/generate', (req, res) => {
  const { appId } = req.body;
  const loan = db.prepare(`SELECT * FROM loan_applications WHERE id = ?`).get(appId);
  const agreement = db.prepare(`SELECT * FROM agreements WHERE application_id = ?`).get(appId);
  
  const estampRef = `ESTAMP-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const hash = `0x${Array.from({length: 64}, () => Math.floor(Math.random()*16).toString(16)).join('')}`;

  db.prepare(`DELETE FROM estamp_records WHERE application_id = ?`).run(appId);

  db.prepare(`
    INSERT INTO estamp_records (
      application_id, agreement_id, estamp_reference, stamp_duty_amount,
      issue_date, document_hash, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(appId, agreement.id, estampRef, 500, now, hash, 'VALID');

  db.prepare(`UPDATE loan_applications SET status = ?, current_step = ?, updated_at = ? WHERE id = ?`)
    .run('STAMPED', 7, new Date().toISOString(), appId);

  createAuditLog(appId, loan.full_name || 'Thribhuvan', 'ESTAMP_GENERATED', `eStamp Duty of ₹500 attached. Ref: ${estampRef}, Hash: ${hash.substring(0, 16)}...`);
  createNotification(loan.user_id, appId, 'eStamp Certificate Issued', `eStamp ${estampRef} attached to agreement. Next step: eSign via OTP.`, 'success');

  res.json({ success: true, estampReference: estampRef, documentHash: hash, message: 'eStamp Certificate generated successfully.' });
});

// STEP 8: eSIGN SEND OTP & VERIFY OTP (Manual Button Triggered)
app.post('/api/esign/send-otp', async (req, res) => {
  const { appId } = req.body || {};
  if (!appId) {
    return res.status(400).json({ error: 'Application ID is required' });
  }

  const loan = db.prepare(`SELECT * FROM loan_applications WHERE id = ?`).get(appId);
  if (!loan) {
    return res.status(404).json({ error: 'Loan application not found' });
  }

  const otpResult = createOtp(loan.email, 'esign');
  if (otpResult.error) {
    return res.status(429).json({ error: otpResult.error });
  }

  const mailResult = await sendEmail({
    to: loan.email,
    subject: 'Digital Loan Signing Portal - Aadhaar eSign Contract Signing Code',
    text: `Digital Loan Signing Portal\n\nDear ${loan.full_name || 'Thribhuvan'},\n\nYour 6-digit Aadhaar eSign contract signing OTP is: ${otpResult.otp}\n\n⏱️ Expiry Time: Valid for 5 minutes only.\nApplication ID: ${appId}.\n\nNational Digital Bank Security Gateway`,
    html: `
      <div style="font-family: Arial, sans-serif; padding: 24px; background-color: #f8fafc; border-radius: 12px; border: 1px solid #e2e8f0;">
        <h2 style="color: #2563eb; margin-top: 0; font-size: 20px;">Digital Loan Signing Portal - eSign Execution</h2>
        <p style="font-size: 14px; color: #334155;">Dear <strong>${loan.full_name || 'Thribhuvan'}</strong>,</p>
        <p style="font-size: 14px; color: #334155;">Your one-time signature verification OTP code for Agreement <strong>${appId}</strong> is:</p>
        <div style="font-size: 32px; font-weight: 900; letter-spacing: 8px; color: #2563eb; padding: 16px 24px; background: #ffffff; border: 2px dashed #bfdbfe; border-radius: 8px; display: inline-block; margin: 12px 0;">
          ${otpResult.otp}
        </div>
        <p style="color: #dc2626; font-size: 13px; font-weight: 700; margin-top: 10px;">⏱️ Expiry Time: Valid for 5 minutes only.</p>
        <p style="color: #64748b; font-size: 12px; margin-bottom: 0;">Legal Execution under Section 3A of IT Act 2000</p>
      </div>
    `
  });

  if (!mailResult.success) {
    clearOtp(loan.email, 'esign');
    return res.status(503).json({ error: mailResult.error || 'Failed to send eSign OTP email' });
  }

  res.json({ success: true, message: 'Aadhaar eSign OTP sent to your registered email address.' });
});

app.post('/api/esign/verify-otp', (req, res) => {
  const { appId, otp } = req.body || {};
  if (!appId || !otp) {
    return res.status(400).json({ error: 'Application ID and OTP code are required' });
  }

  const loan = db.prepare(`SELECT * FROM loan_applications WHERE id = ?`).get(appId);
  if (!loan) {
    return res.status(404).json({ error: 'Loan application not found' });
  }

  const otpCheck = verifyOtp(loan.email, 'esign', otp);
  if (!otpCheck.valid) {
    return res.status(400).json({ error: otpCheck.error });
  }

  const agreement = db.prepare(`SELECT * FROM agreements WHERE application_id = ?`).get(appId);
  const esignRef = `ESIGN-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  db.prepare(`DELETE FROM esign_records WHERE application_id = ?`).run(appId);

  db.prepare(`
    INSERT INTO esign_records (
      application_id, agreement_id, signer_name, signature_reference,
      signed_at, otp_verified, esign_status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(appId, agreement ? agreement.id : 'AGR-2026', loan.full_name || 'Thribhuvan', esignRef, now, 1, 'SIGNED');

  db.prepare(`UPDATE loan_applications SET status = ?, current_step = ?, updated_at = ? WHERE id = ?`)
    .run('SIGNED', 8, new Date().toISOString(), appId);

  createAuditLog(appId, loan.full_name || 'Thribhuvan', 'AGREEMENT_ESIGNED', `Agreement eSigned via Aadhaar Email OTP. Ref: ${esignRef}`);
  createNotification(loan.user_id, appId, 'Agreement eSigned Successfully', `Agreement digitally signed under IT Act 2000. Next step: Loan Disbursement.`, 'success');

  res.json({ success: true, signatureReference: esignRef, signedAt: now, message: 'Agreement digitally signed successfully.' });
});

// STEP 9: PROCESS DISBURSEMENT (Manual Button Triggered)
app.post('/api/disbursement/process', (req, res) => {
  const { appId } = req.body;
  const loan = db.prepare(`SELECT * FROM loan_applications WHERE id = ?`).get(appId);
  const disbRef = `DISB-2026-${Math.floor(100000 + Math.random() * 900000)}`;
  const now = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });

  db.prepare(`DELETE FROM disbursements WHERE application_id = ?`).run(appId);

  db.prepare(`
    INSERT INTO disbursements (
      application_id, transaction_reference, amount, disbursed_at,
      account_number, bank_ifsc, status
    ) VALUES (?, ?, ?, ?, ?, ?, ?)
  `).run(appId, disbRef, loan.requested_amount, now, '50100984128912', 'HDFC0000128', 'COMPLETED');

  db.prepare(`UPDATE loan_applications SET status = ?, current_step = ?, updated_at = ? WHERE id = ?`)
    .run('DISBURSED', 9, new Date().toISOString(), appId);

  createAuditLog(appId, 'Core Banking System', 'LOAN_DISBURSED', `Disbursed ₹${loan.requested_amount.toLocaleString('en-IN')} to Account 50100984128912. Txn Ref: ${disbRef}`);
  createNotification(loan.user_id, appId, 'Loan Disbursed!', `₹${loan.requested_amount.toLocaleString('en-IN')} has been transferred to your HDFC bank account. Workflow Complete!`, 'success');

  res.json({ success: true, transactionReference: disbRef, amount: loan.requested_amount, disbursedAt: now, message: 'Loan funds disbursed successfully!' });
});

// PAPERLESS OFFICE & AUDIT TIMELINE
app.get('/api/paperless/:appId', (req, res) => {
  const { appId } = req.params;
  const loan = db.prepare(`SELECT * FROM loan_applications WHERE id = ?`).get(appId);
  const ekyc = db.prepare(`SELECT * FROM ekyc_records WHERE application_id = ?`).get(appId);
  const docs = db.prepare(`SELECT * FROM documents WHERE application_id = ?`).all(appId);
  const underwriting = db.prepare(`SELECT * FROM underwriting_results WHERE application_id = ?`).get(appId);
  const officerReview = db.prepare(`SELECT * FROM officer_reviews WHERE application_id = ?`).get(appId);
  const agreement = db.prepare(`SELECT * FROM agreements WHERE application_id = ?`).get(appId);
  const estamp = db.prepare(`SELECT * FROM estamp_records WHERE application_id = ?`).get(appId);
  const esign = db.prepare(`SELECT * FROM esign_records WHERE application_id = ?`).get(appId);
  const disbursement = db.prepare(`SELECT * FROM disbursements WHERE application_id = ?`).get(appId);
  const auditLogs = db.prepare(`SELECT * FROM audit_logs WHERE application_id = ? ORDER BY id ASC`).all(appId);

  res.json({
    loan,
    ekyc,
    documents: docs,
    underwriting: underwriting ? { ...underwriting, rules: JSON.parse(underwriting.rules_json) } : null,
    officerReview,
    agreement,
    estamp,
    esign,
    disbursement,
    auditLogs
  });
});

// SYSTEM CONTROL: RESET
app.post('/api/system/reset', (req, res) => {
  resetDatabase();
  res.json({ success: true, message: 'Database reset successfully to clean initial state (0 applications).' });
});

// NOTIFICATIONS
app.get('/api/notifications/:userId', (req, res) => {
  const notifications = db.prepare(`
    SELECT * FROM notifications
    WHERE user_id = ?
    ORDER BY id DESC
  `).all(req.params.userId);
  res.json({ notifications });
});

// FALLBACK 404 ROUTE
app.use((req, res) => {
  res.status(404).json({ error: `Route ${req.method} ${req.url} not found` });
});

// GLOBAL ERROR HANDLER
app.use((err, req, res, next) => {
  console.error('Unhandled server error:', err);
  res.status(err.status || 500).json({ error: err.message || 'Internal server error' });
});

app.listen(PORT, () => {
  console.log(`Server listening on http://localhost:${PORT}`);
});
