import { ipcMain, dialog } from 'electron';
import { DocumentService } from '../services/document.service';
import fs from 'fs';

export function setupDocumentHandlers() {
  ipcMain.handle('documents:list', async (_, entityType: string, entityId: number) => {
    try {
      return DocumentService.getDocuments(entityType, entityId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch documents');
    }
  });

  ipcMain.handle('documents:upload', async (_, entityType: string, entityId: number, documentType?: string) => {
    try {
      // Open file dialog
      const result = await dialog.showOpenDialog({
        title: 'Select Document',
        filters: [
          { name: 'All Files', extensions: ['*'] },
          { name: 'PDF', extensions: ['pdf'] },
          { name: 'Images', extensions: ['jpg', 'jpeg', 'png'] },
          { name: 'Documents', extensions: ['doc', 'docx', 'xls', 'xlsx'] },
        ],
        properties: ['openFile']
      });

      if (result.canceled || !result.filePaths.length) {
        return null;
      }

      const filePath = result.filePaths[0];
      return await DocumentService.uploadDocument(entityType as any, entityId, filePath, documentType);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to upload document');
    }
  });

  ipcMain.handle('documents:download', async (_, documentId: number) => {
    try {
      // Open save dialog
      const result = await dialog.showSaveDialog({
        title: 'Save Document',
        defaultPath: 'document'
      });

      if (result.canceled || !result.filePath) {
        return null;
      }

      await DocumentService.downloadDocument(documentId, result.filePath);
      return { success: true, path: result.filePath };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to download document');
    }
  });

  ipcMain.handle('documents:delete', async (_, documentId: number) => {
    try {
      DocumentService.deleteDocument(documentId);
      return { success: true };
    } catch (error: any) {
      throw new Error(error.message || 'Failed to delete document');
    }
  });

  ipcMain.handle('documents:get', async (_, documentId: number) => {
    try {
      return DocumentService.getDocument(documentId);
    } catch (error: any) {
      throw new Error(error.message || 'Failed to fetch document');
    }
  });
}

