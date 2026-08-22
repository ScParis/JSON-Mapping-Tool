import React from 'react';
import { Badge } from './Badge';

export interface PageHeaderProps {
  title: string;
  description: string;
  icon: React.ElementType;
  iconColor?: string;
  badge?: string;
  actions?: React.ReactNode;
}

export const PageHeader: React.FC<PageHeaderProps> = ({
  title,
  description,
  icon: Icon,
  iconColor = 'bg-gradient-to-br from-indigo-500 to-indigo-600',
  badge,
  actions,
}) => {
  return (
    <div className="flex flex-col md:flex-row md:items-center justify-between gap-4 pb-6 border-b border-zinc-200/80 dark:border-zinc-800/80 mb-6">
      <div className="flex items-start gap-4">
        <div className={`w-12 h-12 rounded-2xl ${iconColor} flex items-center justify-center text-white shadow-md shadow-indigo-500/20 flex-shrink-0 mt-0.5`}>
          <Icon className="w-6 h-6 text-white" />
        </div>
        <div className="space-y-1">
          <div className="flex items-center gap-3">
            <h1 className="text-2xl font-black tracking-tight text-zinc-900 dark:text-white">
              {title}
            </h1>
            {badge && <Badge variant="primary">{badge}</Badge>}
          </div>
          <p className="text-sm text-zinc-500 dark:text-zinc-400 max-w-3xl leading-relaxed">
            {description}
          </p>
        </div>
      </div>
      {actions && (
        <div className="flex items-center gap-2 flex-shrink-0 self-start md:self-center">
          {actions}
        </div>
      )}
    </div>
  );
};
