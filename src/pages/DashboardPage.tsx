import React, { useMemo, useState } from 'react';
import { Link } from 'react-router-dom';
import {
  AlertTriangle,
  ArrowRight,
  BatteryCharging,
  CheckCircle2,
  ClipboardCheck,
  Radio,
  RefreshCw,
  Trash2,
} from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import { CampusBlueprintSvg } from '../components/illustrations/CampusMotifs';
import {
  EmptyState,
  FillMeter,
  KpiCard,
  PageHeader,
  Panel,
  StatusBadge,
  primaryBtnClass,
  secondaryBtnClass,
} from '../components/ui/Primitives';
import { useAuth } from '../features/auth/AuthContext';
import { useAppState } from '../features/campus/AppStateContext';
import { CollectionModal } from '../features/campus/BinModals';
import { formatRelativeTime, getBinStatus } from '../lib/formatters';
import type { Dustbin } from '../types/api';

export const DashboardPage: React.FC = () => {
  const { user } = useAuth();
  const {
    state,
    accessibleBins,
    loadingData,
    simulationRunning,
    setSimulationRunning,
    recordCollection,
    markAlertRead,
    reloadAll,
  } = useAppState();

  const [selectedMapBinId, setSelectedMapBinId] = useState<string | null>(
    accessibleBins[2]?.id || accessibleBins[0]?.id || null,
  );
  const [collectBin, setCollectBin] = useState<Dustbin | null>(null);

  const metrics = useMemo(() => {
    let fullCount = 0;
    let moderateCount = 0;
    let normalCount = 0;
    let offlineCount = 0;
    let batterySum = 0;

    for (const bin of accessibleBins) {
      const st = getBinStatus(bin, state.thresholds);
      if (st.short === 'Offline') offlineCount++;
      else if (st.short === 'Full') fullCount++;
      else if (st.short === 'Moderate') moderateCount++;
      else normalCount++;
      batterySum += bin.battery_level ?? 85;
    }

    const avgBattery = accessibleBins.length ? Math.round(batterySum / accessibleBins.length) : 0;
    const avgFill = accessibleBins.length
      ? Math.round(accessibleBins.reduce((sum, b) => sum + b.fill_percentage, 0) / accessibleBins.length)
      : 0;

    return { fullCount, moderateCount, normalCount, offlineCount, avgBattery, avgFill };
  }, [accessibleBins, state.thresholds]);

  const priorityBins = useMemo(
    () =>
      [...accessibleBins]
        .sort((a, b) => b.fill_percentage - a.fill_percentage)
        .slice(0, 6),
    [accessibleBins],
  );

  const zoneChartData = useMemo(() => {
    return accessibleBins.map(bin => {
      const st = getBinStatus(bin, state.thresholds);
      return {
        id: bin.id,
        zone: bin.campus_zone || bin.location_name,
        fill: bin.fill_percentage,
        color: st.hex,
      };
    });
  }, [accessibleBins, state.thresholds]);

  const unreadAlerts = useMemo(
    () => state.notifications.filter(n => !n.is_read).slice(0, 5),
    [state.notifications],
  );

  return (
    <div>
      <PageHeader
        eyebrow="VIT Bhopal · Real-Time Waste Grid"
        title="Campus Smart Bin Overview"
        subtitle="Live fill levels, solar battery status, and priority collection queue across university blocks."
        actions={
          <>
            <button
              type="button"
              onClick={() => setSimulationRunning(v => !v)}
              className={simulationRunning ? primaryBtnClass : secondaryBtnClass}
            >
              <Radio className={`w-4 h-4 ${simulationRunning ? 'animate-pulse' : ''}`} />
              <span>{simulationRunning ? 'Stop Live Sim' : 'Start Live Sim'}</span>
            </button>
            <button
              type="button"
              onClick={() => void reloadAll()}
              disabled={loadingData}
              className={secondaryBtnClass}
            >
              <RefreshCw className={`w-4 h-4 ${loadingData ? 'animate-spin' : ''}`} />
              <span>Sync</span>
            </button>
          </>
        }
      />

      {/* Top KPI Row */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 mb-6">
        <KpiCard
          label="Active Campus Bins"
          value={accessibleBins.length}
          meta={`${metrics.normalCount} normal · ${metrics.offlineCount} offline · Avg ${metrics.avgFill}% fill`}
          tone="forest"
          icon={<Trash2 className="w-4 h-4" />}
        />
        <KpiCard
          label="Full / Overflowing"
          value={metrics.fullCount}
          meta={`Above ${state.thresholds.moderateMax}% threshold — dispatch now`}
          tone="clay"
          icon={<AlertTriangle className="w-4 h-4" />}
        />
        <KpiCard
          label="Moderate Capacity"
          value={metrics.moderateCount}
          meta={`${state.thresholds.normalMax + 1}%–${state.thresholds.moderateMax}% · queue next shift`}
          tone="ochre"
          icon={<ClipboardCheck className="w-4 h-4" />}
        />
        <KpiCard
          label="Solar & Battery Health"
          value={`${metrics.avgBattery}%`}
          meta="6V 5W Solar + 3.7V Li-ion fleet average"
          tone="cedar"
          icon={<BatteryCharging className="w-4 h-4" />}
        />
      </div>

      {/* Main Asymmetric Split: Campus Map + Real-Time Fill Chart */}
      <div className="grid lg:grid-cols-12 gap-5 mb-6">
        <Panel
          className="lg:col-span-7"
          title="Campus Zone Map"
          subtitle="Live node telemetry across Academic Block, Library, Hostels, Food Court, and Sports Complex"
          action={
            <Link
              to="/campus-map"
              className="inline-flex items-center gap-1 text-xs font-medium text-forest hover:underline"
            >
              <span>Expand map</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
          bodyClassName="p-4"
        >
          <CampusBlueprintSvg
            bins={accessibleBins}
            thresholds={state.thresholds}
            selectedBinId={selectedMapBinId}
            onSelectBin={setSelectedMapBinId}
            compact
          />
        </Panel>

        <Panel
          className="lg:col-span-5"
          title="Live Fill Level by Bin"
          subtitle="HC-SR04 ultrasonic percentage across monitored nodes"
          bodyClassName="p-4"
        >
          <div className="h-[296px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneChartData} margin={{ top: 10, right: 12, left: -18, bottom: 4 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDD4C4" vertical={false} />
                <XAxis
                  dataKey="id"
                  tick={{ fontSize: 11, fill: '#564738', fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={{ stroke: '#D9D0BF' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  tick={{ fontSize: 11, fill: '#7D6E5D', fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                  unit="%"
                />
                <Tooltip
                  cursor={{ fill: '#EDE8DC', opacity: 0.5 }}
                  contentStyle={{
                    backgroundColor: '#FDFCF9',
                    border: '1px solid #C2B59E',
                    borderRadius: 4,
                    fontSize: 12,
                    color: '#1E241C',
                  }}
                  formatter={(value: number) => [`${value}%`, 'Fill Level']}
                />
                <Bar dataKey="fill" radius={[3, 3, 0, 0]} maxBarSize={34}>
                  {zoneChartData.map(entry => (
                    <Cell key={entry.id} fill={entry.color} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Bottom Split: Priority Collection Queue + Unread Alerts */}
      <div className="grid lg:grid-cols-12 gap-5">
        <Panel
          className="lg:col-span-8"
          title="Priority Collection Queue"
          subtitle="Sorted by ultrasonic fill level — confirm clearance directly to reset bin telemetry"
          action={
            <Link to="/bins" className="text-xs font-medium text-forest hover:underline inline-flex items-center gap-1">
              <span>All smart bins</span>
              <ArrowRight className="w-3.5 h-3.5" />
            </Link>
          }
          bodyClassName="p-0"
        >
          {priorityBins.length === 0 ? (
            <EmptyState
              title="No campus bins registered"
              description="Add your first ESP32 smart bin to start monitoring campus fill levels."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/50 text-[11px] font-mono uppercase tracking-wider text-soil">
                    <th className="py-2.5 px-4 font-medium">Bin</th>
                    <th className="py-2.5 px-4 font-medium">Zone</th>
                    <th className="py-2.5 px-4 font-medium">Fill Level</th>
                    <th className="py-2.5 px-4 font-medium">Battery</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                    <th className="py-2.5 px-4 font-medium text-right">Dispatch</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {priorityBins.map(bin => {
                    const st = getBinStatus(bin, state.thresholds);
                    return (
                      <tr key={bin.id} className="hover:bg-surface-hover/70 transition-colors">
                        <td className="py-3 px-4">
                          <div className="font-mono text-xs font-semibold text-ink">{bin.id}</div>
                          <div className="text-xs text-bark truncate max-w-[190px]">{bin.name}</div>
                        </td>
                        <td className="py-3 px-4 text-xs text-bark">
                          {bin.campus_zone || bin.location_name}
                        </td>
                        <td className="py-3 px-4">
                          <FillMeter value={bin.fill_percentage} tone={st.tone} />
                        </td>
                        <td className="py-3 px-4 font-mono text-xs tabular-nums text-bark">
                          {bin.battery_level ?? 85}%
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge tone={st.tone} dot>
                            {st.short}
                          </StatusBadge>
                        </td>
                        <td className="py-3 px-4 text-right">
                          <button
                            type="button"
                            onClick={() => setCollectBin(bin)}
                            className="px-2.5 py-1 text-xs font-medium rounded border border-forest-border bg-forest-soft text-forest hover:bg-forest hover:text-surface transition-colors cursor-pointer"
                          >
                            Collect
                          </button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        <Panel
          className="lg:col-span-4"
          title="Active Campus Alerts"
          subtitle="Unread threshold & hardware alerts"
          action={
            <Link to="/alerts" className="text-xs font-medium text-cedar hover:underline">
              View all
            </Link>
          }
          bodyClassName="p-0"
        >
          {unreadAlerts.length === 0 ? (
            <div className="p-8 text-center">
              <CheckCircle2 className="w-7 h-7 text-forest mx-auto mb-2" />
              <p className="text-sm font-medium text-ink">All alerts cleared</p>
              <p className="text-xs text-soil mt-0.5">Every active campus bin is within nominal bounds.</p>
            </div>
          ) : (
            <ul className="divide-y divide-border">
              {unreadAlerts.map(alert => (
                <li key={alert.id} className="p-4 space-y-1.5 hover:bg-surface-hover/50">
                  <div className="flex items-center justify-between gap-2">
                    <StatusBadge
                      tone={
                        alert.severity === 'Critical'
                          ? 'clay'
                          : alert.severity === 'High'
                            ? 'ochre'
                            : 'cedar'
                      }
                      dot
                    >
                      {alert.severity}
                    </StatusBadge>
                    <span className="font-mono text-[10px] text-soil">
                      {formatRelativeTime(alert.created_at)}
                    </span>
                  </div>
                  <p className="text-xs font-semibold text-ink">
                    {alert.dustbin_id} · {alert.alert_type}
                  </p>
                  <p className="text-xs text-bark leading-relaxed">{alert.message}</p>
                  <button
                    type="button"
                    onClick={() => markAlertRead(alert.id)}
                    className="text-[11px] font-medium text-forest hover:underline cursor-pointer"
                  >
                    Acknowledge
                  </button>
                </li>
              ))}
            </ul>
          )}
        </Panel>
      </div>

      <CollectionModal
        bin={collectBin}
        defaultStaffName={user?.full_name || 'Campus Crew'}
        onClose={() => setCollectBin(null)}
        onConfirm={recordCollection}
      />
    </div>
  );
};
