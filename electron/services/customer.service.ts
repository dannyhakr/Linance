import { db } from '../database/db';
import { auditLog } from './audit.service';
import { LoanService } from './loan.service';

export interface Customer {
  id: number;
  name: string;
  phone: string;
  address?: string;
  pan?: string;
  aadhaar?: string;
  notes?: string;
  created_at: string;
  updated_at: string;
}

export interface CustomerFilters {
  search?: string;
  activeBorrowers?: boolean;
  overdue?: boolean;
  withActiveLoans?: boolean;
  withoutLoans?: boolean;
}

export class CustomerService {
  static list(filters?: CustomerFilters): Customer[] {
    if (!db) {
      throw new Error('Database not initialized');
    }

    let query = 'SELECT * FROM customers WHERE 1=1';
    const params: any[] = [];

    if (filters?.search) {
      query += ' AND (name LIKE ? OR phone LIKE ?)';
      const searchTerm = `%${filters.search}%`;
      params.push(searchTerm, searchTerm);
    }

    if (filters?.withActiveLoans) {
      query += ' AND id IN (SELECT DISTINCT customer_id FROM loans WHERE status = "active")';
    }

    if (filters?.withoutLoans) {
      query += ' AND id NOT IN (SELECT DISTINCT customer_id FROM loans)';
    }

    if (filters?.overdue) {
      query += ` AND id IN (
        SELECT DISTINCT customer_id FROM loans 
        WHERE status = 'overdue' OR (next_due_date < DATE('now') AND status = 'active')
      )`;
    }

    query += ' ORDER BY name ASC';

    return db.prepare(query).all(...params) as Customer[];
  }

  static get(id: number): Customer | null {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(id) as Customer | undefined;
    return customer || null;
  }

  static create(data: Omit<Customer, 'id' | 'created_at' | 'updated_at'>): Customer {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const result = db.prepare(`
      INSERT INTO customers (name, phone, address, pan, aadhaar, notes)
      VALUES (?, ?, ?, ?, ?, ?)
    `).run(
      data.name,
      data.phone,
      data.address || null,
      data.pan || null,
      data.aadhaar || null,
      data.notes || null
    );

    auditLog(null, 'create_customer', 'customer', Number(result.lastInsertRowid), { name: data.name });

    return this.get(Number(result.lastInsertRowid))!;
  }

  static update(id: number, data: Partial<Omit<Customer, 'id' | 'created_at' | 'updated_at'>>): Customer {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const updates: string[] = [];
    const params: any[] = [];

    if (data.name !== undefined) {
      updates.push('name = ?');
      params.push(data.name);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      params.push(data.phone);
    }
    if (data.address !== undefined) {
      updates.push('address = ?');
      params.push(data.address);
    }
    if (data.pan !== undefined) {
      updates.push('pan = ?');
      params.push(data.pan);
    }
    if (data.aadhaar !== undefined) {
      updates.push('aadhaar = ?');
      params.push(data.aadhaar);
    }
    if (data.notes !== undefined) {
      updates.push('notes = ?');
      params.push(data.notes);
    }

    if (updates.length === 0) {
      return this.get(id)!;
    }

    updates.push('updated_at = CURRENT_TIMESTAMP');
    params.push(id);

    db.prepare(`UPDATE customers SET ${updates.join(', ')} WHERE id = ?`).run(...params);

    auditLog(null, 'update_customer', 'customer', id, data);

    return this.get(id)!;
  }

  static getCustomerStats(customerId: number) {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const stats = db.prepare(`
      SELECT 
        COUNT(*) as total_loans,
        COALESCE(SUM(CASE WHEN status = 'active' THEN 1 ELSE 0 END), 0) as active_loans,
        COALESCE(SUM(CASE WHEN status = 'overdue' THEN 1 ELSE 0 END), 0) as overdue_loans,
        COALESCE(SUM(CASE WHEN status = 'active' THEN outstanding_principal ELSE 0 END), 0) as outstanding_amount,
        MAX(p.created_at) as last_payment_date
      FROM loans l
      LEFT JOIN payments p ON l.id = p.loan_id
      WHERE l.customer_id = ?
    `).get(customerId) as {
      total_loans: number;
      active_loans: number;
      overdue_loans: number;
      outstanding_amount: number;
      last_payment_date: string | null;
    };

    return stats;
  }

  static delete(id: number, adminPassword: string) {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const database = db;

    return database.transaction(() => {
      const customer = this.get(id);
      if (!customer) {
        throw new Error('Customer not found');
      }

      // Delete all loans (and their related data) for this customer
      const loans = database
        .prepare('SELECT id FROM loans WHERE customer_id = ?')
        .all(id) as { id: number }[];

      for (const loan of loans) {
        LoanService.delete(loan.id, adminPassword);
      }

      // Delete the customer
      database.prepare('DELETE FROM customers WHERE id = ?').run(id);

      auditLog(null, 'delete_customer', 'customer', id, {
        deleted_loans: loans.length,
      });

      return { success: true };
    })();
  }
}

