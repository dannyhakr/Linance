import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../lib/api';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Collaterals() {
  const [collaterals, setCollaterals] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);
  const [editingCollateral, setEditingCollateral] = useState<any>(null);
  const [filters, setFilters] = useState({
    asset_type: '',
    at_risk: ''
  });
  const navigate = useNavigate();

  usePageTitle('Collaterals');

  useEffect(() => {
    loadCollaterals();
  }, [filters]);

  const loadCollaterals = async () => {
    try {
      setLoading(true);
      const filterParams: any = {};
      if (filters.asset_type) filterParams.asset_type = filters.asset_type;
      if (filters.at_risk !== '') filterParams.at_risk = filters.at_risk === 'true';
      
      const data = await api.collaterals.list(filterParams);
      setCollaterals(data);
    } catch (error) {
      console.error('Failed to load collaterals:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleDelete = async (id: number) => {
    if (!confirm('Are you sure you want to delete this collateral?')) {
      return;
    }
    try {
      await api.collaterals.delete(id);
      await loadCollaterals();
      toast.success('Collateral deleted successfully!');
    } catch (error: any) {
      toast.error('Failed to delete collateral: ' + error.message);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <h1>Collaterals</h1>
        <button
          onClick={() => {
            setEditingCollateral(null);
            setShowModal(true);
          }}
          style={{
            padding: '0.75rem 1.5rem',
            backgroundColor: '#007bff',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            fontSize: '1rem'
          }}
        >
          + New Collateral
        </button>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '1.5rem',
        display: 'flex',
        gap: '1rem',
        alignItems: 'center'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
            Asset Type
          </label>
          <select
            value={filters.asset_type}
            onChange={(e) => setFilters({ ...filters, asset_type: e.target.value })}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All Types</option>
            <option value="vehicle">Vehicle</option>
            <option value="gold">Gold</option>
            <option value="property">Property</option>
            <option value="other">Other</option>
          </select>
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
            Risk Status
          </label>
          <select
            value={filters.at_risk}
            onChange={(e) => setFilters({ ...filters, at_risk: e.target.value })}
            style={{
              padding: '0.5rem',
              border: '1px solid #ddd',
              borderRadius: '4px',
              fontSize: '0.875rem'
            }}
          >
            <option value="">All</option>
            <option value="true">At Risk</option>
            <option value="false">Safe</option>
          </select>
        </div>
      </div>

      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : collaterals.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          No collaterals found
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
          overflow: 'hidden'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa', borderBottom: '2px solid #dee2e6' }}>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Type</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Description</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Linked Loan</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Original Value</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Current Value</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {collaterals.map((collateral) => (
                <tr key={collateral.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>
                    {collateral.asset_type}
                  </td>
                  <td style={{ padding: '1rem' }}>{collateral.description || '-'}</td>
                  <td style={{ padding: '1rem' }}>
                    {collateral.loan_number ? (
                      <span style={{ color: '#007bff', cursor: 'pointer' }}
                        onClick={() => navigate(`/loans/${collateral.loan_id}`)}
                      >
                        {collateral.loan_number}
                      </span>
                    ) : (
                      <span style={{ color: '#999' }}>Not linked</span>
                    )}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    ${collateral.original_value.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    ${collateral.current_value.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    {collateral.at_risk ? (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        backgroundColor: '#dc354520',
                        color: '#dc3545',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        At Risk
                      </span>
                    ) : (
                      <span style={{
                        padding: '0.25rem 0.75rem',
                        borderRadius: '12px',
                        backgroundColor: '#28a74520',
                        color: '#28a745',
                        fontSize: '0.875rem',
                        fontWeight: '500'
                      }}>
                        Safe
                      </span>
                    )}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <div style={{ display: 'flex', gap: '0.5rem' }}>
                      <button
                        onClick={() => navigate(`/assets/${collateral.id}/valuation`)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#007bff',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        View Valuation
                      </button>
                      <button
                        onClick={() => {
                          setEditingCollateral(collateral);
                          setShowModal(true);
                        }}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#6c757d',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Edit
                      </button>
                      <button
                        onClick={() => handleDelete(collateral.id)}
                        style={{
                          padding: '0.5rem 1rem',
                          backgroundColor: '#dc3545',
                          color: 'white',
                          border: 'none',
                          borderRadius: '4px',
                          cursor: 'pointer',
                          fontSize: '0.875rem'
                        }}
                      >
                        Delete
                      </button>
                    </div>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {showModal && (
        <CollateralForm
          collateral={editingCollateral}
          onClose={() => {
            setShowModal(false);
            setEditingCollateral(null);
          }}
          onSuccess={() => {
            setShowModal(false);
            setEditingCollateral(null);
            loadCollaterals();
          }}
        />
      )}
    </div>
  );
}

function CollateralForm({ collateral, onClose, onSuccess }: { collateral?: any; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    loan_id: collateral?.loan_id || '',
    asset_type: collateral?.asset_type || 'vehicle',
    description: collateral?.description || '',
    serial_number: collateral?.serial_number || '',
    registration_number: collateral?.registration_number || '',
    original_value: collateral?.original_value !== undefined && collateral?.original_value !== null ? String(collateral.original_value) : '',
    current_value: collateral?.current_value !== undefined && collateral?.current_value !== null ? String(collateral.current_value) : '',
    owner_name: collateral?.owner_name || '',
    valuation_date: collateral?.valuation_date || new Date().toISOString().split('T')[0],
    risk_threshold: collateral?.risk_threshold || 0.2
  });
  const [submitting, setSubmitting] = useState(false);
  const [loans, setLoans] = useState<any[]>([]);

  useEffect(() => {
    loadLoans();
  }, []);

  const loadLoans = async () => {
    try {
      const data = await api.loans.list({ status: 'active' });
      setLoans(data);
    } catch (error) {
      console.error('Failed to load loans:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      if (collateral) {
        await api.collaterals.update(collateral.id, formData);
        toast.success('Collateral updated successfully!');
      } else {
        await api.collaterals.create({
          ...formData,
          loan_id: formData.loan_id ? Number(formData.loan_id) : undefined,
          original_value: Number(formData.original_value),
          current_value: Number(formData.current_value),
          risk_threshold: Number(formData.risk_threshold)
        });
        toast.success('Collateral created successfully!');
      }
      onSuccess();
    } catch (error: any) {
      toast.error('Failed to save collateral: ' + error.message);
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <div style={{
      position: 'fixed',
      top: 0,
      left: 0,
      right: 0,
      bottom: 0,
      backgroundColor: 'rgba(0,0,0,0.5)',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        borderRadius: '8px',
        padding: '2rem',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflowY: 'auto'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>
          {collateral ? 'Edit Collateral' : 'New Collateral'}
        </h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Asset Type *
            </label>
            <select
              value={formData.asset_type}
              onChange={(e) => setFormData({ ...formData, asset_type: e.target.value as any })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            >
              <option value="vehicle">Vehicle</option>
              <option value="gold">Gold</option>
              <option value="property">Property</option>
              <option value="other">Other</option>
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Description
            </label>
            <textarea
              value={formData.description}
              onChange={(e) => setFormData({ ...formData, description: e.target.value })}
              rows={3}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                fontFamily: 'inherit'
              }}
            />
          </div>

          {formData.asset_type === 'vehicle' && (
            <>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Registration Number
                </label>
                <input
                  type="text"
                  value={formData.registration_number}
                  onChange={(e) => setFormData({ ...formData, registration_number: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div style={{ marginBottom: '1rem' }}>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Serial/Chassis Number
                </label>
                <input
                  type="text"
                  value={formData.serial_number}
                  onChange={(e) => setFormData({ ...formData, serial_number: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </>
          )}

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Original Value ($) *
            </label>
            <input
              type="number"
              value={formData.original_value || ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, original_value: val });
              }}
              required
              min="0"
              step="0.01"
              placeholder="Enter original value"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Current Value ($) *
            </label>
            <input
              type="number"
              value={formData.current_value || ''}
              onChange={(e) => {
                const val = e.target.value;
                setFormData({ ...formData, current_value: val });
              }}
              required
              min="0"
              step="0.01"
              placeholder="Enter current value"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                boxSizing: 'border-box'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Valuation Date *
            </label>
            <input
              type="date"
              value={formData.valuation_date}
              onChange={(e) => setFormData({ ...formData, valuation_date: e.target.value })}
              required
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Owner Name
            </label>
            <input
              type="text"
              value={formData.owner_name}
              onChange={(e) => setFormData({ ...formData, owner_name: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Link to Loan (Optional)
            </label>
            <select
              value={formData.loan_id}
              onChange={(e) => setFormData({ ...formData, loan_id: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            >
              <option value="">No loan</option>
              {loans.map((loan) => (
                <option key={loan.id} value={loan.id}>
                  {loan.loan_number} - {loan.customer_name}
                </option>
              ))}
            </select>
          </div>

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Risk Threshold (0-1, default 0.2 = 20%)
            </label>
            <input
              type="number"
              value={formData.risk_threshold}
              onChange={(e) => setFormData({ ...formData, risk_threshold: e.target.value })}
              min="0"
              max="1"
              step="0.01"
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
          </div>

          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end', marginTop: '2rem' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer',
                fontSize: '1rem'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: submitting ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting ? 'not-allowed' : 'pointer',
                fontSize: '1rem'
              }}
            >
              {submitting ? 'Saving...' : collateral ? 'Update' : 'Create'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
