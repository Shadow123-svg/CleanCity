import React, { useMemo, useState } from 'react';
import {
  Bell,
  CheckCheck,
  Mail,
  MessageSquare,
  QrCode,
  Smartphone,
} from 'lucide-react';
import {
  EmptyState,
  FormField,
  PageHeader,
  Panel,
  StatusBadge,
  inputBaseClass,
  primaryBtnClass,
  secondaryBtnClass,
  selectBaseClass,
} from '../components/ui/Primitives';
import { useAppState } from '../features/campus/AppStateContext';
import { formatRelativeTime } from '../lib/formatters';
import type { QrIssueReport } from '../types/api';

export const AlertsPage: React.FC = () => {
  const {
    state,
    accessibleBins,
    markAlertRead,
    markAllAlertsRead,
    submitQrReport,
    resolveQrReport,
  } = useAppState();

  const [severityFilter, setSeverityFilter] = useState('All');
  const [qrBinId, setQrBinId] = useState(accessibleBins[0]?.id || 'BIN-003');
  const [qrRole, setQrRole] = useState<QrIssueReport['reporter_role']>('Student');
  const [qrType, setQrType] = useState<QrIssueReport['issue_type']>('Overflowing');
  const [qrComment, setQrComment] = useState('');

  const filteredAlerts = useMemo(() => {
    if (severityFilter === 'All') return state.notifications;
    return state.notifications.filter(n => n.severity === severityFilter);
  }, [state.notifications, severityFilter]);

  const handleQrSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    submitQrReport({
      dustbin_id: qrBinId,
      reporter_role: qrRole,
      issue_type: qrType,
      comment: qrComment,
    });
    setQrComment('');
  };

  return (
    <div>
      <PageHeader
        eyebrow="Alert & Notification Engine"
        title="Campus Alerts & QR Reporting"
        subtitle="Threshold breaches (>80% full, MQ-135 odor spikes, low solar battery) and student/staff QR issue reports."
        actions={
          <button type="button" onClick={markAllAlertsRead} className={secondaryBtnClass}>
            <CheckCheck className="w-4 h-4" />
            <span>Mark All Read</span>
          </button>
        }
      />

      {/* Alert Delivery Channels Matrix from Slide 4 */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3.5 mb-6">
        {[
          { icon: Mail, title: 'Email Digest', detail: 'Daily summary to Facilities Management Office', status: 'Configured' },
          { icon: MessageSquare, title: 'SMS Overflow Alerts', detail: 'Triggered immediately at >= 95% fill', status: 'Active Rule' },
          { icon: Bell, title: 'Campus Push Alerts', detail: 'WebSocket live toast & supervisor console', status: 'Live WS' },
          { icon: Smartphone, title: 'WhatsApp Crew Dispatch', detail: 'Zone route notifications to field staff', status: 'Webhook Ready' },
        ].map(ch => {
          const Icon = ch.icon;
          return (
            <div key={ch.title} className="bg-surface border border-border rounded-md p-4">
              <div className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-2 text-xs font-semibold text-ink">
                  <Icon className="w-4 h-4 text-forest" />
                  {ch.title}
                </span>
                <span className="font-mono text-[10px] text-cedar">{ch.status}</span>
              </div>
              <p className="text-xs text-bark mt-1.5">{ch.detail}</p>
            </div>
          );
        })}
      </div>

      <div className="grid lg:grid-cols-12 gap-5 items-start">
        {/* Alert Feed */}
        <Panel
          className="lg:col-span-7"
          title="Threshold & Hardware Alert Feed"
          action={
            <select
              value={severityFilter}
              onChange={e => setSeverityFilter(e.target.value)}
              className={selectBaseClass}
            >
              <option value="All">All Severities</option>
              <option value="Critical">Critical</option>
              <option value="High">High</option>
              <option value="Warning">Warning</option>
              <option value="Info">Info</option>
            </select>
          }
          bodyClassName="p-0"
        >
          {filteredAlerts.length === 0 ? (
            <EmptyState
              title="No alerts in this severity tier"
              description="All monitored VIT Bhopal smart bins are currently operating within safe parameters."
            />
          ) : (
            <ul className="divide-y divide-border">
              {filteredAlerts.map(alert => (
                <li
                  key={alert.id}
                  className={`p-4 flex items-start justify-between gap-4 ${
                    alert.is_read ? 'opacity-70 bg-canvas/40' : 'bg-surface'
                  }`}
                >
                  <div className="space-y-1">
                    <div className="flex flex-wrap items-center gap-2">
                      <StatusBadge
                        tone={
                          alert.severity === 'Critical'
                            ? 'clay'
                            : alert.severity === 'High'
                              ? 'ochre'
                              : alert.severity === 'Warning'
                                ? 'cedar'
                                : 'forest'
                        }
                        dot
                      >
                        {alert.severity}
                      </StatusBadge>
                      <span className="font-mono text-xs font-semibold text-ink">{alert.dustbin_id}</span>
                      <span className="text-xs text-soil">{alert.location}</span>
                      <span className="font-mono text-[10px] text-soil">
                        · {formatRelativeTime(alert.created_at)}
                      </span>
                    </div>
                    <p className="text-xs font-semibold text-ink">{alert.alert_type}</p>
                    <p className="text-xs text-bark leading-relaxed">{alert.message}</p>
                  </div>

                  {!alert.is_read && (
                    <button
                      type="button"
                      onClick={() => markAlertRead(alert.id)}
                      className="shrink-0 text-xs font-medium text-forest hover:underline cursor-pointer"
                    >
                      Mark read
                    </button>
                  )}
                </li>
              ))}
            </ul>
          )}
        </Panel>

        {/* Campus QR Issue Reporter (from Slide 4 mobile mockup) */}
        <div className="lg:col-span-5 space-y-4">
          <Panel
            title="Bin QR Issue Reporter"
            subtitle="Simulate a campus student/faculty scan from a smart bin QR sticker"
            action={<QrCode className="w-4 h-4 text-cedar" />}
          >
            <form onSubmit={handleQrSubmit} className="space-y-3.5">
              <div className="grid grid-cols-2 gap-3">
                <FormField label="Smart Bin">
                  <select
                    value={qrBinId}
                    onChange={e => setQrBinId(e.target.value)}
                    className={`${selectBaseClass} w-full`}
                  >
                    {accessibleBins.map(b => (
                      <option key={b.id} value={b.id}>
                        {b.id} ({b.campus_zone || b.location_name})
                      </option>
                    ))}
                  </select>
                </FormField>
                <FormField label="Reporter">
                  <select
                    value={qrRole}
                    onChange={e => setQrRole(e.target.value as QrIssueReport['reporter_role'])}
                    className={`${selectBaseClass} w-full`}
                  >
                    <option value="Student">Student</option>
                    <option value="Faculty">Faculty</option>
                    <option value="Staff">Staff</option>
                    <option value="Visitor">Visitor</option>
                  </select>
                </FormField>
              </div>

              <FormField label="Issue Type">
                <select
                  value={qrType}
                  onChange={e => setQrType(e.target.value as QrIssueReport['issue_type'])}
                  className={`${selectBaseClass} w-full`}
                >
                  <option value="Overflowing">Overflowing</option>
                  <option value="Odor Alert">Odor Alert</option>
                  <option value="Damaged Lid">Damaged Lid</option>
                  <option value="Sensor Issue">Sensor Issue</option>
                </select>
              </FormField>

              <FormField label="Observation">
                <textarea
                  rows={2}
                  value={qrComment}
                  onChange={e => setQrComment(e.target.value)}
                  placeholder="Optional details about bin condition…"
                  className={inputBaseClass}
                />
              </FormField>

              <button type="submit" className={`${primaryBtnClass} w-full`}>
                Submit Campus QR Report
              </button>
            </form>
          </Panel>

          <Panel title="Recent QR Tickets" bodyClassName="p-0">
            {(state.qrReports || []).length === 0 ? (
              <div className="p-6 text-center text-xs text-soil">No QR reports logged yet.</div>
            ) : (
              <ul className="divide-y divide-border text-xs">
                {(state.qrReports || []).slice(0, 6).map(rep => (
                  <li key={rep.id} className="p-3.5 flex items-start justify-between gap-3">
                    <div>
                      <div className="flex items-center gap-2">
                        <span className="font-mono font-semibold text-ink">{rep.dustbin_id}</span>
                        <StatusBadge tone={rep.resolved ? 'forest' : 'ochre'}>
                          {rep.resolved ? 'Resolved' : rep.issue_type}
                        </StatusBadge>
                      </div>
                      <p className="text-bark mt-1">{rep.comment}</p>
                      <p className="text-[11px] text-soil mt-0.5">
                        {rep.reporter_role} · {formatRelativeTime(rep.created_at)}
                      </p>
                    </div>
                    {!rep.resolved && (
                      <button
                        type="button"
                        onClick={() => resolveQrReport(rep.id)}
                        className="text-forest font-medium hover:underline shrink-0 cursor-pointer"
                      >
                        Resolve
                      </button>
                    )}
                  </li>
                ))}
              </ul>
            )}
          </Panel>
        </div>
      </div>
    </div>
  );
};
