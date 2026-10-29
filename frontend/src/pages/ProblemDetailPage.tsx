import React, { useEffect, useState } from 'react';
import { useParams, useNavigate, Link } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import { Problem, Solution, ProgressUpdate, Role, ProblemStatus, ReviewStatus } from '../types';
import { useAuth } from '../context/AuthContext';
import { StatusBadge } from '../components/StatusBadge';
import { PriorityBadge } from '../components/PriorityBadge';
import { Timeline } from '../components/Timeline';
import { Modal } from '../components/Modal';
import { EmptyState } from '../components/EmptyState';
import {
  MapPin,
  Calendar,
  User,
  ThumbsUp,
  PlusCircle,
  Edit,
  Trash2,
  Sparkles,
  CheckCircle,
  XCircle,
  Clock,
  ArrowRight,
  AlertCircle,
  Building,
  BookOpen,
  Factory,
  Landmark,
} from 'lucide-react';

export const ProblemDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const { user } = useAuth();

  const [problem, setProblem] = useState<Problem | null>(null);
  const [loading, setLoading] = useState(true);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // Modals state
  const [isSolutionModalOpen, setIsSolutionModalOpen] = useState(false);
  const [isStatusModalOpen, setIsStatusModalOpen] = useState(false);
  const [isEditModalOpen, setIsEditModalOpen] = useState(false);

  // Solution submission form
  const [solTitle, setSolTitle] = useState('');
  const [solExplanation, setSolExplanation] = useState('');
  const [solBenefits, setSolBenefits] = useState('');
  const [solApproach, setSolApproach] = useState('');
  const [solLoading, setSolLoading] = useState(false);
  const [solError, setSolError] = useState<string | null>(null);

  // Status transition form (Government)
  const [targetStatus, setTargetStatus] = useState<ProblemStatus>('UNDER_REVIEW');
  const [statusMessage, setStatusMessage] = useState('');
  const [statusLoading, setStatusLoading] = useState(false);
  const [statusError, setStatusError] = useState<string | null>(null);

  // Edit problem form (Citizen creator)
  const [editTitle, setEditTitle] = useState('');
  const [editDescription, setEditDescription] = useState('');
  const [editLocation, setEditLocation] = useState('');
  const [editLoading, setEditLoading] = useState(false);
  const [editError, setEditError] = useState<string | null>(null);

  // AI analysis state
  const [aiLoading, setAiLoading] = useState(false);
  const [aiAnalysis, setAiAnalysis] = useState<any>(null);
  const [aiNotice, setAiNotice] = useState<string | null>(null);

  const fetchProblemDetails = async () => {
    if (!id) return;
    try {
      const res = await api.problems.get(id);
      setProblem(res.problem);
      setEditTitle(res.problem.title);
      setEditDescription(res.problem.description);
      setEditLocation(res.problem.location);

      // Pre-populate latest AI analysis if already generated
      if (res.problem.aiAnalyses && res.problem.aiAnalyses.length > 0) {
        const latest = res.problem.aiAnalyses[0];
        try {
          const parsed = typeof latest.content === 'string' ? JSON.parse(latest.content) : latest.content;
          setAiAnalysis({
            ...parsed,
            model: latest.model,
            createdAt: latest.createdAt,
          });
        } catch {
          // ignore parsing error
        }
      }
    } catch (err: any) {
      setErrorMessage(err.message || 'Failed to load challenge details.');
    } finally {
      setLoading(false);
    }
  };

  const handleGenerateAiBreakdown = async () => {
    if (!id) return;
    if (!user) {
      setAiNotice('Please log in to generate an AI breakdown.');
      return;
    }
    setAiLoading(true);
    setAiNotice(null);

    try {
      const res = await api.ai.breakdown(id);
      if (res.available && res.analysis) {
        setAiAnalysis({
          ...res.analysis,
          model: res.model || 'gemini-3.8-flash',
          createdAt: res.createdAt || new Date().toISOString(),
        });
      } else {
        setAiNotice(res.error || 'AI analysis is unavailable');
      }
    } catch (err: any) {
      setAiNotice(err.message || 'AI analysis is unavailable');
    } finally {
      setAiLoading(false);
    }
  };

  const handleAiAnalysis = handleGenerateAiBreakdown;

  useEffect(() => {
    fetchProblemDetails();
  }, [id]);

  // Submit Solution (University or Industry)
  const handleSolutionSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setSolError(null);
    setSolLoading(true);

    try {
      await api.solutions.create(id, {
        title: solTitle.trim(),
        explanation: solExplanation.trim(),
        expectedBenefits: solBenefits.trim(),
        implementationApproach: solApproach.trim(),
      });
      setIsSolutionModalOpen(false);
      setSolTitle('');
      setSolExplanation('');
      setSolBenefits('');
      setSolApproach('');
      fetchProblemDetails();
    } catch (err: any) {
      setSolError(err.message || 'Failed to submit proposal.');
    } finally {
      setSolLoading(false);
    }
  };

  // Change Status (Government only)
  const handleStatusTransition = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setStatusError(null);
    setStatusLoading(true);

    try {
      await api.problems.changeStatus(id, {
        toStatus: targetStatus,
        message: statusMessage.trim(),
      });
      setIsStatusModalOpen(false);
      setStatusMessage('');
      fetchProblemDetails();
    } catch (err: any) {
      setStatusError(err.message || 'Failed to update problem status.');
    } finally {
      setStatusLoading(false);
    }
  };

  // Edit Problem (Citizen owner only)
  const handleEditSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!id) return;
    setEditError(null);
    setEditLoading(true);

    try {
      await api.problems.update(id, {
        title: editTitle.trim(),
        description: editDescription.trim(),
        location: editLocation.trim(),
      });
      setIsEditModalOpen(false);
      fetchProblemDetails();
    } catch (err: any) {
      setEditError(err.message || 'Failed to edit problem.');
    } finally {
      setEditLoading(false);
    }
  };

  // Delete Problem (Citizen owner only)
  const handleDeleteProblem = async () => {
    if (!id) return;
    if (!window.confirm('Are you sure you want to delete this reported problem? This action cannot be undone.')) {
      return;
    }

    try {
      await api.problems.delete(id);
      navigate('/problems');
    } catch (err: any) {
      alert(err.message || 'Failed to delete problem.');
    }
  };

  // Upvote / Support Solution (Citizen only)
  const handleToggleSupport = async (solutionId: string) => {
    if (!user) {
      navigate('/login');
      return;
    }
    try {
      await api.solutions.toggleSupport(solutionId);
      fetchProblemDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to register support.');
    }
  };

  // Review Solution (Government only)
  const handleReviewSolution = async (solutionId: string, reviewStatus: ReviewStatus) => {
    try {
      await api.solutions.review(solutionId, reviewStatus);
      fetchProblemDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to update review status.');
    }
  };

  // Withdraw Solution (Author only)
  const handleWithdrawSolution = async (solutionId: string) => {
    if (!window.confirm('Are you sure you want to withdraw your proposal?')) return;
    try {
      await api.solutions.withdraw(solutionId);
      fetchProblemDetails();
    } catch (err: any) {
      alert(err.message || 'Failed to withdraw proposal.');
    }
  };

  if (loading) {
    return (
      <div className="container main-content" style={{ textAlign: 'center', padding: '5rem 0' }}>
        <p style={{ color: 'var(--text-muted)' }}>Loading problem details and timeline...</p>
      </div>
    );
  }

  if (errorMessage || !problem) {
    return (
      <div className="container main-content">
        <div className="alert alert-danger">
          <AlertCircle size={20} />
          <span>{errorMessage || 'Problem not found.'}</span>
        </div>
        <Link to="/problems" className="btn btn-outline btn-sm">
          Return to Problems List
        </Link>
      </div>
    );
  }

  const isCitizenCreator = user?.role === 'CITIZEN' && user.id === problem.creatorId;
  const isGov = user?.role === 'GOVERNMENT';
  const canSubmitSolution = user?.role === 'UNIVERSITY' || user?.role === 'INDUSTRY';
  const canEditProblem = isCitizenCreator && problem.status === 'SUBMITTED';

  // Allowed next transitions based on current problem status
  const getNextStatuses = (cur: ProblemStatus): ProblemStatus[] => {
    switch (cur) {
      case 'SUBMITTED':
        return ['UNDER_REVIEW', 'CLOSED'];
      case 'UNDER_REVIEW':
        return ['IN_PROGRESS', 'CLOSED'];
      case 'IN_PROGRESS':
        return ['RESOLVED', 'CLOSED'];
      default:
        return [];
    }
  };
  const availableTransitions = getNextStatuses(problem.status);

  return (
    <div className="container main-content">
      {/* Breadcrumb */}
      <div style={{ marginBottom: '1.25rem', fontSize: '0.875rem' }}>
        <Link to="/problems" style={{ color: 'var(--text-muted)' }}>Problems</Link>
        <span style={{ margin: '0 0.5rem', color: 'var(--text-light)' }}>/</span>
        <span style={{ color: 'var(--text-main)', fontWeight: 500 }}>{problem.title}</span>
      </div>

      <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 2fr) minmax(0, 1.1fr)', gap: '2rem' }}>
        {/* Left Column: Problem Overview & Solutions */}
        <div>
          {/* Main Problem Card */}
          <div className="card" style={{ padding: '2rem', marginBottom: '2rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', flexWrap: 'wrap' }}>
                <StatusBadge status={problem.status} />
                <PriorityBadge priority={problem.priority} />
                <span className="badge" style={{ background: 'var(--primary-light)', color: 'var(--primary-dark)' }}>
                  {problem.category}
                </span>
              </div>

              {/* Creator Controls (Edit/Delete only if SUBMITTED) */}
              {canEditProblem && (
                <div style={{ display: 'flex', gap: '0.5rem' }}>
                  <button
                    type="button"
                    onClick={() => setIsEditModalOpen(true)}
                    className="btn btn-outline btn-sm"
                  >
                    <Edit size={14} /> Edit
                  </button>
                  <button
                    type="button"
                    onClick={handleDeleteProblem}
                    className="btn btn-outline btn-sm"
                    style={{ borderColor: 'var(--color-danger)', color: 'var(--color-danger)' }}
                  >
                    <Trash2 size={14} /> Delete
                  </button>
                </div>
              )}
            </div>

            <h1 style={{ fontSize: '1.85rem', marginBottom: '1rem', lineHeight: 1.25 }}>
              {problem.title}
            </h1>

            <div
              style={{
                display: 'flex',
                alignItems: 'center',
                gap: '1.5rem',
                fontSize: '0.875rem',
                color: 'var(--text-muted)',
                marginBottom: '1.75rem',
                flexWrap: 'wrap',
                borderBottom: '1px solid var(--border-color)',
                paddingBottom: '1rem',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <MapPin size={16} color="var(--primary)" />
                <span>{problem.location}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <Calendar size={16} color="var(--primary)" />
                <span>Reported {new Date(problem.createdAt).toLocaleDateString()}</span>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}>
                <User size={16} color="var(--primary)" />
                <span>Reported by <strong>{problem.creator.fullName}</strong></span>
              </div>
            </div>

            <div style={{ lineHeight: 1.7, color: 'var(--text-main)', fontSize: '1rem', whiteSpace: 'pre-line' }}>
              {problem.description}
            </div>

            {/* AI Analysis Integration */}
            <div
              style={{
                marginTop: '2rem',
                paddingTop: '1.5rem',
                borderTop: '1px solid var(--border-color)',
              }}
            >
              <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '1rem', flexWrap: 'wrap', marginBottom: '1rem' }}>
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', fontWeight: 600, color: 'var(--primary-dark)', fontSize: '1.05rem' }}>
                  <Sparkles size={20} color="var(--primary)" />
                  <span>AI-Assisted Multi-Stakeholder Breakdown</span>
                </div>
                <button
                  type="button"
                  id="btn-generate-ai-breakdown"
                  onClick={handleGenerateAiBreakdown}
                  className="btn btn-outline btn-sm"
                  disabled={aiLoading}
                  style={{
                    borderColor: 'var(--primary)',
                    color: 'var(--primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.4rem',
                    fontWeight: 600,
                  }}
                >
                  <Sparkles size={14} />
                  {aiLoading ? 'Generating Breakdown...' : aiAnalysis ? 'Regenerate AI Breakdown' : 'Generate AI Breakdown'}
                </button>
              </div>

              {aiNotice && (
                <div
                  className="alert alert-warning"
                  style={{
                    margin: '0.75rem 0 1rem 0',
                    fontSize: '0.875rem',
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.5rem',
                  }}
                >
                  <AlertCircle size={18} style={{ flexShrink: 0 }} />
                  <span>{aiNotice}</span>
                </div>
              )}

              {aiAnalysis && (
                <div
                  style={{
                    backgroundColor: '#F8FAFC',
                    border: '1px solid #CBD5E1',
                    borderRadius: 'var(--radius-lg, 12px)',
                    padding: '1.5rem',
                    fontSize: '0.9rem',
                    lineHeight: 1.6,
                    boxShadow: 'var(--shadow-sm)',
                  }}
                >
                  {/* AI Label & Model Banner */}
                  <div
                    style={{
                      display: 'flex',
                      alignItems: 'center',
                      justifyContent: 'space-between',
                      flexWrap: 'wrap',
                      gap: '0.5rem',
                      marginBottom: '1rem',
                      paddingBottom: '0.75rem',
                      borderBottom: '1px solid #E2E8F0',
                    }}
                  >
                    <span
                      className="badge"
                      style={{
                        background: '#EEF2FF',
                        color: '#3730A3',
                        border: '1px solid #C7D2FE',
                        fontWeight: 600,
                        fontSize: '0.8rem',
                        display: 'inline-flex',
                        alignItems: 'center',
                        gap: '0.35rem',
                      }}
                    >
                      🤖 AI-Generated Analysis ({aiAnalysis.model || 'gemini-3.8-flash'})
                    </span>
                    {aiAnalysis.createdAt && (
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                        Generated {new Date(aiAnalysis.createdAt).toLocaleString()}
                      </span>
                    )}
                  </div>

                  {/* Summary */}
                  {aiAnalysis.summary && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--primary-dark)', marginBottom: '0.35rem', fontSize: '0.95rem' }}>
                        Executive Summary
                      </div>
                      <p style={{ margin: 0, color: 'var(--text-main)', fontSize: '0.925rem' }}>
                        {aiAnalysis.summary}
                      </p>
                    </div>
                  )}

                  {/* Possible Causes */}
                  {((aiAnalysis.possibleCauses && aiAnalysis.possibleCauses.length > 0) ||
                    (aiAnalysis.potentialCauses && aiAnalysis.potentialCauses.length > 0)) && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                        Possible Root Causes:
                      </div>
                      <ul style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-main)' }}>
                        {(aiAnalysis.possibleCauses || aiAnalysis.potentialCauses).map((cause: string, idx: number) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>{cause}</li>
                        ))}
                      </ul>
                    </div>
                  )}

                  {/* Multi-Stakeholder Solution Approaches */}
                  {aiAnalysis.solutionApproaches && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.5rem' }}>
                        Solution Approaches by Stakeholder:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '0.85rem' }}>
                        {aiAnalysis.solutionApproaches.universityResearch && (
                          <div style={{ padding: '0.85rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontWeight: 600, color: '#1E40AF', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                              <BookOpen size={14} /> Academia / University
                            </div>
                            <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-main)' }}>
                              {aiAnalysis.solutionApproaches.universityResearch}
                            </p>
                          </div>
                        )}
                        {aiAnalysis.solutionApproaches.industryRecommendation && (
                          <div style={{ padding: '0.85rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontWeight: 600, color: '#047857', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                              <Factory size={14} /> Industry / Contractor
                            </div>
                            <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-main)' }}>
                              {aiAnalysis.solutionApproaches.industryRecommendation}
                            </p>
                          </div>
                        )}
                        {aiAnalysis.solutionApproaches.governmentAction && (
                          <div style={{ padding: '0.85rem', background: '#FFFFFF', borderRadius: '8px', border: '1px solid #E2E8F0' }}>
                            <div style={{ fontWeight: 600, color: '#B45309', fontSize: '0.825rem', display: 'flex', alignItems: 'center', gap: '0.35rem', marginBottom: '0.35rem' }}>
                              <Landmark size={14} /> Government / Municipal
                            </div>
                            <p style={{ margin: 0, fontSize: '0.825rem', color: 'var(--text-main)' }}>
                              {aiAnalysis.solutionApproaches.governmentAction}
                            </p>
                          </div>
                        )}
                      </div>
                    </div>
                  )}

                  {/* Relevant Stakeholders */}
                  {aiAnalysis.relevantStakeholders && (
                    <div style={{ marginBottom: '1.25rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                        Relevant Stakeholder Roles:
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '0.75rem', fontSize: '0.825rem' }}>
                        {Object.entries(aiAnalysis.relevantStakeholders).map(([role, desc]: [string, any]) => (
                          <div key={role} style={{ background: '#FFFFFF', padding: '0.65rem 0.8rem', borderRadius: '6px', border: '1px solid #E2E8F0' }}>
                            <strong style={{ textTransform: 'capitalize', color: 'var(--primary-dark)', display: 'block', marginBottom: '0.2rem' }}>
                              {role}:
                            </strong>
                            <span>{String(desc)}</span>
                          </div>
                        ))}
                      </div>
                    </div>
                  )}

                  {/* Next Steps */}
                  {aiAnalysis.nextSteps && aiAnalysis.nextSteps.length > 0 && (
                    <div style={{ marginBottom: '0.75rem' }}>
                      <div style={{ fontWeight: 700, color: 'var(--text-main)', marginBottom: '0.35rem' }}>
                        Recommended Next Steps:
                      </div>
                      <ol style={{ paddingLeft: '1.25rem', margin: 0, color: 'var(--text-main)' }}>
                        {aiAnalysis.nextSteps.map((step: string, idx: number) => (
                          <li key={idx} style={{ marginBottom: '0.25rem' }}>{step}</li>
                        ))}
                      </ol>
                    </div>
                  )}

                  <div style={{ marginTop: '1rem', paddingTop: '0.75rem', borderTop: '1px solid #E2E8F0', fontSize: '0.75rem', color: 'var(--text-muted)' }}>
                    Disclaimer: This output was generated by Google Gemini AI for collaborative assistance only. Official platform decisions, budget allocations, and status transitions remain strictly governed by authorized participants.
                  </div>
                </div>
              )}
            </div>
          </div>

          {/* Solutions & Proposals Section */}
          <div>
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '1.25rem', flexWrap: 'wrap', gap: '1rem' }}>
              <div>
                <h2 style={{ fontSize: '1.4rem' }}>
                  Solutions & Proposals ({problem.solutions?.length || 0})
                </h2>
                <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                  Academic research proposals (University) and technical recommendations (Industry).
                </p>
              </div>

              {canSubmitSolution && problem.status !== 'CLOSED' && (
                <button
                  type="button"
                  onClick={() => setIsSolutionModalOpen(true)}
                  className="btn btn-secondary btn-sm"
                >
                  <PlusCircle size={16} />
                  <span>
                    {user?.role === 'UNIVERSITY' ? 'Submit Research Proposal' : 'Submit Tech Recommendation'}
                  </span>
                </button>
              )}
            </div>

            {!problem.solutions || problem.solutions.length === 0 ? (
              <EmptyState
                icon={BookOpen}
                title="No solutions have been proposed yet."
                description="Universities and Industries can review this challenge and submit actionable proposals."
                actionText={canSubmitSolution ? 'Submit Proposal' : undefined}
                onAction={canSubmitSolution ? () => setIsSolutionModalOpen(true) : undefined}
              />
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '1.25rem' }}>
                {problem.solutions.map((sol) => {
                  const isAuthor = user?.id === sol.authorId;
                  const hasSupported = user ? sol.supports?.some((s) => s.userId === user.id) : false;
                  const totalVotes = sol._count?.supports || 0;

                  return (
                    <div key={sol.id} className="card" style={{ padding: '1.5rem' }}>
                      <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.75rem', marginBottom: '0.75rem', flexWrap: 'wrap' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          <span
                            className="badge"
                            style={{
                              background: sol.type === 'PROPOSAL' ? 'var(--accent-teal-light)' : '#FFEDD5',
                              color: sol.type === 'PROPOSAL' ? 'var(--accent-teal-dark)' : '#EA580C',
                              fontWeight: 700,
                            }}
                          >
                            {sol.type === 'PROPOSAL' ? 'ACADEMIC PROPOSAL' : 'TECH RECOMMENDATION'}
                          </span>
                          <StatusBadge status={sol.reviewStatus} type="solution" />
                        </div>

                        {/* Author Actions */}
                        {isAuthor && (
                          <button
                            type="button"
                            onClick={() => handleWithdrawSolution(sol.id)}
                            className="btn btn-outline btn-sm"
                            style={{ padding: '0.25rem 0.5rem', fontSize: '0.75rem', color: 'var(--color-danger)' }}
                          >
                            Withdraw
                          </button>
                        )}
                      </div>

                      <h3 style={{ fontSize: '1.2rem', marginBottom: '0.5rem' }}>{sol.title}</h3>

                      <div style={{ fontSize: '0.8rem', color: 'var(--text-muted)', marginBottom: '1rem', display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                        <span>
                          By <strong>{sol.author.fullName}</strong>
                          {sol.author.organization ? ` (${sol.author.organization})` : ''}
                        </span>
                        <span>•</span>
                        <span>{new Date(sol.createdAt).toLocaleDateString()}</span>
                      </div>

                      <div style={{ marginBottom: '1rem' }}>
                        <div style={{ fontWeight: 600, fontSize: '0.85rem', color: 'var(--text-main)', marginBottom: '0.2rem' }}>
                          Explanation & Methodology:
                        </div>
                        <p style={{ fontSize: '0.9rem', color: 'var(--text-main)', whiteSpace: 'pre-line' }}>
                          {sol.explanation}
                        </p>
                      </div>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '1rem', backgroundColor: '#F8FAFC', padding: '1rem', borderRadius: 'var(--radius-md)', marginBottom: '1rem' }}>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
                            Expected Benefits:
                          </div>
                          <p style={{ fontSize: '0.85rem', margin: 0 }}>{sol.expectedBenefits}</p>
                        </div>
                        <div>
                          <div style={{ fontWeight: 600, fontSize: '0.8rem', color: 'var(--primary-dark)', marginBottom: '0.2rem' }}>
                            Implementation Approach:
                          </div>
                          <p style={{ fontSize: '0.85rem', margin: 0 }}>{sol.implementationApproach}</p>
                        </div>
                      </div>

                      {/* Citizen Voting & Government Moderation Bar */}
                      <div
                        style={{
                          display: 'flex',
                          alignItems: 'center',
                          justifyContent: 'space-between',
                          borderTop: '1px solid var(--border-color)',
                          paddingTop: '0.75rem',
                          flexWrap: 'wrap',
                          gap: '0.75rem',
                        }}
                      >
                        {/* Citizen Upvote */}
                        <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                          {user?.role === 'CITIZEN' ? (
                            <button
                              type="button"
                              onClick={() => handleToggleSupport(sol.id)}
                              className={`btn btn-sm ${hasSupported ? 'btn-primary' : 'btn-outline'}`}
                              style={{ display: 'flex', alignItems: 'center', gap: '0.4rem' }}
                            >
                              <ThumbsUp size={14} />
                              <span>{hasSupported ? 'Supported' : 'Support Solution'}</span>
                              <span style={{ marginLeft: '0.25rem', fontWeight: 700 }}>({totalVotes})</span>
                            </button>
                          ) : (
                            <div style={{ display: 'flex', alignItems: 'center', gap: '0.4rem', fontSize: '0.85rem', color: 'var(--text-muted)' }}>
                              <ThumbsUp size={14} />
                              <span>{totalVotes} community supporters</span>
                            </div>
                          )}
                        </div>

                        {/* Government Review Controls */}
                        {isGov && (
                          <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                            <span style={{ fontSize: '0.8rem', fontWeight: 600, color: 'var(--text-muted)' }}>Gov Review:</span>
                            <button
                              type="button"
                              onClick={() => handleReviewSolution(sol.id, 'ACCEPTED')}
                              className="btn btn-sm"
                              style={{ backgroundColor: 'var(--color-success)', color: '#FFFFFF', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              Accept
                            </button>
                            <button
                              type="button"
                              onClick={() => handleReviewSolution(sol.id, 'REJECTED')}
                              className="btn btn-sm"
                              style={{ backgroundColor: 'var(--color-danger)', color: '#FFFFFF', padding: '0.3rem 0.6rem', fontSize: '0.75rem' }}
                            >
                              Reject
                            </button>
                          </div>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        </div>

        {/* Right Column: Government Status Controls & Official Progress Timeline */}
        <div>
          {/* Government Status Control Box */}
          {isGov && (
            <div className="card" style={{ padding: '1.5rem', marginBottom: '2rem', border: '2px solid var(--primary)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '0.5rem', color: 'var(--primary-dark)', fontWeight: 700 }}>
                <Landmark size={20} />
                <span>Government Resolution Workflow</span>
              </div>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1rem' }}>
                Only authorized government accounts may transition problem status and publish certified audit timeline entries.
              </p>

              <div style={{ marginBottom: '1rem', fontSize: '0.85rem' }}>
                Current Status: <StatusBadge status={problem.status} />
              </div>

              {availableTransitions.length > 0 ? (
                <button
                  type="button"
                  onClick={() => {
                    setTargetStatus(availableTransitions[0]);
                    setIsStatusModalOpen(true);
                  }}
                  className="btn btn-primary"
                  style={{ width: '100%' }}
                >
                  Advance / Change Status
                </button>
              ) : (
                <div style={{ fontSize: '0.85rem', color: 'var(--text-muted)', fontStyle: 'italic' }}>
                  Problem is in terminal state ({problem.status}). No further transitions allowed.
                </div>
              )}
            </div>
          )}

          {/* Official Progress Timeline Card */}
          <div className="card" style={{ padding: '1.5rem' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem', marginBottom: '1.25rem' }}>
              <Clock size={18} color="var(--primary)" />
              <h3 style={{ fontSize: '1.15rem', margin: 0 }}>Official Progress Timeline</h3>
            </div>
            <p style={{ fontSize: '0.85rem', color: 'var(--text-muted)', marginBottom: '1.5rem' }}>
              Verifiable append-only chronological record of all administrative status changes.
            </p>

            <Timeline updates={problem.updates || []} />
          </div>
        </div>
      </div>

      {/* MODAL 1: Submit Solution Proposal (University / Industry) */}
      <Modal
        isOpen={isSolutionModalOpen}
        onClose={() => setIsSolutionModalOpen(false)}
        title={user?.role === 'UNIVERSITY' ? 'Submit Academic Research Proposal' : 'Submit Technical Recommendation'}
        maxWidth="620px"
      >
        {solError && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{solError}</span>
          </div>
        )}
        <form onSubmit={handleSolutionSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="sol-title">
              Proposal Title <span className="required">*</span>
            </label>
            <input
              id="sol-title"
              type="text"
              className="form-input"
              placeholder="e.g. Permeable Pavement Stormwater Absorption Pilot"
              value={solTitle}
              onChange={(e) => setSolTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sol-explanation">
              Technical Methodology / Scientific Explanation <span className="required">*</span>
            </label>
            <textarea
              id="sol-explanation"
              rows={4}
              className="form-textarea"
              placeholder="Describe the research findings, design mechanics, or engineering solution..."
              value={solExplanation}
              onChange={(e) => setSolExplanation(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sol-benefits">
              Expected Community & Environmental Benefits <span className="required">*</span>
            </label>
            <textarea
              id="sol-benefits"
              rows={3}
              className="form-textarea"
              placeholder="Measurable improvements, reduction in flood risk, public health benefits..."
              value={solBenefits}
              onChange={(e) => setSolBenefits(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="sol-approach">
              Implementation Approach & Milestones <span className="required">*</span>
            </label>
            <textarea
              id="sol-approach"
              rows={3}
              className="form-textarea"
              placeholder="Phased rollout, pilot testing, estimated duration, equipment requirements..."
              value={solApproach}
              onChange={(e) => setSolApproach(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsSolutionModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={solLoading}
            >
              {solLoading ? 'Submitting...' : 'Submit Proposal'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 2: Government Status Transition Modal */}
      <Modal
        isOpen={isStatusModalOpen}
        onClose={() => setIsStatusModalOpen(false)}
        title="Transition Problem Status"
      >
        {statusError && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{statusError}</span>
          </div>
        )}
        <form onSubmit={handleStatusTransition}>
          <div className="form-group">
            <label className="form-label" htmlFor="status-select">
              Select New Target Status <span className="required">*</span>
            </label>
            <select
              id="status-select"
              className="form-select"
              value={targetStatus}
              onChange={(e) => setTargetStatus(e.target.value as ProblemStatus)}
            >
              {availableTransitions.map((st) => (
                <option key={st} value={st}>
                  {st}
                </option>
              ))}
            </select>
            <span className="form-hint">
              Transitions are strictly enforced by the server state machine.
            </span>
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="status-message">
              Official Progress Note / Message <span className="required">*</span>
            </label>
            <textarea
              id="status-message"
              rows={4}
              className="form-textarea"
              placeholder="Document the administrative decision, contractor assignment, inspection outcome, or next steps..."
              value={statusMessage}
              onChange={(e) => setStatusMessage(e.target.value)}
              required
            />
            <span className="form-hint">This message will be appended to the public immutable audit timeline.</span>
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsStatusModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={statusLoading}
            >
              {statusLoading ? 'Updating...' : 'Publish Status Update'}
            </button>
          </div>
        </form>
      </Modal>

      {/* MODAL 3: Edit Problem (Citizen owner only) */}
      <Modal
        isOpen={isEditModalOpen}
        onClose={() => setIsEditModalOpen(false)}
        title="Edit Reported Problem"
      >
        {editError && (
          <div className="alert alert-danger">
            <AlertCircle size={18} />
            <span>{editError}</span>
          </div>
        )}
        <form onSubmit={handleEditSubmit}>
          <div className="form-group">
            <label className="form-label" htmlFor="edit-title">
              Title <span className="required">*</span>
            </label>
            <input
              id="edit-title"
              type="text"
              className="form-input"
              value={editTitle}
              onChange={(e) => setEditTitle(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-location">
              Location <span className="required">*</span>
            </label>
            <input
              id="edit-location"
              type="text"
              className="form-input"
              value={editLocation}
              onChange={(e) => setEditLocation(e.target.value)}
              required
            />
          </div>

          <div className="form-group">
            <label className="form-label" htmlFor="edit-description">
              Description <span className="required">*</span>
            </label>
            <textarea
              id="edit-description"
              rows={5}
              className="form-textarea"
              value={editDescription}
              onChange={(e) => setEditDescription(e.target.value)}
              required
            />
          </div>

          <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '0.75rem', marginTop: '1.5rem' }}>
            <button
              type="button"
              className="btn btn-outline btn-sm"
              onClick={() => setIsEditModalOpen(false)}
            >
              Cancel
            </button>
            <button
              type="submit"
              className="btn btn-primary btn-sm"
              disabled={editLoading}
            >
              {editLoading ? 'Saving...' : 'Save Changes'}
            </button>
          </div>
        </form>
      </Modal>
    </div>
  );
};
