import bcrypt from 'bcrypt';
import { db } from '../database/db';
import { auditLog } from './audit.service';

export class AuthService {
  static async login(username: string, password: string) {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const user = db.prepare('SELECT * FROM operators WHERE username = ?').get(username) as any;
    
    if (!user) {
      throw new Error('Invalid credentials');
    }
    
    const isValid = await bcrypt.compare(password, user.password_hash);
    if (!isValid) {
      throw new Error('Invalid credentials');
    }
    
    // Update last login
    db.prepare('UPDATE operators SET last_login = CURRENT_TIMESTAMP WHERE id = ?')
      .run(user.id);
    
    // Audit log
    auditLog(user.id, 'login', 'operator', user.id, { username });
    
    return { id: user.id, username: user.username };
  }
  
  static async changePassword(userId: number, oldPassword: string, newPassword: string) {
    if (!db) {
      throw new Error('Database not initialized');
    }

    const user = db.prepare('SELECT * FROM operators WHERE id = ?').get(userId) as any;
    if (!user) {
      throw new Error('User not found');
    }

    const isValid = await bcrypt.compare(oldPassword, user.password_hash);
    
    if (!isValid) {
      throw new Error('Current password is incorrect');
    }
    
    const hash = await bcrypt.hash(newPassword, 10);
    db.prepare('UPDATE operators SET password_hash = ? WHERE id = ?')
      .run(hash, userId);
    
    auditLog(userId, 'change_password', 'operator', userId, {});
    return { success: true };
  }
}

