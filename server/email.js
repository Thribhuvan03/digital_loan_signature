import 'dotenv/config';
import nodemailer from 'nodemailer';

export function checkEnvStatus() {
  const host = process.env.MAIL_HOST;
  const port = process.env.MAIL_PORT;
  const user = process.env.MAIL_USER?.trim();
  const pass = process.env.MAIL_PASSWORD?.trim().replace(/\s+/g, '');
  const from = process.env.MAIL_FROM;
  const customerEmail = process.env.CUSTOMER_EMAIL?.trim();

  console.log('\n====================================================');
  console.log('[ENVIRONMENT CONFIGURATION STATUS]');
  console.log('MAIL_HOST:', host ? 'PRESENT' : 'MISSING');
  console.log('MAIL_PORT:', port ? 'PRESENT' : 'MISSING');
  console.log('MAIL_USER:', user ? 'PRESENT' : 'MISSING');
  console.log('MAIL_PASSWORD:', pass ? 'PRESENT' : 'MISSING');
  console.log('MAIL_FROM:', from ? 'PRESENT' : 'MISSING');
  console.log('CUSTOMER_EMAIL:', customerEmail ? 'PRESENT' : 'MISSING');
  console.log('====================================================\n');
}

let cachedTransporter = null;
let cachedTransporterKey = '';

function getTransporter(host, port, user, pass, isGmail) {
  const key = `${host}:${port}:${user}:${isGmail}`;
  if (cachedTransporter && cachedTransporterKey === key) {
    return cachedTransporter;
  }

  cachedTransporter = nodemailer.createTransport(
    isGmail
      ? {
          service: 'gmail',
          auth: { user, pass }
        }
      : {
          host,
          port,
          secure: port === 465,
          auth: { user, pass },
          tls: { rejectUnauthorized: false }
        }
  );
  cachedTransporterKey = key;
  return cachedTransporter;
}

export async function sendEmail({ to, subject, html, text }) {
  const host = (process.env.MAIL_HOST || 'smtp.gmail.com').toLowerCase();
  const port = parseInt(process.env.MAIL_PORT || '587', 10);
  const user = process.env.MAIL_USER?.trim();
  const pass = process.env.MAIL_PASSWORD?.trim().replace(/\s+/g, '');
  const from = process.env.MAIL_FROM || `"Digital Loan Signing Portal" <${user}>`;

  const timestamp = new Date().toLocaleString('en-IN', { timeZone: 'Asia/Kolkata' });
  const maskedTo = to ? `${to.charAt(0)}*****@${to.split('@')[1] || ''}` : 'unknown';
  const maskedUser = user ? `${user.charAt(0)}*****@${user.split('@')[1] || ''}` : 'NOT CONFIGURED';

  console.log(`\n====================================================`);
  console.log(`[SMTP DIAGNOSTIC] Time: ${timestamp}`);
  console.log(`[SMTP DIAGNOSTIC] Target Recipient: ${maskedTo}`);
  console.log(`[SMTP DIAGNOSTIC] Host: ${host}:${port} | Auth User: ${maskedUser}`);

  // Check if SMTP credentials are provided
  if (!user || !pass) {
    console.error(`[SMTP ERROR] MAIL_USER or MAIL_PASSWORD missing in .env file.`);
    console.log(`====================================================\n`);
    return {
      success: false,
      error: 'SMTP credentials (MAIL_USER and MAIL_PASSWORD) are not configured in .env file. Please add your email credentials to .env.'
    };
  }

  try {
    const isGmail = host.includes('gmail');
    const transporter = getTransporter(host, port, user, pass, isGmail);

    // Dispatch Email
    const info = await transporter.sendMail({
      from,
      to,
      subject,
      text,
      html: html || `<p>${text}</p>`
    });

    console.log(`[SMTP SUCCESS] Email delivered via SMTP! Message ID: ${info.messageId}`);
    if (info.accepted && info.accepted.length > 0) {
      console.log(`[SMTP SUCCESS] Accepted by mail server:`, info.accepted);
    }
    console.log(`====================================================\n`);
    return { success: true, messageId: info.messageId, accepted: info.accepted };
  } catch (err) {
    console.error(`[SMTP ERROR] Failed to send email: ${err.message}`);
    console.log(`====================================================\n`);
    return {
      success: false,
      error: `SMTP Delivery Error: ${err.message}. Please verify your email host, port, user, and App Password in .env.`
    };
  }
}
