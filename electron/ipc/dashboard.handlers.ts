import { ipcMain } from 'electron';
import { DashboardService } from '../services/dashboard.service';

export function setupDashboardHandlers() {
  ipcMain.handle('dashboard:getData', async () => {
    try {
      return DashboardService.getDashboardData();
    } catch (error: any) {
      throw new Error(error.message || 'Failed to load dashboard data');
    }
  });
}

