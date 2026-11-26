import React, { useMemo } from 'react';
import { Download } from 'lucide-react';
import {
  Bar,
  BarChart,
  CartesianGrid,
  Cell,
  Pie,
  PieChart,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  PageHeader,
  Panel,
  StatusBadge,
  secondaryBtnClass,
} from '../components/ui/Primitives';
import { useAppState } from '../features/campus/AppStateContext';
import { downloadCsvFile, getBinStatus } from '../lib/formatters';
import { CLOUD_COST_COMPARISON, HARDWARE_BOM_ITEMS } from '../services/mockStore';

export const AnalyticsPage: React.FC = () => {
  const { state, accessibleBins } = useAppState();

  const statusDistribution = useMemo(() => {
    const counts = { Normal: 0, Moderate: 0, Full: 0, Offline: 0 };
    for (const bin of accessibleBins) {
      counts[getBinStatus(bin, state.thresholds).short]++;
    }
    return [
      { name: `Normal (0–${state.thresholds.normalMax}%)`, value: counts.Normal, color: '#244F34' },
      { name: `Moderate (${state.thresholds.normalMax + 1}–${state.thresholds.moderateMax}%)`, value: counts.Moderate, color: '#B26819' },
      { name: `Full (>${state.thresholds.moderateMax}%)`, value: counts.Full, color: '#A53526' },
      { name: 'Offline', value: counts.Offline, color: '#7D6E5D' },
    ].filter(item => item.value > 0);
  }, [accessibleBins, state.thresholds]);

  const zoneAverages = useMemo(() => {
    const grouped = new Map<string, { sum: number; count: number }>();
    for (const bin of accessibleBins) {
      const zone = bin.campus_zone || bin.location_name;
      const entry = grouped.get(zone) || { sum: 0, count: 0 };
      entry.sum += bin.fill_percentage;
      entry.count += 1;
      grouped.set(zone, entry);
    }
    return Array.from(grouped.entries()).map(([zone, v]) => ({
      zone: zone.replace('Cafeteria & ', '').replace(' & Admin', ''),
      avgFill: Math.round(v.sum / v.count),
      bins: v.count,
    }));
  }, [accessibleBins]);

  const totalBomCost = HARDWARE_BOM_ITEMS.reduce((acc, item) => acc + item.costInr, 0);

  const handleExportReport = () => {
    downloadCsvFile(
      `vit-bhopal-smartbin-report-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Bin ID', 'Name', 'Campus Zone', 'Category', 'Fill %', 'Weight (kg)', 'Gas (ppm)', 'Temp (°C)', 'Battery %', 'Sensor Status'],
      accessibleBins.map(b => [
        b.id,
        b.name,
        b.campus_zone || b.location_name,
        b.waste_category,
        b.fill_percentage,
        b.weight,
        b.gas_ppm ?? '',
        b.temperature,
        b.battery_level ?? '',
        b.sensor_status,
      ]),
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Analytics & Deployment Economics"
        title="Campus Telemetry & Scaling Reports"
        subtitle="Real-time fill analytics alongside hardware BOM (₹3,750/unit) and 300-bin university cloud budget."
        actions={
          <button type="button" onClick={handleExportReport} className={secondaryBtnClass}>
            <Download className="w-4 h-4" />
            <span>Export Fleet CSV</span>
          </button>
        }
      />

      {/* Charts Row */}
      <div className="grid lg:grid-cols-12 gap-5 mb-6">
        <Panel
          className="lg:col-span-5"
          title="Fill Level Distribution"
          subtitle="Live classification across campus smart bins"
        >
          <div className="h-60 w-full">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={statusDistribution}
                  dataKey="value"
                  nameKey="name"
                  cx="50%"
                  cy="50%"
                  innerRadius={52}
                  outerRadius={82}
                  paddingAngle={2}
                >
                  {statusDistribution.map(item => (
                    <Cell key={item.name} fill={item.color} />
                  ))}
                </Pie>
                <Tooltip
                  contentStyle={{
                    backgroundColor: '#FDFCF9',
                    border: '1px solid #C2B59E',
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>
          <div className="grid grid-cols-2 gap-2 pt-3 border-t border-border text-xs">
            {statusDistribution.map(item => (
              <div key={item.name} className="flex items-center justify-between gap-2">
                <span className="inline-flex items-center gap-1.5 text-bark truncate">
                  <span className="w-2.5 h-2.5 rounded-sm shrink-0" style={{ backgroundColor: item.color }} />
                  <span className="truncate">{item.name}</span>
                </span>
                <span className="font-mono font-semibold text-ink">{item.value}</span>
              </div>
            ))}
          </div>
        </Panel>

        <Panel
          className="lg:col-span-7"
          title="Average Fill by Campus Zone"
          subtitle="Identifies peak footfall zones requiring two-shift housekeeping schedules"
        >
          <div className="h-[290px] w-full">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart data={zoneAverages} margin={{ top: 10, right: 16, left: -18, bottom: 8 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#DDD4C4" vertical={false} />
                <XAxis
                  dataKey="zone"
                  tick={{ fontSize: 11, fill: '#564738' }}
                  axisLine={{ stroke: '#D9D0BF' }}
                  tickLine={false}
                />
                <YAxis
                  domain={[0, 100]}
                  unit="%"
                  tick={{ fontSize: 11, fill: '#7D6E5D', fontFamily: 'JetBrains Mono, monospace' }}
                  axisLine={false}
                  tickLine={false}
                />
                <Tooltip
                  cursor={{ fill: '#EDE8DC', opacity: 0.5 }}
                  contentStyle={{
                    backgroundColor: '#FDFCF9',
                    border: '1px solid #C2B59E',
                    borderRadius: 4,
                    fontSize: 12,
                  }}
                />
                <Bar dataKey="avgFill" name="Avg Fill %" fill="#7A4B2A" radius={[3, 3, 0, 0]} maxBarSize={42} />
              </BarChart>
            </ResponsiveContainer>
          </div>
        </Panel>
      </div>

      {/* Hardware BOM & Cloud Cost Tables (Smart Bin.pptx Slides 3 & 5) */}
      <div className="grid lg:grid-cols-12 gap-5 items-start">
        <Panel
          className="lg:col-span-7"
          title="Hardware BOM — 1 Set (Academic Block 120L Smart Bin)"
          subtitle="Reference unit specification from VIT Bhopal hardware blueprint"
          action={<StatusBadge tone="forest">Total: ₹{totalBomCost.toLocaleString('en-IN')} / unit</StatusBadge>}
          bodyClassName="p-0"
        >
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-xs">
              <thead>
                <tr className="border-b border-border bg-surface-alt/55 font-mono uppercase text-[10px] text-soil">
                  <th className="py-2 px-4">#</th>
                  <th className="py-2 px-4">Component</th>
                  <th className="py-2 px-4">Qty</th>
                  <th className="py-2 px-4 text-right">Est. Cost (₹)</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {HARDWARE_BOM_ITEMS.map(item => (
                  <tr key={item.sno} className="hover:bg-surface-hover/50">
                    <td className="py-2.5 px-4 font-mono text-soil">{item.sno}</td>
                    <td className="py-2.5 px-4">
                      <span className="font-medium text-ink block">{item.component}</span>
                      <span className="text-[11px] text-soil">{item.spec}</span>
                    </td>
                    <td className="py-2.5 px-4 font-mono text-bark">{item.quantity}</td>
                    <td className="py-2.5 px-4 font-mono text-right text-ink tabular-nums">
                      {item.costInr === 0 ? 'Included' : `₹${item.costInr.toLocaleString('en-IN')}`}
                    </td>
                  </tr>
                ))}
              </tbody>
              <tfoot>
                <tr className="bg-forest-soft/60 border-t border-forest-border font-semibold">
                  <td colSpan={3} className="py-2.5 px-4 text-forest">
                    Total Approximate Hardware Cost (1 Smart Bin Unit)
                  </td>
                  <td className="py-2.5 px-4 text-right font-mono text-forest">
                    ₹{totalBomCost.toLocaleString('en-IN')}
                  </td>
                </tr>
              </tfoot>
            </table>
          </div>
        </Panel>

        <Panel
          className="lg:col-span-5"
          title="Cloud Scaling Budget (300 Campus Bins)"
          subtitle="Annual platform estimate for telemetry storage, dashboards & REST API"
          bodyClassName="p-0"
        >
          <div className="divide-y divide-border">
            {CLOUD_COST_COMPARISON.map(tier => (
              <div
                key={tier.provider}
                className={`p-4 ${tier.recommended ? 'bg-forest-soft/45' : 'bg-surface'}`}
              >
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="text-sm font-semibold text-ink">{tier.provider}</h3>
                      {tier.recommended && <StatusBadge tone="forest">Recommended</StatusBadge>}
                    </div>
                    <p className="text-[11px] font-mono text-soil mt-0.5">{tier.stack}</p>
                  </div>
                  <span className="font-mono text-xs font-semibold text-cedar shrink-0">
                    {tier.annualCostRange}
                  </span>
                </div>
                <p className="text-xs text-bark mt-2">{tier.remarks}</p>
              </div>
            ))}
          </div>
        </Panel>
      </div>
    </div>
  );
};
