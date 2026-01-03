import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { Loan } from '../types';
import { FiPlus, FiDollarSign, FiEye, FiAlertCircle, FiCheckCircle, FiXCircle } from 'react-icons/fi';

export default function Loans() {
  const [loans, setLoans] = useState<Loan[]>([]);
  const [loading, setLoading] = useState(true);
  const [filter, setFilter] = useState<string>('all');
  const navigate = useNavigate();

  useEffect(() => {
    loadLoans();
  }, [filter]);

  const loadLoans = async () => {
    try {
      setLoading(true);
      const filters: any = filter !== 'all' ? { status: filter } : {};
      const data = await api.loans.list(filters);
      setLoans(data);
    } catch (error) {
      console.error('Failed to load loans:', error);
    } finally {
      setLoading(false);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'active': return '#28a745';
      case 'overdue': return '#dc3545';
      case 'closed': return '#6c757d';
      case 'default': return '#ffc107';
      default: return '#6c757d';
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      <div style={{ 
        display: 'flex', 
        justifyContent: 'space-between', 
        alignItems: 'center', 
        marginBottom: '2rem' 
      }}>
        <div>
          <h1 style={{ 
            margin: 0, 
            fontSize: '2rem', 
            fontWeight: '700',
            color: '#1a1d29',
            letterSpacing: '-0.5px'
          }}>
            Loans
          </h1>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            color: '#6c757d',
            fontSize: '0.95rem'
          }}>
            Manage all loan accounts and their status
          </p>
        </div>
        <button
          onClick={() => navigate('/loans/new')}
          style={{
            padding: '0.875rem 1.75rem',
            background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(17, 153, 142, 0.4)',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(17, 153, 142, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(17, 153, 142, 0.4)';
          }}
        >
          <FiPlus style={{ fontSize: '1.1rem' }} />
          New Loan
        </button>
      </div>

      {/* Filters */}
      <div style={{ 
        marginBottom: '1.5rem', 
        display: 'flex', 
        gap: '0.75rem',
        backgroundColor: 'white',
        padding: '0.75rem',
        borderRadius: '12px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef',
        flexWrap: 'wrap'
      }}>
        {[
          { value: 'all', label: 'All Loans', icon: FiDollarSign },
          { value: 'active', label: 'Active', icon: FiCheckCircle },
          { value: 'overdue', label: 'Overdue', icon: FiAlertCircle },
          { value: 'closed', label: 'Closed', icon: FiXCircle }
        ].map(({ value, label, icon: Icon }) => (
          <button
            key={value}
            onClick={() => setFilter(value)}
            style={{
              padding: '0.625rem 1.25rem',
              background: filter === value 
                ? 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)'
                : 'transparent',
              color: filter === value ? 'white' : '#6c757d',
              border: filter === value ? 'none' : '2px solid #e9ecef',
              borderRadius: '8px',
              cursor: 'pointer',
              fontSize: '0.875rem',
              fontWeight: filter === value ? '600' : '500',
              display: 'flex',
              alignItems: 'center',
              gap: '0.5rem',
              transition: 'all 0.2s',
              boxShadow: filter === value ? '0 2px 8px rgba(102, 126, 234, 0.3)' : 'none'
            }}
            onMouseEnter={(e) => {
              if (filter !== value) {
                e.currentTarget.style.borderColor = '#667eea';
                e.currentTarget.style.color = '#667eea';
              }
            }}
            onMouseLeave={(e) => {
              if (filter !== value) {
                e.currentTarget.style.borderColor = '#e9ecef';
                e.currentTarget.style.color = '#6c757d';
              }
            }}
          >
            <Icon style={{ fontSize: '0.9rem' }} />
            {label}
          </button>
        ))}
      </div>

      {/* Loans List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : loans.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          No loans found
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
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Loan #</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Principal</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>EMI</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Outstanding</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Next Due</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Status</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {loans.map((loan) => (
                <tr
                  key={loan.id}
                  style={{
                    borderBottom: '1px solid #dee2e6'
                  }}
                >
                  <td style={{ padding: '1rem' }}>{loan.loan_number}</td>
                  <td style={{ padding: '1rem' }}>
                    {loan.customer_name || `Customer #${loan.customer_id}`}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    ${loan.principal.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    ${loan.emi_amount.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'right' }}>
                    ${loan.outstanding_principal.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '1rem' }}>
                    {loan.next_due_date ? new Date(loan.next_due_date).toLocaleDateString() : '-'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <span style={{
                      padding: '0.25rem 0.75rem',
                      borderRadius: '12px',
                      backgroundColor: getStatusColor(loan.status) + '20',
                      color: getStatusColor(loan.status),
                      fontSize: '0.875rem',
                      fontWeight: '500',
                      textTransform: 'capitalize'
                    }}>
                      {loan.status}
                    </span>
                  </td>
                  <td style={{ padding: '1rem' }}>
                    <button
                      onClick={() => navigate(`/loans/${loan.id}`)}
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
                      View
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}
    </div>
  );
}
