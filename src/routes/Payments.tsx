import { useState, useEffect } from 'react';
import { toast } from 'react-toastify';
import { api } from '../lib/api';
import { FiFileText, FiDownload, FiCreditCard, FiCalendar, FiFilter } from 'react-icons/fi';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Payments() {
  const [payments, setPayments] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({
    dateFrom: '',
    dateTo: '',
    payment_mode: ''
  });

  usePageTitle('Payments');

  useEffect(() => {
    loadPayments();
  }, [filters]);

  const loadPayments = async () => {
    try {
      setLoading(true);
      const filterParams: any = {};
      
      if (filters.dateFrom) filterParams.dateFrom = filters.dateFrom;
      if (filters.dateTo) filterParams.dateTo = filters.dateTo;
      if (filters.payment_mode) filterParams.payment_mode = filters.payment_mode;

      const data = await api.payments.list(filterParams);
      setPayments(data);
    } catch (error) {
      console.error('Failed to load payments:', error);
    } finally {
      setLoading(false);
    }
  };

  const getTotalByMode = () => {
    const totals: { [key: string]: number } = {};
    payments.forEach(p => {
      totals[p.payment_mode] = (totals[p.payment_mode] || 0) + p.amount;
    });
    return totals;
  };

  const totals = getTotalByMode();
  const grandTotal = payments.reduce((sum, p) => sum + p.amount, 0);

  const handleExportDailyPDF = async () => {
    const today = new Date().toISOString().split('T')[0];
    try {
      const result = await api.reports.generateDailyCollection(today);
      if (result.success) {
        toast.success(`Daily collection PDF saved to: ${result.path}`);
      }
    } catch (error: any) {
      if (!error.message.includes('canceled')) {
        toast.error('Failed to generate PDF: ' + error.message);
      }
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
            Payments Ledger
          </h1>
          <p style={{ 
            margin: '0.5rem 0 0 0', 
            color: '#6c757d',
            fontSize: '0.95rem'
          }}>
            Track all payment transactions and collections
          </p>
        </div>
        <button
          onClick={handleExportDailyPDF}
          style={{
            padding: '0.875rem 1.75rem',
            background: 'linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)',
            color: 'white',
            border: 'none',
            borderRadius: '12px',
            cursor: 'pointer',
            fontSize: '0.95rem',
            fontWeight: '600',
            display: 'flex',
            alignItems: 'center',
            gap: '0.5rem',
            boxShadow: '0 4px 12px rgba(238, 9, 121, 0.4)',
            transition: 'all 0.3s'
          }}
          onMouseEnter={(e) => {
            e.currentTarget.style.transform = 'translateY(-2px)';
            e.currentTarget.style.boxShadow = '0 6px 20px rgba(238, 9, 121, 0.5)';
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'translateY(0)';
            e.currentTarget.style.boxShadow = '0 4px 12px rgba(238, 9, 121, 0.4)';
          }}
        >
          <FiDownload style={{ fontSize: '1.1rem' }} />
          Export Today's Report (PDF)
        </button>
      </div>

      {/* Filters */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(3, 1fr)',
        gap: '1rem'
      }}>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            From Date
          </label>
          <input
            type="date"
            value={filters.dateFrom}
            onChange={(e) => setFilters({ ...filters, dateFrom: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            To Date
          </label>
          <input
            type="date"
            value={filters.dateTo}
            onChange={(e) => setFilters({ ...filters, dateTo: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          />
        </div>
        <div>
          <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
            Payment Mode
          </label>
          <select
            value={filters.payment_mode}
            onChange={(e) => setFilters({ ...filters, payment_mode: e.target.value })}
            style={{
              width: '100%',
              padding: '0.75rem',
              border: '1px solid #ddd',
              borderRadius: '4px'
            }}
          >
            <option value="">All Modes</option>
            <option value="cash">Cash</option>
            <option value="upi">UPI</option>
            <option value="bank">Bank Transfer</option>
            <option value="cheque">Cheque</option>
          </select>
        </div>
      </div>

      {/* Summary */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.5rem',
        borderRadius: '8px',
        boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
        marginBottom: '2rem',
        display: 'grid',
        gridTemplateColumns: 'repeat(5, 1fr)',
        gap: '1rem'
      }}>
        <div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Cash</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            ${(totals.cash || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Total UPI</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            ${(totals.upi || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Bank</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            ${(totals.bank || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Total Cheque</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
            ${(totals.cheque || 0).toLocaleString('en-IN')}
          </div>
        </div>
        <div>
          <div style={{ fontSize: '0.875rem', color: '#666' }}>Grand Total</div>
          <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#28a745' }}>
            ${grandTotal.toLocaleString('en-IN')}
          </div>
        </div>
      </div>

      {/* Payments List */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '2rem' }}>Loading...</div>
      ) : payments.length === 0 ? (
        <div style={{ textAlign: 'center', padding: '2rem', color: '#666' }}>
          No payments found
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
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Date</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Loan #</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Customer</th>
                <th style={{ padding: '1rem', textAlign: 'right', fontWeight: '600' }}>Amount</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Mode</th>
                <th style={{ padding: '1rem', textAlign: 'left', fontWeight: '600' }}>Reference</th>
                <th style={{ padding: '1rem', textAlign: 'center', fontWeight: '600' }}>Actions</th>
              </tr>
            </thead>
            <tbody>
              {payments.map((payment) => (
                <tr key={payment.id} style={{ borderBottom: '1px solid #dee2e6' }}>
                  <td style={{ padding: '1rem' }}>
                    {new Date(payment.payment_date).toLocaleDateString()}
                  </td>
                  <td style={{ padding: '1rem' }}>{payment.loan_number}</td>
                  <td style={{ padding: '1rem' }}>{payment.customer_name}</td>
                  <td style={{ padding: '1rem', textAlign: 'right', fontWeight: '500' }}>
                    ${payment.amount.toLocaleString('en-IN')}
                  </td>
                  <td style={{ padding: '1rem', textTransform: 'capitalize' }}>
                    {payment.payment_mode}
                  </td>
                  <td style={{ padding: '1rem', color: '#666' }}>
                    {payment.reference_number || '-'}
                  </td>
                  <td style={{ padding: '1rem', textAlign: 'center' }}>
                    <button
                      onClick={async () => {
                        try {
                          const result = await api.reports.generatePaymentReceipt(payment.id);
                          if (result.success) {
                            toast.success(`Receipt saved to: ${result.path}`);
                          }
                        } catch (error: any) {
                          if (!error.message || !error.message.includes('canceled')) {
                            toast.error('Failed to generate receipt: ' + error.message);
                          }
                        }
                      }}
                      style={{
                        padding: '0.5rem 1rem',
                        backgroundColor: '#28a745',
                        color: 'white',
                        border: 'none',
                        borderRadius: '4px',
                        cursor: 'pointer',
                        fontSize: '0.875rem'
                      }}
                    >
                      📄 Receipt
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
