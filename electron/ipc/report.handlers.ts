import { ipcMain } from 'electron';
import { ReportService } from '../services/report.service';

export function setupReportHandlers() {
  ipcMain.handle('reports:generateLoanSchedule', async (_, loanId: number) => {
    try {
      const filePath = await ReportService.generateLoanSchedulePDF(loanId);
      return { success: true, path: filePath };
    } catch (error: any) {
      if (error.message && error.message.includes('canceled')) {
        return { success: false, canceled: true };
      }
      throw new Error(error.message || 'Failed to generate loan schedule PDF');
    }
  });

  ipcMain.handle('reports:generatePaymentReceipt', async (_, paymentId: number) => {
    try {
      const filePath = await ReportService.generatePaymentReceiptPDF(paymentId);
      return { success: true, path: filePath };
    } catch (error: any) {
      if (error.message && error.message.includes('canceled')) {
        return { success: false, canceled: true };
      }
      throw new Error(error.message || 'Failed to generate payment receipt PDF');
    }
  });

  ipcMain.handle('reports:generateCustomerStatement', async (_, customerId: number, dateFrom?: string, dateTo?: string) => {
    try {
      const filePath = await ReportService.generateCustomerStatementPDF(customerId, dateFrom, dateTo);
      return { success: true, path: filePath };
    } catch (error: any) {
      if (error.message && error.message.includes('canceled')) {
        return { success: false, canceled: true };
      }
      throw new Error(error.message || 'Failed to generate customer statement PDF');
    }
  });

  ipcMain.handle('reports:generateOverdueLoans', async () => {
    try {
      const filePath = await ReportService.generateOverdueLoansReportPDF();
      return { success: true, path: filePath };
    } catch (error: any) {
      if (error.message && error.message.includes('canceled')) {
        return { success: false, canceled: true };
      }
      throw new Error(error.message || 'Failed to generate overdue loans report');
    }
  });

  ipcMain.handle('reports:generateDailyCollection', async (_, date: string) => {
    try {
      const filePath = await ReportService.generateDailyCollectionReportPDF(date);
      return { success: true, path: filePath };
    } catch (error: any) {
      if (error.message && error.message.includes('canceled')) {
        return { success: false, canceled: true };
      }
      throw new Error(error.message || 'Failed to generate daily collection report');
    }
  });

  ipcMain.handle('reports:generateLoanSummary', async () => {
    try {
      const filePath = await ReportService.generateLoanSummaryReportPDF();
      return { success: true, path: filePath };
    } catch (error: any) {
      if (error.message && error.message.includes('canceled')) {
        return { success: false, canceled: true };
      }
      throw new Error(error.message || 'Failed to generate loan summary report');
    }
  });
}

