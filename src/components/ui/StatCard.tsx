import React from 'react';
import * as LucideIcons from 'lucide-react';

interface StatCardProps {
  title?: string;
  label?: string;
  value: string | number;
  subtitle?: string;
  subtext?: string;
  iconName?: keyof typeof LucideIcons;
  icon?: React.ReactNode;
  trend?: {
    value: string;
    isPositive?: boolean;
  };
  highlightColor?: string;
}

export default function StatCard({
  title,
  label,
  value,
  subtitle,
  subtext,
  iconName = 'Activity',
  icon,
  trend,
  highlightColor = 'border-l-[#6D28D9]',
}: StatCardProps) {
  const displayTitle = title || label || '';
  const displaySubtitle = subtitle || subtext || '';

  // Dynamically resolve icon
  const IconComponent = (LucideIcons[iconName] as React.ComponentType<{ className?: string }>) || LucideIcons.Activity;

  return (
    <div
      className={`ivr-card p-5 border-l-4 ${highlightColor} bg-white flex flex-col justify-between relative overflow-hidden`}
    >
      <div className="flex items-start justify-between">
        <div>
          <p className="text-xs font-semibold uppercase tracking-wider text-slate-500 mb-1">{displayTitle}</p>
          <h3 className="text-2xl font-bold tracking-tight text-slate-900">{value}</h3>
        </div>
        <div className="w-10 h-10 rounded-lg bg-purple-50 text-[#6D28D9] flex items-center justify-center shrink-0 border border-purple-100">
          {icon ? icon : <IconComponent className="w-5 h-5" />}
        </div>
      </div>

      {(displaySubtitle || trend) && (
        <div className="mt-3 pt-3 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
          {displaySubtitle && <span>{displaySubtitle}</span>}
          {trend && (
            <span
              className={`font-semibold inline-flex items-center gap-1 ${
                trend.isPositive ? 'text-emerald-600' : 'text-amber-600'
              }`}
            >
              {trend.value}
            </span>
          )}
        </div>
      )}
    </div>
  );
}
