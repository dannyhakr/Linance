import { app, BrowserWindow, ipcMain } from 'electron';
import path from 'path';
import { initDatabase } from './database/db';
import { setupAuthHandlers } from './ipc/auth.handlers';
import { setupDashboardHandlers } from './ipc/dashboard.handlers';
import { setupCustomerHandlers } from './ipc/customer.handlers';
import { setupLoanHandlers } from './ipc/loan.handlers';
import { setupPaymentHandlers } from './ipc/payment.handlers';
import { setupDocumentHandlers } from './ipc/document.handlers';
import { setupReportHandlers } from './ipc/report.handlers';
import { setupCollateralHandlers } from './ipc/collateral.handlers';

let mainWindow: BrowserWindow | null = null;

function createWindow() {
  mainWindow = new BrowserWindow({
    width: 1400,
    height: 900,
    webPreferences: {
      preload: path.join(__dirname, 'preload.js'),
      nodeIntegration: false,
      contextIsolation: true,
    },
  });

  // Check if we're in development mode
  // app.isPackaged is false when running from source (development)
  const isDev = !app.isPackaged || process.env.NODE_ENV === 'development';
  
  console.log('Environment check:', {
    isPackaged: app.isPackaged,
    NODE_ENV: process.env.NODE_ENV,
    isDev: isDev
  });
  
  if (isDev) {
    // In development, load from Vite dev server
    console.log('Loading from Vite dev server: http://localhost:5173');
    mainWindow.loadURL('http://localhost:5173').catch((err) => {
      console.error('Failed to load Vite dev server:', err);
      console.log('Make sure Vite is running on http://localhost:5173');
    });
    mainWindow.webContents.openDevTools();
  } else {
    // In production, load from built files
    const indexPath = path.join(__dirname, '../dist/index.html');
    console.log('Loading from file:', indexPath);
    mainWindow.loadFile(indexPath);
  }
}

app.whenReady().then(async () => {
  // Initialize database
  initDatabase();
  
  // Setup IPC handlers
  setupIPC();
  
  createWindow();
});

function setupIPC() {
  // Ping test handler
  ipcMain.handle('ping', () => {
    return 'pong';
  });

  // Setup feature handlers
  setupAuthHandlers();
  setupDashboardHandlers();
  setupCustomerHandlers();
  setupLoanHandlers();
  setupPaymentHandlers();
  setupDocumentHandlers();
  setupReportHandlers();
  setupCollateralHandlers();
}

app.on('window-all-closed', () => {
  if (process.platform !== 'darwin') {
    app.quit();
  }
});

app.on('activate', () => {
  if (BrowserWindow.getAllWindows().length === 0) {
    createWindow();
  }
});

