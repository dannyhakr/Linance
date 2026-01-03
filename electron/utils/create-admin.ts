// Utility to create admin user if it doesn't exist
// This can be called manually or on app startup

import { getDatabase } from '../database/db';
import bcrypt from 'bcrypt';

export async function ensureAdminUser() {
  const db = getDatabase();
  
  const existing = db.prepare('SELECT COUNT(*) as count FROM operators').get() as { count: number };
  
  if (existing.count === 0) {
    const defaultPassword = 'admin123';
    const hash = await bcrypt.hash(defaultPassword, 10);
    
    db.prepare('INSERT INTO operators (username, password_hash) VALUES (?, ?)')
      .run('admin', hash);
    
    console.log('✅ Default operator created: username=admin, password=admin123');
    console.log('⚠️  CHANGE THIS PASSWORD IMMEDIATELY!');
    return true;
  }
  
  return false;
}

