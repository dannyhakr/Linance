import { db } from '../database/db';

export interface DashboardData {
  totalActiveLoans: number;
  totalOutstandingPrincipal: number;
  overdueLoansCount: number;
  paymentsDueToday: number;
  paymentsDueThisWeek: number;
  atRiskCollaterals: number;
  upcomingDues: Array<{
    customer_name: string;
    loan_number: string;
    due_amount: number;
    due_date: string;
  }>;
  recentPayments: Array<{
    id: number;
    amount: number;
    loan_number: string;
    customer_name: string;
    payment_mode: string;
    payment_date: string;
  }>;
  lastBackupTime?: string;
  pendingNotifications: number;
}

export class DashboardService {
  static getDashboardData(): DashboardData {
    if (!db) {
      throw new Error('Database not initialized');
    }

    // Total active loans
    const totalActiveLoans = (db.prepare('SELECT COUNT(*) as count FROM loans WHERE status = ?')
      .get('active') as { count: number }).count;

    // Outstanding principal
    const outstandingResult = db.prepare(`
      SELECT COALESCE(SUM(outstanding_principal), 0) as total 
      FROM loans 
      WHERE status = 'active'
    `).get() as { total: number };
    const totalOutstandingPrincipal = outstandingResult.total || 0;

    // Overdue loans
    const overdueLoans = (db.prepare(`
      SELECT COUNT(*) as count FROM loans 
      WHERE status = 'overdue' 
         OR (next_due_date < DATE('now') AND status = 'active')
    `).get() as { count: number }).count;

    // Payments due today
    const paymentsDueToday = (db.prepare(`
      SELECT COUNT(*) as count FROM loan_schedules 
      WHERE due_date = DATE('now') AND status = 'pending'
    `).get() as { count: number }).count;

    // Payments due this week
    const paymentsDueThisWeek = (db.prepare(`
      SELECT COUNT(*) as count FROM loan_schedules 
      WHERE due_date BETWEEN DATE('now') AND DATE('now', '+7 days') 
        AND status = 'pending'
    `).get() as { count: number }).count;

    // At-risk collaterals
    const atRiskCollaterals = (db.prepare(`
      SELECT COUNT(*) as count FROM collaterals WHERE at_risk = 1
    `).get() as { count: number }).count;

    // Upcoming dues (next 7 days)
    const upcomingDues = db.prepare(`
      SELECT 
        c.name as customer_name,
        l.loan_number,
        ls.total_amount as due_amount,
        ls.due_date
      FROM loan_schedules ls
      JOIN loans l ON ls.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      WHERE ls.status = 'pending' 
        AND ls.due_date BETWEEN DATE('now') AND DATE('now', '+7 days')
      ORDER BY ls.due_date
      LIMIT 10
    `).all() as Array<{
      customer_name: string;
      loan_number: string;
      due_amount: number;
      due_date: string;
    }>;

    // Recent payments (last 10)
    const recentPayments = db.prepare(`
      SELECT 
        p.id,
        p.amount,
        l.loan_number,
        c.name as customer_name,
        p.payment_mode,
        p.payment_date
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      ORDER BY p.created_at DESC
      LIMIT 10
    `).all() as Array<{
      id: number;
      amount: number;
      loan_number: string;
      customer_name: string;
      payment_mode: string;
      payment_date: string;
    }>;

    // Last backup time
    const lastBackup = db.prepare(`
      SELECT created_at FROM backups 
      ORDER BY created_at DESC 
      LIMIT 1
    `).get() as { created_at: string } | undefined;

    // Pending notifications
    const pendingNotifications = (db.prepare(`
      SELECT COUNT(*) as count FROM notifications WHERE status = 'pending'
    `).get() as { count: number }).count;

    return {
      totalActiveLoans,
      totalOutstandingPrincipal,
      overdueLoansCount: overdueLoans,
      paymentsDueToday,
      paymentsDueThisWeek,
      atRiskCollaterals,
      upcomingDues,
      recentPayments,
      lastBackupTime: lastBackup?.created_at,
      pendingNotifications,
    };
  }
}

