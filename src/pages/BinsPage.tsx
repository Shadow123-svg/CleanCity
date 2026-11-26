import React, { useMemo, useState } from 'react';
import {
  BatteryCharging,
  ClipboardCheck,
  Edit3,
  Plus,
  Search,
  Sun,
  Thermometer,
  Trash2,
  Wifi,
  WifiOff,
  Wind,
} from 'lucide-react';
import {
  Area,
  AreaChart,
  CartesianGrid,
  ResponsiveContainer,
  Tooltip,
  XAxis,
  YAxis,
} from 'recharts';
import {
  EmptyState,
  FillMeter,
  PageHeader,
  Panel,
  StatusBadge,
  inputBaseClass,
  primaryBtnClass,
  secondaryBtnClass,
  selectBaseClass,
} from '../components/ui/Primitives';
import { useAuth } from '../features/auth/AuthContext';
import { useAppState } from '../features/campus/AppStateContext';
import { BinFormModal, CollectionModal } from '../features/campus/BinModals';
import { formatRelativeTime, getBinStatus } from '../lib/formatters';
import type { Dustbin } from '../types/api';

export const BinsPage: React.FC = () => {
  const { user } = useAuth();
  const {
    state,
    accessibleBins,
    users,
    upsertDustbin,
    deleteDustbin,
    recordCollection,
  } = useAppState();

  const [query, setQuery] = useState('');
  const [zoneFilter, setZoneFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedBinId, setSelectedBinId] = useState<string | null>(accessibleBins[0]?.id || null);

  const [showFormModal, setShowFormModal] = useState(false);
  const [editingBin, setEditingBin] = useState<Dustbin | null>(null);
  const [collectBin, setCollectBin] = useState<Dustbin | null>(null);

  const zones = useMemo(
    () => Array.from(new Set(accessibleBins.map(b => b.campus_zone || b.location_name))).sort(),
    [accessibleBins],
  );

  const filteredBins = useMemo(() => {
    const q = query.trim().toLowerCase();
    return accessibleBins
      .filter(bin => {
        if (q) {
          const hay = `${bin.id} ${bin.name} ${bin.location_name} ${bin.waste_category}`.toLowerCase();
          if (!hay.includes(q)) return false;
        }
        if (zoneFilter !== 'All' && (bin.campus_zone || bin.location_name) !== zoneFilter) return false;
        if (statusFilter !== 'All') {
          const st = getBinStatus(bin, state.thresholds).short;
          if (st !== statusFilter) return false;
        }
        return true;
      })
      .sort((a, b) => b.fill_percentage - a.fill_percentage);
  }, [accessibleBins, query, zoneFilter, statusFilter, state.thresholds]);

  const selectedBin = useMemo(
    () => filteredBins.find(b => b.id === selectedBinId) || filteredBins[0] || null,
    [filteredBins, selectedBinId],
  );

  const selectedHistory = useMemo(() => {
    if (!selectedBin) return [];
    return state.sensorHistory
      .filter(r => r.dustbin_id === selectedBin.id)
      .slice(-12)
      .map(r => ({
        time: new Date(r.recorded_at).toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' }),
        fill: r.fill_percentage,
        gas: r.gas_ppm ?? 120,
      }));
  }, [state.sensorHistory, selectedBin]);

  const canManageBins = user?.role !== 'Field Staff';

  return (
    <div>
      <PageHeader
        eyebrow="Campus Hardware Fleet"
        title="Smart Bins & Telemetry"
        subtitle="Inspect HC-SR04 fill percentage, MQ-135 odor ppm, DHT22 climate, and 6V solar battery state per node."
        actions={
          canManageBins ? (
            <button
              type="button"
              onClick={() => {
                setEditingBin(null);
                setShowFormModal(true);
              }}
              className={primaryBtnClass}
            >
              <Plus className="w-4 h-4" />
              <span>Register Smart Bin</span>
            </button>
          ) : undefined
        }
      />

      {/* Filter Bar */}
      <div className="bg-surface border border-border rounded-md p-3.5 mb-5 flex flex-wrap items-center gap-3">
        <div className="relative flex-1 min-w-[210px]">
          <Search className="w-4 h-4 text-soil absolute left-3 top-1/2 -translate-y-1/2" />
          <input
            type="text"
            placeholder="Search by Bin ID, building, or waste type…"
            value={query}
            onChange={e => setQuery(e.target.value)}
            className={`${inputBaseClass} pl-9`}
          />
        </div>
        <select value={zoneFilter} onChange={e => setZoneFilter(e.target.value)} className={selectBaseClass}>
          <option value="All">All Campus Zones</option>
          {zones.map(z => (
            <option key={z} value={z}>
              {z}
            </option>
          ))}
        </select>
        <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={selectBaseClass}>
          <option value="All">All Statuses</option>
          <option value="Full">Full (&gt;{state.thresholds.moderateMax}%)</option>
          <option value="Moderate">Moderate</option>
          <option value="Normal">Normal</option>
          <option value="Offline">Offline</option>
        </select>
      </div>

      {/* Master-Detail Split Layout */}
      <div className="grid xl:grid-cols-12 gap-5 items-start">
        <Panel className="xl:col-span-7" bodyClassName="p-0">
          {filteredBins.length === 0 ? (
            <EmptyState
              title="No matching smart bins"
              description="Try clearing your zone or status filters to view all deployed campus units."
            />
          ) : (
            <div className="overflow-x-auto">
              <table className="w-full text-left border-collapse">
                <thead>
                  <tr className="border-b border-border bg-surface-alt/55 text-[11px] font-mono uppercase tracking-wider text-soil">
                    <th className="py-2.5 px-4 font-medium">Bin Node</th>
                    <th className="py-2.5 px-4 font-medium">Fill</th>
                    <th className="py-2.5 px-4 font-medium">Battery</th>
                    <th className="py-2.5 px-4 font-medium">Wi-Fi</th>
                    <th className="py-2.5 px-4 font-medium">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-border text-sm">
                  {filteredBins.map(bin => {
                    const st = getBinStatus(bin, state.thresholds);
                    const isSelected = selectedBin?.id === bin.id;
                    return (
                      <tr
                        key={bin.id}
                        onClick={() => setSelectedBinId(bin.id)}
                        className={`cursor-pointer transition-colors ${
                          isSelected ? 'bg-forest-soft/65' : 'hover:bg-surface-hover/70'
                        }`}
                      >
                        <td className="py-3 px-4">
                          <div className="flex items-center gap-2">
                            <span className="font-mono text-xs font-semibold text-ink">{bin.id}</span>
                            <span className="text-[11px] px-1.5 py-0.5 rounded bg-surface-alt text-bark">
                              {bin.waste_category}
                            </span>
                          </div>
                          <p className="text-xs text-bark mt-0.5">{bin.name}</p>
                        </td>
                        <td className="py-3 px-4">
                          <FillMeter value={bin.fill_percentage} tone={st.tone} />
                        </td>
                        <td className="py-3 px-4 font-mono text-xs tabular-nums text-bark">
                          {bin.battery_level ?? 85}%
                        </td>
                        <td className="py-3 px-4">
                          {bin.sensor_status === 'online' ? (
                            <Wifi className="w-4 h-4 text-forest" />
                          ) : (
                            <WifiOff className="w-4 h-4 text-clay" />
                          )}
                        </td>
                        <td className="py-3 px-4">
                          <StatusBadge tone={st.tone} dot>
                            {st.short}
                          </StatusBadge>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          )}
        </Panel>

        {/* Right Detail Hardware Inspector */}
        <div className="xl:col-span-5 space-y-4">
          {selectedBin ? (
            <Panel
              title={`${selectedBin.id} · ${selectedBin.name}`}
              subtitle={selectedBin.address}
              action={
                <StatusBadge tone={getBinStatus(selectedBin, state.thresholds).tone} dot>
                  {getBinStatus(selectedBin, state.thresholds).label}
                </StatusBadge>
              }
            >
              <div className="space-y-5">
                {/* Hardware Sensor Readout Grid */}
                <div className="grid grid-cols-2 gap-3">
                  <div className="p-3 rounded border border-border bg-canvas/70">
                    <div className="flex items-center justify-between text-[11px] font-mono text-soil">
                      <span>HC-SR04 FILL</span>
                      <span>120L</span>
                    </div>
                    <p className="text-xl font-mono font-semibold text-ink mt-1 tabular-nums">
                      {selectedBin.fill_percentage}%
                    </p>
                    <p className="text-[11px] text-bark mt-0.5">Weight: {selectedBin.weight} kg</p>
                  </div>

                  <div className="p-3 rounded border border-border bg-canvas/70">
                    <div className="flex items-center justify-between text-[11px] font-mono text-soil">
                      <span>SOLAR + LI-ION</span>
                      {selectedBin.solar_charging ? (
                        <Sun className="w-3.5 h-3.5 text-ochre" />
                      ) : (
                        <BatteryCharging className="w-3.5 h-3.5 text-soil" />
                      )}
                    </div>
                    <p className="text-xl font-mono font-semibold text-ink mt-1 tabular-nums">
                      {selectedBin.battery_level ?? 85}%
                    </p>
                    <p className="text-[11px] text-bark mt-0.5">
                      {selectedBin.solar_charging ? '6V 5W Trickle Charging' : 'Battery Discharge'}
                    </p>
                  </div>

                  <div className="p-3 rounded border border-border bg-canvas/70">
                    <div className="flex items-center justify-between text-[11px] font-mono text-soil">
                      <span>MQ-135 GAS/ODOR</span>
                      <Wind className="w-3.5 h-3.5 text-cedar" />
                    </div>
                    <p className="text-xl font-mono font-semibold text-ink mt-1 tabular-nums">
                      {selectedBin.gas_ppm ?? 135} <span className="text-xs font-normal">ppm</span>
                    </p>
                    <p className="text-[11px] text-bark mt-0.5">
                      {(selectedBin.gas_ppm ?? 0) >= (state.thresholds.maxSafeGasPpm ?? 400)
                        ? 'Odor threshold exceeded'
                        : 'Air quality normal'}
                    </p>
                  </div>

                  <div className="p-3 rounded border border-border bg-canvas/70">
                    <div className="flex items-center justify-between text-[11px] font-mono text-soil">
                      <span>DHT22 CLIMATE</span>
                      <Thermometer className="w-3.5 h-3.5 text-forest" />
                    </div>
                    <p className="text-xl font-mono font-semibold text-ink mt-1 tabular-nums">
                      {selectedBin.temperature}°C
                    </p>
                    <p className="text-[11px] text-bark mt-0.5">
                      Humidity: {selectedBin.humidity ?? 55}% RH
                    </p>
                  </div>
                </div>

                {/* Fill Trend Mini Chart */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <span className="text-xs font-semibold text-ink">Recent Telemetry Trend</span>
                    <span className="font-mono text-[10px] text-soil">
                      Updated {formatRelativeTime(selectedBin.last_sensor_update)}
                    </span>
                  </div>
                  <div className="h-36 w-full border border-border rounded bg-canvas/50 p-2">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={selectedHistory} margin={{ top: 6, right: 8, left: -24, bottom: 0 }}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#DDD4C4" vertical={false} />
                        <XAxis dataKey="time" tick={{ fontSize: 10, fill: '#7D6E5D' }} axisLine={false} tickLine={false} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 10, fill: '#7D6E5D' }} axisLine={false} tickLine={false} />
                        <Tooltip
                          contentStyle={{
                            backgroundColor: '#FDFCF9',
                            border: '1px solid #C2B59E',
                            borderRadius: 4,
                            fontSize: 11,
                          }}
                        />
                        <Area
                          type="monotone"
                          dataKey="fill"
                          stroke="#244F34"
                          fill="#244F34"
                          fillOpacity={0.14}
                          strokeWidth={2}
                        />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </div>

                {/* Metadata & Actions */}
                <dl className="grid grid-cols-2 gap-y-2 gap-x-4 text-xs border-t border-border pt-3.5">
                  <div>
                    <dt className="text-soil">Channel / API Key</dt>
                    <dd className="font-mono text-ink mt-0.5">{selectedBin.device_api_key}</dd>
                  </div>
                  <div>
                    <dt className="text-soil">Last Cleared</dt>
                    <dd className="font-mono text-ink mt-0.5">
                      {selectedBin.last_collection_date} {selectedBin.last_collection_time}
                    </dd>
                  </div>
                  <div className="col-span-2">
                    <dt className="text-soil">Field Notes</dt>
                    <dd className="text-bark mt-0.5">{selectedBin.notes || '—'}</dd>
                  </div>
                </dl>

                <div className="flex flex-wrap items-center gap-2 pt-3 border-t border-border">
                  <button
                    type="button"
                    onClick={() => setCollectBin(selectedBin)}
                    className={`${primaryBtnClass} flex-1`}
                  >
                    <ClipboardCheck className="w-4 h-4" />
                    <span>Log Collection</span>
                  </button>
                  {canManageBins && (
                    <>
                      <button
                        type="button"
                        onClick={() => {
                          setEditingBin(selectedBin);
                          setShowFormModal(true);
                        }}
                        className={secondaryBtnClass}
                      >
                        <Edit3 className="w-4 h-4" />
                        <span>Edit</span>
                      </button>
                      <button
                        type="button"
                        onClick={() => {
                          if (window.confirm(`Remove ${selectedBin.id} (${selectedBin.name}) from registry?`)) {
                            deleteDustbin(selectedBin.id);
                          }
                        }}
                        className="p-2 rounded border border-clay-border text-clay hover:bg-clay-soft cursor-pointer"
                        title="Remove bin"
                      >
                        <Trash2 className="w-4 h-4" />
                      </button>
                    </>
                  )}
                </div>
              </div>
            </Panel>
          ) : (
            <Panel>
              <EmptyState title="Select a smart bin" description="Choose any row on the left to inspect its ESP32 hardware sensors." />
            </Panel>
          )}
        </div>
      </div>

      <BinFormModal
        open={showFormModal}
        editingBin={editingBin}
        staffOptions={users}
        onClose={() => setShowFormModal(false)}
        onSave={upsertDustbin}
      />

      <CollectionModal
        bin={collectBin}
        defaultStaffName={user?.full_name || 'Campus Crew'}
        onClose={() => setCollectBin(null)}
        onConfirm={recordCollection}
      />
    </div>
  );
};
