import { getDatabase } from '../database/db';
import { app, dialog } from 'electron';
import fs from 'fs';
import path from 'path';
import puppeteer from 'puppeteer';

export class ReportService {
  static async generateLoanSchedulePDF(loanId: number): Promise<string> {
    const db = getDatabase();
    
    // Get loan details
    const loan = db.prepare(`
      SELECT l.*, c.name as customer_name, c.phone as customer_phone
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      WHERE l.id = ?
    `).get(loanId) as any;

    if (!loan) {
      throw new Error('Loan not found');
    }

    // Get schedule
    const schedule = db.prepare(`
      SELECT * FROM loan_schedules 
      WHERE loan_id = ? 
      ORDER BY installment_number
    `).all(loanId) as any[];

    const html = this.getLoanScheduleHTML(loan, schedule);
    return await this.generatePDF(html, `loan_schedule_${loan.loan_number}.pdf`);
  }

  static async generatePaymentReceiptPDF(paymentId: number): Promise<string> {
    const db = getDatabase();
    
    const payment = db.prepare(`
      SELECT p.*, l.loan_number, c.name as customer_name, c.phone as customer_phone, c.address
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      WHERE p.id = ?
    `).get(paymentId) as any;

    if (!payment) {
      throw new Error('Payment not found');
    }

    const html = this.getPaymentReceiptHTML(payment);
    return await this.generatePDF(html, `receipt_${payment.id}.pdf`);
  }

  static async generateCustomerStatementPDF(customerId: number, dateFrom?: string, dateTo?: string): Promise<string> {
    const db = getDatabase();
    
    const customer = db.prepare('SELECT * FROM customers WHERE id = ?').get(customerId) as any;
    if (!customer) {
      throw new Error('Customer not found');
    }

    // Get all loans
    const loans = db.prepare('SELECT * FROM loans WHERE customer_id = ? ORDER BY created_at DESC').all(customerId) as any[];

    // Get all payments
    let paymentsQuery = `
      SELECT p.*, l.loan_number
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      WHERE l.customer_id = ?
    `;
    const params: any[] = [customerId];
    
    if (dateFrom) {
      paymentsQuery += ' AND p.payment_date >= ?';
      params.push(dateFrom);
    }
    if (dateTo) {
      paymentsQuery += ' AND p.payment_date <= ?';
      params.push(dateTo);
    }
    
    paymentsQuery += ' ORDER BY p.payment_date DESC';
    const payments = db.prepare(paymentsQuery).all(...params) as any[];

    const html = this.getCustomerStatementHTML(customer, loans, payments, dateFrom, dateTo);
    return await this.generatePDF(html, `customer_statement_${customer.name.replace(/\s+/g, '_')}.pdf`);
  }

  static async generateOverdueLoansReportPDF(): Promise<string> {
    const db = getDatabase();
    
    const overdueLoans = db.prepare(`
      SELECT 
        l.*, c.name as customer_name, c.phone,
        ls.due_date, ls.total_amount as due_amount,
        julianday('now') - julianday(ls.due_date) as days_overdue
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      JOIN loan_schedules ls ON l.id = ls.loan_id
      WHERE ls.status = 'pending' 
        AND ls.due_date < DATE('now')
        AND l.status IN ('active', 'overdue')
      ORDER BY ls.due_date
    `).all() as any[];

    const html = this.getOverdueLoansReportHTML(overdueLoans);
    return await this.generatePDF(html, `overdue_loans_report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  static async generateDailyCollectionReportPDF(reportDate: string): Promise<string> {
    const db = getDatabase();
    
    const payments = db.prepare(`
      SELECT p.*, l.loan_number, c.name as customer_name
      FROM payments p
      JOIN loans l ON p.loan_id = l.id
      JOIN customers c ON l.customer_id = c.id
      WHERE DATE(p.payment_date) = ?
      ORDER BY p.created_at
    `).all(reportDate) as any[];

    // Calculate totals by mode
    const totals: { [key: string]: number } = {};
    payments.forEach(p => {
      totals[p.payment_mode] = (totals[p.payment_mode] || 0) + p.amount;
    });

    const grandTotal = payments.reduce((sum, p) => sum + p.amount, 0);

    const html = this.getDailyCollectionReportHTML(payments, totals, grandTotal, reportDate);
    return await this.generatePDF(html, `daily_collection_${reportDate}.pdf`);
  }

  static async generateLoanSummaryReportPDF(): Promise<string> {
    const db = getDatabase();
    
    const loans = db.prepare(`
      SELECT l.*, c.name as customer_name
      FROM loans l
      JOIN customers c ON l.customer_id = c.id
      ORDER BY l.created_at DESC
    `).all() as any[];

    const summary = {
      totalLoans: loans.length,
      activeLoans: loans.filter(l => l.status === 'active').length,
      totalPrincipal: loans.reduce((sum, l) => sum + l.principal, 0),
      totalOutstanding: loans.reduce((sum, l) => sum + l.outstanding_principal, 0),
      totalInterestEarned: loans.reduce((sum, l) => sum + l.total_interest_earned, 0),
    };

    const html = this.getLoanSummaryReportHTML(loans, summary);
    return await this.generatePDF(html, `loan_summary_report_${new Date().toISOString().split('T')[0]}.pdf`);
  }

  private static async generatePDF(html: string, fileName: string): Promise<string> {
    const browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox']
    });
    
    try {
      const page = await browser.newPage();
      await page.setContent(html, { waitUntil: 'networkidle0' });
      
      // Show save dialog
      const result = await dialog.showSaveDialog({
        title: 'Save PDF Report',
        defaultPath: fileName,
        filters: [{ name: 'PDF Files', extensions: ['pdf'] }]
      });

      if (result.canceled || !result.filePath) {
        throw new Error('Save cancelled');
      }

      await page.pdf({
        path: result.filePath,
        format: 'A4',
        printBackground: true,
        margin: {
          top: '20mm',
          right: '15mm',
          bottom: '20mm',
          left: '15mm'
        }
      });

      return result.filePath;
    } finally {
      await browser.close();
    }
  }

  private static getLoanScheduleHTML(loan: any, schedule: any[]): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #2c3e50; }
            .loan-info { margin: 20px 0; }
            .info-row { display: flex; justify-content: space-between; margin: 10px 0; padding: 8px; background: #f8f9fa; }
            .info-label { font-weight: bold; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #2c3e50; color: white; }
            tr:nth-child(even) { background-color: #f8f9fa; }
            .status-paid { color: #28a745; font-weight: bold; }
            .status-pending { color: #ffc107; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sri Kumaran Finance</h1>
            <h2>Loan EMI Schedule</h2>
          </div>
          
          <div class="loan-info">
            <div class="info-row">
              <span class="info-label">Loan Number:</span>
              <span>${loan.loan_number}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Customer:</span>
              <span>${loan.customer_name} (${loan.customer_phone})</span>
            </div>
            <div class="info-row">
              <span class="info-label">Principal Amount:</span>
              <span>$${loan.principal.toLocaleString('en-IN')}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Interest Rate:</span>
              <span>${loan.interest_rate}% p.a.</span>
            </div>
            <div class="info-row">
              <span class="info-label">EMI Amount:</span>
              <span>$${loan.emi_amount.toFixed(2)}</span>
            </div>
            <div class="info-row">
              <span class="info-label">Tenure:</span>
              <span>${loan.tenure_months} months</span>
            </div>
            <div class="info-row">
              <span class="info-label">Outstanding:</span>
              <span>$${loan.outstanding_principal.toLocaleString('en-IN')}</span>
            </div>
          </div>

          <h3>EMI Schedule</h3>
          <table>
            <thead>
              <tr>
                <th>#</th>
                <th>Due Date</th>
                <th>Principal</th>
                <th>Interest</th>
                <th>Total EMI</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${schedule.map(item => `
                <tr>
                  <td>${item.installment_number}</td>
                  <td>${new Date(item.due_date).toLocaleDateString('en-IN')}</td>
                  <td>$${item.principal_component.toFixed(2)}</td>
                  <td>$${item.interest_component.toFixed(2)}</td>
                  <td>$${item.total_amount.toFixed(2)}</td>
                  <td class="status-${item.status}">${item.status.toUpperCase()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
            <p>Sri Kumaran Finance - Loan Management System</p>
          </div>
        </body>
      </html>
    `;
  }

  private static getPaymentReceiptHTML(payment: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 40px; max-width: 600px; margin: 0 auto; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .header h1 { margin: 0; color: #2c3e50; }
            .receipt-details { margin: 30px 0; }
            .detail-row { display: flex; justify-content: space-between; padding: 12px; border-bottom: 1px solid #eee; }
            .detail-label { font-weight: bold; color: #666; }
            .amount { font-size: 24px; font-weight: bold; color: #28a745; text-align: center; margin: 30px 0; padding: 20px; background: #f8f9fa; border-radius: 8px; }
            .footer { margin-top: 40px; text-align: center; color: #666; font-size: 12px; border-top: 1px solid #eee; padding-top: 20px; }
            .signature { margin-top: 50px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sri Kumaran Finance</h1>
            <h2>Payment Receipt</h2>
          </div>
          
          <div class="receipt-details">
            <div class="detail-row">
              <span class="detail-label">Receipt Number:</span>
              <span>#${payment.id}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Date:</span>
              <span>${new Date(payment.payment_date).toLocaleDateString('en-IN')}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Customer Name:</span>
              <span>${payment.customer_name}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Phone:</span>
              <span>${payment.customer_phone || '-'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Address:</span>
              <span>${payment.address || '-'}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Loan Number:</span>
              <span>${payment.loan_number}</span>
            </div>
            <div class="detail-row">
              <span class="detail-label">Payment Mode:</span>
              <span>${payment.payment_mode.toUpperCase()}</span>
            </div>
            ${payment.reference_number ? `
            <div class="detail-row">
              <span class="detail-label">Reference:</span>
              <span>${payment.reference_number}</span>
            </div>
            ` : ''}
          </div>

          <div class="amount">
            Amount Received: $${payment.amount.toLocaleString('en-IN')}
          </div>

          ${payment.notes ? `
          <div class="detail-row">
            <span class="detail-label">Notes:</span>
            <span>${payment.notes}</span>
          </div>
          ` : ''}

          <div class="signature">
            <p>_________________________</p>
            <p>Authorized Signature</p>
          </div>

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
            <p>This is a computer-generated receipt</p>
            <p>Sri Kumaran Finance - Loan Management System</p>
          </div>
        </body>
      </html>
    `;
  }

  private static getCustomerStatementHTML(customer: any, loans: any[], payments: any[], dateFrom?: string, dateTo?: string): string {
    const totalOutstanding = loans.reduce((sum, l) => sum + (l.status === 'active' ? l.outstanding_principal : 0), 0);
    const totalPaid = payments.reduce((sum, p) => sum + p.amount, 0);

    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .customer-info { margin: 20px 0; background: #f8f9fa; padding: 15px; border-radius: 8px; }
            .summary { display: grid; grid-template-columns: repeat(3, 1fr); gap: 15px; margin: 20px 0; }
            .summary-card { background: #fff; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
            .summary-value { font-size: 24px; font-weight: bold; color: #2c3e50; }
            .summary-label { color: #666; font-size: 14px; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #2c3e50; color: white; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sri Kumaran Finance</h1>
            <h2>Customer Statement</h2>
          </div>
          
          <div class="customer-info">
            <h3>${customer.name}</h3>
            <p>Phone: ${customer.phone}</p>
            ${customer.address ? `<p>Address: ${customer.address}</p>` : ''}
            ${dateFrom || dateTo ? `<p>Period: ${dateFrom || 'Start'} to ${dateTo || 'End'}</p>` : ''}
          </div>

          <div class="summary">
            <div class="summary-card">
              <div class="summary-value">${loans.length}</div>
              <div class="summary-label">Total Loans</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">$${totalOutstanding.toLocaleString('en-IN')}</div>
              <div class="summary-label">Outstanding</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">$${totalPaid.toLocaleString('en-IN')}</div>
              <div class="summary-label">Total Paid</div>
            </div>
          </div>

          <h3>Loans</h3>
          <table>
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Principal</th>
                <th>Outstanding</th>
                <th>Status</th>
                <th>Created</th>
              </tr>
            </thead>
            <tbody>
              ${loans.map(loan => `
                <tr>
                  <td>${loan.loan_number}</td>
                  <td>$${loan.principal.toLocaleString('en-IN')}</td>
                  <td>$${loan.outstanding_principal.toLocaleString('en-IN')}</td>
                  <td>${loan.status.toUpperCase()}</td>
                  <td>${new Date(loan.created_at).toLocaleDateString('en-IN')}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <h3>Payment History</h3>
          ${payments.length > 0 ? `
          <table>
            <thead>
              <tr>
                <th>Date</th>
                <th>Loan #</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              ${payments.map(p => `
                <tr>
                  <td>${new Date(p.payment_date).toLocaleDateString('en-IN')}</td>
                  <td>${p.loan_number}</td>
                  <td>$${p.amount.toLocaleString('en-IN')}</td>
                  <td>${p.payment_mode.toUpperCase()}</td>
                  <td>${p.reference_number || '-'}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>
          ` : '<p>No payments found for this period</p>'}

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
            <p>Sri Kumaran Finance - Loan Management System</p>
          </div>
        </body>
      </html>
    `;
  }

  private static getOverdueLoansReportHTML(loans: any[]): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #dc3545; color: white; }
            tr:nth-child(even) { background-color: #f8f9fa; }
            .days-overdue { color: #dc3545; font-weight: bold; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sri Kumaran Finance</h1>
            <h2>Overdue Loans Report</h2>
            <p>Generated on ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
          
          <p><strong>Total Overdue Loans: ${loans.length}</strong></p>

          <table>
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Customer</th>
                <th>Phone</th>
                <th>Due Date</th>
                <th>Due Amount</th>
                <th>Days Overdue</th>
              </tr>
            </thead>
            <tbody>
              ${loans.length > 0 ? loans.map(loan => `
                <tr>
                  <td>${loan.loan_number}</td>
                  <td>${loan.customer_name}</td>
                  <td>${loan.phone || '-'}</td>
                  <td>${new Date(loan.due_date).toLocaleDateString('en-IN')}</td>
                  <td>$${loan.due_amount.toLocaleString('en-IN')}</td>
                  <td class="days-overdue">${Math.floor(loan.days_overdue)} days</td>
                </tr>
              `).join('') : '<tr><td colspan="6" style="text-align: center;">No overdue loans</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            <p>Sri Kumaran Finance - Loan Management System</p>
          </div>
        </body>
      </html>
    `;
  }

  private static getDailyCollectionReportHTML(payments: any[], totals: any, grandTotal: number, date: string): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
            .summary-card { background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
            .summary-value { font-size: 20px; font-weight: bold; color: #2c3e50; }
            .summary-label { color: #666; font-size: 12px; margin-top: 5px; }
            .grand-total { background: #28a745; color: white; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; }
            th, td { border: 1px solid #ddd; padding: 10px; text-align: left; }
            th { background-color: #2c3e50; color: white; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sri Kumaran Finance</h1>
            <h2>Daily Collection Report</h2>
            <p>Date: ${new Date(date).toLocaleDateString('en-IN')}</p>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <div class="summary-value">$${(totals.cash || 0).toLocaleString('en-IN')}</div>
              <div class="summary-label">Cash</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">$${(totals.upi || 0).toLocaleString('en-IN')}</div>
              <div class="summary-label">UPI</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">$${(totals.bank || 0).toLocaleString('en-IN')}</div>
              <div class="summary-label">Bank Transfer</div>
            </div>
            <div class="summary-card grand-total">
              <div class="summary-value" style="color: white;">$${grandTotal.toLocaleString('en-IN')}</div>
              <div class="summary-label" style="color: white;">Grand Total</div>
            </div>
          </div>

          <h3>Payment Details</h3>
          <table>
            <thead>
              <tr>
                <th>Time</th>
                <th>Loan #</th>
                <th>Customer</th>
                <th>Amount</th>
                <th>Mode</th>
                <th>Reference</th>
              </tr>
            </thead>
            <tbody>
              ${payments.length > 0 ? payments.map(p => `
                <tr>
                  <td>${new Date(p.created_at).toLocaleTimeString('en-IN')}</td>
                  <td>${p.loan_number}</td>
                  <td>${p.customer_name}</td>
                  <td>$${p.amount.toLocaleString('en-IN')}</td>
                  <td>${p.payment_mode.toUpperCase()}</td>
                  <td>${p.reference_number || '-'}</td>
                </tr>
              `).join('') : '<tr><td colspan="6" style="text-align: center;">No payments on this date</td></tr>'}
            </tbody>
          </table>

          <div class="footer">
            <p>Generated on ${new Date().toLocaleString('en-IN')}</p>
            <p>Sri Kumaran Finance - Loan Management System</p>
          </div>
        </body>
      </html>
    `;
  }

  private static getLoanSummaryReportHTML(loans: any[], summary: any): string {
    return `
      <!DOCTYPE html>
      <html>
        <head>
          <meta charset="UTF-8">
          <style>
            body { font-family: Arial, sans-serif; padding: 20px; }
            .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #333; padding-bottom: 20px; }
            .summary { display: grid; grid-template-columns: repeat(4, 1fr); gap: 15px; margin: 20px 0; }
            .summary-card { background: #f8f9fa; border: 1px solid #ddd; padding: 15px; border-radius: 8px; text-align: center; }
            .summary-value { font-size: 20px; font-weight: bold; color: #2c3e50; }
            .summary-label { color: #666; font-size: 12px; margin-top: 5px; }
            table { width: 100%; border-collapse: collapse; margin: 20px 0; font-size: 12px; }
            th, td { border: 1px solid #ddd; padding: 8px; text-align: left; }
            th { background-color: #2c3e50; color: white; }
            .footer { margin-top: 30px; text-align: center; color: #666; font-size: 12px; }
          </style>
        </head>
        <body>
          <div class="header">
            <h1>Sri Kumaran Finance</h1>
            <h2>Loan Summary Report</h2>
            <p>Generated on ${new Date().toLocaleDateString('en-IN')}</p>
          </div>
          
          <div class="summary">
            <div class="summary-card">
              <div class="summary-value">${summary.totalLoans}</div>
              <div class="summary-label">Total Loans</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">${summary.activeLoans}</div>
              <div class="summary-label">Active Loans</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">$${summary.totalPrincipal.toLocaleString('en-IN')}</div>
              <div class="summary-label">Total Principal</div>
            </div>
            <div class="summary-card">
              <div class="summary-value">$${summary.totalOutstanding.toLocaleString('en-IN')}</div>
              <div class="summary-label">Total Outstanding</div>
            </div>
          </div>

          <h3>All Loans</h3>
          <table>
            <thead>
              <tr>
                <th>Loan #</th>
                <th>Customer</th>
                <th>Principal</th>
                <th>Outstanding</th>
                <th>Interest Earned</th>
                <th>Status</th>
              </tr>
            </thead>
            <tbody>
              ${loans.map(loan => `
                <tr>
                  <td>${loan.loan_number}</td>
                  <td>${loan.customer_name}</td>
                  <td>$${loan.principal.toLocaleString('en-IN')}</td>
                  <td>$${loan.outstanding_principal.toLocaleString('en-IN')}</td>
                  <td>$${loan.total_interest_earned.toLocaleString('en-IN')}</td>
                  <td>${loan.status.toUpperCase()}</td>
                </tr>
              `).join('')}
            </tbody>
          </table>

          <div class="footer">
            <p>Sri Kumaran Finance - Loan Management System</p>
          </div>
        </body>
      </html>
    `;
  }
}

