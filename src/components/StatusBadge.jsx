import React from 'react';
import { STATUS_THEME, ROOM_STATUSES } from '../utils/availability';

export default function StatusBadge({ status, size = 'md', className = '' }) {
  const currentStatus = status || ROOM_STATUSES.AVAILABLE;
  const theme = STATUS_THEME[currentStatus] || STATUS_THEME[ROOM_STATUSES.AVAILABLE];

  const sizeClasses = {
    sm: 'text-xs px-2 py-0.5 gap-1.5',
    md: 'text-xs px-2.5 py-1 gap-1.5 font-medium',
    lg: 'text-sm px-3 py-1.5 gap-2 font-medium',
  };

  const dotSizes = {
    sm: 'w-1.5 h-1.5',
    md: 'w-2 h-2',
    lg: 'w-2.5 h-2.5',
  };

  return (
    <span
      className={`inline-flex items-center rounded-full border shadow-sm transition-all ${theme.badgeClass} ${sizeClasses[size] || sizeClasses.md} ${className}`}
    >
      <span className={`rounded-full shrink-0 ${theme.dotClass} ${dotSizes[size] || dotSizes.md} animate-pulse`} />
      <span>{theme.label}</span>
    </span>
  );
}
