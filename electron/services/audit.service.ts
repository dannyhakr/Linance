import { db } from '../database/db';

export function auditLog(
  operatorId: number | null,
  action: string,
  entityType: string | null,
  entityId: number | null,
  details: any
) {
  if (!db) return;

  try {
    db.prepare(`
      INSERT INTO audit_log (operator_id, action, entity_type, entity_id, details)
      VALUES (?, ?, ?, ?, ?)
    `).run(
      operatorId,
      action,
      entityType,
      entityId,
      JSON.stringify(details)
    );
  } catch (error) {
    console.error('Failed to write audit log:', error);
  }
}

