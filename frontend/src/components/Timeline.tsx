import React from 'react';
import { ProgressUpdate } from '../types';
import { StatusBadge } from './StatusBadge';
import { Calendar, User, ArrowRight } from 'lucide-react';

interface Props {
  updates: ProgressUpdate[];
}

export const Timeline: React.FC<Props> = ({ updates }) => {
  if (!updates || updates.length === 0) {
    return (
      <div style={{ padding: '1rem', color: 'var(--text-muted)', fontSize: '0.9rem' }}>
        No status updates recorded yet.
      </div>
    );
  }

  return (
    <div style={{ position: 'relative', paddingLeft: '1.5rem', display: 'flex', flexDirection: 'column', gap: '1.5rem' }}>
      {/* Vertical Track Line */}
      <div
        style={{
          position: 'absolute',
          top: '12px',
          bottom: '12px',
          left: '7px',
          width: '2px',
          backgroundColor: 'var(--border-color)',
        }}
      />

      {updates.map((update, idx) => {
        const isTerminal = update.toStatus === 'RESOLVED' || update.toStatus === 'CLOSED';
        return (
          <div key={update.id || idx} style={{ position: 'relative' }}>
            {/* Timeline Dot */}
            <div
              style={{
                position: 'absolute',
                left: '-1.5rem',
                top: '4px',
                width: '16px',
                height: '16px',
                borderRadius: '50%',
                backgroundColor: isTerminal ? 'var(--color-success)' : 'var(--primary)',
                border: '3px solid #FFFFFF',
                boxShadow: '0 0 0 2px var(--border-color)',
              }}
            />

            <div
              style={{
                background: '#FFFFFF',
                border: '1px solid var(--border-color)',
                borderRadius: 'var(--radius-md)',
                padding: '1rem',
                boxShadow: 'var(--shadow-sm)',
              }}
            >
              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  flexWrap: 'wrap',
                  gap: '0.5rem',
                  marginBottom: '0.5rem',
                }}
              >
                <div style={{ display: 'flex', alignItems: 'center', gap: '0.5rem' }}>
                  {update.fromStatus !== update.toStatus ? (
                    <>
                      <StatusBadge status={update.fromStatus} />
                      <ArrowRight size={14} color="var(--text-muted)" />
                      <StatusBadge status={update.toStatus} />
                    </>
                  ) : (
                    <StatusBadge status={update.toStatus} />
                  )}
                </div>

                <div
                  style={{
                    display: 'flex',
                    alignItems: 'center',
                    gap: '0.75rem',
                    fontSize: '0.8rem',
                    color: 'var(--text-muted)',
                  }}
                >
                  <span style={{ display: 'flex', alignItems: 'center', gap: '0.25rem' }}>
                    <Calendar size={13} />
                    {new Date(update.createdAt).toLocaleString(undefined, {
                      dateStyle: 'medium',
                      timeStyle: 'short',
                    })}
                  </span>
                </div>
              </div>

              <p style={{ margin: '0.5rem 0', color: 'var(--text-main)', fontSize: '0.95rem' }}>
                {update.message}
              </p>

              <div
                style={{
                  display: 'flex',
                  alignItems: 'center',
                  gap: '0.5rem',
                  fontSize: '0.8rem',
                  color: 'var(--text-muted)',
                  borderTop: '1px solid #F1F5F9',
                  paddingTop: '0.5rem',
                  marginTop: '0.5rem',
                }}
              >
                <User size={13} />
                <span>
                  <strong>{update.author.fullName}</strong>
                  {update.author.organization ? ` (${update.author.organization})` : ''} —{' '}
                  <span style={{ textTransform: 'capitalize' }}>{update.author.role.toLowerCase()}</span>
                </span>
              </div>
            </div>
          </div>
        );
      })}
    </div>
  );
};
