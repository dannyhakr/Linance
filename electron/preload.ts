import { contextBridge, ipcRenderer } from 'electron';

contextBridge.exposeInMainWorld('electronAPI', {
  // Test ping
  ping: () => ipcRenderer.invoke('ping'),
  
  // Auth methods (to be implemented)
  login: (username: string, password: string) => 
    ipcRenderer.invoke('auth:login', username, password),
  changePassword: (oldPassword: string, newPassword: string) =>
    ipcRenderer.invoke('auth:changePassword', oldPassword, newPassword),
  
  // Customer methods
  getCustomers: (filters?: any) => 
    ipcRenderer.invoke('customers:list', filters),
  getCustomer: (id: number) => 
    ipcRenderer.invoke('customers:get', id),
  createCustomer: (data: any) => 
    ipcRenderer.invoke('customers:create', data),
  updateCustomer: (id: number, data: any) => 
    ipcRenderer.invoke('customers:update', id, data),
  getCustomerStats: (customerId: number) =>
    ipcRenderer.invoke('customers:getStats', customerId),
  deleteCustomer: (id: number, adminPassword: string) =>
    ipcRenderer.invoke('customers:delete', id, adminPassword),
  
  // Loan methods
  getLoans: (filters?: any) => 
    ipcRenderer.invoke('loans:list', filters),
  getLoan: (id: number) => 
    ipcRenderer.invoke('loans:get', id),
  createLoan: (data: any) => 
    ipcRenderer.invoke('loans:create', data),
  deleteLoan: (id: number, adminPassword: string) =>
    ipcRenderer.invoke('loans:delete', id, adminPassword),
  recordPayment: (loanId: number, paymentData: any) => 
    ipcRenderer.invoke('loans:recordPayment', loanId, paymentData),
  getLoanSchedule: (loanId: number) =>
    ipcRenderer.invoke('loans:getSchedule', loanId),
  closeLoan: (loanId: number) =>
    ipcRenderer.invoke('loans:close', loanId),
  reopenLoan: (loanId: number) =>
    ipcRenderer.invoke('loans:reopen', loanId),
  
  // Payment methods (to be implemented)
  getPayments: (filters?: any) => 
    ipcRenderer.invoke('payments:list', filters),
  
  // Collateral methods
  getCollaterals: (filters?: any) => 
    ipcRenderer.invoke('collaterals:list', filters),
  getCollateral: (id: number) => 
    ipcRenderer.invoke('collaterals:get', id),
  createCollateral: (data: any) =>
    ipcRenderer.invoke('collaterals:create', data),
  updateCollateral: (id: number, data: any) =>
    ipcRenderer.invoke('collaterals:update', id, data),
  deleteCollateral: (id: number) =>
    ipcRenderer.invoke('collaterals:delete', id),
  getCollateralValuations: (collateralId: number) =>
    ipcRenderer.invoke('collaterals:getValuations', collateralId),
  addCollateralValuation: (collateralId: number, data: any) =>
    ipcRenderer.invoke('collaterals:addValuation', collateralId, data),
  linkCollateralToLoan: (collateralId: number, loanId: number) =>
    ipcRenderer.invoke('collaterals:linkToLoan', collateralId, loanId),
  unlinkCollateralFromLoan: (collateralId: number) =>
    ipcRenderer.invoke('collaterals:unlinkFromLoan', collateralId),
  
  // Report methods
  generateLoanSchedulePDF: (loanId: number) =>
    ipcRenderer.invoke('reports:generateLoanSchedule', loanId),
  generatePaymentReceiptPDF: (paymentId: number) =>
    ipcRenderer.invoke('reports:generatePaymentReceipt', paymentId),
  generateCustomerStatementPDF: (customerId: number, dateFrom?: string, dateTo?: string) =>
    ipcRenderer.invoke('reports:generateCustomerStatement', customerId, dateFrom, dateTo),
  generateOverdueLoansPDF: () =>
    ipcRenderer.invoke('reports:generateOverdueLoans'),
  generateDailyCollectionPDF: (date: string) =>
    ipcRenderer.invoke('reports:generateDailyCollection', date),
  generateLoanSummaryPDF: () =>
    ipcRenderer.invoke('reports:generateLoanSummary'),
  
  // Dashboard methods
  getDashboardData: () => 
    ipcRenderer.invoke('dashboard:getData'),
  
  // Document methods
  getDocuments: (entityType: string, entityId: number) =>
    ipcRenderer.invoke('documents:list', entityType, entityId),
  uploadDocument: (entityType: string, entityId: number, documentType?: string) =>
    ipcRenderer.invoke('documents:upload', entityType, entityId, documentType),
  downloadDocument: (documentId: number) =>
    ipcRenderer.invoke('documents:download', documentId),
  deleteDocument: (documentId: number) =>
    ipcRenderer.invoke('documents:delete', documentId),
  getDocument: (documentId: number) =>
    ipcRenderer.invoke('documents:get', documentId),
});

