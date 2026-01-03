import { getDatabase } from '../database/db';
import { auditLog } from './audit.service';

export interface Collateral {
  id: number;
  loan_id?: number;
  asset_type: 'vehicle' | 'gold' | 'property' | 'other';
  description?: string;
  serial_number?: string;
  registration_number?: string;
  original_value: number;
  current_value: number;
  owner_name?: string;
  valuation_date: string;
  at_risk: boolean;
  risk_threshold: number;
  created_at: string;
  updated_at: string;
}

export interface CollateralValuation {
  id: number;
  collateral_id: number;
  valuation_date: string;
  value: number;
  valuator?: string;
  notes?: string;
  created_at: string;
}

export class CollateralService {
  static list(filters?: {
    loan_id?: number;
    asset_type?: string;
    at_risk?: boolean;
  }) {
    const db = getDatabase();
    
    let query = `
      SELECT c.*, l.loan_number, cu.name as customer_name
      FROM collaterals c
      LEFT JOIN loans l ON c.loan_id = l.id
      LEFT JOIN customers cu ON l.customer_id = cu.id
      WHERE 1=1
    `;
    const params: any[] = [];

    if (filters?.loan_id) {
      query += ' AND c.loan_id = ?';
      params.push(filters.loan_id);
    }
    if (filters?.asset_type) {
      query += ' AND c.asset_type = ?';
      params.push(filters.asset_type);
    }
    if (filters?.at_risk !== undefined) {
      query += ' AND c.at_risk = ?';
      params.push(filters.at_risk ? 1 : 0);
    }

    query += ' ORDER BY c.created_at DESC';

    return db.prepare(query).all(...params) as any[];
  }

  static get(id: number) {
    const db = getDatabase();
    const collateral = db.prepare(`
      SELECT c.*, l.loan_number, cu.name as customer_name
      FROM collaterals c
      LEFT JOIN loans l ON c.loan_id = l.id
      LEFT JOIN customers cu ON l.customer_id = cu.id
      WHERE c.id = ?
    `).get(id) as any;

    if (!collateral) {
      throw new Error('Collateral not found');
    }

    return collateral;
  }

  static create(data: {
    loan_id?: number;
    asset_type: 'vehicle' | 'gold' | 'property' | 'other';
    description?: string;
    serial_number?: string;
    registration_number?: string;
    original_value: number;
    current_value: number;
    owner_name?: string;
    valuation_date: string;
    risk_threshold?: number;
  }) {
    const db = getDatabase();

    return db.transaction(() => {
      const riskThreshold = data.risk_threshold ?? 0.2;
      const valueDrop = ((data.original_value - data.current_value) / data.original_value);
      const atRisk = valueDrop > riskThreshold;

      const id = db.prepare(`
        INSERT INTO collaterals (
          loan_id, asset_type, description, serial_number, registration_number,
          original_value, current_value, owner_name, valuation_date,
          at_risk, risk_threshold
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
      `).run(
        data.loan_id || null,
        data.asset_type,
        data.description || null,
        data.serial_number || null,
        data.registration_number || null,
        data.original_value,
        data.current_value,
        data.owner_name || null,
        data.valuation_date,
        atRisk ? 1 : 0,
        riskThreshold
      ).lastInsertRowid as number;

      // Create initial valuation entry
      db.prepare(`
        INSERT INTO collateral_valuations (
          collateral_id, valuation_date, value, valuator, notes
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        id,
        data.valuation_date,
        data.current_value,
        null,
        'Initial valuation'
      );

      auditLog(null, 'create_collateral', 'collateral', id, data);

      return { id, success: true };
    })();
  }

  static update(id: number, data: {
    loan_id?: number;
    asset_type?: 'vehicle' | 'gold' | 'property' | 'other';
    description?: string;
    serial_number?: string;
    registration_number?: string;
    owner_name?: string;
    risk_threshold?: number;
  }) {
    const db = getDatabase();

    return db.transaction(() => {
      const existing = db.prepare('SELECT * FROM collaterals WHERE id = ?').get(id) as any;
      if (!existing) {
        throw new Error('Collateral not found');
      }

      const updates: string[] = [];
      const params: any[] = [];

      if (data.loan_id !== undefined) {
        updates.push('loan_id = ?');
        params.push(data.loan_id || null);
      }
      if (data.asset_type) {
        updates.push('asset_type = ?');
        params.push(data.asset_type);
      }
      if (data.description !== undefined) {
        updates.push('description = ?');
        params.push(data.description || null);
      }
      if (data.serial_number !== undefined) {
        updates.push('serial_number = ?');
        params.push(data.serial_number || null);
      }
      if (data.registration_number !== undefined) {
        updates.push('registration_number = ?');
        params.push(data.registration_number || null);
      }
      if (data.owner_name !== undefined) {
        updates.push('owner_name = ?');
        params.push(data.owner_name || null);
      }
      if (data.risk_threshold !== undefined) {
        updates.push('risk_threshold = ?');
        params.push(data.risk_threshold);
      }

      if (updates.length === 0) {
        return { success: true };
      }

      updates.push('updated_at = CURRENT_TIMESTAMP');
      params.push(id);

      db.prepare(`
        UPDATE collaterals 
        SET ${updates.join(', ')}
        WHERE id = ?
      `).run(...params);

      // Recalculate at_risk if value changed
      const updated = db.prepare('SELECT * FROM collaterals WHERE id = ?').get(id) as any;
      const valueDrop = ((updated.original_value - updated.current_value) / updated.original_value);
      const atRisk = valueDrop > updated.risk_threshold;

      db.prepare('UPDATE collaterals SET at_risk = ? WHERE id = ?')
        .run(atRisk ? 1 : 0, id);

      auditLog(null, 'update_collateral', 'collateral', id, data);

      return { success: true };
    })();
  }

  static delete(id: number) {
    const db = getDatabase();

    return db.transaction(() => {
      const existing = db.prepare('SELECT * FROM collaterals WHERE id = ?').get(id) as any;
      if (!existing) {
        throw new Error('Collateral not found');
      }

      // Delete valuations
      db.prepare('DELETE FROM collateral_valuations WHERE collateral_id = ?').run(id);

      // Delete collateral
      db.prepare('DELETE FROM collaterals WHERE id = ?').run(id);

      auditLog(null, 'delete_collateral', 'collateral', id, {});

      return { success: true };
    })();
  }

  static getValuations(collateralId: number) {
    const db = getDatabase();
    return db.prepare(`
      SELECT * FROM collateral_valuations
      WHERE collateral_id = ?
      ORDER BY valuation_date DESC
    `).all(collateralId) as CollateralValuation[];
  }

  static addValuation(collateralId: number, data: {
    valuation_date: string;
    value: number;
    valuator?: string;
    notes?: string;
  }) {
    const db = getDatabase();

    return db.transaction(() => {
      const collateral = db.prepare('SELECT * FROM collaterals WHERE id = ?').get(collateralId) as any;
      if (!collateral) {
        throw new Error('Collateral not found');
      }

      // Add valuation entry
      db.prepare(`
        INSERT INTO collateral_valuations (
          collateral_id, valuation_date, value, valuator, notes
        ) VALUES (?, ?, ?, ?, ?)
      `).run(
        collateralId,
        data.valuation_date,
        data.value,
        data.valuator || null,
        data.notes || null
      );

      // Update current value and valuation date
      db.prepare(`
        UPDATE collaterals 
        SET current_value = ?, valuation_date = ?, updated_at = CURRENT_TIMESTAMP
        WHERE id = ?
      `).run(data.value, data.valuation_date, collateralId);

      // Recalculate at_risk
      const valueDrop = ((collateral.original_value - data.value) / collateral.original_value);
      const atRisk = valueDrop > collateral.risk_threshold;

      db.prepare('UPDATE collaterals SET at_risk = ? WHERE id = ?')
        .run(atRisk ? 1 : 0, collateralId);

      auditLog(null, 'add_valuation', 'collateral', collateralId, data);

      return { success: true };
    })();
  }

  static linkToLoan(collateralId: number, loanId: number) {
    const db = getDatabase();

    return db.transaction(() => {
      const collateral = db.prepare('SELECT * FROM collaterals WHERE id = ?').get(collateralId) as any;
      if (!collateral) {
        throw new Error('Collateral not found');
      }

      const loan = db.prepare('SELECT * FROM loans WHERE id = ?').get(loanId) as any;
      if (!loan) {
        throw new Error('Loan not found');
      }

      db.prepare('UPDATE collaterals SET loan_id = ?, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(loanId, collateralId);

      auditLog(null, 'link_collateral', 'collateral', collateralId, { loan_id: loanId });

      return { success: true };
    })();
  }

  static unlinkFromLoan(collateralId: number) {
    const db = getDatabase();

    return db.transaction(() => {
      const collateral = db.prepare('SELECT * FROM collaterals WHERE id = ?').get(collateralId) as any;
      if (!collateral) {
        throw new Error('Collateral not found');
      }

      db.prepare('UPDATE collaterals SET loan_id = NULL, updated_at = CURRENT_TIMESTAMP WHERE id = ?')
        .run(collateralId);

      auditLog(null, 'unlink_collateral', 'collateral', collateralId, {});

      return { success: true };
    })();
  }
}

