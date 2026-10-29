import React, { useState } from 'react';
import { Link, useNavigate, useLocation } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ApiError } from '../services/api';
import { LogIn, AlertCircle, ShieldAlert, ArrowRight, Lock, Mail } from 'lucide-react';

export const LoginPage: React.FC = () => {
  const { login } = useAuth();
  const navigate = useNavigate();
  const location = useLocation();

  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [isConflict, setIsConflict] = useState(false);

  // Check if redirected from a protected route with a message
  const from = (location.state as any)?.from?.pathname || '/dashboard';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setIsConflict(false);

    if (!email.trim() || !password) {
      setErrorMessage('Please enter both your email and password.');
      return;
    }

    setLoading(true);
    try {
      await login({ email: email.trim(), password });
      navigate(from, { replace: true });
    } catch (err: any) {
      if (err instanceof ApiError) {
        if (err.statusCode === 409) {
          setIsConflict(true);
          setErrorMessage(err.message);
        } else if (err.statusCode === 401) {
          setErrorMessage('Invalid email or password.');
        } else {
          setErrorMessage(err.message || 'An error occurred during authentication.');
        }
      } else {
        setErrorMessage('Unable to connect to the authentication server.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '480px', padding: '3.5rem 1.5rem' }}>
      <div className="card" style={{ padding: '2.5rem', boxShadow: 'var(--shadow-lg)' }}>
        <div style={{ textAlign: 'center', marginBottom: '2rem' }}>
          <div
            style={{
              width: '52px',
              height: '52px',
              borderRadius: '12px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-teal))',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              margin: '0 auto 1rem',
            }}
          >
            <LogIn size={26} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>Welcome Back</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Sign in to access your CivicSolve stakeholder portal
          </p>
        </div>

        {/* 409 Single-Session Conflict Notice */}
        {isConflict && (
          <div className="alert alert-warning" style={{ flexDirection: 'column', gap: '0.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700 }}>
              <ShieldAlert size={20} color="#E65100" />
              <span>Active Session Detected (HTTP 409)</span>
            </div>
            <p style={{ fontSize: '0.875rem', margin: 0, color: '#BF360C' }}>
              {errorMessage}
            </p>
            <p style={{ fontSize: '0.8rem', margin: 0, color: '#E65100', opacity: 0.9 }}>
              <strong>Single-Session Security Policy:</strong> CivicSolve accounts are restricted to one active browser session across all devices. If you left a session open elsewhere, you must log out from that device, or wait for the 30-minute idle timeout.
            </p>
          </div>
        )}

        {/* Standard Error Notice */}
        {!isConflict && errorMessage && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          <div className="form-group">
            <label className="form-label" htmlFor="login-email">
              <Mail size={15} />
              <span>Email Address</span>
              <span className="required">*</span>
            </label>
            <input
              id="login-email"
              type="email"
              className="form-input"
              placeholder="e.g. citizen@example.com"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="login-password">
              <Lock size={15} />
              <span>Password</span>
              <span className="required">*</span>
            </label>
            <input
              id="login-password"
              type="password"
              className="form-input"
              placeholder="Enter your password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              autoComplete="current-password"
              required
            />
          </div>

          <button
            type="submit"
            id="login-submit-button"
            className="btn btn-primary"
            style={{ width: '100%', marginTop: '0.75rem', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Authenticating...' : 'Sign In'}
            {!loading && <ArrowRight size={16} />}
          </button>
        </form>

        <div
          style={{
            marginTop: '2rem',
            paddingTop: '1.25rem',
            borderTop: '1px solid var(--border-color)',
            textAlign: 'center',
            fontSize: '0.9rem',
            color: 'var(--text-muted)',
          }}
        >
          Don't have an account yet?{' '}
          <Link to="/register" style={{ fontWeight: 600 }}>
            Register as a Stakeholder
          </Link>
        </div>
      </div>
    </div>
  );
};
