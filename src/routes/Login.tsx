import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { api } from '../lib/api';
import { FiLock, FiUser, FiLogIn, FiAlertCircle, FiEye, FiEyeOff } from 'react-icons/fi';
import { APP_CONFIG } from '../config/appConfig';

export default function Login() {
  const [username, setUsername] = useState(APP_CONFIG.defaultLoginUsername || '');
  const [password, setPassword] = useState(APP_CONFIG.defaultLoginPassword || '');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const navigate = useNavigate();

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const result = await api.auth.login(username, password);
      if (result) {
        navigate('/dashboard');
      }
    } catch (_err: any) {
      // Always show a simple, user-friendly error and hide technical details
      setError('Invalid credentials');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{
      display: 'flex',
      justifyContent: 'center',
      alignItems: 'center',
      height: '100vh',
      background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
      padding: '1rem'
    }}>
      <div style={{
        backgroundColor: 'white',
        padding: '3rem',
        borderRadius: '20px',
        boxShadow: '0 20px 60px rgba(0,0,0,0.3)',
        width: '100%',
        maxWidth: '420px',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Decorative background */}
        <div style={{
          position: 'absolute',
          top: '-50px',
          right: '-50px',
          width: '200px',
          height: '200px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          opacity: 0.1
        }} />
        <div style={{
          position: 'absolute',
          bottom: '-30px',
          left: '-30px',
          width: '150px',
          height: '150px',
          borderRadius: '50%',
          background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
          opacity: 0.1
        }} />

        <div style={{ position: 'relative', zIndex: 1 }}>
          {/* Logo/Header */}
          <div style={{
            textAlign: 'center',
            marginBottom: '2.5rem'
          }}>
            <div style={{
              width: '80px',
              height: '80px',
              borderRadius: '20px',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1.5rem',
              boxShadow: '0 8px 20px rgba(102, 126, 234, 0.4)'
            }}>
              <FiLock style={{ fontSize: '2.5rem', color: 'white' }} />
            </div>
            <h1 style={{ 
              marginBottom: '0.5rem', 
              fontSize: '1.75rem',
              fontWeight: '700',
              background: 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
              WebkitBackgroundClip: 'text',
              WebkitTextFillColor: 'transparent',
              letterSpacing: '-0.5px'
            }}>
              {APP_CONFIG.companyName}
            </h1>
            <p style={{ 
              color: '#6c757d', 
              fontSize: '0.95rem',
              margin: 0
            }}>
              Loan Management System
            </p>
          </div>
          
          {error && (
            <div style={{
              padding: '0.875rem 1rem',
              backgroundColor: '#fee',
              color: '#e74c3c',
              borderRadius: '10px',
              marginBottom: '1.5rem',
              display: 'flex',
              alignItems: 'center',
              gap: '0.75rem',
              border: '1px solid #fcc',
              fontSize: '0.9rem'
            }}>
              <FiAlertCircle style={{ fontSize: '1.1rem', flexShrink: 0 }} />
              <span>{error}</span>
            </div>
          )}

          <form onSubmit={handleSubmit}>
            <div style={{ marginBottom: '1.25rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#1a1d29',
                fontSize: '0.9rem'
              }}>
                Username
              </label>
              <div style={{ position: 'relative' }}>
                <FiUser style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                  fontSize: '1.1rem'
                }} />
                <input
                  type="text"
                  value={username}
                  onChange={(e) => setUsername(e.target.value)}
                  required
                  placeholder={APP_CONFIG.defaultLoginUsername ? `Default: ${APP_CONFIG.defaultLoginUsername}` : "Enter your username"}
                  style={{
                    width: '100%',
                    padding: '0.875rem 1rem 0.875rem 2.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '1rem',
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
            </div>

            <div style={{ marginBottom: '2rem' }}>
              <label style={{ 
                display: 'block', 
                marginBottom: '0.5rem', 
                fontWeight: '600',
                color: '#1a1d29',
                fontSize: '0.9rem'
              }}>
                Password
              </label>
              <div style={{ position: 'relative' }}>
                <FiLock style={{
                  position: 'absolute',
                  left: '1rem',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: '#6c757d',
                  fontSize: '1.1rem'
                }} />
                <input
                  type={showPassword ? 'text' : 'password'}
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  required
                  placeholder={APP_CONFIG.defaultLoginPassword ? `Default: ${APP_CONFIG.defaultLoginPassword}` : "Enter your password"}
                  style={{
                    width: '100%',
                    padding: '0.875rem 2.75rem 0.875rem 2.75rem',
                    border: '2px solid #e9ecef',
                    borderRadius: '10px',
                    fontSize: '1rem',
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
                <button
                  type="button"
                  onClick={() => setShowPassword((v) => !v)}
                  style={{
                    position: 'absolute',
                    right: '0.9rem',
                    top: '50%',
                    transform: 'translateY(-50%)',
                    background: 'none',
                    border: 'none',
                    padding: 0,
                    margin: 0,
                    cursor: 'pointer',
                    color: '#6c757d',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center'
                  }}
                  aria-label={showPassword ? 'Hide password' : 'Show password'}
                >
                  {showPassword ? (
                    <FiEyeOff style={{ fontSize: '1.1rem' }} />
                  ) : (
                    <FiEye style={{ fontSize: '1.1rem' }} />
                  )}
                </button>
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              style={{
                width: '100%',
                padding: '0.875rem',
                background: loading 
                  ? 'linear-gradient(135deg, #95a5a6 0%, #7f8c8d 100%)'
                  : 'linear-gradient(135deg, #667eea 0%, #764ba2 100%)',
                color: 'white',
                border: 'none',
                borderRadius: '10px',
                fontSize: '1rem',
                fontWeight: '600',
                cursor: loading ? 'not-allowed' : 'pointer',
                transition: 'all 0.3s',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '0.5rem',
                boxShadow: loading 
                  ? 'none'
                  : '0 4px 12px rgba(102, 126, 234, 0.4)'
              }}
              onMouseEnter={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(-2px)';
                  e.currentTarget.style.boxShadow = '0 6px 20px rgba(102, 126, 234, 0.5)';
                }
              }}
              onMouseLeave={(e) => {
                if (!loading) {
                  e.currentTarget.style.transform = 'translateY(0)';
                  e.currentTarget.style.boxShadow = '0 4px 12px rgba(102, 126, 234, 0.4)';
                }
              }}
            >
              <FiLogIn style={{ fontSize: '1.1rem' }} />
              {loading ? 'Logging in...' : 'Login'}
            </button>
          </form>

          <div style={{ 
            marginTop: '1.5rem', 
            fontSize: '0.8rem', 
            color: '#6c757d', 
            textAlign: 'center',
            padding: '0.75rem',
            backgroundColor: '#f8f9fa',
            borderRadius: '8px'
          }}>
            <div style={{ fontWeight: '500', marginBottom: '0.25rem' }}>Default Credentials</div>
            <div style={{ fontFamily: 'monospace', fontSize: '0.75rem' }}>
              Username: <strong>admin</strong> • Password: <strong>admin123</strong>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
