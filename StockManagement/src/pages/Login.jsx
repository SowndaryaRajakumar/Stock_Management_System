import React, { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import Button from '../components/common/Button';

export const Login = () => {
  const { login, isAuthenticated, user } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [identifier, setIdentifier] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [sessionNotice, setSessionNotice] = useState('');
  const [loading, setLoading] = useState(false);

  // Check for session expired notice in sessionStorage
  useEffect(() => {
    const expiredMsg = sessionStorage.getItem('auth_expired_notice');
    if (expiredMsg) {
      setSessionNotice(expiredMsg);
      sessionStorage.removeItem('auth_expired_notice');
    }
  }, []);

  // Redirect if already authenticated based on role
  useEffect(() => {
    if (isAuthenticated && user) {
      const from = location.state?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
        return;
      }
      if (user.role?.toUpperCase() === 'ADMIN') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/faculty/catalog', { replace: true });
      }
    }
  }, [isAuthenticated, user, navigate, location]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setSessionNotice('');

    if (!identifier.trim() || !password.trim()) {
      setError('Please provide both username/email and password.');
      return;
    }

    setLoading(true);
    const res = await login(identifier.trim(), password);
    setLoading(false);

    if (res.success && res.user) {
      const from = location.state?.from?.pathname;
      if (from && from !== '/login') {
        navigate(from, { replace: true });
        return;
      }
      if (res.user.role?.toUpperCase() === 'ADMIN') {
        navigate('/dashboard', { replace: true });
      } else {
        navigate('/faculty/catalog', { replace: true });
      }
    } else {
      setError(res.error || 'Invalid username/email or password');
    }
  };

  return (
    <div className="login-page">
      <div className="login-card">
        <div className="login-mark" aria-hidden="true">
          📦
        </div>
        <h1>Consumable Stock Management System</h1>
        <p className="login-sub">
          Central Consumable Store & Inventory Record Maintenance
        </p>

        {sessionNotice && (
          <div
            className="login-error-box"
            style={{
              backgroundColor: '#eff6ff',
              borderColor: '#93c5fd',
              color: '#1e40af',
              marginBottom: '16px'
            }}
            role="status"
          >
            <span>ℹ</span>
            <span>{sessionNotice}</span>
          </div>
        )}

        {error && (
          <div className="login-error-box" role="alert">
            <span>⚠</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="field">
            <label htmlFor="login-identifier">Username or Email</label>
            <input
              type="text"
              id="login-identifier"
              name="identifier"
              placeholder="Enter your username or email"
              value={identifier}
              onChange={(e) => {
                setIdentifier(e.target.value);
                setError('');
              }}
              autoComplete="username"
              required
              disabled={loading}
            />
          </div>

          <div className="field">
            <label htmlFor="login-password">Password</label>
            <input
              type="password"
              id="login-password"
              name="password"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => {
                setPassword(e.target.value);
                setError('');
              }}
              autoComplete="current-password"
              required
              disabled={loading}
            />
          </div>

          <Button
            type="submit"
            variant="primary"
            disabled={loading}
            style={{ width: '100%', marginTop: '8px' }}
          >
            {loading ? 'Authenticating...' : 'Login to System'}
          </Button>
        </form>

        <div className="login-foot">
          Secure Role-Based Access Control
        </div>
      </div>
    </div>
  );
};

export default Login;
