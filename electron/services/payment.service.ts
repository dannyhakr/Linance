import { getDatabase } from '../database/db';

export interface Payment {
  id: number;
  loan_id: number;
  schedule_id?: number;
  amount: number;
  payment_date: string;
  payment_mode: 'cash' | 'upi' | 'bank' | 'cheque';
  reference_number?: string;
  notes?: string;
  receipt_generated: boolean;
  receipt_path?: string;
  created_at: string;
}

export interface PaymentFilters {
  dateFrom?: string;
  dateTo?: string;
  customer_id?: number;
  loan_id?: number;
  payment_mode?: string;
}

export class PaymentService {
  static list(filters?: PaymentFilters): Payment[] {
    const db = getDatabase();

    let query = `
      SELECT p.*, l.loan_number, c.name as customer_name
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.dateFrom) {
      query += ' AND p.payment_date >= ?';
      params.push(filters.dateFrom);
    }

    if (filters?.dateTo) {
      query += ' AND p.payment_date <= ?';
      params.push(filters.dateTo);
    }

    if (filters?.customer_id) {
      query += ' AND l.customer_id = ?';
      params.push(filters.customer_id);
    }

    if (filters?.loan_id) {
      query += ' AND p.loan_id = ?';
      params.push(filters.loan_id);
    }

    if (filters?.payment_mode) {
      query += ' AND p.payment_mode = ?';
      params.push(filters.payment_mode);
    }

    query += ' ORDER BY p.payment_date DESC, p.created_at DESC';

    return db.prepare(query).all(...params) as any[];
  }
}

