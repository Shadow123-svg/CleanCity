import React, { useMemo, useState } from 'react';
import { ClipboardCheck, Download, Plus, Scale } from 'lucide-react';
import {
  EmptyState,
  KpiCard,
  PageHeader,
  Panel,
  primaryBtnClass,
  secondaryBtnClass,
  selectBaseClass,
} from '../components/ui/Primitives';
import { useAuth } from '../features/auth/AuthContext';
import { useAppState } from '../features/campus/AppStateContext';
import { CollectionModal } from '../features/campus/BinModals';
import { downloadCsvFile } from '../lib/formatters';
import type { Dustbin } from '../types/api';

export const CollectionsPage: React.FC = () => {
  const { user } = useAuth();
  const { state, accessibleBins, recordCollection } = useAppState();
  const [binFilter, setBinFilter] = useState('All');
  const [staffFilter, setStaffFilter] = useState('All');
  const [collectBin, setCollectBin] = useState<Dustbin | null>(null);

  const staffNames = useMemo(
    () => Array.from(new Set(state.collections.map(c => c.collected_by))).sort(),
    [state.collections],
  );

  const filtered = useMemo(() => {
    return state.collections.filter(c => {
      if (binFilter !== 'All' && c.dustbin_id !== binFilter) return false;
      if (staffFilter !== 'All' && c.collected_by !== staffFilter) return false;
      return true;
    });
  }, [state.collections, binFilter, staffFilter]);

  const totalWeight = useMemo(
    () => filtered.reduce((sum, c) => sum + Number(c.waste_quantity || 0), 0),
    [filtered],
  );

  const handleExport = () => {
    downloadCsvFile(
      `vit-bhopal-collections-${new Date().toISOString().slice(0, 10)}.csv`,
      ['Collection ID', 'Bin ID', 'Date', 'Time', 'Collected By', 'Weight (kg)', 'Notes'],
      filtered.map(c => [
        c.id,
        c.dustbin_id,
        c.collection_date,
        c.collection_time,
        c.collected_by,
        c.waste_quantity,
        c.notes,
      ]),
    );
  };

  return (
    <div>
      <PageHeader
        eyebrow="Housekeeping Dispatch Ledger"
        title="Waste Collection History"
        subtitle="Verified bin clearances logged by maintenance crews with automatic ultrasonic reset to 0%."
        actions={
          <>
            <button type="button" onClick={handleExport} className={secondaryBtnClass}>
              <Download className="w-4 h-4" />
              <span>Export CSV</span>
            </button>
            {accessibleBins.length > 0 && (
              <button
                type="button"
                onClick={() => {
                  const highest = [...accessibleBins].sort((a, b) => b.fill_percentage - a.fill_percentage)[0];
                  setCollectBin(highest);
                }}
                className={primaryBtnClass}
              >
                <Plus className="w-4 h-4" />
                <span>Log Highest Priority Bin</span>
              </button>
            )}
          </>
        }
      />

      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4 mb-6">
        <KpiCard
          label="Logged Clearances"
          value={filtered.length}
          meta="Matching active filter criteria"
          tone="forest"
          icon={<ClipboardCheck className="w-4 h-4" />}
        />
        <KpiCard
          label="Total Waste Cleared"
          value={`${totalWeight.toFixed(1)} kg`}
          meta="Cumulative verified haulage"
          tone="cedar"
          icon={<Scale className="w-4 h-4" />}
        />
        <KpiCard
          label="Average Load / Bin"
          value={`${filtered.length ? (totalWeight / filtered.length).toFixed(1) : '0.0'} kg`}
          meta="Across 120L campus smart bins"
          tone="ochre"
        />
      </div>

      <Panel
        title="Collection Records"
        action={
          <div className="flex flex-wrap items-center gap-2">
            <select value={binFilter} onChange={e => setBinFilter(e.target.value)} className={selectBaseClass}>
              <option value="All">All Bins</option>
              {accessibleBins.map(b => (
                <option key={b.id} value={b.id}>
                  {b.id} · {b.campus_zone || b.location_name}
                </option>
              ))}
            </select>
            <select value={staffFilter} onChange={e => setStaffFilter(e.target.value)} className={selectBaseClass}>
              <option value="All">All Crew Members</option>
              {staffNames.map(name => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        }
        bodyClassName="p-0"
      >
        {filtered.length === 0 ? (
          <EmptyState
            title="No collection records yet"
            description="When maintenance staff mark a bin as collected, the dispatch record appears here."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse">
              <thead>
                <tr className="border-b border-border bg-surface-alt/55 text-[11px] font-mono uppercase tracking-wider text-soil">
                  <th className="py-2.5 px-4 font-medium">Log ID</th>
                  <th className="py-2.5 px-4 font-medium">Bin</th>
                  <th className="py-2.5 px-4 font-medium">Date &amp; Time</th>
                  <th className="py-2.5 px-4 font-medium">Crew Member</th>
                  <th className="py-2.5 px-4 font-medium">Cleared Weight</th>
                  <th className="py-2.5 px-4 font-medium">Notes</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-border text-sm">
                {filtered.map(rec => {
                  const bin = state.dustbins.find(b => b.id === rec.dustbin_id);
                  return (
                    <tr key={rec.id} className="hover:bg-surface-hover/60">
                      <td className="py-3 px-4 font-mono text-xs text-soil">{rec.id}</td>
                      <td className="py-3 px-4">
                        <span className="font-mono text-xs font-semibold text-ink">{rec.dustbin_id}</span>
                        {bin && <span className="block text-xs text-bark">{bin.name}</span>}
                      </td>
                      <td className="py-3 px-4 font-mono text-xs text-bark">
                        {rec.collection_date} · {rec.collection_time}
                      </td>
                      <td className="py-3 px-4 text-xs font-medium text-ink">{rec.collected_by}</td>
                      <td className="py-3 px-4 font-mono text-xs font-semibold text-forest tabular-nums">
                        {rec.waste_quantity} kg
                      </td>
                      <td className="py-3 px-4 text-xs text-bark max-w-xs">{rec.notes}</td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>

      <CollectionModal
        bin={collectBin}
        defaultStaffName={user?.full_name || 'Campus Crew'}
        onClose={() => setCollectBin(null)}
        onConfirm={recordCollection}
      />
    </div>
  );
};
