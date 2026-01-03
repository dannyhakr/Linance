import { ipcMain } from 'electron';
import { AuthService } from '../services/auth.service';

export function setupAuthHandlers() {
  ipcMain.handle('auth:login', async (_, username: string, password: string) => {
    try {
      return await AuthService.login(username, password);
    } catch (error: any) {
      throw new Error(error.message || 'Login failed');
    }
  });

  ipcMain.handle('auth:changePassword', async (_, oldPassword: string, newPassword: string) => {
    try {
      // TODO: Get current user ID from session/context
      const userId = 1; // Placeholder - implement session management
      return await AuthService.changePassword(userId, oldPassword, newPassword);
    } catch (error: any) {
      throw new Error(error.message || 'Password change failed');
    }
  });
}

