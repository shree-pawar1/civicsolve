import React, { useEffect, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';
import { api } from '../services/api';
import { Problem, DashboardStats } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { EmptyState } from '../components/EmptyState';
import {
  PlusCircle,
  Clock,
  CheckCircle2,
  AlertCircle,
  FileText,
  MapPin,
  ArrowRight,
  TrendingUp,
  Shield,
  BookOpen,
  Building2,
  Landmark,
} from 'lucide-react';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [myProblems, setMyProblems] = useState<Problem[]>([]);
  const [openProblems, setOpenProblems] = useState<Problem[]>([]);
  const [stats, setStats] = useState<DashboardStats | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      navigate('/login');
      return;
    }

    const loadData = async () => {
      setLoading(true);
      try {
        const [statsData, allProblemsData] = await Promise.all([
          api.dashboard.getStats(),
          api.problems.list({ limit: 50 }),
        ]);

        setStats(statsData);

        const all = allProblemsData.data as Problem[];
        // Citizen view: filter own submissions
        if (user.role === 'CITIZEN') {
          setMyProblems(all.filter((p) => p.creatorId === user.id));
        }

        // University & Industry & Government view: open problems
        setOpenProblems(all);
      } catch (err) {
        console.error('Failed to load dashboard data:', err);
      } finally {
        setLoading(false);
      }
    };

    loadData();
  }, [user, navigate]);

  if (!user) return null;

  return (
    <div className="container main-content">
      {/* Welcome Banner */}
      <div
        className="card"
        style={{
          background: 'linear-gradient(135deg, #1976D2 0%, #0D47A1 100%)',
          color: '#FFFFFF',
          padding: '2rem',
          marginBottom: '2rem',
        }}
      >
        <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', flexWrap: 'wrap', gap: '1rem' }}>
          <div>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.6rem', marginBottom: '0.35rem' }}>
              <span className="badge" style={{ backgroundColor: 'rgba(255, 255, 255, 0.2)', color: '#FFFFFF' }}>
                {user.role} PORTAL
              </span>
              {user.organization && (
                <span style={{ fontSize: '0.85rem', opacity: 0.9 }}>• {user.organization}</span>
              )}
            </div>
            <h1 style={{ fontSize: '1.85rem', color: '#FFFFFF', margin: 0 }}>
              Hello, {user.fullName}
            </h1>
            <p style={{ color: 'rgba(255, 255, 255, 0.85)', margin: '0.25rem 0 0', fontSize: '0.95rem' }}>
              {user.role === 'CITIZEN' && 'Report issues in your neighborhood, track their status, and support solutions.'}
              {user.role === 'UNIVERSITY' && 'Browse active civic challenges and submit academic research proposals.'}
              {user.role === 'INDUSTRY' && 'Review civic challenges and provide technical recommendations & turnkey specs.'}
              {user.role === 'GOVERNMENT' && 'Review reported challenges, manage official status transitions, and evaluate solutions.'}
            </p>
          </div>

          <div>
            {user.role === 'CITIZEN' && (
              <Link to="/create-problem" className="btn btn-secondary">
                <PlusCircle size={18} />
                <span>Report New Problem</span>
              </Link>
            )}
            {(user.role === 'UNIVERSITY' || user.role === 'INDUSTRY') && (
              <Link to="/problems" className="btn btn-secondary">
                <ArrowRight size={18} />
                <span>Explore Challenges</span>
              </Link>
            )}
          </div>
        </div>
      </div>

      {/* Aggregate Metrics Row */}
      <div className="grid grid-cols-4" style={{ marginBottom: '2.5rem' }}>
        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>TOTAL CHALLENGES</span>
            <FileText size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--text-main)' }}>
            {loading ? '...' : stats?.summary?.totalProblems ?? 0}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>UNDER REVIEW</span>
            <Clock size={18} color="#D97706" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem', color: '#D97706' }}>
            {loading ? '...' : stats?.statusBreakdown?.UNDER_REVIEW ?? 0}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>IN PROGRESS</span>
            <TrendingUp size={18} color="var(--primary)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--primary)' }}>
            {loading ? '...' : stats?.statusBreakdown?.IN_PROGRESS ?? 0}
          </div>
        </div>

        <div className="card">
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
            <span style={{ fontSize: '0.85rem', fontWeight: 600, color: 'var(--text-muted)' }}>RESOLVED</span>
            <CheckCircle2 size={18} color="var(--color-success)" />
          </div>
          <div style={{ fontSize: '1.85rem', fontWeight: 800, marginTop: '0.5rem', color: 'var(--color-success)' }}>
            {loading ? '...' : stats?.statusBreakdown?.RESOLVED ?? 0}
          </div>
        </div>
      </div>

      {/* Role-Specific Content Sections */}

      {/* 1. CITIZEN VIEW */}
      {user.role === 'CITIZEN' && (
        <section>
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem' }}>
            <div>
              <h2 style={{ fontSize: '1.4rem' }}>My Reported Problems</h2>
              <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
                Track the progress, review proposals, and see official government updates for your submissions.
              </p>
            </div>
            <Link to="/create-problem" className="btn btn-outline btn-sm">
              <PlusCircle size={15} /> Report Another Issue
            </Link>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading your submissions...</div>
          ) : myProblems.length === 0 ? (
            <EmptyState
              icon={FileText}
              title="No problems reported yet"
              description="You have not reported any community challenges yet. Help your neighborhood by documenting an issue today."
              actionText="Report a Problem"
              onAction={() => navigate('/create-problem')}
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {myProblems.map((prob) => (
                <div key={prob.id} className="card card-hover" style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'flex-start', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1, minWidth: '240px' }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', flexWrap: 'wrap' }}>
                        <StatusBadge status={prob.status} />
                        <PriorityBadge priority={prob.priority} />
                        <span className="badge" style={{ background: '#F1F5F9', color: 'var(--text-muted)' }}>
                          {prob.category}
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', marginBottom: '0.4rem' }}>
                        <Link to={`/problems/${prob.id}`} style={{ color: 'var(--text-main)', textDecoration: 'none' }}>
                          {prob.title}
                        </Link>
                      </h3>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                          <MapPin size={14} /> {prob.location}
                        </span>
                        <span>•</span>
                        <span>{prob._count?.solutions || 0} solutions submitted</span>
                      </div>
                    </div>

                    <Link to={`/problems/${prob.id}`} className="btn btn-outline btn-sm">
                      View Details & Timeline <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 2. UNIVERSITY VIEW */}
      {user.role === 'UNIVERSITY' && (
        <section>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem' }}>Open Challenges Requiring Research Solutions</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Explore community problems submitted by citizens and contribute academic research proposals (PROPOSAL).
            </p>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading challenges...</div>
          ) : openProblems.length === 0 ? (
            <EmptyState
              icon={BookOpen}
              title="No open problems available"
              description="There are currently no reported problems in the database."
            />
          ) : (
            <div className="grid grid-cols-2">
              {openProblems.slice(0, 6).map((prob) => (
                <div key={prob.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <StatusBadge status={prob.status} />
                    <PriorityBadge priority={prob.priority} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{prob.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', flex: 1, marginBottom: '1rem' }}>
                    {prob.description.substring(0, 140)}...
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Category: <strong>{prob.category}</strong>
                    </span>
                    <Link to={`/problems/${prob.id}`} className="btn btn-secondary btn-sm">
                      Submit Research Proposal
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 3. INDUSTRY VIEW */}
      {user.role === 'INDUSTRY' && (
        <section>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem' }}>Civic Opportunities for Technical Recommendations</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Identify municipal challenges where your organization can provide engineering equipment, implementation approaches, or CSR support.
            </p>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading opportunities...</div>
          ) : openProblems.length === 0 ? (
            <EmptyState
              icon={Building2}
              title="No active challenges"
              description="No community challenges found at this time."
            />
          ) : (
            <div className="grid grid-cols-2">
              {openProblems.slice(0, 6).map((prob) => (
                <div key={prob.id} className="card card-hover" style={{ display: 'flex', flexDirection: 'column' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem' }}>
                    <StatusBadge status={prob.status} />
                    <PriorityBadge priority={prob.priority} />
                  </div>
                  <h3 style={{ fontSize: '1.1rem', marginBottom: '0.4rem' }}>{prob.title}</h3>
                  <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)', flex: 1, marginBottom: '1rem' }}>
                    {prob.description.substring(0, 140)}...
                  </p>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', borderTop: '1px solid #F1F5F9', paddingTop: '0.75rem' }}>
                    <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                      Location: <strong>{prob.location}</strong>
                    </span>
                    <Link to={`/problems/${prob.id}`} className="btn btn-primary btn-sm">
                      Provide Recommendation
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}

      {/* 4. GOVERNMENT VIEW */}
      {user.role === 'GOVERNMENT' && (
        <section>
          <div style={{ marginBottom: '1.5rem' }}>
            <h2 style={{ fontSize: '1.4rem' }}>Municipal Moderation & Resolution Queue</h2>
            <p style={{ fontSize: '0.875rem', color: 'var(--text-muted)' }}>
              Evaluate reported problems, execute authorized status transitions, review university/industry solutions, and publish certified audit logs.
            </p>
          </div>

          {loading ? (
            <div style={{ padding: '3rem', textAlign: 'center', color: 'var(--text-muted)' }}>Loading review queue...</div>
          ) : openProblems.length === 0 ? (
            <EmptyState
              icon={Landmark}
              title="Queue is empty"
              description="No problems reported yet."
            />
          ) : (
            <div style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
              {openProblems.map((prob) => (
                <div key={prob.id} className="card card-hover" style={{ padding: '1.25rem 1.5rem' }}>
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap' }}>
                    <div style={{ flex: 1 }}>
                      <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.35rem' }}>
                        <StatusBadge status={prob.status} />
                        <PriorityBadge priority={prob.priority} />
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-muted)' }}>
                          Reported by <strong>{prob.creator.fullName}</strong>
                        </span>
                      </div>
                      <h3 style={{ fontSize: '1.15rem', margin: '0.2rem 0' }}>{prob.title}</h3>
                      <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                        Location: {prob.location} • Category: {prob.category} • Solutions: {prob._count?.solutions || 0}
                      </div>
                    </div>

                    <Link to={`/problems/${prob.id}`} className="btn btn-primary btn-sm">
                      Review & Transition Status <ArrowRight size={14} />
                    </Link>
                  </div>
                </div>
              ))}
            </div>
          )}
        </section>
      )}
    </div>
  );
};
