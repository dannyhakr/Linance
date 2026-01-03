import { ipcMain } from 'electron';
import { LoanService } from '../services/loan.service';

export function setupLoanHandlers() {
  ipcMain.handle('loans:list', async (_, filters?: any) => {
    try {
      return LoanService.list(filters);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch loans');
    }
  });

  ipcMain.handle('loans:get', async (_, id: number) => {
    try {
      return LoanService.get(id);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch loan');
    }
  });

  ipcMain.handle('loans:create', async (_, data: any) => {
    try {
      return LoanService.create(data);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create loan');
    }
  });

  ipcMain.handle('loans:recordPayment', async (_, loanId: number, paymentData: any) => {
    try {
      return LoanService.recordPayment(loanId, paymentData);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to record payment');
    }
  });

  ipcMain.handle('loans:getSchedule', async (_, loanId: number) => {
    try {
      return LoanService.getSchedule(loanId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch schedule');
    }
  });

  ipcMain.handle('loans:close', async (_, loanId: number) => {
    try {
      return LoanService.closeLoan(loanId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to close loan');
    }
  });

  ipcMain.handle('loans:reopen', async (_, loanId: number) => {
    try {
      return LoanService.reopenLoan(loanId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to reopen loan');
    }
  });

  ipcMain.handle('loans:delete', async (_, id: number, adminPassword: string) => {
    try {
      return LoanService.delete(id, adminPassword);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete loan');
    }
  });
}

