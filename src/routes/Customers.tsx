import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../lib/api';
import { Customer } from '../types';
import { FiPlus, FiSearch, FiUser, FiPhone, FiDollarSign, FiCalendar, FiEye } from 'react-icons/fi';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Customers() {
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [filter, setFilter] = useState<string>('all');
  const navigate = useNavigate();

  usePageTitle('Customers');

  useEffect(() => {
    loadCustomers();
  }, [filter, search]);

  const loadCustomers = async () => {
    try {
      setLoading(true);
      const filters: any = {};
      
      if (search) {
        filters.search = search;
      }
      
      if (filter === 'withLoans') {
        filters.withActiveLoans = true;
      } else if (filter === 'withoutLoans') {
        filters.withoutLoans = true;
      } else if (filter === 'overdue') {
        filters.overdue = true;
      }

      const data = await api.customers.list(filters);
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    } finally {
      setLoading(false);
    }
  };

  const [showCreateModal, setShowCreateModal] = useState(false);

  const handleCreateCustomer = () => {
    setShowCreateModal(true);
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '2rem' }}>
        <button
          onClick={handleCreateCustomer}
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
          + New Customer
        </button>
      </div>

      {/* Search and Filters */}
      <div style={{ 
        marginBottom: '1.5rem', 
        display: 'flex', 
        gap: '1rem', 
        alignItems: 'center',
        backgroundColor: 'white',
        padding: '1rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef'
      }}>
        <div style={{ position: 'relative', flex: 1 }}>
          <FiSearch style={{
            position: 'absolute',
            left: '1rem',
            top: '50%',
            transform: 'translateY(-50%)',
            color: '#6c757d',
            fontSize: '1.1rem'
          }} />
          <input
            type="text"
            placeholder="Search by name or phone..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            style={{
              width: '100%',
              padding: '0.875rem 1rem 0.875rem 2.75rem',
              border: '2px solid #e9ecef',
              borderRadius: '10px',
              fontSize: '0.95rem',
              transition: 'all 0.2s',
              boxSizing: 'border-box'
            }}
            onFocus={(e) => {
              e.target.style.borderColor = '#667eea';
              e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
            }}
            onBlur={(e) => {
              e.target.style.borderColor = '#e9ecef';
              e.target.style.boxShadow = 'none';
            }}
          />
        </div>
        <select
          value={filter}
          onChange={(e) => setFilter(e.target.value)}
          style={{
            padding: '0.875rem 1rem',
            border: '2px solid #e9ecef',
            borderRadius: '10px',
            fontSize: '0.95rem',
            cursor: 'pointer',
            backgroundColor: 'white',
            minWidth: '180px',
            transition: 'all 0.2s',
            boxSizing: 'border-box'
          }}
          onFocus={(e) => {
            e.target.style.borderColor = '#667eea';
            e.target.style.boxShadow = '0 0 0 3px rgba(102, 126, 234, 0.1)';
          }}
          onBlur={(e) => {
            e.target.style.borderColor = '#e9ecef';
            e.target.style.boxShadow = 'none';
          }}
        >
          <option value="all">All Customers</option>
          <option value="withLoans">With Active Loans</option>
          <option value="withoutLoans">Without Loans</option>
          <option value="overdue">Overdue</option>
        </select>
      </div>

      {/* Customers List */}
      {loading ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)'
        }}>
          <div style={{ fontSize: '1.1rem', color: '#6c757d' }}>Loading customers...</div>
        </div>
      ) : customers.length === 0 ? (
        <div style={{ 
          textAlign: 'center', 
          padding: '3rem',
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef'
        }}>
          <FiUser style={{ fontSize: '3rem', color: '#cbd5e0', marginBottom: '1rem' }} />
          <div style={{ fontSize: '1.1rem', color: '#6c757d', marginBottom: '0.5rem' }}>
            No customers found
          </div>
          <p style={{ fontSize: '0.9rem', color: '#9ca3af', margin: 0 }}>
            Create your first customer to get started
          </p>
        </div>
      ) : (
        <div style={{
          backgroundColor: 'white',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          overflow: 'hidden',
          border: '1px solid #e9ecef'
        }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ 
                backgroundColor: '#f8f9fa', 
                borderBottom: '2px solid #e9ecef'
              }}>
                <th style={{ 
                  padding: '1.25rem 1rem', 
                  textAlign: 'left', 
                  fontWeight: '600',
                  color: '#1a1d29',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiUser style={{ fontSize: '1rem' }} />
                    Name
                  </div>
                </th>
                <th style={{ 
                  padding: '1.25rem 1rem', 
                  textAlign: 'left', 
                  fontWeight: '600',
                  color: '#1a1d29',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                    <FiPhone style={{ fontSize: '1rem' }} />
                    Phone
                  </div>
                </th>
                <th style={{ 
                  padding: '1.25rem 1rem', 
                  textAlign: 'left', 
                  fontWeight: '600',
                  color: '#1a1d29',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Address
                </th>
                <th style={{ 
                  padding: '1.25rem 1rem', 
                  textAlign: 'left', 
                  fontWeight: '600',
                  color: '#1a1d29',
                  fontSize: '0.875rem',
                  textTransform: 'uppercase',
                  letterSpacing: '0.5px'
                }}>
                  Actions
                </th>
              </tr>
            </thead>
            <tbody>
              {customers.map((customer) => (
                <tr
                  key={customer.id}
                  style={{
                    borderBottom: '1px solid #e9ecef',
                    cursor: 'pointer',
                    transition: 'all 0.2s'
                  }}
                  onClick={() => navigate(`/customers/${customer.id}`)}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.transform = 'scale(1.01)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = 'white';
                    e.currentTarget.style.transform = 'scale(1)';
                  }}
                >
                  <td style={{ 
                    padding: '1.25rem 1rem',
                    fontWeight: '500',
                    color: '#1a1d29'
                  }}>
                    {customer.name}
                  </td>
                  <td style={{ 
                    padding: '1.25rem 1rem',
                    color: '#6c757d'
                  }}>
                    {customer.phone}
                  </td>
                  <td style={{ 
                    padding: '1.25rem 1rem', 
                    color: '#6c757d',
                    fontSize: '0.9rem'
                  }}>
                    {customer.address || '-'}
                  </td>
                  <td style={{ padding: '1.25rem 1rem' }}>
                    <button
                      onClick={(e) => {
                        e.stopPropagation();
                        navigate(`/customers/${customer.id}`);
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#667eea',
                        color: 'white',
                        border: 'none',
                        borderRadius: '8px',
                        cursor: 'pointer',
                        fontSize: '0.875rem',
                        fontWeight: '500',
                        display: 'flex',
                        alignItems: 'center',
                        gap: '0.5rem',
                        transition: 'all 0.2s',
                        boxShadow: '0 2px 4px rgba(102, 126, 234, 0.3)'
                      }}
                      onMouseEnter={(e) => {
                        e.currentTarget.style.backgroundColor = '#5568d3';
                        e.currentTarget.style.transform = 'translateY(-1px)';
                        e.currentTarget.style.boxShadow = '0 4px 8px rgba(102, 126, 234, 0.4)';
                      }}
                      onMouseLeave={(e) => {
                        e.currentTarget.style.backgroundColor = '#667eea';
                        e.currentTarget.style.transform = 'translateY(0)';
                        e.currentTarget.style.boxShadow = '0 2px 4px rgba(102, 126, 234, 0.3)';
                      }}
                    >
                      <FiEye style={{ fontSize: '0.9rem' }} />
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      {/* Create Customer Modal */}
      {showCreateModal && (
        <CreateCustomerModal
          onClose={() => setShowCreateModal(false)}
          onSuccess={() => {
            setShowCreateModal(false);
            loadCustomers();
          }}
        />
      )}
    </div>
  );
}

type CustomerFormData = {
  name: string;
  phone: string;
  address: string;
  pan: string;
  aadhaar: string;
  notes: string;
};

function CreateCustomerModal({ onClose, onSuccess }: { onClose: () => void; onSuccess: () => void }) {
  const [formData, setFormData] = useState<CustomerFormData>({
    name: '',
    phone: '',
    address: '',
    pan: '',
    aadhaar: '',
    notes: ''
  });
  const [errors, setErrors] = useState<{ phone?: string; pan?: string; aadhaar?: string }>({});
  const [submitting, setSubmitting] = useState(false);

  const validate = (data: CustomerFormData) => {
    const newErrors: { phone?: string; pan?: string; aadhaar?: string } = {};

    // Phone: strictly 10 digits
    if (!/^[0-9]{10}$/.test(data.phone)) {
      newErrors.phone = 'Phone number must be exactly 10 digits.';
    }

    // PAN: optional but if present must match standard pattern
    if (data.pan) {
      const panRegex = /^[A-Z]{5}[0-9]{4}[A-Z]{1}$/;
      if (!panRegex.test(data.pan.toUpperCase())) {
        newErrors.pan = 'PAN must be 10 characters (e.g. ABCDE1234F).';
      }
    }

    // Aadhaar: optional but if present must be 12 digits
    if (data.aadhaar) {
      if (!/^[0-9]{12}$/.test(data.aadhaar)) {
        newErrors.aadhaar = 'Aadhaar must be exactly 12 digits.';
      }
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!validate(formData)) {
      return;
    }

    setSubmitting(true);
    try {
      await api.customers.create({
        ...formData,
        pan: formData.pan ? formData.pan.toUpperCase() : '',
        aadhaar: formData.aadhaar,
      });
      onSuccess();
    } catch (error: any) {
      toast.error('Failed to create customer: ' + (error.message || 'Unknown error'));
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
      justifyContent: 'center',
      alignItems: 'center',
      zIndex: 1000
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '2rem',
        borderRadius: '8px',
        width: '90%',
        maxWidth: '600px',
        maxHeight: '90vh',
        overflow: 'auto'
      }}>
        <h2 style={{ marginBottom: '1.5rem' }}>Add New Customer</h2>
        <form onSubmit={handleSubmit}>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Name *
            </label>
            <input
              type="text"
              value={formData.name}
              onChange={(e) => setFormData({ ...formData, name: e.target.value })}
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
              Phone *
            </label>
            <input
              type="tel"
              value={formData.phone}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, 10);
                setFormData({ ...formData, phone: digitsOnly });
              }}
              required
              maxLength={10}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem'
              }}
            />
            {errors.phone && (
              <div style={{ marginTop: '0.25rem', color: '#dc3545', fontSize: '0.85rem' }}>
                {errors.phone}
              </div>
            )}
          </div>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Address
            </label>
            <textarea
              value={formData.address}
              onChange={(e) => setFormData({ ...formData, address: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                minHeight: '80px'
              }}
            />
          </div>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem', marginBottom: '1rem' }}>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                PAN
              </label>
              <input
                type="text"
                value={formData.pan}
                onChange={(e) => {
                const value = e.target.value.toUpperCase().slice(0, 10);
                setFormData({ ...formData, pan: value });
                }}
              maxLength={10}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
              {errors.pan && (
                <div style={{ marginTop: '0.25rem', color: '#dc3545', fontSize: '0.85rem' }}>
                  {errors.pan}
                </div>
              )}
            </div>
            <div>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Aadhaar
              </label>
              <input
                type="text"
                value={formData.aadhaar}
              onChange={(e) => {
                const digitsOnly = e.target.value.replace(/[^0-9]/g, '').slice(0, 12);
                setFormData({ ...formData, aadhaar: digitsOnly });
              }}
              maxLength={12}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              />
              {errors.aadhaar && (
                <div style={{ marginTop: '0.25rem', color: '#dc3545', fontSize: '0.85rem' }}>
                  {errors.aadhaar}
                </div>
              )}
            </div>
          </div>
          <div style={{ marginBottom: '1.5rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              style={{
                width: '100%',
                padding: '0.75rem',
                border: '1px solid #ddd',
                borderRadius: '4px',
                fontSize: '1rem',
                minHeight: '80px'
              }}
            />
          </div>
          <div style={{ display: 'flex', gap: '1rem', justifyContent: 'flex-end' }}>
            <button
              type="button"
              onClick={onClose}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: '#6c757d',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: 'pointer'
              }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={submitting || !formData.name || !formData.phone}
              style={{
                padding: '0.75rem 1.5rem',
                backgroundColor: submitting || !formData.name || !formData.phone ? '#ccc' : '#007bff',
                color: 'white',
                border: 'none',
                borderRadius: '4px',
                cursor: submitting || !formData.name || !formData.phone ? 'not-allowed' : 'pointer'
              }}
            >
              {submitting ? 'Creating...' : 'Create Customer'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
