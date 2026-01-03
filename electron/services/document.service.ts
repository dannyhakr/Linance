import { getDatabase } from '../database/db';
import { app } from 'electron';
import fs from 'fs';
import path from 'path';
import crypto from 'crypto';
import { auditLog } from './audit.service';

export interface Document {
  id: number;
  entity_type: 'customer' | 'loan' | 'collateral' | 'company';
  entity_id: number;
  document_type?: string;
  file_name: string;
  file_path: string;
  file_size: number;
  mime_type?: string;
  uploaded_at: string;
}

const ALGORITHM = 'aes-256-gcm';
const KEY_LENGTH = 32;
const IV_LENGTH = 16;

// Get encryption key (in production, this should be stored securely)
function getEncryptionKey(): Buffer {
  // For now, use a fixed key derived from app name
  // In production, use a secure key management system
  const keyMaterial = app.getName() + 'sri-kumaran-finance-secret-key-2024';
  return crypto.pbkdf2Sync(keyMaterial, 'salt', 100000, KEY_LENGTH, 'sha512');
}

export class DocumentService {
  static getDocuments(entityType: string, entityId: number): Document[] {
    const db = getDatabase();
    
    return db.prepare(`
      SELECT * FROM documents 
      WHERE entity_type = ? AND entity_id = ?
      ORDER BY uploaded_at DESC
    `).all(entityType, entityId) as Document[];
  }

  static async uploadDocument(
    entityType: 'customer' | 'loan' | 'collateral' | 'company',
    entityId: number,
    filePath: string,
    documentType?: string
  ): Promise<Document> {
    const db = getDatabase();
    
    // Get file info
    const stats = fs.statSync(filePath);
    const fileName = path.basename(filePath);
    const fileSize = stats.size;
    const mimeType = this.getMimeType(fileName);

    // Create documents directory
    const userDataPath = app.getPath('userData');
    const documentsDir = path.join(userDataPath, 'documents', entityType, String(entityId));
    if (!fs.existsSync(documentsDir)) {
      fs.mkdirSync(documentsDir, { recursive: true });
    }

    // Encrypt and save file
    const encryptedFileName = `${Date.now()}_${fileName}.enc`;
    const encryptedPath = path.join(documentsDir, encryptedFileName);
    this.encryptFile(filePath, encryptedPath);

    // Save metadata to database
    const result = db.prepare(`
      INSERT INTO documents (
        entity_type, entity_id, document_type, file_name,
        file_path, file_size, mime_type
      ) VALUES (?, ?, ?, ?, ?, ?, ?)
    `).run(
      entityType,
      entityId,
      documentType || null,
      fileName,
      encryptedPath,
      fileSize,
      mimeType || null
    );

    auditLog(null, 'upload_document', entityType, entityId, { file_name: fileName });

    return this.getDocument(Number(result.lastInsertRowid))!;
  }

  static getDocument(id: number): Document | null {
    const db = getDatabase();
    const doc = db.prepare('SELECT * FROM documents WHERE id = ?').get(id) as Document | undefined;
    return doc || null;
  }

  static async downloadDocument(id: number, outputPath: string): Promise<void> {
    const doc = this.getDocument(id);
    if (!doc) {
      throw new Error('Document not found');
    }

    // Decrypt and save to output path
    this.decryptFile(doc.file_path, outputPath);
  }

  static deleteDocument(id: number): void {
    const db = getDatabase();
    const doc = this.getDocument(id);
    
    if (!doc) {
      throw new Error('Document not found');
    }

    // Delete encrypted file
    if (fs.existsSync(doc.file_path)) {
      fs.unlinkSync(doc.file_path);
    }

    // Delete from database
    db.prepare('DELETE FROM documents WHERE id = ?').run(id);

    auditLog(null, 'delete_document', doc.entity_type, doc.entity_id, { file_name: doc.file_name });
  }

  private static encryptFile(inputPath: string, outputPath: string): void {
    const key = getEncryptionKey();
    const iv = crypto.randomBytes(IV_LENGTH);
    const fileBuffer = fs.readFileSync(inputPath);
    
    const cipher = crypto.createCipheriv(ALGORITHM, key, iv);
    const encrypted = Buffer.concat([
      cipher.update(fileBuffer),
      cipher.final()
    ]);

    // Write IV first, then encrypted data
    fs.writeFileSync(outputPath, Buffer.concat([iv, encrypted]));
  }

  private static decryptFile(inputPath: string, outputPath: string): void {
    const key = getEncryptionKey();
    const fileBuffer = fs.readFileSync(inputPath);
    
    // Extract IV from the beginning
    const iv = fileBuffer.slice(0, IV_LENGTH);
    const encryptedData = fileBuffer.slice(IV_LENGTH);

    const decipher = crypto.createDecipheriv(ALGORITHM, key, iv);
    const decrypted = Buffer.concat([
      decipher.update(encryptedData),
      decipher.final()
    ]);

    fs.writeFileSync(outputPath, decrypted);
  }

  private static getMimeType(fileName: string): string {
    const ext = path.extname(fileName).toLowerCase();
    const mimeTypes: { [key: string]: string } = {
      '.pdf': 'application/pdf',
      '.jpg': 'image/jpeg',
      '.jpeg': 'image/jpeg',
      '.png': 'image/png',
      '.doc': 'application/msword',
      '.docx': 'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
      '.xls': 'application/vnd.ms-excel',
      '.xlsx': 'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
    };
    return mimeTypes[ext] || 'application/octet-stream';
  }
}

