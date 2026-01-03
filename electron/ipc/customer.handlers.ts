import { ipcMain } from 'electron';
import { CustomerService, CustomerFilters } from '../services/customer.service';

export function setupCustomerHandlers() {
  ipcMain.handle('customers:list', async (_, filters?: CustomerFilters) => {
    try {
      return CustomerService.list(filters);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch customers');
    }
  });

  ipcMain.handle('customers:get', async (_, id: number) => {
    try {
      return CustomerService.get(id);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch customer');
    }
  });

  ipcMain.handle('customers:create', async (_, data: any) => {
    try {
      return CustomerService.create(data);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to create customer');
    }
  });

  ipcMain.handle('customers:update', async (_, id: number, data: any) => {
    try {
      return CustomerService.update(id, data);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to update customer');
    }
  });

  ipcMain.handle('customers:getStats', async (_, customerId: number) => {
    try {
      return CustomerService.getCustomerStats(customerId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch customer stats');
    }
  });

  ipcMain.handle('customers:delete', async (_, id: number, adminPassword: string) => {
    try {
      return CustomerService.delete(id, adminPassword);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete customer');
    }
  });
}

