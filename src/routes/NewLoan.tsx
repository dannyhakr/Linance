import { useState, useEffect } from 'react';
import { useNavigate, useSearchParams } from 'react-router-dom';
import { toast } from 'react-toastify';
import { api } from '../lib/api';
import { Customer } from '../types';
import { usePageTitle } from '../hooks/usePageTitle';

export default function NewLoan() {
  const navigate = useNavigate();
  const [searchParams] = useSearchParams();
  const preselectedCustomerId = searchParams.get('customerId');

  const [step, setStep] = useState(1);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [selectedCustomerId, setSelectedCustomerId] = useState<number | null>(
    preselectedCustomerId ? Number(preselectedCustomerId) : null
  );
  
  const [formData, setFormData] = useState({
    principal: '',
    interest_rate: '',
    tenure_months: '',
    repayment_frequency: 'monthly' as 'monthly' | 'weekly' | 'daily',
    emi_date: '',
    product_type: ''
  });

  const [loading, setLoading] = useState(false);

  usePageTitle('New Loan');

  useEffect(() => {
    loadCustomers();
  }, []);

  const loadCustomers = async () => {
    try {
      const data = await api.customers.list();
      setCustomers(data);
    } catch (error) {
      console.error('Failed to load customers:', error);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const loanData = {
        customer_id: selectedCustomerId!,
        principal: Number(formData.principal),
        interest_rate: Number(formData.interest_rate),
        tenure_months: Number(formData.tenure_months),
        repayment_frequency: formData.repayment_frequency,
        emi_date: Number(formData.emi_date),
        product_type: formData.product_type || undefined
      };

      const loan = await api.loans.create(loanData);
      navigate(`/loans/${loan.id}`);
    } catch (error: any) {
      toast.error('Failed to create loan: ' + (error.message || 'Unknown error'));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ padding: '2rem', maxWidth: '800px', margin: '0 auto' }}>
      <div style={{ marginBottom: '2rem' }}>
        <button
          onClick={() => navigate('/loans')}
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
          ← Back to Loans
        </button>
        <h1 style={{ marginTop: '1rem' }}>New Loan</h1>
        <div style={{ marginTop: '1rem', display: 'flex', gap: '0.5rem' }}>
          {[1, 2, 3].map((s) => (
            <div
              key={s}
              style={{
                flex: 1,
                height: '4px',
                backgroundColor: step >= s ? '#007bff' : '#dee2e6',
                borderRadius: '2px'
              }}
            />
          ))}
        </div>
      </div>

      <form onSubmit={handleSubmit}>
        {step === 1 && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Step 1: Select Customer</h2>
            <div style={{ marginBottom: '1rem' }}>
              <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                Customer
              </label>
              <select
                value={selectedCustomerId || ''}
                onChange={(e) => setSelectedCustomerId(Number(e.target.value))}
                required
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  border: '1px solid #ddd',
                  borderRadius: '4px',
                  fontSize: '1rem'
                }}
              >
                <option value="">Select a customer</option>
                {customers.map((customer) => (
                  <option key={customer.id} value={customer.id}>
                    {customer.name} - {customer.phone}
                  </option>
                ))}
              </select>
            </div>
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '1rem', marginTop: '2rem' }}>
              <button
                type="button"
                onClick={() => navigate('/loans')}
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
                type="button"
                onClick={() => setStep(2)}
                disabled={!selectedCustomerId}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: selectedCustomerId ? '#007bff' : '#ccc',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: selectedCustomerId ? 'pointer' : 'not-allowed'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 2 && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Step 2: Loan Details</h2>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(2, 1fr)', gap: '1rem', marginBottom: '1rem' }}>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Principal Amount ($)
                </label>
                <input
                  type="number"
                  value={formData.principal}
                  onChange={(e) => setFormData({ ...formData, principal: e.target.value })}
                  required
                  min="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Interest Rate (% p.a.)
                </label>
                <input
                  type="number"
                  value={formData.interest_rate}
                  onChange={(e) => setFormData({ ...formData, interest_rate: e.target.value })}
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
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Tenure (Months)
                </label>
                <input
                  type="number"
                  value={formData.tenure_months}
                  onChange={(e) => setFormData({ ...formData, tenure_months: e.target.value })}
                  required
                  min="1"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Repayment Frequency
                </label>
                <select
                  value={formData.repayment_frequency}
                  onChange={(e) => setFormData({ ...formData, repayment_frequency: e.target.value as any })}
                  required
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                >
                  <option value="monthly">Monthly</option>
                  <option value="weekly">Weekly</option>
                  <option value="daily">Daily</option>
                </select>
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  EMI Date (Day of month/week)
                </label>
                <input
                  type="number"
                  value={formData.emi_date}
                  onChange={(e) => setFormData({ ...formData, emi_date: e.target.value })}
                  required
                  min="1"
                  max="31"
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
              <div>
                <label style={{ display: 'block', marginBottom: '0.5rem', fontWeight: '500' }}>
                  Product Type (Optional)
                </label>
                <input
                  type="text"
                  value={formData.product_type}
                  onChange={(e) => setFormData({ ...formData, product_type: e.target.value })}
                  style={{
                    width: '100%',
                    padding: '0.75rem',
                    border: '1px solid #ddd',
                    borderRadius: '4px',
                    fontSize: '1rem'
                  }}
                />
              </div>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button
                type="button"
                onClick={() => setStep(1)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                type="button"
                onClick={() => setStep(3)}
                disabled={!formData.principal || !formData.interest_rate || !formData.tenure_months || !formData.emi_date}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: (!formData.principal || !formData.interest_rate || !formData.tenure_months || !formData.emi_date) ? '#ccc' : '#007bff',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: (!formData.principal || !formData.interest_rate || !formData.tenure_months || !formData.emi_date) ? 'not-allowed' : 'pointer'
                }}
              >
                Next
              </button>
            </div>
          </div>
        )}

        {step === 3 && (
          <div style={{
            backgroundColor: 'white',
            padding: '2rem',
            borderRadius: '8px',
            boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
          }}>
            <h2 style={{ marginBottom: '1.5rem' }}>Step 3: Review & Confirm</h2>
            <div style={{ marginBottom: '2rem' }}>
              <p><strong>Customer:</strong> {customers.find(c => c.id === selectedCustomerId)?.name}</p>
              <p><strong>Principal:</strong> ${Number(formData.principal).toLocaleString('en-IN')}</p>
              <p><strong>Interest Rate:</strong> {formData.interest_rate}% p.a.</p>
              <p><strong>Tenure:</strong> {formData.tenure_months} months</p>
              <p><strong>Frequency:</strong> {formData.repayment_frequency}</p>
              <p><strong>EMI Date:</strong> Day {formData.emi_date}</p>
            </div>
            <div style={{ display: 'flex', justifyContent: 'space-between', marginTop: '2rem' }}>
              <button
                type="button"
                onClick={() => setStep(2)}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: '#6c757d',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: 'pointer'
                }}
              >
                Back
              </button>
              <button
                type="submit"
                disabled={loading}
                style={{
                  padding: '0.75rem 1.5rem',
                  backgroundColor: loading ? '#ccc' : '#28a745',
                  color: 'white',
                  border: 'none',
                  borderRadius: '4px',
                  cursor: loading ? 'not-allowed' : 'pointer'
                }}
              >
                {loading ? 'Creating...' : 'Create Loan'}
              </button>
            </div>
          </div>
        )}
      </form>
    </div>
  );
}
