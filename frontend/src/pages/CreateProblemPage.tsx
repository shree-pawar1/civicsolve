import React, { useState } from 'react';
import { useNavigate, Link } from 'react-router-dom';
import { api, ApiError } from '../services/api';
import { useAuth } from '../context/AuthContext';
import { Category, Priority } from '../types';
import { PlusCircle, AlertCircle, MapPin, Tag, Flag, FileText, ArrowLeft, ArrowRight, Sparkles, Check, RefreshCw } from 'lucide-react';

export const CreateProblemPage: React.FC = () => {
  const { user } = useAuth();
  const navigate = useNavigate();

  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState<Category>('INFRASTRUCTURE');
  const [location, setLocation] = useState('');
  const [priority, setPriority] = useState<Priority>('MEDIUM');

  const [loading, setLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);

  // AI Classification state
  const [aiClassifying, setAiClassifying] = useState(false);
  const [aiSuggestion, setAiSuggestion] = useState<{ category: Category; reasoning: string; confidence: number } | null>(null);
  const [aiError, setAiError] = useState<string | null>(null);
  const [acceptedSuggestion, setAcceptedSuggestion] = useState<boolean>(false);

  // Guard: non-citizens cannot create problems
  if (user && user.role !== 'CITIZEN') {
    return (
      <div className="container main-content" style={{ maxWidth: '600px' }}>
        <div className="alert alert-warning">
          <AlertCircle size={20} />
          <span>
            Only Citizens are authorized to report community problems. As a {user.role}, you can explore challenges and submit proposals.
          </span>
        </div>
        <Link to="/problems" className="btn btn-primary btn-sm">
          Browse Challenges
        </Link>
      </div>
    );
  }

  const handleAiClassify = async () => {
    setAiError(null);
    if (title.trim().length < 3) {
      setAiError('Please enter at least a brief problem title (min 3 characters) first.');
      return;
    }
    if (description.trim().length < 10) {
      setAiError('Please enter at least a brief description (min 10 characters) so the AI can analyze context.');
      return;
    }

    setAiClassifying(true);
    setAcceptedSuggestion(false);
    try {
      const res = await api.ai.classify({
        title: title.trim(),
        description: description.trim(),
      });

      if (res.available && res.category) {
        setAiSuggestion({
          category: res.category as Category,
          reasoning: res.reasoning || '',
          confidence: res.confidence || 0.9,
        });
      } else {
        setAiError(res.error || 'AI analysis is unavailable');
      }
    } catch (err: any) {
      setAiError(err.message || 'AI analysis is unavailable');
    } finally {
      setAiClassifying(false);
    }
  };

  const handleAcceptSuggestion = () => {
    if (aiSuggestion) {
      setCategory(aiSuggestion.category);
      setAcceptedSuggestion(true);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setErrorMessage(null);

    if (title.trim().length < 5) {
      setErrorMessage('Title must be at least 5 characters long.');
      return;
    }

    if (description.trim().length < 20) {
      setErrorMessage('Description must be at least 20 characters long to provide sufficient detail.');
      return;
    }

    if (location.trim().length < 3) {
      setErrorMessage('Please provide a specific street, landmark, or ward location.');
      return;
    }

    setLoading(true);
    try {
      const res = await api.problems.create({
        title: title.trim(),
        description: description.trim(),
        category,
        location: location.trim(),
        priority,
      });

      navigate(`/problems/${res.problem.id}`);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setErrorMessage(err.message);
      } else {
        setErrorMessage('Failed to report problem. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="container main-content" style={{ maxWidth: '720px' }}>
      <div style={{ marginBottom: '1.5rem' }}>
        <Link
          to="/dashboard"
          style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '0.4rem',
            color: 'var(--text-muted)',
            fontSize: '0.875rem',
            marginBottom: '0.5rem',
          }}
        >
          <ArrowLeft size={14} /> Back to Dashboard
        </Link>
        <h1 style={{ fontSize: '1.85rem', marginBottom: '0.25rem' }}>Report a Community Challenge</h1>
        <p style={{ color: 'var(--text-muted)', fontSize: '0.95rem' }}>
          Document an issue in your locality to mobilize universities, industries, and municipal authorities.
        </p>
      </div>

      <div className="card" style={{ padding: '2.5rem', boxShadow: 'var(--shadow-md)' }}>
        {errorMessage && (
          <div className="alert alert-danger">
            <AlertCircle size={18} style={{ flexShrink: 0 }} />
            <span>{errorMessage}</span>
          </div>
        )}

        <form onSubmit={handleSubmit} noValidate>
          {/* Title */}
          <div className="form-group">
            <label className="form-label" htmlFor="prob-title">
              <FileText size={15} />
              <span>Problem Title</span>
              <span className="required">*</span>
            </label>
            <input
              id="prob-title"
              type="text"
              className="form-input"
              placeholder="e.g. Severely Damaged Culvert Causing Monsoon Flooding"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              required
            />
            <span className="form-hint">A clear, concise summary of the issue (5-150 characters).</span>
          </div>

          {/* Category & Priority Grid */}
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '1.25rem' }}>
            <div className="form-group">
              <label className="form-label" htmlFor="prob-category">
                <Tag size={15} />
                <span>Sector / Category</span>
                <span className="required">*</span>
              </label>
              <select
                id="prob-category"
                className="form-select"
                value={category}
                onChange={(e) => setCategory(e.target.value as Category)}
              >
                <option value="INFRASTRUCTURE">Infrastructure (Roads, Bridges, Water)</option>
                <option value="ENVIRONMENT">Environment & Ecology</option>
                <option value="EDUCATION">Education & Schools</option>
                <option value="HEALTHCARE">Public Healthcare & Clinics</option>
                <option value="SANITATION">Sanitation & Waste Management</option>
                <option value="PUBLIC_SAFETY">Public Safety & Streetlighting</option>
                <option value="OTHER">Other Community Need</option>
              </select>

              <div style={{ marginTop: '0.5rem', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', flexWrap: 'wrap' }}>
                <button
                  type="button"
                  id="btn-ai-classify"
                  onClick={handleAiClassify}
                  disabled={aiClassifying}
                  className="btn btn-outline btn-sm"
                  style={{
                    fontSize: '0.8rem',
                    padding: '0.35rem 0.65rem',
                    borderColor: 'var(--primary)',
                    color: 'var(--primary)',
                    display: 'inline-flex',
                    alignItems: 'center',
                    gap: '0.35rem',
                  }}
                >
                  <Sparkles size={13} />
                  {aiClassifying ? 'Analyzing with AI...' : 'Suggest Category with AI'}
                </button>
              </div>

              {aiError && (
                <div className="alert alert-warning" style={{ marginTop: '0.5rem', padding: '0.5rem 0.75rem', fontSize: '0.82rem' }}>
                  <AlertCircle size={15} style={{ flexShrink: 0 }} />
                  <span>{aiError}</span>
                </div>
              )}

              {aiSuggestion && (
                <div
                  style={{
                    marginTop: '0.65rem',
                    padding: '0.8rem',
                    background: 'var(--primary-light, #e3f2fd)',
                    border: '1px solid var(--primary, #1976D2)',
                    borderRadius: 'var(--radius-md, 8px)',
                  }}
                >
                  <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '0.5rem', marginBottom: '0.3rem' }}>
                    <span style={{ fontWeight: 600, color: 'var(--primary-dark, #0D47A1)', fontSize: '0.85rem', display: 'inline-flex', alignItems: 'center', gap: '0.3rem' }}>
                      <Sparkles size={14} /> AI Suggestion: {aiSuggestion.category}
                    </span>
                    {acceptedSuggestion ? (
                      <span style={{ color: '#2e7d32', fontWeight: 600, fontSize: '0.78rem', display: 'inline-flex', alignItems: 'center', gap: '0.2rem' }}>
                        <Check size={13} /> Applied
                      </span>
                    ) : (
                      <button
                        type="button"
                        id="btn-accept-category-suggestion"
                        onClick={handleAcceptSuggestion}
                        className="btn btn-primary btn-sm"
                        style={{ fontSize: '0.75rem', padding: '0.2rem 0.55rem' }}
                      >
                        Accept Suggestion
                      </button>
                    )}
                  </div>
                  <p style={{ margin: '0 0 0.35rem 0', color: 'var(--text-main)', fontSize: '0.8rem', lineHeight: 1.4 }}>
                    {aiSuggestion.reasoning}
                  </p>
                  <span style={{ fontSize: '0.7rem', color: 'var(--text-muted)' }}>
                    AI recommendation only. You can change the category above anytime. AI never saves the challenge.
                  </span>
                </div>
              )}
            </div>

            <div className="form-group">
              <label className="form-label" htmlFor="prob-priority">
                <Flag size={15} />
                <span>Urgency / Priority</span>
                <span className="required">*</span>
              </label>
              <select
                id="prob-priority"
                className="form-select"
                value={priority}
                onChange={(e) => setPriority(e.target.value as Priority)}
              >
                <option value="LOW">Low (Routine maintenance)</option>
                <option value="MEDIUM">Medium (Persistent disruption)</option>
                <option value="HIGH">High (Active danger or severe delay)</option>
                <option value="CRITICAL">Critical (Immediate life/safety emergency)</option>
              </select>
            </div>
          </div>

          {/* Location */}
          <div className="form-group">
            <label className="form-label" htmlFor="prob-location">
              <MapPin size={15} />
              <span>Location / Neighborhood Landmark</span>
              <span className="required">*</span>
            </label>
            <input
              id="prob-location"
              type="text"
              className="form-input"
              placeholder="e.g. Intersection of 4th Cross and Gandhi Nagar Main Road, Ward 15"
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              required
            />
            <span className="form-hint">Specify exact street, landmark, or municipal ward.</span>
          </div>

          {/* Description */}
          <div className="form-group">
            <label className="form-label" htmlFor="prob-description">
              <FileText size={15} />
              <span>Detailed Description of the Problem</span>
              <span className="required">*</span>
            </label>
            <textarea
              id="prob-description"
              rows={6}
              className="form-textarea"
              placeholder="Describe what is broken, how long the issue has persisted, how many residents are affected, and what has already been attempted..."
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              required
            />
            <span className="form-hint">Minimum 20 characters. Detailed reports attract faster university and industry solutions.</span>
          </div>

          <button
            type="submit"
            id="create-problem-submit"
            className="btn btn-primary btn-lg"
            style={{ width: '100%', marginTop: '1rem' }}
            disabled={loading}
          >
            {loading ? 'Submitting Challenge...' : 'Submit Challenge to Platform'}
            {!loading && <ArrowRight size={18} />}
          </button>
        </form>
      </div>
    </div>
  );
};
