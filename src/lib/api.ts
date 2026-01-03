// IPC API wrapper for Electron communication

declare global {
  interface Window {
    electronAPI: {
      ping: () => Promise<string>;
      login: (username: string, password: string) => Promise<any>;
      changePassword: (oldPassword: string, newPassword: string) => Promise<any>;
      getCustomers: (filters?: any) => Promise<any>;
      getCustomer: (id: number) => Promise<any>;
      createCustomer: (data: any) => Promise<any>;
      updateCustomer: (id: number, data: any) => Promise<any>;
      deleteCustomer: (id: number, adminPassword: string) => Promise<any>;
      getCustomerStats: (customerId: number) => Promise<any>;
      getLoans: (filters?: any) => Promise<any>;
      getLoan: (id: number) => Promise<any>;
      createLoan: (data: any) => Promise<any>;
      closeLoan: (id: number) => Promise<any>;
      reopenLoan: (id: number) => Promise<any>;
      deleteLoan: (id: number, adminPassword: string) => Promise<any>;
      recordPayment: (loanId: number, paymentData: any) => Promise<any>;
      getLoanSchedule: (loanId: number) => Promise<any>;
      getPayments: (filters?: any) => Promise<any>;
      getCollaterals: (filters?: any) => Promise<any>;
      getCollateral: (id: number) => Promise<any>;
      createCollateral: (data: any) => Promise<any>;
      updateCollateral: (id: number, data: any) => Promise<any>;
      deleteCollateral: (id: number) => Promise<any>;
      getCollateralValuations: (collateralId: number) => Promise<any>;
      addCollateralValuation: (collateralId: number, data: any) => Promise<any>;
      linkCollateralToLoan: (collateralId: number, loanId: number) => Promise<any>;
      unlinkCollateralFromLoan: (collateralId: number) => Promise<any>;
      generateLoanSchedulePDF: (loanId: number) => Promise<any>;
      generatePaymentReceiptPDF: (paymentId: number) => Promise<any>;
      generateCustomerStatementPDF: (customerId: number, dateFrom?: string, dateTo?: string) => Promise<any>;
      generateOverdueLoansPDF: () => Promise<any>;
      generateDailyCollectionPDF: (date: string) => Promise<any>;
      generateLoanSummaryPDF: () => Promise<any>;
      getDashboardData: () => Promise<any>;
      getDocuments: (entityType: string, entityId: number) => Promise<any>;
      uploadDocument: (entityType: string, entityId: number, documentType?: string) => Promise<any>;
      downloadDocument: (documentId: number) => Promise<any>;
      deleteDocument: (documentId: number) => Promise<any>;
      getDocument: (documentId: number) => Promise<any>;
    };
  }
}

// Check if electronAPI is available
const isElectron = typeof window !== 'undefined' && window.electronAPI;

export const api = {
  auth: {
    login: (username: string, password: string) => {
      if (!isElectron) {
        throw new Error('Electron API not available. Make sure you are running in Electron.');
      }
      return window.electronAPI!.login(username, password);
    },
    changePassword: (oldPassword: string, newPassword: string) => {
      if (!isElectron) {
        throw new Error('Electron API not available.');
      }
      return window.electronAPI!.changePassword(oldPassword, newPassword);
    },
  },
  customers: {
    list: (filters?: any) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.getCustomers(filters);
    },
    get: (id: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.getCustomer(id);
    },
    create: (data: any) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.createCustomer(data);
    },
    update: (id: number, data: any) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.updateCustomer(id, data);
    },
    getStats: (customerId: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.getCustomerStats(customerId);
    },
    delete: (id: number, adminPassword: string) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.deleteCustomer(id, adminPassword);
    },
  },
  loans: {
    list: (filters?: any) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.getLoans(filters);
    },
    get: (id: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.getLoan(id);
    },
    create: (data: any) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.createLoan(data);
    },
    close: (id: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.closeLoan(id);
    },
    reopen: (id: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.reopenLoan(id);
    },
    delete: (id: number, adminPassword: string) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.deleteLoan(id, adminPassword);
    },
    recordPayment: (loanId: number, paymentData: any) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.recordPayment(loanId, paymentData);
    },
    getSchedule: (loanId: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.getLoanSchedule(loanId);
    },
  },
  payments: {
    list: (filters?: any) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.getPayments(filters);
    },
  },
  collaterals: {
    list: (filters?: any) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.getCollaterals(filters);
    },
    get: (id: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.getCollateral(id);
    },
    create: (data: any) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.createCollateral(data);
    },
    update: (id: number, data: any) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.updateCollateral(id, data);
    },
    delete: (id: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.deleteCollateral(id);
    },
    getValuations: (collateralId: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.getCollateralValuations(collateralId);
    },
    addValuation: (collateralId: number, data: any) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.addCollateralValuation(collateralId, data);
    },
    linkToLoan: (collateralId: number, loanId: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.linkCollateralToLoan(collateralId, loanId);
    },
    unlinkFromLoan: (collateralId: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.unlinkCollateralFromLoan(collateralId);
    },
  },
  reports: {
    generateLoanSchedule: (loanId: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.generateLoanSchedulePDF(loanId);
    },
    generatePaymentReceipt: (paymentId: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.generatePaymentReceiptPDF(paymentId);
    },
    generateCustomerStatement: (customerId: number, dateFrom?: string, dateTo?: string) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.generateCustomerStatementPDF(customerId, dateFrom, dateTo);
    },
    generateOverdueLoans: () => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.generateOverdueLoansPDF();
    },
    generateDailyCollection: (date: string) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.generateDailyCollectionPDF(date);
    },
    generateLoanSummary: () => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.generateLoanSummaryPDF();
    },
  },
  dashboard: {
    getData: () => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.getDashboardData();
    },
  },
  documents: {
    list: (entityType: string, entityId: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.getDocuments(entityType, entityId);
    },
    upload: (entityType: string, entityId: number, documentType?: string) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.uploadDocument(entityType, entityId, documentType);
    },
    download: (documentId: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.downloadDocument(documentId);
    },
    delete: (documentId: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.deleteDocument(documentId);
    },
    get: (documentId: number) => {
      if (!isElectron) throw new Error('Electron API not available.');
      return window.electronAPI!.getDocument(documentId);
    },
  },
};

