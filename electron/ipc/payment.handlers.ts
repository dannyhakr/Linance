import { ipcMain } from 'electron';
import { PaymentService } from '../services/payment.service';

export function setupPaymentHandlers() {
  ipcMain.handle('payments:list', async (_, filters?: any) => {
    try {
      return PaymentService.list(filters);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch payments');
    }
  });
}

