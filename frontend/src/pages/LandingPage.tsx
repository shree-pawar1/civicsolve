import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { DashboardStats } from '../types';
import {
  ShieldCheck,
  BookOpen,
  Building2,
  Landmark,
  ArrowRight,
  TrendingUp,
  Users,
  CheckCircle2,
  FileText,
  Sparkles,
} from 'lucide-react';

export const LandingPage: React.FC = () => {
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState<boolean>(true);

  useEffect(() => {
    api.dashboard
      .getStats()
      .then((data) => setStats(data))
      .catch((err) => console.error('Failed to load stats:', err))
      .finally(() => setLoading(false));
  }, []);

  return (
    <div>
      {/* Hero Section */}
      <section
        style={{
          background: 'linear-gradient(135deg, #0D47A1 0%, #1976D2 50%, #00796B 100%)',
          color: '#FFFFFF',
          padding: '5rem 0 4.5rem',
          position: 'relative',
          overflow: 'hidden',
        }}
      >
        <div className="container" style={{ position: 'relative', zIndex: 2 }}>
          <div style={{ maxWidth: '780px' }}>
            <div
              style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '0.5rem',
                padding: '0.4rem 0.85rem',
                borderRadius: 'var(--radius-full)',
                backgroundColor: 'rgba(255, 255, 255, 0.15)',
                backdropFilter: 'blur(8px)',
                fontSize: '0.85rem',
                fontWeight: 600,
                marginBottom: '1.5rem',
                letterSpacing: '0.03em',
              }}
            >
              <Sparkles size={16} />
              <span>DTI Innovation Capstone Platform</span>
            </div>

            <h1
              style={{
                fontSize: 'clamp(2.2rem, 5vw, 3.4rem)',
                fontWeight: 800,
                color: '#FFFFFF',
                lineHeight: 1.15,
                marginBottom: '1.25rem',
              }}
            >
              Solving Real-World Challenges Together
            </h1>

            <p
              style={{
                fontSize: 'clamp(1.05rem, 2vw, 1.25rem)',
                color: 'rgba(255, 255, 255, 0.9)',
                lineHeight: 1.6,
                marginBottom: '2.5rem',
                maxWidth: '680px',
              }}
            >
              CivicSolve bridges the gap between citizens reporting real civic problems, universities contributing research solutions, industries offering technical recommendations, and governments driving verified execution.
            </p>

            <div style={{ display: 'flex', gap: '1rem', flexWrap: 'wrap' }}>
              <Link to="/register" className="btn btn-secondary btn-lg" style={{ color: '#FFFFFF' }}>
                Join the Platform <ArrowRight size={18} />
              </Link>
              <Link
                to="/problems"
                className="btn btn-lg"
                style={{
                  backgroundColor: 'rgba(255, 255, 255, 0.15)',
                  color: '#FFFFFF',
                  borderColor: 'rgba(255, 255, 255, 0.3)',
                  backdropFilter: 'blur(6px)',
                }}
              >
                Browse Problems
              </Link>
            </div>
          </div>
        </div>
      </section>

      {/* Live Verified Platform Metrics (From DB queries) */}
      <section style={{ transform: 'translateY(-2rem)', position: 'relative', zIndex: 10 }}>
        <div className="container">
          <div
            className="card"
            style={{
              padding: '1.75rem',
              boxShadow: 'var(--shadow-lg)',
              border: '1px solid var(--border-color)',
            }}
          >
            <div
              style={{
                display: 'grid',
                gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
                gap: '1.5rem',
                textAlign: 'center',
              }}
            >
              <div>
                <div style={{ color: 'var(--primary)', marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                  <FileText size={26} />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {loading ? '...' : stats?.summary?.totalProblems ?? 0}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Reported Problems
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--accent-teal)', marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                  <TrendingUp size={26} />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {loading ? '...' : stats?.summary?.totalSolutions ?? 0}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Solutions & Proposals
                </div>
              </div>

              <div>
                <div style={{ color: '#EA580C', marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                  <Users size={26} />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {loading ? '...' : stats?.summary?.totalUsers ?? 0}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Active Stakeholders
                </div>
              </div>

              <div>
                <div style={{ color: 'var(--color-success)', marginBottom: '0.4rem', display: 'flex', justifyContent: 'center' }}>
                  <CheckCircle2 size={26} />
                </div>
                <div style={{ fontSize: '2rem', fontWeight: 800, color: 'var(--text-main)' }}>
                  {loading ? '...' : `${stats?.summary?.resolutionRate ?? 0}%`}
                </div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontWeight: 500 }}>
                  Problem Resolution Rate
                </div>
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* Four Stakeholder Pathways */}
      <section className="container" style={{ padding: '3rem 1.5rem 4rem' }}>
        <div style={{ textAlign: 'center', maxWidth: '640px', margin: '0 auto 3rem' }}>
          <h2 style={{ fontSize: '2rem', marginBottom: '0.75rem' }}>Four Pillars of Civic Innovation</h2>
          <p style={{ fontSize: '1rem', color: 'var(--text-muted)' }}>
            Each stakeholder brings unique capabilities to transform community problems into sustainable, research-backed, and funded solutions.
          </p>
        </div>

        <div className="grid grid-cols-4">
          {/* Citizen */}
          <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--primary-light)',
                color: 'var(--primary)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Users size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Citizens</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', flex: 1 }}>
              Document and submit real community challenges with geographic location, photos, and urgency ratings. Vote on solutions and monitor progress.
            </p>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--primary)' }}>
              • Report Problems<br />• Upvote Proposals<br />• Track Timeline
            </div>
          </div>

          {/* University */}
          <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: 'var(--accent-teal-light)',
                color: 'var(--accent-teal-dark)',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <BookOpen size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Universities</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', flex: 1 }}>
              Academia and researchers propose scientifically validated methodologies, prototypes, feasibility studies, and environmental assessments.
            </p>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--accent-teal-dark)' }}>
              • Research Proposals<br />• Scientific Analysis<br />• Prototype Testing
            </div>
          </div>

          {/* Industry */}
          <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#FFEDD5',
                color: '#EA580C',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Building2 size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Industries</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', flex: 1 }}>
              Commercial enterprises contribute turnkey technology recommendations, industrial scale equipment, cost estimates, and CSR co-funding.
            </p>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#EA580C' }}>
              • Technical Specs<br />• Implementation Plans<br />• CSR Sponsorship
            </div>
          </div>

          {/* Government */}
          <div className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
            <div
              style={{
                width: '48px',
                height: '48px',
                borderRadius: '12px',
                background: '#DCFCE7',
                color: '#166534',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                marginBottom: '1.25rem',
              }}
            >
              <Landmark size={24} />
            </div>
            <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>Government</h3>
            <p style={{ fontSize: '0.9rem', color: 'var(--text-muted)', marginBottom: '1.25rem', flex: 1 }}>
              Municipal authorities review challenges, approve vetted solutions, coordinate public works departments, and issue certified status updates.
            </p>
            <div style={{ fontSize: '0.8rem', fontWeight: 600, color: '#166534' }}>
              • Official Review<br />• Status Transitions<br />• Verifiable Audit Log
            </div>
          </div>
        </div>
      </section>

      {/* Verified Status Workflow Overview */}
      <section style={{ backgroundColor: '#FFFFFF', padding: '4rem 0', borderTop: '1px solid var(--border-color)', borderBottom: '1px solid var(--border-color)' }}>
        <div className="container">
          <div style={{ textAlign: 'center', maxWidth: '600px', margin: '0 auto 2.5rem' }}>
            <h2 style={{ fontSize: '1.75rem', marginBottom: '0.5rem' }}>Accountable Resolution Lifecycle</h2>
            <p style={{ color: 'var(--text-muted)' }}>
              Every civic issue advances through strict, server-enforced state transitions with immutable progress updates.
            </p>
          </div>

          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(190px, 1fr))',
              gap: '1rem',
              position: 'relative',
            }}
          >
            <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>1. Submitted</div>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Citizen files issue with severity and location data.</p>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: '#D97706', marginBottom: '0.25rem' }}>2. Under Review</div>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Government assesses jurisdiction, severity, and solutions.</p>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '1.25rem' }}>
              <div style={{ fontWeight: 700, color: 'var(--primary)', marginBottom: '0.25rem' }}>3. In Progress</div>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Work orders issued, contractors or teams deployed.</p>
            </div>
            <div className="card" style={{ textAlign: 'center', padding: '1.25rem', borderLeft: '4px solid var(--color-success)' }}>
              <div style={{ fontWeight: 700, color: 'var(--color-success)', marginBottom: '0.25rem' }}>4. Resolved</div>
              <p style={{ fontSize: '0.8rem', margin: 0 }}>Field inspection passes, problem marked complete.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
};
