import { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../lib/api';
import { usePageTitle } from '../hooks/usePageTitle';

export default function CollateralValuation() {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [collateral, setCollateral] = useState<any>(null);
  const [valuations, setValuations] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [showModal, setShowModal] = useState(false);

  usePageTitle('Collateral Valuation');

  useEffect(() => {
    if (id) {
      loadCollateral();
      loadValuations();
    }
  }, [id]);

  const loadCollateral = async () => {
    try {
      const data = await api.collaterals.get(Number(id));
      setCollateral(data);
    } catch (error) {
      console.error('Failed to load collateral:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadValuations = async () => {
    try {
      const data = await api.collaterals.getValuations(Number(id));
      setValuations(data);
    } catch (error) {
      console.error('Failed to load valuations:', error);
    }
  };

  if (loading) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Loading...</div>;
  }

  if (!collateral) {
    return <div style={{ padding: '2rem', textAlign: 'center' }}>Collateral not found</div>;
  }

  const valueDrop = ((collateral.original_value - collateral.current_value) / collateral.original_value) * 100;

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/collaterals')}
          style={{
            padding: '0.5rem 1rem',
            backgroundColor: '#6c757d',
            color: 'white',
            border: 'none',
            borderRadius: '4px',
            cursor: 'pointer',
            marginBottom: '1rem'
          }}
        >
          ← Back to Collaterals
        </button>
        <h1 style={{ marginTop: '1rem' }}>Collateral Valuation History</h1>
      </div>

      {/* Collateral Info */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem'
      }}>
        <h2 style={{ marginBottom: '1rem' }}>
          {collateral.asset_type.charAt(0).toUpperCase() + collateral.asset_type.slice(1)} - {collateral.description || 'No description'}
        </h2>
        {collateral.registration_number && (
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
            Registration: {collateral.registration_number}
          </p>
        )}
        {collateral.serial_number && (
          <p style={{ color: '#666', marginBottom: '0.5rem' }}>
            Serial: {collateral.serial_number}
          </p>
        )}
        {collateral.owner_name && (
          <p style={{ color: '#666', marginBottom: '1rem' }}>
            Owner: {collateral.owner_name}
          </p>
        )}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '1rem' }}>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Original Value</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              ${collateral.original_value.toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Current Value</div>
            <div style={{ fontSize: '1.5rem', fontWeight: 'bold' }}>
              ${collateral.current_value.toLocaleString('en-IN')}
            </div>
          </div>
          <div>
            <div style={{ fontSize: '0.875rem', color: '#666' }}>Value Drop</div>
            <div style={{
              fontSize: '1.5rem',
              fontWeight: 'bold',
              color: valueDrop > 20 ? '#dc3545' : '#28a745'
            }}>
              {valueDrop.toFixed(2)}%
            </div>
            {collateral.at_risk && (
              <div style={{
                marginTop: '0.5rem',
                padding: '0.25rem 0.75rem',
                borderRadius: '12px',
                backgroundColor: '#dc354520',
                color: '#dc3545',
                fontSize: '0.875rem',
                fontWeight: '500',
                display: 'inline-block'
              }}>
                At Risk
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Valuation History */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
      }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '1rem' }}>
          <h2>Valuation History</h2>
          <button
            onClick={() => setShowModal(true)}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: 'pointer'
            }}
          >
            + Add Valuation
          </button>
        </div>
        {valuations.length === 0 ? (
          <p style={{ color: '#666' }}>No valuation history found</p>
        ) : (
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ backgroundColor: '#f8f9fa' }}>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Date</th>
                <th style={{ padding: '0.75rem', textAlign: 'right' }}>Value</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Valuator</th>
                <th style={{ padding: '0.75rem', textAlign: 'left' }}>Notes</th>
              </tr>
            </thead>
            <tbody>
              {valuations.map((val) => (
                <tr key={val.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '0.75rem' }}>
                    {new Date(val.valuation_date).toLocaleDateString('en-IN')}
                  </td>
                  <td style={{ padding: '0.75rem', textAlign: 'right', fontWeight: '500' }}>
                    ${val.value.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '0.75rem' }}>{val.valuator || '-'}</td>
                  <td style={{ padding: '0.75rem', color: '#666' }}>{val.notes || '-'}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )}
      </div>

      {showModal && (
        <ValuationForm
          collateralId={Number(id)}
          onClose={() => setShowModal(false)}
          onSuccess={() => {
            setShowModal(false);
            loadValuations();
            loadCollateral();
          }}
        />
      )}
    </div>
  );
}

function ValuationForm({ collateralId, onClose, onSuccess }: { collateralId: number; onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState({
    valuation_date: new Date().toISOString().split('T')[0],
    value: '',
    valuator: '',
    notes: ''
  });
  const [submitting, setSubmitting] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      await api.collaterals.addValuation(collateralId, {
        ...formData,
        value: Number(formData.value),
        valuator: formData.valuator || undefined,
        notes: formData.notes || undefined
      });
      toast.success('Valuation added successfully!');
      onSuccess();
    } catch (error: any) {
      toast.error('Failed to add valuation: ' + error.message);
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
        maxWidth: '500px'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Add Valuation</h2>
        <form onSubmit={handleSubmit}>
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
              Value ($) *
            </label>
            <input
              type="number"
              value={formData.value}
              onChange={(e) => setFormData({ ...formData, value: e.target.value })}
              required
              min="0"
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

          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Valuator
            </label>
            <input
              type="text"
              value={formData.valuator}
              onChange={(e) => setFormData({ ...formData, valuator: e.target.value })}
              placeholder="Name of valuator or source"
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
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              rows={3}
              placeholder="Additional notes about this valuation"
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
              {submitting ? 'Adding...' : 'Add Valuation'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
