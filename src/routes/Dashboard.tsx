import { useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { DashboardData } from '../types';
import { 
  FiDollarSign, 
  FiUsers, 
  FiAlertCircle, 
  FiCalendar,
  FiHome,
  FiTrendingUp,
  FiPlus,
  FiCreditCard,
  FiArrowRight
} from 'react-icons/fi';

export default function Dashboard() {
  const [data, setData] = useState<DashboardData | null>(null);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    loadDashboardData();
  }, []);

  const loadDashboardData = async () => {
    try {
      const result = await api.dashboard.getData();
      setData(result);
    } catch (error) {
      console.error('Failed to load dashboard data:', error);
    } finally {
      setLoading(false);
    }
  };

  if (loading) {
    return (
      <div style={{ 
        padding: '3rem', 
        textAlign: 'center',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        height: '100%'
      }}>
        <div style={{
          padding: '2rem',
          backgroundColor: 'white',
          borderRadius: '12px',
          boxShadow: '0 4px 6px rgba(0,0,0,0.1)'
        }}>
          <div style={{ fontSize: '1.25rem', color: '#6c757d' }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  if (!data) {
    return (
      <div style={{ padding: '2rem', textAlign: 'center' }}>
        Failed to load dashboard data
      </div>
    );
  }

  return (
    <div style={{ padding: '2rem', maxWidth: '1400px', margin: '0 auto' }}>
      {/* KPI Cards */}
      <div style={{
        display: 'grid',
        gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))',
        gap: '1.25rem',
        marginBottom: '2rem'
      }}>
        <KPICard 
          title="Active Loans" 
          value={data.totalActiveLoans.toString()} 
          icon={FiDollarSign}
          color="#3498db"
          gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
        />
        <KPICard 
          title="Outstanding Principal" 
          value={`$${data.totalOutstandingPrincipal.toLocaleString('en-IN')}`} 
          icon={FiTrendingUp}
          color="#2ecc71"
          gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
        />
        <KPICard 
          title="Overdue Loans" 
          value={data.overdueLoansCount.toString()} 
          icon={FiAlertCircle}
          color="#e74c3c"
          gradient="linear-gradient(135deg, #ee0979 0%, #ff6a00 100%)"
        />
        <KPICard 
          title="Due Today" 
          value={data.paymentsDueToday.toString()} 
          icon={FiCalendar}
          color="#f39c12"
          gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
        />
        <KPICard 
          title="Due This Week" 
          value={data.paymentsDueThisWeek.toString()} 
          icon={FiCalendar}
          color="#9b59b6"
          gradient="linear-gradient(135deg, #4facfe 0%, #00f2fe 100%)"
        />
        <KPICard 
          title="At-Risk Collaterals" 
          value={data.atRiskCollaterals.toString()} 
          icon={FiHome}
          color="#e67e22"
          gradient="linear-gradient(135deg, #fa709a 0%, #fee140 100%)"
        />
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1.5rem', marginBottom: '2rem' }}>
        {/* Upcoming Dues */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.75rem',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <FiCalendar style={{ fontSize: '1.25rem' }} />
            </div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: '700',
              color: '#1a1d29'
            }}>
              Upcoming Dues
            </h2>
          </div>
          {data.upcomingDues.length === 0 ? (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center',
              color: '#6c757d'
            }}>
              <FiCalendar style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No upcoming dues</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.upcomingDues.map((due, idx) => (
                <div 
                  key={idx} 
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    border: '1px solid #e9ecef',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f3f5';
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => navigate(`/loans/${due.loan_id}`)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      color: '#1a1d29',
                      marginBottom: '0.25rem',
                      fontSize: '0.95rem'
                    }}>
                      {due.customer_name}
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#6c757d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>{due.loan_number}</span>
                      <span>•</span>
                      <span>Due: {new Date(due.due_date).toLocaleDateString('en-IN')}</span>
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: '700', 
                    fontSize: '1.1rem',
                    color: '#e74c3c',
                    marginLeft: '1rem'
                  }}>
                    ${due.due_amount.toLocaleString('en-IN')}
                  </div>
                  <FiArrowRight style={{ 
                    marginLeft: '0.75rem', 
                    color: '#6c757d',
                    fontSize: '1.1rem'
                  }} />
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Recent Payments */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.75rem',
          borderRadius: '16px',
          boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
          border: '1px solid #e9ecef'
        }}>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '0.75rem',
            marginBottom: '1.5rem'
          }}>
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #11998e 0%, #38ef7d 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: 'white'
            }}>
              <FiCreditCard style={{ fontSize: '1.25rem' }} />
            </div>
            <h2 style={{ 
              margin: 0, 
              fontSize: '1.5rem', 
              fontWeight: '700',
              color: '#1a1d29'
            }}>
              Recent Payments
            </h2>
          </div>
          {data.recentPayments.length === 0 ? (
            <div style={{ 
              padding: '2rem', 
              textAlign: 'center',
              color: '#6c757d'
            }}>
              <FiCreditCard style={{ fontSize: '2rem', marginBottom: '0.5rem', opacity: 0.5 }} />
              <p style={{ margin: 0 }}>No recent payments</p>
            </div>
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '0.75rem' }}>
              {data.recentPayments.map((payment) => (
                <div 
                  key={payment.id} 
                  style={{
                    padding: '1rem',
                    backgroundColor: '#f8f9fa',
                    borderRadius: '10px',
                    display: 'flex',
                    justifyContent: 'space-between',
                    alignItems: 'center',
                    transition: 'all 0.2s',
                    border: '1px solid #e9ecef',
                    cursor: 'pointer'
                  }}
                  onMouseEnter={(e) => {
                    e.currentTarget.style.backgroundColor = '#f1f3f5';
                    e.currentTarget.style.transform = 'translateX(4px)';
                    e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.1)';
                  }}
                  onMouseLeave={(e) => {
                    e.currentTarget.style.backgroundColor = '#f8f9fa';
                    e.currentTarget.style.transform = 'translateX(0)';
                    e.currentTarget.style.boxShadow = 'none';
                  }}
                  onClick={() => navigate(`/loans/${payment.loan_id}`)}
                >
                  <div style={{ flex: 1 }}>
                    <div style={{ 
                      fontWeight: '600', 
                      color: '#1a1d29',
                      marginBottom: '0.25rem',
                      fontSize: '0.95rem'
                    }}>
                      {payment.customer_name}
                    </div>
                    <div style={{ 
                      fontSize: '0.8rem', 
                      color: '#6c757d',
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.5rem'
                    }}>
                      <span>{payment.loan_number}</span>
                      <span>•</span>
                      <span style={{
                        textTransform: 'capitalize',
                        padding: '0.125rem 0.5rem',
                        backgroundColor: '#e9ecef',
                        borderRadius: '4px',
                        fontSize: '0.75rem',
                        fontWeight: '500'
                      }}>
                        {payment.payment_mode}
                      </span>
                    </div>
                  </div>
                  <div style={{ 
                    fontWeight: '700', 
                    fontSize: '1.1rem',
                    color: '#2ecc71',
                    marginLeft: '1rem'
                  }}>
                    ${payment.amount.toLocaleString('en-IN')}
                  </div>
                  <FiArrowRight style={{ 
                    marginLeft: '0.75rem', 
                    color: '#6c757d',
                    fontSize: '1.1rem'
                  }} />
                </div>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Quick Actions */}
      <div style={{
        backgroundColor: 'white',
        padding: '1.75rem',
        borderRadius: '16px',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        border: '1px solid #e9ecef'
      }}>
        <h2 style={{ 
          marginBottom: '1.25rem', 
          fontSize: '1.5rem',
          fontWeight: '700',
          color: '#1a1d29'
        }}>
          Quick Actions
        </h2>
        <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
          <ActionButton
            onClick={() => navigate('/customers')}
            label="New Customer"
            icon={FiUsers}
            color="#9b59b6"
            gradient="linear-gradient(135deg, #667eea 0%, #764ba2 100%)"
          />
          <ActionButton
            onClick={() => navigate('/loans/new')}
            label="New Loan"
            icon={FiDollarSign}
            color="#2ecc71"
            gradient="linear-gradient(135deg, #11998e 0%, #38ef7d 100%)"
          />
          <ActionButton
            onClick={() => navigate('/payments')}
            label="Record Payment"
            icon={FiCreditCard}
            color="#f39c12"
            gradient="linear-gradient(135deg, #f093fb 0%, #f5576c 100%)"
          />
        </div>
      </div>
    </div>
  );
}

function KPICard({ 
  title, 
  value, 
  icon: Icon, 
  color, 
  gradient 
}: { 
  title: string; 
  value: string; 
  icon: any;
  color: string;
  gradient: string;
}) {
  return (
    <div style={{
      backgroundColor: 'white',
      padding: '1.5rem',
      borderRadius: '16px',
      boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
      border: '1px solid #e9ecef',
      transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
      position: 'relative',
      overflow: 'hidden'
    }}
    onMouseEnter={(e) => {
      e.currentTarget.style.transform = 'translateY(-4px)';
      e.currentTarget.style.boxShadow = '0 8px 16px rgba(0,0,0,0.12)';
    }}
    onMouseLeave={(e) => {
      e.currentTarget.style.transform = 'translateY(0)';
      e.currentTarget.style.boxShadow = '0 2px 8px rgba(0,0,0,0.08)';
    }}
    >
      <div style={{
        position: 'absolute',
        top: '-20px',
        right: '-20px',
        width: '100px',
        height: '100px',
        borderRadius: '50%',
        background: gradient,
        opacity: 0.1
      }} />
      <div style={{ 
        display: 'flex', 
        alignItems: 'flex-start',
        justifyContent: 'space-between',
        marginBottom: '1rem'
      }}>
        <div style={{
          width: '48px',
          height: '48px',
          borderRadius: '12px',
          background: gradient,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          color: 'white',
          boxShadow: `0 4px 12px ${color}40`,
          flexShrink: 0
        }}>
          <Icon style={{ fontSize: '1.5rem' }} />
        </div>
      </div>
      <div style={{ 
        fontSize: '0.875rem', 
        color: '#6c757d', 
        marginBottom: '0.5rem',
        fontWeight: '500'
      }}>
        {title}
      </div>
      <div style={{ 
        fontSize: '1.75rem', 
        fontWeight: '700',
        color: '#1a1d29',
        letterSpacing: '-0.5px'
      }}>
        {value}
      </div>
    </div>
  );
}

function ActionButton({ 
  onClick, 
  label, 
  icon: Icon, 
  color, 
  gradient 
}: { 
  onClick: () => void; 
  label: string; 
  icon: any;
  color: string;
  gradient: string;
}) {
  return (
    <button
      onClick={onClick}
      style={{
        padding: '1rem 1.5rem',
        background: gradient,
        color: 'white',
        border: 'none',
        borderRadius: '12px',
        cursor: 'pointer',
        fontSize: '0.95rem',
        fontWeight: '600',
        display: 'flex',
        alignItems: 'center',
        gap: '0.75rem',
        transition: 'all 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        boxShadow: `0 4px 12px ${color}40`,
        minWidth: '160px',
        justifyContent: 'center'
      }}
      onMouseEnter={(e) => {
        e.currentTarget.style.transform = 'translateY(-2px)';
        e.currentTarget.style.boxShadow = `0 6px 20px ${color}60`;
      }}
      onMouseLeave={(e) => {
        e.currentTarget.style.transform = 'translateY(0)';
        e.currentTarget.style.boxShadow = `0 4px 12px ${color}40`;
      }}
    >
      <Icon style={{ fontSize: '1.25rem' }} />
      {label}
    </button>
  );
}
