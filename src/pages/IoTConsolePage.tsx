import React, { useState } from 'react';
import { Cpu, Pause, Play, Send } from 'lucide-react';
import {
  FormField,
  PageHeader,
  Panel,
  StatusBadge,
  cedarBtnClass,
  inputBaseClass,
  primaryBtnClass,
  selectBaseClass,
} from '../components/ui/Primitives';
import { useAppState } from '../features/campus/AppStateContext';
import { formatShortDateTime } from '../lib/formatters';
import type { SensorStatus } from '../types/api';

export const IoTConsolePage: React.FC = () => {
  const {
    state,
    accessibleBins,
    simulationRunning,
    simulationIntervalSec,
    setSimulationRunning,
    setSimulationIntervalSec,
    ingestTelemetry,
    notify,
  } = useAppState();

  const defaultBin = accessibleBins[0];
  const [dustbinId, setDustbinId] = useState(defaultBin?.id || 'BIN-001');
  const [fillPercentage, setFillPercentage] = useState(88);
  const [weight, setWeight] = useState(21.4);
  const [temperature, setTemperature] = useState(33.2);
  const [humidity, setHumidity] = useState(58);
  const [gasPpm, setGasPpm] = useState(290);
  const [batteryLevel, setBatteryLevel] = useState(84);
  const [sensorStatus, setSensorStatus] = useState<SensorStatus>('online');

  const selectedBin = state.dustbins.find(b => b.id === dustbinId);

  const previewPayload = {
    dustbin_id: dustbinId,
    device_api_key: selectedBin?.device_api_key || 'TS-VITB-BIN001',
    fill_percentage: fillPercentage,
    weight,
    temperature,
    humidity,
    gas_ppm: gasPpm,
    battery_level: batteryLevel,
    sensor_status: sensorStatus,
    timestamp: new Date().toISOString(),
  };

  const handleSend = (e: React.FormEvent) => {
    e.preventDefault();
    const res = ingestTelemetry(previewPayload, 'Hardware');
    notify(res.message, res.ok ? 'success' : 'error');
  };

  return (
    <div>
      <PageHeader
        eyebrow="ESP32 & ThingSpeak Telemetry Lab"
        title="IoT Hardware Console & Simulator"
        subtitle="Test ultrasonic, MQ-135 gas, DHT22 climate, and Li-ion battery frames or run live campus telemetry simulation."
      />

      <div className="grid lg:grid-cols-12 gap-5 items-start mb-6">
        <Panel
          className="lg:col-span-7"
          title="Manual ESP32 Telemetry Frame"
          subtitle="Ingests a validated sensor packet and triggers threshold alerts + MySQL state sync"
          action={<Cpu className="w-4 h-4 text-forest" />}
        >
          <form onSubmit={handleSend} className="space-y-4">
            <div className="grid sm:grid-cols-2 gap-3.5">
              <FormField label="Target Smart Bin">
                <select
                  value={dustbinId}
                  onChange={e => setDustbinId(e.target.value)}
                  className={`${selectBaseClass} w-full font-mono`}
                >
                  {accessibleBins.map(b => (
                    <option key={b.id} value={b.id}>
                      {b.id} — {b.campus_zone || b.location_name}
                    </option>
                  ))}
                </select>
              </FormField>

              <FormField label="Campus Wi-Fi Sensor Status">
                <select
                  value={sensorStatus}
                  onChange={e => setSensorStatus(e.target.value as SensorStatus)}
                  className={`${selectBaseClass} w-full`}
                >
                  <option value="online">online</option>
                  <option value="offline">offline</option>
                </select>
              </FormField>
            </div>

            <div className="grid grid-cols-2 sm:grid-cols-3 gap-3.5">
              <FormField label="HC-SR04 Fill (%)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={fillPercentage}
                  onChange={e => setFillPercentage(Number(e.target.value))}
                  className={`${inputBaseClass} font-mono`}
                />
              </FormField>
              <FormField label="Weight (kg)">
                <input
                  type="number"
                  step="0.1"
                  min={0}
                  max={200}
                  value={weight}
                  onChange={e => setWeight(Number(e.target.value))}
                  className={`${inputBaseClass} font-mono`}
                />
              </FormField>
              <FormField label="Li-ion Battery (%)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={batteryLevel}
                  onChange={e => setBatteryLevel(Number(e.target.value))}
                  className={`${inputBaseClass} font-mono`}
                />
              </FormField>
              <FormField label="MQ-135 Gas (ppm)">
                <input
                  type="number"
                  min={0}
                  max={2000}
                  value={gasPpm}
                  onChange={e => setGasPpm(Number(e.target.value))}
                  className={`${inputBaseClass} font-mono`}
                />
              </FormField>
              <FormField label="DHT22 Temp (°C)">
                <input
                  type="number"
                  step="0.1"
                  value={temperature}
                  onChange={e => setTemperature(Number(e.target.value))}
                  className={`${inputBaseClass} font-mono`}
                />
              </FormField>
              <FormField label="Humidity (% RH)">
                <input
                  type="number"
                  min={0}
                  max={100}
                  value={humidity}
                  onChange={e => setHumidity(Number(e.target.value))}
                  className={`${inputBaseClass} font-mono`}
                />
              </FormField>
            </div>

            <button type="submit" className={primaryBtnClass}>
              <Send className="w-4 h-4" />
              <span>Ingest Sensor Reading</span>
            </button>
          </form>
        </Panel>

        <div className="lg:col-span-5 space-y-4">
          <Panel
            title="Live Campus Auto-Simulator"
            subtitle="Periodically emits ultrasonic & battery updates across active bins"
          >
            <div className="flex flex-wrap items-end justify-between gap-3">
              <FormField label="Interval (seconds)">
                <select
                  value={simulationIntervalSec}
                  onChange={e => setSimulationIntervalSec(Number(e.target.value))}
                  className={`${selectBaseClass} font-mono`}
                >
                  <option value={3}>3s (Fast)</option>
                  <option value={6}>6s (Default)</option>
                  <option value={12}>12s (Steady)</option>
                </select>
              </FormField>

              <button
                type="button"
                onClick={() => setSimulationRunning(v => !v)}
                className={simulationRunning ? cedarBtnClass : primaryBtnClass}
              >
                {simulationRunning ? <Pause className="w-4 h-4" /> : <Play className="w-4 h-4" />}
                <span>{simulationRunning ? 'Pause Simulator' : 'Run Simulator'}</span>
              </button>
            </div>
          </Panel>

          <Panel title="JSON Packet Preview" subtitle="Standard ESP32 payload contract">
            <pre className="p-3 rounded bg-ink text-[#E6EFE8] font-mono text-[11px] overflow-x-auto leading-relaxed">
              {JSON.stringify(previewPayload, null, 2)}
            </pre>
          </Panel>
        </div>
      </div>

      <Panel title="Recent Telemetry Stream" subtitle="Latest 15 readings recorded across campus sensors" bodyClassName="p-0">
        <div className="overflow-x-auto">
          <table className="w-full text-left border-collapse text-xs">
            <thead>
              <tr className="border-b border-border bg-surface-alt/55 font-mono uppercase text-[10px] text-soil">
                <th className="py-2.5 px-4">Timestamp</th>
                <th className="py-2.5 px-4">Bin</th>
                <th className="py-2.5 px-4">Source</th>
                <th className="py-2.5 px-4">Fill</th>
                <th className="py-2.5 px-4">Weight</th>
                <th className="py-2.5 px-4">Gas</th>
                <th className="py-2.5 px-4">Temp</th>
                <th className="py-2.5 px-4">Battery</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-border font-mono">
              {[...state.sensorHistory]
                .reverse()
                .slice(0, 15)
                .map(r => (
                  <tr key={r.id} className="hover:bg-surface-hover/50">
                    <td className="py-2.5 px-4 text-soil">{formatShortDateTime(r.recorded_at)}</td>
                    <td className="py-2.5 px-4 font-semibold text-ink">{r.dustbin_id}</td>
                    <td className="py-2.5 px-4">
                      <StatusBadge tone={r.source === 'Collection Reset' ? 'forest' : r.source === 'Simulation' ? 'cedar' : 'soil'}>
                        {r.source}
                      </StatusBadge>
                    </td>
                    <td className="py-2.5 px-4 text-ink">{r.fill_percentage}%</td>
                    <td className="py-2.5 px-4 text-bark">{r.weight} kg</td>
                    <td className="py-2.5 px-4 text-bark">{r.gas_ppm ?? '—'} ppm</td>
                    <td className="py-2.5 px-4 text-bark">{r.temperature}°C</td>
                    <td className="py-2.5 px-4 text-bark">{r.battery_level ?? '—'}%</td>
                  </tr>
                ))}
            </tbody>
          </table>
        </div>
      </Panel>
    </div>
  );
};
