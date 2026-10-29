import React from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { User, Shield, Building, Mail, Calendar, LogOut, Clock, Key } from 'lucide-react';

export const ProfilePage: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  if (!user) {
    navigate('/login');
    return null;
  }

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <div className="container main-content" style={{ maxWidth: '680px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>Stakeholder Profile</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Manage your verified account identity, session security, and active authorizations.
        </p>
      </div>

      <div className="card" style={{ padding: '2rem', marginBottom: '1.5rem', boxShadow: 'var(--shadow-md)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '1.25rem', marginBottom: '1.75rem', borderBottom: '1px solid var(--border-color)', paddingBottom: '1.5rem' }}>
          <div
            style={{
              width: '64px',
              height: '64px',
              borderRadius: '50%',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-teal))',
              color: '#FFFFFF',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              fontSize: '1.5rem',
              fontWeight: 700,
            }}
          >
            {user.fullName.charAt(0).toUpperCase()}
          </div>

          <div>
            <h2 style={{ fontSize: '1.4rem', margin: '0 0 0.25rem' }}>{user.fullName}</h2>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
              <span className="badge badge-role">{user.role}</span>
              {user.organization && (
                <span style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  • {user.organization}
                </span>
              )}
            </div>
          </div>
        </div>

        {/* Details list */}
        <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem', fontSize: '0.95rem' }}>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <Mail size={16} /> Email Address
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.email}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <Shield size={16} /> Stakeholder Authorization
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>{user.role}</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0', borderBottom: '1px solid #F1F5F9' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <Building size={16} /> Organization Name
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {user.organization || 'Individual Citizen'}
            </span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '0.5rem 0' }}>
            <span style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', color: 'var(--text-muted)' }}>
              <Calendar size={16} /> Account Registered
            </span>
            <span style={{ fontWeight: 600, color: 'var(--text-main)' }}>
              {user.createdAt ? new Date(user.createdAt).toLocaleDateString() : 'Active'}
            </span>
          </div>
        </div>
      </div>

      {/* Session Security Card */}
      <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1rem', color: 'var(--primary-dark)', fontWeight: 700 }}>
          <Key size={18} />
          <span>Active Session Security Policy</span>
        </div>

        <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6, marginBottom: '1.25rem' }}>
          This session is secured with a cryptographically hashed opaque token delivered via HttpOnly, SameSite=Lax cookie.
        </p>

        <div style={{ backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '1.5rem', display: 'flex', flexDirection: 'column', gap: '0.5rem' }}>
          <div>• <strong>Single Active Session Rule:</strong> Enforced at database level via partial unique index.</div>
          <div>• <strong>Sliding Idle Timeout:</strong> 30 minutes of inactivity automatically invalidates this session.</div>
          <div>• <strong>Absolute Lifetime:</strong> 8 hours maximum session duration.</div>
        </div>

        <button
          type="button"
          onClick={handleLogout}
          className="btn btn-outline"
          style={{ width: '100%', borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
        >
          <LogOut size={16} />
          <span>Log Out and Revoke Current Session</span>
        </button>
      </div>
    </div>
  );
};
