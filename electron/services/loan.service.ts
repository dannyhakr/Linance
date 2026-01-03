import { getDatabase } from '../database/db';
import { auditLog } from './audit.service';

export interface Loan {
  id: number;
  customer_id: number;
  loan_number: string;
  principal: number;
  interest_rate: number;
  tenure_months: number;
  emi_amount: number;
  repayment_frequency: 'monthly' | 'weekly' | 'daily';
  emi_date: number;
  product_type?: string;
  status: 'active' | 'overdue' | 'closed' | 'default';
  outstanding_principal: number;
  total_interest_earned: number;
  next_due_date?: string;
  created_at: string;
  updated_at: string;
}

export interface LoanSchedule {
  id: number;
  loan_id: number;
  installment_number: number;
  due_date: string;
  principal_component: number;
  interest_component: number;
  total_amount: number;
  status: 'pending' | 'paid' | 'overdue' | 'skipped';
  paid_date?: string;
  paid_amount: number;
}

export interface CreateLoanData {
  customer_id: number;
  principal: number;
  interest_rate: number;
  tenure_months: number;
  repayment_frequency: 'monthly' | 'weekly' | 'daily';
  emi_date: number;
  product_type?: string;
  start_date?: string;
}

export class LoanService {
  static list(filters?: { status?: string; customer_id?: number }): any[] {
    const db = getDatabase();

    let query = `
      SELECT 
        l.*, 
        CASE 
          WHEN l.outstanding_principal < 0 THEN 0 
          ELSE l.outstanding_principal 
        END as outstanding_principal,
        c.name as customer_name
      FROM loans l
      LEFT JOIN customers c ON l.customer_id = c.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.status) {
      query += ' AND l.status = ?';
      params.push(filters.status);
    }

    if (filters?.customer_id) {
      query += ' AND l.customer_id = ?';
      params.push(filters.customer_id);
    }

    query += ' ORDER BY l.created_at DESC';

    return db.prepare(query).all(...params) as any[];
  }

  static get(id: number): Loan | null {
    const db = getDatabase();
    const loan = db
      .prepare(
        `SELECT 
           *, 
           CASE 
             WHEN outstanding_principal < 0 THEN 0 
             ELSE outstanding_principal 
           END as outstanding_principal
         FROM loans 
         WHERE id = ?`
      )
      .get(id) as Loan | undefined;
    return loan || null;
  }

  static create(data: CreateLoanData): Loan {
    const db = getDatabase();

    // Calculate EMI
    const monthlyRate = data.interest_rate / 100 / 12;
    const emiAmount = data.principal * monthlyRate * Math.pow(1 + monthlyRate, data.tenure_months) / 
                     (Math.pow(1 + monthlyRate, data.tenure_months) - 1);

    // Generate loan number
    const loanNumber = `LN${Date.now()}`;

    // Calculate first due date
    const startDate = data.start_date ? new Date(data.start_date) : new Date();
    const firstDueDate = this.calculateFirstDueDate(startDate, data.emi_date, data.repayment_frequency);

    return db.transaction(() => {
      // Insert loan
      const result = db.prepare(`
        INSERT INTO loans (
          customer_id, loan_number, principal, interest_rate, tenure_months,
          emi_amount, repayment_frequency, emi_date, product_type,
          outstanding_principal, next_due_date
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.customer_id,
        loanNumber,
        data.principal,
        data.interest_rate,
        data.tenure_months,
        emiAmount,
        data.repayment_frequency,
        data.emi_date,
        data.product_type || null,
        data.principal,
        firstDueDate.toISOString().split('T')[0]
      );

      const loanId = Number(result.lastInsertRowid);

      // Generate schedule
      this.generateSchedule(db, loanId, data.principal, data.interest_rate, data.tenure_months,
                           emiAmount, data.repayment_frequency, firstDueDate);

      auditLog(null, 'create_loan', 'loan', loanId, { loan_number: loanNumber });

      return this.get(loanId)!;
    })();
  }

  private static calculateFirstDueDate(
    startDate: Date,
    emiDate: number,
    frequency: string
  ): Date {
    const dueDate = new Date(startDate);
    
    if (frequency === 'monthly') {
      dueDate.setMonth(dueDate.getMonth() + 1);
      dueDate.setDate(emiDate);
    } else if (frequency === 'weekly') {
      const daysToAdd = (emiDate - dueDate.getDay() + 7) % 7 || 7;
      dueDate.setDate(dueDate.getDate() + daysToAdd);
    } else if (frequency === 'daily') {
      dueDate.setDate(dueDate.getDate() + emiDate);
    }

    return dueDate;
  }

  private static generateSchedule(
    db: any,
    loanId: number,
    principal: number,
    rate: number,
    months: number,
    emi: number,
    frequency: string,
    startDate: Date
  ) {
    let remainingPrincipal = principal;
    const monthlyRate = rate / 100 / 12;

    for (let i = 1; i <= months; i++) {
      const interestComponent = remainingPrincipal * monthlyRate;
      const principalComponent = emi - interestComponent;
      remainingPrincipal -= principalComponent;

      const dueDate = new Date(startDate);
      if (frequency === 'monthly') {
        dueDate.setMonth(dueDate.getMonth() + i);
      } else if (frequency === 'weekly') {
        dueDate.setDate(dueDate.getDate() + (i * 7));
      } else if (frequency === 'daily') {
        dueDate.setDate(dueDate.getDate() + i);
      }

      db.prepare(`
        INSERT INTO loan_schedules (
          loan_id, installment_number, due_date,
          principal_component, interest_component, total_amount
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        loanId,
        i,
        dueDate.toISOString().split('T')[0],
        principalComponent,
        interestComponent,
        emi
      );
    }
  }

  static getSchedule(loanId: number): LoanSchedule[] {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM loan_schedules 
      WHERE loan_id = ? 
      ORDER BY installment_number
    `).all(loanId) as LoanSchedule[];
  }

  static delete(id: number, adminPassword: string) {
    const db = getDatabase();

    return db.transaction(() => {
      const loan = this.get(id);
      if (!loan) {
        throw new Error('Loan not found');
      }

      // For now we trust that adminPassword was validated on the frontend via auth;
      // if needed, hook this into an operator/admin table.

      // Delete related collaterals and their valuations
      const collaterals = db
        .prepare('SELECT id FROM collaterals WHERE loan_id = ?')
        .all(id) as { id: number }[];

      for (const c of collaterals) {
        db.prepare('DELETE FROM collateral_valuations WHERE collateral_id = ?')
          .run(c.id);
        db.prepare('DELETE FROM collaterals WHERE id = ?').run(c.id);
      }

      // Delete payments (must come before schedules because of FOREIGN KEY schedule_id)
      db.prepare('DELETE FROM payments WHERE loan_id = ?').run(id);

      // Delete loan schedules
      db.prepare('DELETE FROM loan_schedules WHERE loan_id = ?').run(id);

      // Delete notifications linked to this loan
      db.prepare('DELETE FROM notifications WHERE loan_id = ?').run(id);

      // Finally delete the loan
      db.prepare('DELETE FROM loans WHERE id = ?').run(id);

      auditLog(null, 'delete_loan', 'loan', id, { deleted_collaterals: collaterals.length });

      return { success: true };
    })();
  }

  static closeLoan(loanId: number) {
    const db = getDatabase();

    return db.transaction(() => {
      const loan = this.get(loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }

      // Ensure there are no pending installments
      const pending = db
        .prepare(
          `SELECT COUNT(*) as count FROM loan_schedules WHERE loan_id = ? AND status = 'pending'`
        )
        .get(loanId) as { count: number };

      if (pending.count > 0) {
        throw new Error('Cannot close loan while there are pending installments.');
      }

      // Allow a small tolerance for rounding differences (≤ $1)
      const OUTSTANDING_TOLERANCE = 1;
      if (loan.outstanding_principal > OUTSTANDING_TOLERANCE) {
        throw new Error(
          'Cannot close loan while outstanding principal is greater than zero.'
        );
      }

      db.prepare(
        `UPDATE loans SET status = 'closed', outstanding_principal = 0, updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(loanId);

      auditLog(null, 'close_loan', 'loan', loanId, {});

      return this.get(loanId);
    })();
  }

  static reopenLoan(loanId: number) {
    const db = getDatabase();

    return db.transaction(() => {
      const loan = this.get(loanId);
      if (!loan) {
        throw new Error('Loan not found');
      }

      if (loan.status !== 'closed') {
        throw new Error('Only closed loans can be reopened.');
      }

      db.prepare(
        `UPDATE loans SET status = 'active', updated_at = CURRENT_TIMESTAMP WHERE id = ?`
      ).run(loanId);

      auditLog(null, 'reopen_loan', 'loan', loanId, {});

      return this.get(loanId);
    })();
  }

  static recordPayment(loanId: number, paymentData: {
    amount: number;
    date: string;
    mode: string;
    reference?: string;
    notes?: string;
  }) {
    const db = getDatabase();

    return db.transaction(() => {
      let remainingAmount = paymentData.amount;
      const paymentId = db.prepare(`
        INSERT INTO payments (
          loan_id, amount, payment_date, payment_mode, reference_number, notes
        ) VALUES (?, ?, ?, ?, ?, ?)
      `).run(
        loanId,
        paymentData.amount,
        paymentData.date,
        paymentData.mode,
        paymentData.reference || null,
        paymentData.notes || null
      ).lastInsertRowid as number;

      // Get all pending schedules
      const pendingSchedules = db.prepare(`
        SELECT * FROM loan_schedules 
        WHERE loan_id = ? AND status = 'pending'
        ORDER BY installment_number
      `).all(loanId) as LoanSchedule[];

      if (pendingSchedules.length === 0) {
        throw new Error('No pending installments found');
      }

      // Allocate payment across multiple installments if needed (for partial payments)
      // Tolerance for rounding adjustments: ±1 rupee
      const ROUNDING_TOLERANCE = 1.0;
      
      for (const schedule of pendingSchedules) {
        if (remainingAmount <= 0) break;

        const pendingAmount = schedule.total_amount - schedule.paid_amount;
        
        // Check if payment is within rounding tolerance (±1 rupee)
        // If customer pays slightly less (e.g., 250 instead of 250.78), accept it as full payment
        // If customer pays slightly more (e.g., 251 instead of 250.78), accept it and allocate excess to next
        const difference = remainingAmount - pendingAmount;
        const isWithinTolerance = Math.abs(difference) <= ROUNDING_TOLERANCE;
        
        let allocateAmount: number;
        if (isWithinTolerance) {
          // Payment is within ±1 rupee tolerance - accept as full payment
          // If they paid less, we still mark it as fully paid (rounding adjustment)
          // If they paid more, we allocate the full pending amount and the excess goes to next installment
          allocateAmount = pendingAmount; // Allocate the full pending amount to mark as paid
          // remainingAmount will be adjusted after allocation
        } else {
          // Normal allocation - not within tolerance
          allocateAmount = Math.min(remainingAmount, pendingAmount);
        }
        
        const newPaidAmount = schedule.paid_amount + allocateAmount;
        // Use a small tolerance (0.01) to handle floating point precision issues
        // Round to 2 decimal places for comparison
        const roundedPaid = Math.round(newPaidAmount * 100) / 100;
        const roundedTotal = Math.round(schedule.total_amount * 100) / 100;
        // Mark as paid if within rounding tolerance or fully paid
        const isFullyPaid = roundedPaid >= roundedTotal || 
                           Math.abs(roundedPaid - roundedTotal) < 0.01 ||
                           (roundedPaid >= roundedTotal - ROUNDING_TOLERANCE && roundedPaid < roundedTotal + ROUNDING_TOLERANCE);

        // Update schedule - mark as paid if fully paid (including rounding tolerance), regardless of due date
        // If within tolerance but slightly less, set paid_amount to total_amount to mark as fully paid
        const finalPaidAmount = isFullyPaid ? schedule.total_amount : newPaidAmount;
        
        db.prepare(`
          UPDATE loan_schedules 
          SET paid_amount = ?, status = ?, paid_date = ?
          WHERE id = ?
        `).run(
          finalPaidAmount,
          isFullyPaid ? 'paid' : 'pending',
          isFullyPaid ? paymentData.date : null,
          schedule.id
        );

        // Link payment to schedule (for first installment)
        if (schedule.id === pendingSchedules[0].id) {
          db.prepare('UPDATE payments SET schedule_id = ? WHERE id = ?')
            .run(schedule.id, paymentId);
        }

        // Update loan outstanding - only reduce by principal component
        // For simplicity, we'll reduce by the principal component of this installment
        // If this is a partial payment, we need to calculate the principal portion
        const principalRatio = schedule.principal_component / schedule.total_amount;
        const principalReduction = allocateAmount * principalRatio;
        
        db.prepare(`
          UPDATE loans 
          SET outstanding_principal = MAX(outstanding_principal - ?, 0),
              updated_at = CURRENT_TIMESTAMP
          WHERE id = ?
        `).run(principalReduction, loanId);

        // Adjust remaining amount
        // If we allocated more than available (within tolerance), set to 0
        if (allocateAmount > remainingAmount) {
          remainingAmount = 0;
        } else {
          remainingAmount -= allocateAmount;
        }
      }

      // Update next due date
      const nextPending = db.prepare(`
        SELECT MIN(due_date) as next_due FROM loan_schedules 
        WHERE loan_id = ? AND status = 'pending'
      `).get(loanId) as { next_due: string | null } | undefined;

      if (nextPending?.next_due) {
        db.prepare('UPDATE loans SET next_due_date = ? WHERE id = ?')
          .run(nextPending.next_due, loanId);
      }

      auditLog(null, 'record_payment', 'loan', loanId, { amount: paymentData.amount, payment_id: paymentId });

      return { success: true, paymentId };
    })();
  }
}

