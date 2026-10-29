import React, { useEffect, useState } from 'react';
import { Link } from 'react-router-dom';
import { api } from '../services/api';
import { Problem, Category, Priority, ProblemStatus } from '../types';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { EmptyState } from '../components/EmptyState';
import { useAuth } from '../context/AuthContext';
import {
  Search,
  Filter,
  PlusCircle,
  MapPin,
  Calendar,
  MessageSquare,
  FileText,
  ChevronLeft,
  ChevronRight,
} from 'lucide-react';

export const ProblemsPage: React.FC = () => {
  const { user } = useAuth();

  const [problems, setProblems] = useState<Problem[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  const [category, setCategory] = useState<string>('');
  const [status, setStatus] = useState<string>('');
  const [priority, setPriority] = useState<string>('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [totalCount, setTotalCount] = useState(0);

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await api.problems.list({
        search,
        category,
        status,
        priority,
        page,
        limit: 9,
      });

      setProblems(res.data);
      setTotalPages(res.pagination.totalPages);
      setTotalCount(res.pagination.total);
    } catch (err) {
      console.error('Failed to load problems:', err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, [category, status, priority, page]);

  const handleSearchSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    fetchProblems();
  };

  return (
    <div className="container main-content">
      {/* Header & Action */}
      <div
        style={{
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'space-between',
          flexWrap: 'wrap',
          gap: '1rem',
          marginBottom: '2rem',
        }}
      >
        <div>
          <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>Community Challenges</h1>
          <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
            Browse societal problems documented by citizens and active across all stakeholder sectors
          </p>
        </div>

        {user?.role === 'CITIZEN' && (
          <Link to="/create-problem" className="btn btn-primary">
            <PlusCircle size={18} />
            <span>Report a Problem</span>
          </Link>
        )}
      </div>

      {/* Search and Filters Bar */}
      <div
        className="card"
        style={{
          padding: '1.25rem',
          marginBottom: '2rem',
          boxShadow: 'var(--shadow-sm)',
        }}
      >
        <form onSubmit={handleSearchSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '1rem' }}>
          <div style={{ display: 'flex', gap: '0.75rem', flexWrap: 'wrap' }}>
            <div style={{ flex: 1, minWidth: '260px', position: 'relative' }}>
              <Search
                size={18}
                style={{
                  position: 'absolute',
                  left: '12px',
                  top: '50%',
                  transform: 'translateY(-50%)',
                  color: 'var(--text-muted)',
                }}
              />
              <input
                type="text"
                className="form-input"
                style={{ paddingLeft: '2.5rem' }}
                placeholder="Search by keywords, title, description, or location..."
                value={search}
                onChange={(e) => setSearch(e.target.value)}
              />
            </div>
            <button type="submit" className="btn btn-primary btn-sm" style={{ padding: '0 1.25rem' }}>
              Search
            </button>
          </div>

          {/* Filter Dropdowns */}
          <div
            style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
              gap: '0.75rem',
            }}
          >
            <div>
              <select
                className="form-select"
                value={category}
                onChange={(e) => {
                  setCategory(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Categories</option>
                <option value="INFRASTRUCTURE">Infrastructure</option>
                <option value="ENVIRONMENT">Environment</option>
                <option value="EDUCATION">Education</option>
                <option value="HEALTHCARE">Healthcare</option>
                <option value="SANITATION">Sanitation</option>
                <option value="PUBLIC_SAFETY">Public Safety</option>
                <option value="OTHER">Other</option>
              </select>
            </div>

            <div>
              <select
                className="form-select"
                value={status}
                onChange={(e) => {
                  setStatus(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Statuses</option>
                <option value="SUBMITTED">Submitted</option>
                <option value="UNDER_REVIEW">Under Review</option>
                <option value="IN_PROGRESS">In Progress</option>
                <option value="RESOLVED">Resolved</option>
                <option value="CLOSED">Closed</option>
              </select>
            </div>

            <div>
              <select
                className="form-select"
                value={priority}
                onChange={(e) => {
                  setPriority(e.target.value);
                  setPage(1);
                }}
              >
                <option value="">All Priorities</option>
                <option value="LOW">Low</option>
                <option value="MEDIUM">Medium</option>
                <option value="HIGH">High</option>
                <option value="CRITICAL">Critical</option>
              </select>
            </div>

            {(category || status || priority || search) && (
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => {
                  setCategory('');
                  setStatus('');
                  setPriority('');
                  setSearch('');
                  setPage(1);
                }}
              >
                Reset Filters
              </button>
            )}
          </div>
        </form>
      </div>

      {/* Problem Cards Grid */}
      {loading ? (
        <div style={{ textAlign: 'center', padding: '4rem', color: 'var(--text-muted)' }}>
          Loading community challenges...
        </div>
      ) : problems.length === 0 ? (
        <EmptyState
          icon={FileText}
          title="No problems have been reported yet."
          description={
            category || status || priority || search
              ? 'No challenges matched your search filters. Try adjusting your query or resetting filters.'
              : 'Be the first citizen to report a real civic challenge in your neighborhood.'
          }
          actionText={user?.role === 'CITIZEN' ? 'Report a Problem' : undefined}
          onAction={user?.role === 'CITIZEN' ? () => (window.location.href = '/create-problem') : undefined}
        />
      ) : (
        <>
          <div style={{ marginBottom: '1rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
            Showing {problems.length} of {totalCount} total challenges
          </div>

          <div className="grid grid-cols-3" style={{ marginBottom: '2.5rem' }}>
            {problems.map((prob) => (
              <div
                key={prob.id}
                className="card card-hover"
                style={{
                  display: 'flex',
                  flexDirection: 'column',
                  padding: '1.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.75rem' }}>
                  <StatusBadge status={prob.status} />
                  <PriorityBadge priority={prob.priority} />
                </div>

                <h3 style={{ fontSize: '1.15rem', marginBottom: '0.5rem', lineHeight: 1.3 }}>
                  <Link
                    to={`/problems/${prob.id}`}
                    style={{ color: 'var(--text-main)', textDecoration: 'none' }}
                  >
                    {prob.title}
                  </Link>
                </h3>

                <p
                  style={{
                    fontSize: '0.875rem',
                    color: 'var(--text-muted)',
                    lineHeight: 1.5,
                    marginBottom: '1.25rem',
                    flex: 1,
                  }}
                >
                  {prob.description.length > 120
                    ? `${prob.description.substring(0, 120)}...`
                    : prob.description}
                </p>

                <div
                  style={{
                    display: 'flex',
                    flexDirection: 'column',
                    gap: '0.5rem',
                    borderTop: '1px solid var(--border-color)',
                    paddingTop: '0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                    <MapPin size={13} />
                    <span>{prob.location}</span>
                  </div>

                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                      <Calendar size={13} />
                      {new Date(prob.createdAt).toLocaleDateString()}
                    </span>

                    <span style={{ display: 'flex', alignItems: 'center', gap: '0.3rem', fontWeight: 600, color: 'var(--primary)' }}>
                      <MessageSquare size={13} />
                      {prob._count?.solutions || 0} proposals
                    </span>
                  </div>
                </div>

                <Link
                  to={`/problems/${prob.id}`}
                  className="btn btn-outline btn-sm"
                  style={{ width: '100%', marginTop: '1rem' }}
                >
                  View Details & Solutions
                </Link>
              </div>
            ))}
          </div>

          {/* Pagination Controls */}
          {totalPages > 1 && (
            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                gap: '1rem',
                marginTop: '2rem',
              }}
            >
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page <= 1}
              >
                <ChevronLeft size={16} /> Previous
              </button>
              <span style={{ fontSize: '0.9rem', color: 'var(--text-muted)', fontWeight: 600 }}>
                Page {page} of {totalPages}
              </span>
              <button
                type="button"
                className="btn btn-outline btn-sm"
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page >= totalPages}
              >
                Next <ChevronRight size={16} />
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};
