import React from 'react';
import { ProblemStatus, ReviewStatus } from '../types';
import { Clock, CheckCircle2, AlertCircle, PlayCircle, XCircle } from 'lucide-react';

interface Props {
  status: ProblemStatus | ReviewStatus | string;
  type?: 'problem' | 'solution';
}

export const StatusBadge: React.FC<Props> = ({ status, type = 'problem' }) => {
  const norm = status.toLowerCase();

  const getIcon = () => {
    switch (norm) {
      case 'submitted':
        return <Clock size={12} />;
      case 'under_review':
        return <AlertCircle size={12} />;
      case 'in_progress':
        return <PlayCircle size={12} />;
      case 'resolved':
      case 'accepted':
        return <CheckCircle2 size={12} />;
      case 'closed':
      case 'rejected':
        return <XCircle size={12} />;
      default:
        return null;
    }
  };

  const getLabel = () => {
    switch (norm) {
      case 'submitted':
        return 'Submitted';
      case 'under_review':
        return 'Under Review';
      case 'in_progress':
        return 'In Progress';
      case 'resolved':
        return 'Resolved';
      case 'closed':
        return 'Closed';
      case 'accepted':
        return 'Accepted';
      case 'rejected':
        return 'Rejected';
      default:
        return status;
    }
  };

  return (
    <span className={`badge badge-${norm}`}>
      {getIcon()}
      <span>{getLabel()}</span>
    </span>
  );
};
