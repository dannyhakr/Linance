import { useState } from 'react';
import { toast } from 'react-toastify';
import { api } from '../lib/api';
import { usePageTitle } from '../hooks/usePageTitle';

export default function Reports() {
  const [generating, setGenerating] = useState<string | null>(null);
  const [dailyCollectionDate, setDailyCollectionDate] = useState(new Date().toISOString().split('T')[0]);

  usePageTitle('Reports');

  const handleGenerate = async (reportType: string, params?: any) => {
    setGenerating(reportType);
    try {
      let result;
      switch (reportType) {
        case 'overdue':
          result = await api.reports.generateOverdueLoans();
          break;
        case 'daily':
          result = await api.reports.generateDailyCollection(dailyCollectionDate);
          break;
        case 'loanSummary':
          result = await api.reports.generateLoanSummary();
          break;
        default:
          return;
      }
      if (result.success) {
        toast.success(`PDF report saved to: ${result.path}`);
      }
    } catch (error: any) {
      if (!error.message.includes('canceled')) {
        toast.error('Failed to generate report: ' + error.message);
      }
    } finally {
      setGenerating(null);
    }
  };

  return (
    <div style={{ padding: '2rem' }}>
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(2, 1fr)',
        gap: '1.5rem'
      }}>
        {/* Overdue Loans Report */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Overdue Loans Report</h3>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Generate report of all overdue loans with customer details and days overdue
          </p>
          <button
            onClick={() => handleGenerate('overdue')}
            disabled={generating === 'overdue'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: generating === 'overdue' ? '#ccc' : '#dc3545',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: generating === 'overdue' ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
          >
            {generating === 'overdue' ? 'Generating...' : '📄 Generate PDF'}
          </button>
        </div>

        {/* Daily Collection Report */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Daily Collection Report</h3>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
            All payments collected on a specific date with summary by payment mode
          </p>
          <div style={{ marginBottom: '1rem' }}>
            <label style={{ display: 'block', marginBottom: '0.5rem', fontSize: '0.875rem', fontWeight: '500' }}>
              Select Date
            </label>
            <input
              type="date"
              value={dailyCollectionDate}
              onChange={(e) => setDailyCollectionDate(e.target.value)}
              style={{
                width: '100%',
                padding: '0.5rem',
                border: '1px solid #ddd',
                borderRadius: '4px'
              }}
            />
          </div>
          <button
            onClick={() => handleGenerate('daily')}
            disabled={generating === 'daily'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: generating === 'daily' ? '#ccc' : '#007bff',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: generating === 'daily' ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
          >
            {generating === 'daily' ? 'Generating...' : '📄 Generate PDF'}
          </button>
        </div>

        {/* Loan Summary Report */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Loan Summary Report</h3>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Summary of all loans with principal, outstanding, and interest earned
          </p>
          <button
            onClick={() => handleGenerate('loanSummary')}
            disabled={generating === 'loanSummary'}
            style={{
              padding: '0.75rem 1.5rem',
              backgroundColor: generating === 'loanSummary' ? '#ccc' : '#28a745',
              color: 'white',
              border: 'none',
              borderRadius: '4px',
              cursor: generating === 'loanSummary' ? 'not-allowed' : 'pointer',
              width: '100%'
            }}
          >
            {generating === 'loanSummary' ? 'Generating...' : '📄 Generate PDF'}
          </button>
        </div>

        {/* Customer Statement */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Customer Statement</h3>
          <p style={{ color: '#666', fontSize: '0.875rem', marginBottom: '1rem' }}>
            Generate statement for a customer showing all payments, dues, and outstanding.
            Use the Customer Detail page to generate statements.
          </p>
          <p style={{ color: '#999', fontSize: '0.75rem', fontStyle: 'italic' }}>
            Available from Customer Detail → Payments tab
          </p>
        </div>

        {/* Collateral Exposure Report */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.5rem',
          borderRadius: '8px',
          boxShadow: '0 2px 4px rgba(0,0,0,0.1)'
        }}>
          <h3 style={{ marginBottom: '0.5rem' }}>Collateral Exposure Report</h3>
          <p style={{ color: '#666', fontSize: '0.875rem' }}>
            Report of all collaterals with asset types, valuation, and linked loans
          </p>
          <p style={{ color: '#999', fontSize: '0.75rem', marginTop: '1rem', fontStyle: 'italic' }}>
            Coming soon
          </p>
        </div>
      </div>

      <div style={{ marginTop: '2rem', padding: '1rem', backgroundColor: '#e7f3ff', borderRadius: '4px', border: '1px solid #b3d9ff' }}>
        <p style={{ color: '#0066cc', fontSize: '0.875rem', margin: 0 }}>
          <strong>💡 Tip:</strong> All reports are generated as PDF files and saved to your chosen location.
          You can also export payment data as CSV from the Payments page.
        </p>
      </div>
    </div>
  );
}
