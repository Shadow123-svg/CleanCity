import React, { useMemo, useState } from 'react';
import { ClipboardCheck, MapPin, Sun, Wifi, WifiOff } from 'lucide-react';
import { CampusBlueprintSvg } from '../components/illustrations/CampusMotifs';
import {
  FillMeter,
  PageHeader,
  Panel,
  StatusBadge,
  primaryBtnClass,
  selectBaseClass,
} from '../components/ui/Primitives';
import { useAuth } from '../features/auth/AuthContext';
import { useAppState } from '../features/campus/AppStateContext';
import { CollectionModal } from '../features/campus/BinModals';
import { formatRelativeTime, getBinStatus } from '../lib/formatters';
import type { Dustbin } from '../types/api';

export const CampusMapPage: React.FC = () => {
  const { user } = useAuth();
  const { state, accessibleBins, recordCollection } = useAppState();
  const [statusFilter, setStatusFilter] = useState('All');
  const [selectedId, setSelectedId] = useState<string | null>(accessibleBins[2]?.id || accessibleBins[0]?.id || null);
  const [collectBin, setCollectBin] = useState<Dustbin | null>(null);

  const visibleBins = useMemo(() => {
    if (statusFilter === 'All') return accessibleBins;
    return accessibleBins.filter(b => getBinStatus(b, state.thresholds).short === statusFilter);
  }, [accessibleBins, statusFilter, state.thresholds]);

  const selectedBin = useMemo(
    () => visibleBins.find(b => b.id === selectedId) || visibleBins[0] || null,
    [visibleBins, selectedId],
  );

  return (
    <div>
      <PageHeader
        eyebrow="Spatial Campus View"
        title="VIT Bhopal Smart Bin Blueprint"
        subtitle="Architectural overview of Academic Block, Central Library, Hostel Blocks, Food Court, Sports Complex, and Main Gate."
        actions={
          <select
            value={statusFilter}
            onChange={e => setStatusFilter(e.target.value)}
            className={selectBaseClass}
          >
            <option value="All">Show All Nodes ({accessibleBins.length})</option>
            <option value="Full">Full / Overflowing</option>
            <option value="Moderate">Moderate</option>
            <option value="Normal">Normal</option>
            <option value="Offline">Offline</option>
          </select>
        }
      />

      <div className="grid lg:grid-cols-12 gap-5 items-start">
        <div className="lg:col-span-8">
          <CampusBlueprintSvg
            bins={visibleBins}
            thresholds={state.thresholds}
            selectedBinId={selectedBin?.id || null}
            onSelectBin={setSelectedId}
          />
        </div>

        <div className="lg:col-span-4 space-y-4">
          {selectedBin && (
            <Panel
              title={selectedBin.id}
              subtitle={selectedBin.name}
              action={
                <StatusBadge tone={getBinStatus(selectedBin, state.thresholds).tone} dot>
                  {getBinStatus(selectedBin, state.thresholds).short}
                </StatusBadge>
              }
            >
              <div className="space-y-4">
                <div className="flex items-start gap-2 text-xs text-bark">
                  <MapPin className="w-4 h-4 text-cedar shrink-0 mt-0.5" />
                  <div>
                    <p className="font-medium text-ink">{selectedBin.campus_zone || selectedBin.location_name}</p>
                    <p className="text-soil">{selectedBin.address}</p>
                    <p className="font-mono text-[10px] text-soil mt-1">
                      GPS: {selectedBin.latitude.toFixed(4)}° N, {selectedBin.longitude.toFixed(4)}° E
                    </p>
                  </div>
                </div>

                <div>
                  <div className="flex items-center justify-between text-xs mb-1.5">
                    <span className="text-bark">Ultrasonic Fill Level</span>
                    <span className="font-mono text-soil">{selectedBin.weight} kg</span>
                  </div>
                  <FillMeter
                    value={selectedBin.fill_percentage}
                    tone={getBinStatus(selectedBin, state.thresholds).tone}
                  />
                </div>

                <div className="grid grid-cols-2 gap-2.5 text-xs">
                  <div className="p-2.5 rounded border border-border bg-canvas/70">
                    <span className="text-[10px] font-mono text-soil block">BATTERY / SOLAR</span>
                    <span className="font-mono font-semibold text-ink inline-flex items-center gap-1 mt-0.5">
                      {selectedBin.battery_level ?? 85}%
                      {selectedBin.solar_charging && <Sun className="w-3 h-3 text-ochre" />}
                    </span>
                  </div>
                  <div className="p-2.5 rounded border border-border bg-canvas/70">
                    <span className="text-[10px] font-mono text-soil block">CAMPUS WI-FI</span>
                    <span className="font-mono font-semibold text-ink inline-flex items-center gap-1 mt-0.5">
                      {selectedBin.sensor_status === 'online' ? (
                        <>
                          <Wifi className="w-3 h-3 text-forest" /> Online
                        </>
                      ) : (
                        <>
                          <WifiOff className="w-3 h-3 text-clay" /> Offline
                        </>
                      )}
                    </span>
                  </div>
                  <div className="p-2.5 rounded border border-border bg-canvas/70">
                    <span className="text-[10px] font-mono text-soil block">ODOR (MQ-135)</span>
                    <span className="font-mono font-semibold text-ink block mt-0.5">
                      {selectedBin.gas_ppm ?? 130} ppm
                    </span>
                  </div>
                  <div className="p-2.5 rounded border border-border bg-canvas/70">
                    <span className="text-[10px] font-mono text-soil block">LAST PING</span>
                    <span className="font-mono font-semibold text-ink block mt-0.5">
                      {formatRelativeTime(selectedBin.last_sensor_update)}
                    </span>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setCollectBin(selectedBin)}
                  className={`${primaryBtnClass} w-full`}
                >
                  <ClipboardCheck className="w-4 h-4" />
                  <span>Dispatch &amp; Mark Collected</span>
                </button>
              </div>
            </Panel>
          )}
        </div>
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
