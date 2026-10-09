import 'dotenv/config';
import { DatabaseSync } from 'node:sqlite';
import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);
const dbPath = path.join(__dirname, 'database.db');

export const db = new DatabaseSync(dbPath);

export function syncCustomerEmail() {
  const customerEmail = (process.env.CUSTOMER_EMAIL || 'customer@demo.com').trim().toLowerCase();
  if (!customerEmail) return;

  const existingCustomer = db.prepare(`SELECT * FROM users WHERE role = 'CUSTOMER' OR id = 1`).get();
  if (existingCustomer) {
    db.prepare(`UPDATE users SET email = ?, password = 'demo123', name = 'Thribhuvan' WHERE id = ?`).run(customerEmail, existingCustomer.id);
  } else {
    const now = new Date().toISOString();
    db.prepare(`INSERT INTO users (email, password, name, role, created_at) VALUES (?, ?, ?, ?, ?)`).run(customerEmail, 'demo123', 'Thribhuvan', 'CUSTOMER', now);
  }

  try {
    db.prepare(`UPDATE loan_applications SET email = ?, full_name = 'Thribhuvan'`).run(customerEmail);
  } catch (err) {
    // Ignore if table does not exist yet during initial boot
  }
}

// Initialize Tables
export function initDb() {
  db.exec(`
    CREATE TABLE IF NOT EXISTS users (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      email TEXT UNIQUE NOT NULL,
      password TEXT NOT NULL,
      name TEXT NOT NULL,
      role TEXT NOT NULL,
      created_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS loan_applications (
      id TEXT PRIMARY KEY,
      user_id INTEGER,
      full_name TEXT NOT NULL,
      dob TEXT NOT NULL,
      mobile TEXT NOT NULL,
      email TEXT NOT NULL,
      pan TEXT NOT NULL,
      aadhaar TEXT NOT NULL,
      address TEXT NOT NULL,
      employment_type TEXT NOT NULL,
      monthly_income REAL NOT NULL,
      existing_emi REAL NOT NULL,
      requested_amount REAL NOT NULL,
      tenure_months INTEGER NOT NULL,
      status TEXT NOT NULL,
      current_step INTEGER NOT NULL,
      created_at TEXT NOT NULL,
      updated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS ekyc_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      aadhaar_number TEXT NOT NULL,
      name TEXT NOT NULL,
      dob TEXT NOT NULL,
      gender TEXT NOT NULL,
      address TEXT NOT NULL,
      mobile_hash TEXT NOT NULL,
      photo_url TEXT NOT NULL,
      verified_at TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      document_type TEXT NOT NULL,
      file_name TEXT NOT NULL,
      file_size TEXT NOT NULL,
      file_path TEXT NOT NULL,
      uploaded_at TEXT NOT NULL,
      verification_status TEXT NOT NULL,
      ocr_extracted_data TEXT
    );

    CREATE TABLE IF NOT EXISTS underwriting_results (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      cibil_score INTEGER NOT NULL,
      dti_ratio REAL NOT NULL,
      foir_ratio REAL NOT NULL,
      max_eligible_loan REAL NOT NULL,
      recommended_decision TEXT NOT NULL,
      risk_category TEXT NOT NULL,
      rules_json TEXT NOT NULL,
      passed_rules INTEGER NOT NULL,
      total_rules INTEGER NOT NULL,
      evaluated_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS officer_reviews (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      officer_name TEXT NOT NULL,
      decision TEXT NOT NULL,
      remarks TEXT,
      decision_at TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS agreements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      loan_amount REAL NOT NULL,
      tenure_months INTEGER NOT NULL,
      interest_rate REAL NOT NULL,
      emi_amount REAL NOT NULL,
      agreement_html TEXT NOT NULL,
      generated_at TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS estamps (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      stamp_duty_amount REAL NOT NULL,
      certificate_number TEXT NOT NULL,
      stamped_at TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS esign_records (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      agreement_id INTEGER NOT NULL,
      signer_name TEXT NOT NULL,
      signature_reference TEXT NOT NULL,
      signed_at TEXT NOT NULL,
      otp_verified INTEGER DEFAULT 0,
      esign_status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS disbursements (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      transaction_reference TEXT NOT NULL,
      amount REAL NOT NULL,
      disbursed_at TEXT NOT NULL,
      account_number TEXT NOT NULL,
      bank_ifsc TEXT NOT NULL,
      status TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS audit_logs (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      application_id TEXT NOT NULL,
      actor TEXT NOT NULL,
      action TEXT NOT NULL,
      details TEXT NOT NULL,
      timestamp TEXT NOT NULL
    );

    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      user_id INTEGER,
      application_id TEXT,
      title TEXT NOT NULL,
      message TEXT NOT NULL,
      type TEXT NOT NULL,
      created_at TEXT NOT NULL,
      is_read INTEGER DEFAULT 0
    );
  `);

  // Ensure default users exist
  const checkUserStmt = db.prepare(`SELECT COUNT(*) as count FROM users`);
  const result = checkUserStmt.get();
  const now = new Date().toISOString();

  if (result.count === 0) {
    const insertUser = db.prepare(`
      INSERT INTO users (email, password, name, role, created_at)
      VALUES (?, ?, ?, ?, ?)
    `);
    const customerEmail = (process.env.CUSTOMER_EMAIL || 'customer@demo.com').trim().toLowerCase();
    insertUser.run(customerEmail, 'demo123', 'Thribhuvan', 'CUSTOMER', now);
    insertUser.run('officer@demo.com', 'demo123', 'Priya Sharma (Credit Officer)', 'OFFICER', now);
    insertUser.run('admin@demo.com', 'demo123', 'System Administrator', 'ADMIN', now);
  } else {
    syncCustomerEmail();
    db.prepare(`
      UPDATE users
      SET password = 'demo123', name = 'Priya Sharma (Credit Officer)'
      WHERE email = 'officer@demo.com' OR role = 'OFFICER'
    `).run();
  }
}

// Reset Database function to clean state
export function resetDatabase() {
  db.exec(`
    DELETE FROM loan_applications;
    DELETE FROM ekyc_records;
    DELETE FROM documents;
    DELETE FROM underwriting_results;
    DELETE FROM officer_reviews;
    DELETE FROM agreements;
    DELETE FROM estamps;
    DELETE FROM esign_records;
    DELETE FROM disbursements;
    DELETE FROM audit_logs;
    DELETE FROM notifications;
  `);

  syncCustomerEmail();
}
