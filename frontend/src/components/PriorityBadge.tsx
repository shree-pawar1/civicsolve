import React from 'react';
import { Priority } from '../types';
import { ArrowDown, ArrowRight, ArrowUp, AlertTriangle } from 'lucide-react';

interface Props {
  priority: Priority;
}

export const PriorityBadge: React.FC<Props> = ({ priority }) => {
  const norm = priority.toLowerCase();

  const getIcon = () => {
    switch (priority) {
      case 'LOW':
        return <ArrowDown size={12} />;
      case 'MEDIUM':
        return <ArrowRight size={12} />;
      case 'HIGH':
        return <ArrowUp size={12} />;
      case 'CRITICAL':
        return <AlertTriangle size={12} />;
      default:
        return null;
    }
  };

  return (
    <span className={`badge badge-${norm}`}>
      {getIcon()}
      <span>{priority}</span>
    </span>
  );
};
