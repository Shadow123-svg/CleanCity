import type { Dustbin, Thresholds } from '../types/api';

let idCounter = 0;

export function createClientId(prefix: string): string {
  idCounter = (idCounter + 1) % 10000;
  return `${prefix}-${Date.now().toString(36).toUpperCase()}${idCounter.toString(36).padStart(2, '0').toUpperCase()}`;
}

export type BinTone = 'forest' | 'ochre' | 'clay' | 'soil';

export interface BinVisualStatus {
  label: string;
  short: 'Normal' | 'Moderate' | 'Full' | 'Offline';
  tone: BinTone;
  hex: string;
  priorityText: string;
}

export function getBinStatus(bin: Dustbin, thresholds: Thresholds): BinVisualStatus {
  if (bin.sensor_status === 'offline' || bin.operational_status !== 'Active') {
    return {
      label: 'Offline / Maintenance',
      short: 'Offline',
      tone: 'soil',
      hex: '#7D6E5D',
      priorityText: 'Node inspection needed',
    };
  }
  if (bin.fill_percentage > thresholds.moderateMax) {
    const isUrgent = bin.fill_percentage >= thresholds.urgentMin;
    return {
      label: isUrgent ? 'Overflowing' : 'Full · High Priority',
      short: 'Full',
      tone: 'clay',
      hex: '#A53526',
      priorityText: isUrgent
        ? `Immediate dispatch (>= ${thresholds.urgentMin}%)`
        : `Scheduled priority (> ${thresholds.moderateMax}%)`,
    };
  }
  if (bin.fill_percentage > thresholds.normalMax) {
    return {
      label: 'Moderate',
      short: 'Moderate',
      tone: 'ochre',
      hex: '#B26819',
      priorityText: `Approaching capacity (${thresholds.normalMax + 1}–${thresholds.moderateMax}%)`,
    };
  }
  return {
    label: 'Normal',
    short: 'Normal',
    tone: 'forest',
    hex: '#244F34',
    priorityText: `Healthy (0–${thresholds.normalMax}%)`,
  };
}

export function formatRelativeTime(iso: string): string {
  if (!iso) return '—';
  const parsed = new Date(iso).getTime();
  if (Number.isNaN(parsed)) return iso;
  const diffMin = Math.floor((Date.now() - parsed) / 60_000);
  if (diffMin < 1) return 'Just now';
  if (diffMin < 60) return `${diffMin}m ago`;
  const diffHr = Math.floor(diffMin / 60);
  if (diffHr < 24) return `${diffHr}h ago`;
  const diffDay = Math.floor(diffHr / 24);
  return `${diffDay}d ago`;
}

export function formatShortDateTime(iso: string): string {
  if (!iso) return '—';
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) return iso;
  return date.toLocaleString('en-IN', {
    day: '2-digit',
    month: 'short',
    hour: '2-digit',
    minute: '2-digit',
    hour12: true,
  });
}

export function escapeCsvCell(value: unknown): string {
  const str = String(value ?? '').replace(/"/g, '""');
  return `"${str}"`;
}

export function downloadCsvFile(filename: string, headers: string[], rows: unknown[][]): void {
  const lines = [
    headers.map(escapeCsvCell).join(','),
    ...rows.map(row => row.map(escapeCsvCell).join(',')),
  ];
  const blob = new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.href = url;
  link.download = filename;
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}
