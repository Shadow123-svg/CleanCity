import React, { useEffect, useState } from 'react';
import { Activity, Save } from 'lucide-react';
import {
  FormField,
  PageHeader,
  Panel,
  StatusBadge,
  inputBaseClass,
  primaryBtnClass,
  secondaryBtnClass,
} from '../components/ui/Primitives';
import { useAppState } from '../features/campus/AppStateContext';
import { formatShortDateTime } from '../lib/formatters';
import { stateService } from '../services/stateService';
import type { Thresholds } from '../types/api';

export const SettingsPage: React.FC = () => {
  const { state, updateThresholds } = useAppState();
  const [form, setForm] = useState<Thresholds>(state.thresholds);
  const [healthStatus, setHealthStatus] = useState<string>('Checking…');
  const [checkingHealth, setCheckingHealth] = useState(false);

  useEffect(() => {
    setForm(state.thresholds);
  }, [state.thresholds]);

  const checkApiHealth = async () => {
    setCheckingHealth(true);
    try {
      const res = await stateService.checkHealth();
      setHealthStatus(`Healthy (${res.status})`);
    } catch {
      setHealthStatus('Backend unreachable');
    } finally {
      setCheckingHealth(false);
    }
  };

  useEffect(() => {
    void checkApiHealth();
  }, []);

  const handleSave = (e: React.FormEvent) => {
    e.preventDefault();
    updateThresholds(form);
  };

  return (
    <div>
      <PageHeader
        eyebrow="System Calibration & Governance"
        title="Thresholds, Health & Audit Trail"
        subtitle="Configure ultrasonic fill bands, MQ-135 gas alerts, battery thresholds, and review system audit entries."
        actions={
          <button
            type="button"
            onClick={() => void checkApiHealth()}
            disabled={checkingHealth}
            className={secondaryBtnClass}
          >
            <Activity className="w-4 h-4" />
            <span>API Health: {healthStatus}</span>
          </button>
        }
      />

      <div className="grid lg:grid-cols-12 gap-5 items-start">
        <Panel
          className="lg:col-span-5"
          title="Campus Alert Thresholds"
          subtitle="Matches VIT Bhopal legend: Normal 0–50%, Moderate 51–80%, Full >80%"
        >
          <form onSubmit={handleSave} className="space-y-3.5">
            <div className="grid grid-cols-2 gap-3.5">
              <FormField label="Normal Max (%)">
                <input
                  type="number"
                  min={10}
                  max={75}
                  value={form.normalMax}
                  onChange={e => setForm(p => ({ ...p, normalMax: Number(e.target.value) }))}
                  className={`${inputBaseClass} font-mono`}
                />
              </FormField>
              <FormField label="Moderate Max (%)">
                <input
                  type="number"
                  min={50}
                  max={94}
                  value={form.moderateMax}
                  onChange={e => setForm(p => ({ ...p, moderateMax: Number(e.target.value) }))}
                  className={`${inputBaseClass} font-mono`}
                />
              </FormField>
              <FormField label="Urgent Overflow (%)">
                <input
                  type="number"
                  min={80}
                  max={100}
                  value={form.urgentMin}
                  onChange={e => setForm(p => ({ ...p, urgentMin: Number(e.target.value) }))}
                  className={`${inputBaseClass} font-mono`}
                />
              </FormField>
              <FormField label="Low Battery Alert (%)">
                <input
                  type="number"
                  min={5}
                  max={50}
                  value={form.lowBatteryThreshold ?? 25}
                  onChange={e => setForm(p => ({ ...p, lowBatteryThreshold: Number(e.target.value) }))}
                  className={`${inputBaseClass} font-mono`}
                />
              </FormField>
              <FormField label="Max Safe Gas (ppm)">
                <input
                  type="number"
                  min={150}
                  max={1000}
                  value={form.maxSafeGasPpm ?? 400}
                  onChange={e => setForm(p => ({ ...p, maxSafeGasPpm: Number(e.target.value) }))}
                  className={`${inputBaseClass} font-mono`}
                />
              </FormField>
              <FormField label="Max Safe Temp (°C)">
                <input
                  type="number"
                  min={35}
                  max={80}
                  value={form.maxSafeTemp}
                  onChange={e => setForm(p => ({ ...p, maxSafeTemp: Number(e.target.value) }))}
                  className={`${inputBaseClass} font-mono`}
                />
              </FormField>
            </div>

            <button type="submit" className={`${primaryBtnClass} w-full mt-2`}>
              <Save className="w-4 h-4" />
              <span>Save Thresholds</span>
            </button>
          </form>
        </Panel>

        <Panel
          className="lg:col-span-7"
          title="System Audit Trail"
          subtitle="Immutable log of sensor ingestions, clearances, and configuration changes"
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto max-h-[460px] overflow-y-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead className="sticky top-0 bg-surface-alt border-b border-border">
                <tr className="font-mono uppercase text-[10px] text-soil">
                  <th className="py-2.5 px-4">Time</th>
                  <th className="py-2.5 px-4">Actor</th>
                  <th className="py-2.5 px-4">Event</th>
                  <th className="py-2.5 px-4">Details</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {state.auditLogs.map(log => (
                  <tr key={log.id} className="hover:bg-surface-hover/50">
                    <td className="py-2.5 px-4 font-mono text-soil whitespace-nowrap">
                      {formatShortDateTime(log.created_at)}
                    </td>
                    <td className="py-2.5 px-4">
                      <span className="font-medium text-ink block">{log.user_name}</span>
                      <span className="text-[10px] font-mono text-soil">{log.role}</span>
                    </td>
                    <td className="py-2.5 px-4">
                      <StatusBadge tone="cedar">{log.action}</StatusBadge>
                    </td>
                    <td className="py-2.5 px-4 text-bark">{log.details}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </Panel>
      </div>
    </div>
  );
};
