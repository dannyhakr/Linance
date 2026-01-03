import Database from 'better-sqlite3';
import path from 'path';
import { app } from 'electron';
import fs from 'fs';
import bcrypt from 'bcrypt';

let db: Database.Database | null = null;

export function initDatabase(): Database.Database {
  if (db) return db;

  const userDataPath = app.getPath('userData');
  const dbDir = path.join(userDataPath, 'data');
  
  // Create data directory if it doesn't exist
  if (!fs.existsSync(dbDir)) {
    fs.mkdirSync(dbDir, { recursive: true });
  }

  const dbPath = path.join(dbDir, 'finance.db');
  db = new Database(dbPath);

  // Enable foreign keys
  db.pragma('foreign_keys = ON');

  // Run migrations
  runMigrations();
  
  // Create default operator (synchronous version)
  createDefaultOperatorSync();

  return db;
}

function runMigrations() {
  if (!db) return;

  // Create migrations table
  db.exec(`
    CREATE TABLE IF NOT EXISTS schema_migrations (
      version INTEGER PRIMARY KEY,
      applied_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );
  `);

  // Migration 1: Initial schema
  const migration1 = `
    -- Operators
    CREATE TABLE IF NOT EXISTS operators (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      username TEXT UNIQUE NOT NULL,
      password_hash TEXT NOT NULL,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      last_login DATETIME
    );

    -- Customers
    CREATE TABLE IF NOT EXISTS customers (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      name TEXT NOT NULL,
      phone TEXT NOT NULL,
      address TEXT,
      pan TEXT,
      aadhaar TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Loans
    CREATE TABLE IF NOT EXISTS loans (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      customer_id INTEGER NOT NULL,
      loan_number TEXT UNIQUE NOT NULL,
      principal REAL NOT NULL,
      interest_rate REAL NOT NULL,
      tenure_months INTEGER NOT NULL,
      emi_amount REAL NOT NULL,
      repayment_frequency TEXT NOT NULL,
      emi_date INTEGER NOT NULL,
      product_type TEXT,
      status TEXT DEFAULT 'active',
      outstanding_principal REAL NOT NULL,
      total_interest_earned REAL DEFAULT 0,
      next_due_date DATE,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (customer_id) REFERENCES customers(id)
    );

    -- Loan Schedules
    CREATE TABLE IF NOT EXISTS loan_schedules (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      installment_number INTEGER NOT NULL,
      due_date DATE NOT NULL,
      principal_component REAL NOT NULL,
      interest_component REAL NOT NULL,
      total_amount REAL NOT NULL,
      status TEXT DEFAULT 'pending',
      paid_date DATE,
      paid_amount REAL DEFAULT 0,
      FOREIGN KEY (loan_id) REFERENCES loans(id),
      UNIQUE(loan_id, installment_number)
    );

    -- Payments
    CREATE TABLE IF NOT EXISTS payments (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      schedule_id INTEGER,
      amount REAL NOT NULL,
      payment_date DATE NOT NULL,
      payment_mode TEXT NOT NULL,
      reference_number TEXT,
      notes TEXT,
      receipt_generated BOOLEAN DEFAULT 0,
      receipt_path TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (loan_id) REFERENCES loans(id),
      FOREIGN KEY (schedule_id) REFERENCES loan_schedules(id)
    );

    -- Collaterals
    CREATE TABLE IF NOT EXISTS collaterals (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER,
      asset_type TEXT NOT NULL,
      description TEXT,
      serial_number TEXT,
      registration_number TEXT,
      original_value REAL NOT NULL,
      current_value REAL NOT NULL,
      owner_name TEXT,
      valuation_date DATE NOT NULL,
      at_risk BOOLEAN DEFAULT 0,
      risk_threshold REAL DEFAULT 0.2,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (loan_id) REFERENCES loans(id)
    );

    -- Collateral Valuations
    CREATE TABLE IF NOT EXISTS collateral_valuations (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      collateral_id INTEGER NOT NULL,
      valuation_date DATE NOT NULL,
      value REAL NOT NULL,
      valuator TEXT,
      notes TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (collateral_id) REFERENCES collaterals(id)
    );

    -- Documents
    CREATE TABLE IF NOT EXISTS documents (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      entity_type TEXT NOT NULL,
      entity_id INTEGER NOT NULL,
      document_type TEXT,
      file_name TEXT NOT NULL,
      file_path TEXT NOT NULL,
      file_size INTEGER,
      mime_type TEXT,
      uploaded_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Audit Log
    CREATE TABLE IF NOT EXISTS audit_log (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      operator_id INTEGER,
      action TEXT NOT NULL,
      entity_type TEXT,
      entity_id INTEGER,
      details TEXT,
      ip_address TEXT,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (operator_id) REFERENCES operators(id)
    );

    -- Settings
    CREATE TABLE IF NOT EXISTS settings (
      key TEXT PRIMARY KEY,
      value TEXT NOT NULL,
      updated_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Notifications
    CREATE TABLE IF NOT EXISTS notifications (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      loan_id INTEGER NOT NULL,
      notification_type TEXT NOT NULL,
      recipient TEXT NOT NULL,
      message TEXT NOT NULL,
      status TEXT DEFAULT 'pending',
      scheduled_at DATETIME,
      sent_at DATETIME,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP,
      FOREIGN KEY (loan_id) REFERENCES loans(id)
    );

    -- Backups
    CREATE TABLE IF NOT EXISTS backups (
      id INTEGER PRIMARY KEY AUTOINCREMENT,
      backup_path TEXT NOT NULL,
      backup_size INTEGER,
      created_at DATETIME DEFAULT CURRENT_TIMESTAMP
    );

    -- Indexes
    CREATE INDEX IF NOT EXISTS idx_loans_customer ON loans(customer_id);
    CREATE INDEX IF NOT EXISTS idx_loans_status ON loans(status);
    CREATE INDEX IF NOT EXISTS idx_loans_next_due ON loans(next_due_date);
    CREATE INDEX IF NOT EXISTS idx_schedules_loan ON loan_schedules(loan_id);
    CREATE INDEX IF NOT EXISTS idx_schedules_due ON loan_schedules(due_date);
    CREATE INDEX IF NOT EXISTS idx_payments_loan ON payments(loan_id);
    CREATE INDEX IF NOT EXISTS idx_payments_date ON payments(payment_date);
    CREATE INDEX IF NOT EXISTS idx_collaterals_loan ON collaterals(loan_id);
    CREATE INDEX IF NOT EXISTS idx_documents_entity ON documents(entity_type, entity_id);
    CREATE INDEX IF NOT EXISTS idx_audit_operator ON audit_log(operator_id);
    CREATE INDEX IF NOT EXISTS idx_audit_created ON audit_log(created_at);
  `;

  // Check if migration 1 already applied
  const applied = db.prepare('SELECT version FROM schema_migrations WHERE version = 1').get();
  
  if (!applied) {
    db.exec(migration1);
    db.prepare('INSERT INTO schema_migrations (version) VALUES (1)').run();
  }

  // Create default operator if none exists (called from initDatabase)
}

function createDefaultOperatorSync() {
  if (!db) return;

  try {
    const existing = db.prepare('SELECT COUNT(*) as count FROM operators').get() as { count: number };
    
    if (existing.count === 0) {
      const defaultPassword = 'admin123'; // Change this!
      // Use synchronous bcrypt hash (for better-sqlite3 compatibility)
      const salt = bcrypt.genSaltSync(10);
      const hash = bcrypt.hashSync(defaultPassword, salt);
      
      db.prepare('INSERT INTO operators (username, password_hash) VALUES (?, ?)')
        .run('admin', hash);
      
      console.log('✅ Default operator created: username=admin, password=admin123');
      console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');
    } else {
      console.log('Admin user already exists');
    }
  } catch (error) {
    console.error('Error creating default operator:', error);
  }
}

export function getDatabase(): Database.Database {
  if (!db) {
    throw new Error('Database not initialized. Call initDatabase() first.');
  }
  return db;
}

// Export db for use in services
export { db };

