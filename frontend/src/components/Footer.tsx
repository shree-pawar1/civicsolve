import React from 'react';
import { Shield, BookOpen, Factory, Landmark, Award } from 'lucide-react';

export const Footer: React.FC = () => {
  return (
    <footer
      style={{
        backgroundColor: '#FFFFFF',
        borderTop: '1px solid var(--border-color)',
        padding: '2.5rem 0 1.5rem',
        marginTop: 'auto',
      }}
    >
      <div className="container">
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))',
            gap: '2rem',
            marginBottom: '2rem',
          }}
        >
          {/* Brand Info */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 700, color: 'var(--primary)', marginBottom: '0.75rem' }}>
              <Shield size={20} />
              <span>CivicSolve Platform</span>
            </div>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', lineHeight: 1.6 }}>
              A Digital Platform Connecting Citizens, Universities, Industries, and Government Organizations to Solve Societal Problems.
            </p>
          </div>

          {/* Stakeholders */}
          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>Stakeholder Roles</h4>
            <ul style={{ listStyle: 'none', display: 'flex', flexDirection: 'column', gap: '0.5rem', fontSize: '0.85rem' }}>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <Shield size={14} color="var(--primary)" /> Citizen: Community Reporting
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <BookOpen size={14} color="var(--accent-teal)" /> University: Research Proposals
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <Factory size={14} color="#EA580C" /> Industry: Tech Recommendations
              </li>
              <li style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', color: 'var(--text-muted)' }}>
                <Landmark size={14} color="#166534" /> Government: Review & Resolution
              </li>
            </ul>
          </div>

          {/* Security & Integrity */}
          <div>
            <h4 style={{ fontSize: '0.95rem', marginBottom: '0.75rem', color: 'var(--text-main)' }}>Engineering Standards</h4>
            <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', display: 'flex', flexDirection: 'column', gap: '0.4rem' }}>
              <div>• Argon2id Password Hashing</div>
              <div>• Concurrency-Safe Single Active Session</div>
              <div>• Normalized Database Unique Constraints</div>
              <div>• Append-Only Official Audit Trails</div>
            </div>
          </div>
        </div>

        <div
          style={{
            borderTop: '1px solid var(--border-color)',
            paddingTop: '1.25rem',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'space-between',
            flexWrap: 'wrap',
            gap: '1rem',
            fontSize: '0.8rem',
            color: 'var(--text-light)',
          }}
        >
          <div>
            © {new Date().getFullYear()} CivicSolve — Design Thinking & Innovation (DTI) Capstone Prototype (Assignment 9).
          </div>
          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
            <Award size={14} /> Full-Stack Production Architecture
          </div>
        </div>
      </div>
    </footer>
  );
};
