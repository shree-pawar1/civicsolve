import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { ShieldCheck, PlusCircle, LogOut, User as UserIcon, LayoutDashboard, ListFilter } from 'lucide-react';

export const Navbar: React.FC = () => {
  const { user, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = async () => {
    await logout();
    navigate('/login');
  };

  return (
    <header
      style={{
        backgroundColor: '#FFFFFF',
        borderBottom: '1px solid var(--border-color)',
        position: 'sticky',
        top: 0,
        zIndex: 100,
        boxShadow: 'var(--shadow-sm)',
      }}
    >
      <div
        className="container"
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          height: '68px',
        }}
      >
        {/* Brand Logo */}
        <Link
          to="/"
          style={{
            display: 'flex',
            alignItems: 'center',
            gap: '0.6rem',
            color: 'var(--primary)',
            fontWeight: 800,
            fontSize: '1.35rem',
            textDecoration: 'none',
          }}
        >
          <div
            style={{
              width: '36px',
              height: '36px',
              borderRadius: '8px',
              background: 'linear-gradient(135deg, var(--primary), var(--accent-teal))',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'center',
              color: '#FFFFFF',
            }}
          >
            <ShieldCheck size={22} />
          </div>
          <span>Civic<span style={{ color: 'var(--accent-teal)' }}>Solve</span></span>
        </Link>

        {/* Navigation Links */}
        <nav style={{ display: 'flex', alignItems: 'center', gap: '1.25rem' }}>
          <Link
            to="/problems"
            style={{
              display: 'flex',
              alignItems: 'center',
              gap: '0.4rem',
              color: 'var(--text-main)',
              fontWeight: 500,
              fontSize: '0.95rem',
            }}
          >
            <ListFilter size={16} />
            <span>Browse Problems</span>
          </Link>

          {user && (
            <Link
              to="/dashboard"
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '0.4rem',
                color: 'var(--text-main)',
                fontWeight: 500,
                fontSize: '0.95rem',
              }}
            >
              <LayoutDashboard size={16} />
              <span>Dashboard</span>
            </Link>
          )}

          {user?.role === 'CITIZEN' && (
            <Link
              to="/create-problem"
              className="btn btn-primary btn-sm"
              style={{ display: 'flex', alignItems: 'center', gap: '0.35rem' }}
            >
              <PlusCircle size={15} />
              <span>Report Issue</span>
            </Link>
          )}

          {/* User state */}
          {user ? (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.85rem', marginLeft: '0.5rem' }}>
              <Link
                to="/profile"
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  padding: '0.35rem 0.75rem',
                  borderRadius: 'var(--radius-full)',
                  background: '#F1F5F9',
                  color: 'var(--text-main)',
                  textDecoration: 'none',
                  fontSize: '0.875rem',
                }}
              >
                <UserIcon size={14} color="var(--primary)" />
                <span style={{ fontWeight: 600 }}>{user.fullName}</span>
                <span className="badge badge-role" style={{ fontSize: '0.65rem', padding: '0.15rem 0.5rem' }}>
                  {user.role}
                </span>
              </Link>

              <button
                type="button"
                onClick={handleLogout}
                className="btn btn-outline btn-sm"
                title="Log out and revoke session"
                style={{ padding: '0.4rem 0.6rem' }}
              >
                <LogOut size={15} />
                <span style={{ fontSize: '0.85rem' }}>Logout</span>
              </button>
            </div>
          ) : (
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.75rem' }}>
              <Link to="/login" className="btn btn-outline btn-sm">
                Login
              </Link>
              <Link to="/register" className="btn btn-primary btn-sm">
                Register
              </Link>
            </div>
          )}
        </nav>
      </div>
    </header>
  );
};
