import React from 'react';
import './GlassCard.css';

interface GlassCardProps {
  children: React.ReactNode;
  className?: string;
  hoverable?: boolean;
  large?: boolean;
}

export default function GlassCard({
  children,
  className = '',
  hoverable = false,
  large = false,
}: GlassCardProps) {
  const classes = [
    'glass-card',
    hoverable && 'glass-card--hoverable',
    large && 'glass-card--lg',
    className,
  ]
    .filter(Boolean)
    .join(' ');

  return <div className={classes}>{children}</div>;
}
