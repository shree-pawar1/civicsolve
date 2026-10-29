import React, { useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { Role } from '../types';
import { ApiError } from '../services/api';
import {
  UserPlus,
  AlertCircle,
  CheckCircle2,
  Building,
  User,
  Mail,
  Lock,
  ArrowRight,
  Shield,
  BookOpen,
  Building2,
  Landmark,
} from 'lucide-react';

export const RegisterPage: React.FC = () => {
  const { register } = useAuth();
  const navigate = useNavigate();

  const [fullName, setFullName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [role, setRole] = useState<Role>('CITIZEN');
  const [organization, setOrganization] = useState('');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const [successMessage, setSuccessMessage] = useState<string | null>(null);

  const isOrgRequired = role !== 'CITIZEN';

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);
    setSuccessMessage(null);

    // Frontend validations
    if (!fullName.trim() || fullName.trim().length < 2) {
      setErrorMessage('Full name must be at least 2 characters long.');
      return;
    }

    if (!email.trim() || !email.includes('@')) {
      setErrorMessage('Please enter a valid email address.');
      return;
    }

    if (password.length < 8) {
      setErrorMessage('Password must be at least 8 characters long.');
      return;
    }

    if (!/[A-Za-z]/.test(password) || !/[0-9]/.test(password)) {
      setErrorMessage('Password must contain at least one letter and one number.');
      return;
    }

    if (password !== confirmPassword) {
      setErrorMessage('Passwords do not match.');
      return;
    }

    if (isOrgRequired && (!organization.trim() || organization.trim().length < 2)) {
      setErrorMessage(`Organization name is required for ${role.toLowerCase()} accounts.`);
      return;
    }

    setLoading(true);
    try {
      await register({
        fullName: fullName.trim(),
        email: email.trim(),
        password,
        confirmPassword,
        role,
        organization: organization.trim() || undefined,
      });

      setSuccessMessage('Registration successful! Redirecting to login...');
      setTimeout(() => {
        navigate('/login');
      }, 1500);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to register account. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container" style={{ maxWidth: '640px', padding: '3rem 1.5rem' }}>
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
            <UserPlus size={26} />
          </div>
          <h1 style={{ fontSize: '1.75rem', marginBottom: '0.35rem' }}>Create an Account</h1>
          <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)' }}>
            Join CivicSolve as an active stakeholder solving community challenges
          </p>
        </div>

        {errorMessage && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        {successMessage && (
          <div className="alert alert-success">
            <CheckCircle2 size={18} style={{ flexShrink: 0 }} />
            <span>{successMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Stakeholder Role Selection */}
          <div className="form-group" style={{ marginBottom: '1.5rem' }}>
            <label className="form-label">
              <span>Select Your Stakeholder Role</span>
              <span className="required">*</span>
            </label>
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(2, 1fr)',
                gap: '0.75rem',
                marginTop: '0.25rem',
              }}
            >
              {[
                { id: 'CITIZEN' as Role, label: 'Citizen', icon: Shield, desc: 'Community resident' },
                { id: 'UNIVERSITY' as Role, label: 'University', icon: BookOpen, desc: 'Academia & research' },
                { id: 'INDUSTRY' as Role, label: 'Industry', icon: Building2, desc: 'Technical solutions' },
                { id: 'GOVERNMENT' as Role, label: 'Government', icon: Landmark, desc: 'Municipal authority' },
              ].map((item) => {
                const Icon = item.icon;
                const isSelected = role === item.id;
                return (
                  <button
                    type="button"
                    key={item.id}
                    onClick={() => setRole(item.id)}
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      gap: '0.75rem',
                      padding: '0.75rem 1rem',
                      borderRadius: 'var(--radius-md)',
                      border: `2px solid ${isSelected ? 'var(--primary)' : 'var(--border-color)'}`,
                      backgroundColor: isSelected ? 'var(--primary-light)' : '#FFFFFF',
                      cursor: 'pointer',
                      textAlign: 'left',
                      transition: 'var(--transition)',
                    }}
                  >
                    <Icon size={20} color={isSelected ? 'var(--primary-dark)' : 'var(--text-muted)'} />
                    <div>
                      <div style={{ fontWeight: 600, fontSize: '0.9rem', color: isSelected ? 'var(--primary-dark)' : 'var(--text-main)' }}>
                        {item.label}
                      </div>
                      <div style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        {item.desc}
                      </div>
                    </div>
                  </button>
                );
              })}
            </div>
            {role === 'GOVERNMENT' && (
              <p style={{ fontSize: '0.75rem', color: 'var(--text-muted)', marginTop: '0.5rem', fontStyle: 'italic' }}>
                * Self-registration for Government is enabled for testing purposes. Production deployment requires administrative verification.
              </p>
            )}
          </div>

          {/* Full Name */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-fullName">
              <User size={15} />
              <span>Full Name</span>
              <span className="required">*</span>
            </label>
            <input
              id="register-fullName"
              type="text"
              className="form-input"
              placeholder="e.g. Dr. Jane Smith / Officer Dave"
              value={fullName}
              onChange={(e) => setFullName(e.target.value)}
              required
            />
          </div>

          {/* Organization Name (Required for Uni/Ind/Gov, Optional for Citizen) */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-organization">
              <Building size={15} />
              <span>Organization / Institution Name</span>
              {isOrgRequired ? <span className="required">*</span> : <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>(Optional)</span>}
            </label>
            <input
              id="register-organization"
              type="text"
              className="form-input"
              placeholder={
                role === 'UNIVERSITY'
                  ? 'e.g. Stanford University'
                  : role === 'INDUSTRY'
                  ? 'e.g. Siemens Infrastructure Ltd'
                  : role === 'GOVERNMENT'
                  ? 'e.g. Department of Municipal Administration'
                  : 'Neighborhood Association or Employer (optional)'
              }
              value={organization}
              onChange={(e) => setOrganization(e.target.value)}
              required={isOrgRequired}
            />
            {isOrgRequired && (
              <span className="form-hint">Required for official verification of {role.toLowerCase()} submissions.</span>
            )}
          </div>

          {/* Email Address */}
          <div className="form-group">
            <label className="form-label" htmlFor="register-email">
              <Mail size={15} />
              <span>Email Address</span>
              <span className="required">*</span>
            </label>
            <input
              id="register-email"
              type="email"
              className="form-input"
              placeholder="e.g. jane.smith@example.org"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              autoComplete="email"
              required
            />
            <span className="form-hint">Stored in normalized lowercase with unique database constraint.</span>
          </div>

          {/* Password & Confirm Password */}
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '1rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="register-password">
                <Lock size={15} />
                <span>Password</span>
                <span className="required">*</span>
              </label>
              <input
                id="register-password"
                type="password"
                className="form-input"
                placeholder="Min 8 characters"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="register-confirmPassword">
                <Lock size={15} />
                <span>Confirm</span>
                <span className="required">*</span>
              </label>
              <input
                id="register-confirmPassword"
                type="password"
                className="form-input"
                placeholder="Re-enter password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                autoComplete="new-password"
                required
              />
            </div>
          </div>

          <span className="form-hint" style={{ display: 'block', marginBottom: '1.25rem' }}>
            Must contain at least 8 characters with both letters and numbers.
          </span>

          <button
            type="submit"
            id="register-submit-button"
            className="btn btn-primary"
            style={{ width: '100%', padding: '0.75rem' }}
            disabled={loading}
          >
            {loading ? 'Creating Account...' : 'Complete Registration'}
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
          Already have an account?{' '}
          <Link to="/login" style={{ fontWeight: 600 }}>
            Sign In Here
          </Link>
        </div>
      </div>
    </div>
  );
};
