import { useState } from 'react';
import { Link, useLocation, useNavigate } from 'react-router-dom';
import { 
  FiLayout, 
  FiUsers, 
  FiDollarSign, 
  FiCreditCard, 
  FiHome,
  FiFileText,
  FiMenu,
  FiX,
  FiLogOut,
  FiChevronLeft,
  FiChevronRight
} from 'react-icons/fi';
import { APP_CONFIG } from '../config/appConfig';

interface LayoutProps {
  children: React.ReactNode;
}

export default function Layout({ children }: LayoutProps) {
  const location = useLocation();
  const navigate = useNavigate();
  const [sidebarOpen, setSidebarOpen] = useState(true);

  const isActive = (path: string) => location.pathname === path;

  const menuItems = [
    { path: '/dashboard', label: 'Dashboard', icon: FiLayout, color: '#3498db' },
    { path: '/customers', label: 'Customers', icon: FiUsers, color: '#9b59b6' },
    { path: '/loans', label: 'Loans', icon: FiDollarSign, color: '#2ecc71' },
    { path: '/payments', label: 'Payments', icon: FiCreditCard, color: '#f39c12' },
    { path: '/collaterals', label: 'Collaterals', icon: FiHome, color: '#e67e22' },
    { path: '/reports', label: 'Reports', icon: FiFileText, color: '#e74c3c' },
    { path: '/settings', label: 'Settings', icon: FiFileText, color: '#95a5a6' },
  ];

  // Don't show layout on login page
  if (location.pathname === '/login') {
    return <>{children}</>;
  }

  return (
    <div style={{ display: 'flex', height: '100vh', overflow: 'hidden', backgroundColor: '#f8f9fa' }}>
      {/* Sidebar */}
      <div style={{
        width: sidebarOpen ? '260px' : '70px',
        backgroundColor: '#1a1d29',
        color: 'white',
        display: 'flex',
        flexDirection: 'column',
        transition: 'width 0.3s cubic-bezier(0.4, 0, 0.2, 1)',
        overflow: 'hidden',
        boxShadow: '2px 0 10px rgba(0,0,0,0.1)',
        position: 'relative',
        zIndex: 100
      }}>
        {/* Logo/Header */}
        <div style={{
          padding: '1.5rem',
          borderBottom: '1px solid rgba(255,255,255,0.08)',
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          minHeight: '70px'
        }}>
          {sidebarOpen && (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <div style={{
                width: '40px',
                height: '40px',
                borderRadius: '10px',
                background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                fontSize: '1.25rem',
                fontWeight: 'bold',
                color: 'white',
                boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)'
              }}>
                SK
              </div>
              <div>
                <h2 style={{ 
                  margin: 0, 
                  fontSize: '1.1rem', 
                  fontWeight: '700',
                  background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                  WebkitBackgroundClip: 'text',
                  WebkitTextFillColor: 'transparent',
                  letterSpacing: '-0.5px'
                }}>
                  {APP_CONFIG.companyName}
                </h2>
                <div style={{ fontSize: '0.7rem', color: 'rgba(255,255,255,0.5)', marginTop: '2px' }}>
                  Loan Management
                </div>
              </div>
            </div>
          )}
          {!sidebarOpen && (
            <div style={{
              width: '40px',
              height: '40px',
              borderRadius: '10px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.25rem',
              fontWeight: 'bold',
              color: 'white',
              margin: '0 auto',
              boxShadow: '0 4px 6px rgba(102, 126, 234, 0.3)'
            }}>
              SK
            </div>
          )}
          <button
            onClick={() => setSidebarOpen(!sidebarOpen)}
            style={{
              backgroundColor: 'rgba(255,255,255,0.1)',
              border: 'none',
              color: 'white',
              cursor: 'pointer',
              fontSize: '1.1rem',
              padding: '0.5rem',
              borderRadius: '6px',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              transition: 'all 0.2s',
              width: '32px',
              height: '32px'
            }}
            onMouseEnter={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.2)';
              e.currentTarget.style.transform = 'scale(1.05)';
            }}
            onMouseLeave={(e) => {
              e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.1)';
              e.currentTarget.style.transform = 'scale(1)';
            }}
          >
            {sidebarOpen ? <FiChevronLeft /> : <FiChevronRight />}
          </button>
        </div>

        {/* Navigation Menu */}
        <nav style={{ 
          flex: 1, 
          padding: '1rem 0.75rem', 
          overflowY: 'auto',
          overflowX: 'hidden'
        }}>
          {menuItems.map((item) => {
            const Icon = item.icon;
            const active = isActive(item.path);
            return (
              <Link
                key={item.path}
                to={item.path}
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  padding: '0.875rem 1rem',
                  color: active ? '#fff' : 'rgba(255,255,255,0.7)',
                  backgroundColor: active ? `rgba(${item.color === '#3498db' ? '52,152,219' : item.color === '#9b59b6' ? '155,89,182' : item.color === '#2ecc71' ? '46,204,113' : item.color === '#f39c12' ? '243,156,18' : item.color === '#e67e22' ? '230,126,34' : '231,76,60'},0.15)` : 'transparent',
                  textDecoration: 'none',
                  transition: 'all 0.2s cubic-bezier(0.4, 0, 0.2, 1)',
                  borderRadius: '10px',
                  marginBottom: '0.5rem',
                  borderLeft: active ? `3px solid ${item.color}` : '3px solid transparent',
                  position: 'relative',
                  overflow: 'hidden'
                }}
                onMouseEnter={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'rgba(255,255,255,0.08)';
                    e.currentTarget.style.transform = 'translateX(4px)';
                  }
                }}
                onMouseLeave={(e) => {
                  if (!active) {
                    e.currentTarget.style.backgroundColor = 'transparent';
                    e.currentTarget.style.transform = 'translateX(0)';
                  }
                }}
              >
                <Icon 
                  style={{ 
                    fontSize: '1.25rem', 
                    marginRight: sidebarOpen ? '0.875rem' : '0',
                    minWidth: '20px',
                    color: active ? item.color : 'rgba(255,255,255,0.7)',
                    transition: 'color 0.2s'
                  }} 
                />
                {sidebarOpen && (
                  <span style={{ 
                    fontWeight: active ? '600' : '400',
                    fontSize: '0.95rem',
                    letterSpacing: '0.3px'
                  }}>
                    {item.label}
                  </span>
                )}
                {active && (
                  <div style={{
                    position: 'absolute',
                    right: '0.5rem',
                    width: '6px',
                    height: '6px',
                    borderRadius: '50%',
                    backgroundColor: item.color,
                    boxShadow: `0 0 8px ${item.color}`
                  }} />
                )}
              </Link>
            );
          })}
        </nav>

        {/* Footer */}
        <div style={{
          padding: '1rem',
          borderTop: '1px solid rgba(255,255,255,0.08)',
          fontSize: '0.75rem',
          color: 'rgba(255,255,255,0.5)'
        }}>
          {sidebarOpen ? (
            <div>
              <div style={{ marginBottom: '0.75rem', textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', opacity: 0.6 }}>v1.0.0</div>
              </div>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to logout?')) {
                    navigate('/login');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(231, 76, 60, 0.15)',
                  color: '#e74c3c',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontSize: '0.875rem',
                  fontWeight: '500',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  gap: '0.5rem',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.25)';
                  e.currentTarget.style.transform = 'translateY(-1px)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.15)';
                  e.currentTarget.style.transform = 'translateY(0)';
                }}
              >
                <FiLogOut style={{ fontSize: '1rem' }} />
                Logout
              </button>
            </div>
          ) : (
            <div style={{ textAlign: 'center' }}>
              <button
                onClick={() => {
                  if (confirm('Are you sure you want to logout?')) {
                    navigate('/login');
                  }
                }}
                style={{
                  width: '100%',
                  padding: '0.75rem',
                  backgroundColor: 'rgba(231, 76, 60, 0.15)',
                  color: '#e74c3c',
                  border: '1px solid rgba(231, 76, 60, 0.3)',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  transition: 'all 0.2s'
                }}
                onMouseEnter={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.25)';
                }}
                onMouseLeave={(e) => {
                  e.currentTarget.style.backgroundColor = 'rgba(231, 76, 60, 0.15)';
                }}
              >
                <FiLogOut style={{ fontSize: '1.25rem' }} />
              </button>
            </div>
          )}
        </div>
      </div>

      {/* Main Content */}
      <div style={{
        flex: 1,
        display: 'flex',
        flexDirection: 'column',
        overflow: 'hidden',
        backgroundColor: '#f8f9fa'
      }}>
        {/* Top Bar */}
        <div style={{
          backgroundColor: 'white',
          padding: '1.25rem 2rem',
          borderBottom: '1px solid #e9ecef',
          display: 'flex',
          justifyContent: 'space-between',
          alignItems: 'center',
          boxShadow: '0 1px 3px rgba(0,0,0,0.05)',
          position: 'sticky',
          top: 0,
          zIndex: 10
        }}>
          <div style={{ 
            fontSize: '1.5rem', 
            fontWeight: '700', 
            color: '#1a1d29',
            letterSpacing: '-0.5px'
          }}>
            {menuItems.find(item => isActive(item.path))?.label || 'Dashboard'}
          </div>
          <div style={{ 
            display: 'flex', 
            alignItems: 'center', 
            gap: '1.5rem'
          }}>
            <div style={{ 
              padding: '0.5rem 1rem',
              backgroundColor: '#f8f9fa',
              borderRadius: '8px',
              fontSize: '0.875rem',
              color: '#6c757d',
              fontWeight: '500'
            }}>
              {new Date().toLocaleDateString('en-IN', { 
                weekday: 'long', 
                year: 'numeric', 
                month: 'long', 
                day: 'numeric' 
              })}
            </div>
          </div>
        </div>

        {/* Page Content */}
        <div style={{
          flex: 1,
          overflow: 'auto',
          padding: '0',
          backgroundColor: '#f8f9fa'
        }}>
          {children}
        </div>
      </div>
    </div>
  );
}
