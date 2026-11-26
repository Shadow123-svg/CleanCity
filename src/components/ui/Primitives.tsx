import React from 'react';
import { X } from 'lucide-react';
import { CampusHouseLineArt, LeafSprig } from '../illustrations/CampusMotifs';
import type { BinTone } from '../../lib/formatters';

export const inputBaseClass =
  'w-full px-3 py-2 text-sm bg-surface border border-border rounded text-ink placeholder:text-soil/70 focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors disabled:opacity-60 disabled:bg-surface-alt';

export const selectBaseClass =
  'px-3 py-2 text-sm bg-surface border border-border rounded text-ink focus:outline-none focus:border-forest focus:ring-1 focus:ring-forest transition-colors';

export const primaryBtnClass =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded bg-forest text-surface hover:bg-forest-hover active:bg-forest-hover transition-colors disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer';

export const secondaryBtnClass =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded bg-surface border border-border text-ink hover:bg-surface-alt transition-colors disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer';

export const cedarBtnClass =
  'inline-flex items-center justify-center gap-1.5 px-3.5 py-2 text-sm font-medium rounded bg-cedar text-surface hover:bg-cedar-hover transition-colors disabled:opacity-55 disabled:cursor-not-allowed cursor-pointer';

export const PageHeader: React.FC<{
  title: string;
  subtitle?: string;
  eyebrow?: string;
  actions?: React.ReactNode;
}> = ({ title, subtitle, eyebrow, actions }) => (
  <div className="flex flex-wrap items-end justify-between gap-4 pb-5 mb-6 border-b border-border">
    <div>
      {eyebrow && (
        <div className="flex items-center gap-1.5 text-[11px] font-mono uppercase tracking-wider text-cedar mb-1">
          <LeafSprig className="w-3.5 h-3.5 text-leaf" />
          <span>{eyebrow}</span>
        </div>
      )}
      <h1 className="text-2xl font-semibold tracking-tight text-ink leading-tight">{title}</h1>
      {subtitle && <p className="text-sm text-bark mt-1">{subtitle}</p>}
    </div>
    {actions && <div className="flex flex-wrap items-center gap-2">{actions}</div>}
  </div>
);

const toneMap: Record<BinTone | 'cedar', string> = {
  forest: 'bg-forest-soft text-forest border-forest-border',
  ochre: 'bg-ochre-soft text-ochre border-ochre-border',
  clay: 'bg-clay-soft text-clay border-clay-border',
  soil: 'bg-surface-alt text-bark border-border-strong',
  cedar: 'bg-cedar-soft text-cedar border-cedar-border',
};

export const StatusBadge: React.FC<{
  tone?: BinTone | 'cedar';
  dot?: boolean;
  children: React.ReactNode;
}> = ({ tone = 'soil', dot = false, children }) => {
  const dotColor: Record<BinTone | 'cedar', string> = {
    forest: 'bg-forest',
    ochre: 'bg-ochre',
    clay: 'bg-clay',
    soil: 'bg-soil',
    cedar: 'bg-cedar',
  };

  return (
    <span
      className={`inline-flex items-center gap-1.5 px-2 py-0.5 text-[11px] font-medium rounded border ${toneMap[tone]}`}
    >
      {dot && <span className={`w-1.5 h-1.5 rounded-full ${dotColor[tone]}`} />}
      {children}
    </span>
  );
};

export const Panel: React.FC<{
  title?: string;
  subtitle?: string;
  action?: React.ReactNode;
  className?: string;
  bodyClassName?: string;
  children: React.ReactNode;
}> = ({ title, subtitle, action, className = '', bodyClassName = 'p-5', children }) => (
  <section className={`bg-surface border border-border rounded-md ${className}`}>
    {(title || action) && (
      <div className="flex flex-wrap items-center justify-between gap-3 px-5 py-3.5 border-b border-border bg-surface-alt/35">
        <div>
          {title && <h2 className="text-base font-semibold text-ink tracking-tight">{title}</h2>}
          {subtitle && <p className="text-xs text-soil mt-0.5">{subtitle}</p>}
        </div>
        {action}
      </div>
    )}
    <div className={bodyClassName}>{children}</div>
  </section>
);

export const KpiCard: React.FC<{
  label: string;
  value: string | number;
  meta?: string;
  tone?: BinTone | 'cedar';
  icon?: React.ReactNode;
}> = ({ label, value, meta, tone = 'forest', icon }) => {
  const accentBar: Record<BinTone | 'cedar', string> = {
    forest: 'border-t-forest',
    ochre: 'border-t-ochre',
    clay: 'border-t-clay',
    soil: 'border-t-soil',
    cedar: 'border-t-cedar',
  };

  return (
    <div className={`bg-surface border border-border border-t-2 ${accentBar[tone]} rounded-md px-4 py-3.5`}>
      <div className="flex items-center justify-between gap-2">
        <span className="text-[11px] font-mono uppercase tracking-wider text-soil">{label}</span>
        {icon && <span className="text-bark/75">{icon}</span>}
      </div>
      <div className="mt-2 flex items-baseline justify-between gap-2">
        <span className="text-2xl font-semibold font-mono tabular-nums text-ink">{value}</span>
      </div>
      {meta && <p className="text-xs text-bark mt-1">{meta}</p>}
    </div>
  );
};

export const FormField: React.FC<{
  label: string;
  htmlFor?: string;
  error?: string;
  hint?: string;
  required?: boolean;
  children: React.ReactNode;
}> = ({ label, htmlFor, error, hint, required, children }) => (
  <div className="space-y-1">
    <label htmlFor={htmlFor} className="block text-xs font-medium text-bark">
      {label}
      {required && <span className="text-clay ml-0.5">*</span>}
    </label>
    {children}
    {error ? (
      <p className="text-xs text-clay">{error}</p>
    ) : hint ? (
      <p className="text-[11px] text-soil">{hint}</p>
    ) : null}
  </div>
);

export const FillMeter: React.FC<{ value: number; tone: BinTone; showLabel?: boolean }> = ({
  value,
  tone,
  showLabel = true,
}) => {
  const barColors: Record<BinTone, string> = {
    forest: 'bg-forest',
    ochre: 'bg-ochre',
    clay: 'bg-clay',
    soil: 'bg-soil',
  };

  const clamped = Math.max(0, Math.min(100, Math.round(value)));
  return (
    <div className="flex items-center gap-2.5 min-w-[100px]">
      <div className="flex-1 h-2 bg-surface-alt rounded-sm overflow-hidden border border-border/60">
        <div className={`h-full transition-all duration-300 ${barColors[tone]}`} style={{ width: `${clamped}%` }} />
      </div>
      {showLabel && <span className="font-mono text-xs font-medium tabular-nums text-ink w-9 text-right">{clamped}%</span>}
    </div>
  );
};

export const EmptyState: React.FC<{
  title: string;
  description: string;
  action?: React.ReactNode;
}> = ({ title, description, action }) => (
  <div className="py-12 px-6 text-center flex flex-col items-center">
    <CampusHouseLineArt className="w-32 h-20 opacity-85 mb-3" />
    <h3 className="text-base font-semibold text-ink font-editorial">{title}</h3>
    <p className="text-sm text-bark mt-1 max-w-md">{description}</p>
    {action && <div className="mt-4">{action}</div>}
  </div>
);

export const Modal: React.FC<{
  open: boolean;
  title: string;
  subtitle?: string;
  onClose: () => void;
  children: React.ReactNode;
  maxWidthClass?: string;
}> = ({ open, title, subtitle, onClose, children, maxWidthClass = 'max-w-xl' }) => {
  if (!open) return null;
  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink/45"
      role="dialog"
      aria-modal="true"
      onMouseDown={e => {
        if (e.target === e.currentTarget) onClose();
      }}
    >
      <div className={`w-full ${maxWidthClass} bg-surface border border-border-strong rounded-md overflow-hidden`}>
        <div className="flex items-start justify-between gap-4 px-5 py-4 border-b border-border bg-surface-alt/50">
          <div>
            <h2 className="text-lg font-semibold text-ink leading-snug">{title}</h2>
            {subtitle && <p className="text-xs text-bark mt-0.5">{subtitle}</p>}
          </div>
          <button
            type="button"
            onClick={onClose}
            className="p-1 rounded text-soil hover:text-ink hover:bg-surface-alt cursor-pointer"
            aria-label="Close modal"
          >
            <X className="w-4 h-4" />
          </button>
        </div>
        <div className="p-5 max-h-[80vh] overflow-y-auto">{children}</div>
      </div>
    </div>
  );
};
