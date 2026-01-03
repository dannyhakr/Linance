import { ipcMain } from 'electron';
import { CollateralService } from '../services/collateral.service';

export function setupCollateralHandlers() {
  ipcMain.handle('collaterals:list', async (_, filters?: any) => {
    try {
      return CollateralService.list(filters);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to list collaterals');
    }
  });

  ipcMain.handle('collaterals:get', async (_, id: number) => {
    try {
      return CollateralService.get(id);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get collateral');
    }
  });

  ipcMain.handle('collaterals:create', async (_, data: any) => {
    try {
      return CollateralService.create(data);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create collateral');
    }
  });

  ipcMain.handle('collaterals:update', async (_, id: number, data: any) => {
    try {
      return CollateralService.update(id, data);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update collateral');
    }
  });

  ipcMain.handle('collaterals:delete', async (_, id: number) => {
    try {
      return CollateralService.delete(id);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete collateral');
    }
  });

  ipcMain.handle('collaterals:getValuations', async (_, collateralId: number) => {
    try {
      return CollateralService.getValuations(collateralId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to get valuations');
    }
  });

  ipcMain.handle('collaterals:addValuation', async (_, collateralId: number, data: any) => {
    try {
      return CollateralService.addValuation(collateralId, data);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to add valuation');
    }
  });

  ipcMain.handle('collaterals:linkToLoan', async (_, collateralId: number, loanId: number) => {
    try {
      return CollateralService.linkToLoan(collateralId, loanId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to link collateral to loan');
    }
  });

  ipcMain.handle('collaterals:unlinkFromLoan', async (_, collateralId: number) => {
    try {
      return CollateralService.unlinkFromLoan(collateralId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to unlink collateral from loan');
    }
  });
}

