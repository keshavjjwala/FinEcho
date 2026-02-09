import React from 'react';
import { LucideIcon } from 'lucide-react';
import { cn } from '@/lib/utils';

interface StatCardProps {
  title: string;
  value: number;
  icon: LucideIcon;
  variant?: 'default' | 'warning' | 'success' | 'info';
  subtitle?: string;
}

const variantStyles = {
  default: {
    icon: 'bg-primary/10 text-primary',
    border: 'border-border/50',
  },
  warning: {
    icon: 'bg-warning/10 text-warning',
    border: 'border-warning/20',
  },
  success: {
    icon: 'bg-success/10 text-success',
    border: 'border-success/20',
  },
  info: {
    icon: 'bg-info/10 text-info',
    border: 'border-info/20',
  },
};

const StatCard: React.FC<StatCardProps> = ({
  title,
  value,
  icon: Icon,
  variant = 'default',
  subtitle,
}) => {
  const styles = variantStyles[variant];

  return (
    <div className={cn('stat-card group hover:scale-105 transition-all duration-300 hover:shadow-elevated-lg', styles.border)}>
      <div className="flex items-start justify-between">
        <div className="space-y-1">
          <p className="text-sm font-medium text-muted-foreground">{title}</p>
          <p className="text-3xl font-bold text-foreground group-hover:scale-110 transition-transform duration-300">{value}</p>
          {subtitle && (
            <p className="text-xs text-muted-foreground">{subtitle}</p>
          )}
        </div>
        <div className={cn('flex h-12 w-12 items-center justify-center rounded-xl group-hover:scale-110 transition-transform duration-300', styles.icon)}>
          <Icon className="h-6 w-6" />
        </div>
      </div>
    </div>
  );
};

export default StatCard;
