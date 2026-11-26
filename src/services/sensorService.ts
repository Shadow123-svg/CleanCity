import type { QrIssueReport, SensorStatus } from '../types/api';
import { createClientId } from '../lib/formatters';

export interface SensorTelemetryPayload {
  dustbin_id: string;
  device_api_key?: string;
  fill_percentage: number;
  waste_type?: string;
  weight: number;
  temperature: number;
  humidity?: number;
  gas_ppm?: number;
  battery_level?: number;
  solar_charging?: boolean;
  sensor_status?: SensorStatus;
  timestamp?: string;
}

export interface TelemetryValidationResult {
  valid: boolean;
  error?: string;
  normalized?: Required<Pick<SensorTelemetryPayload, 'dustbin_id' | 'fill_percentage' | 'weight' | 'temperature' | 'sensor_status' | 'timestamp'>> &
    Pick<SensorTelemetryPayload, 'waste_type' | 'humidity' | 'gas_ppm' | 'battery_level' | 'solar_charging'>;
}

/**
 * Isolated hardware telemetry validation & QR report adapter.
 *
 * TODO: missing backend route — server/index.js currently persists dashboard telemetry
 * through PUT /api/state rather than a dedicated ESP32 ingestion endpoint (POST /api/sensors/data)
 * or public QR report endpoint (POST /api/issues/report). Once those routes are added,
 * wire fetch calls here without changing any UI components.
 */
export const sensorService = {
  validateTelemetryPayload(payload: SensorTelemetryPayload): TelemetryValidationResult {
    const fill = Number(payload.fill_percentage);
    const weight = Number(payload.weight);
    const temp = Number(payload.temperature);

    if (!payload.dustbin_id.trim()) {
      return { valid: false, error: 'A valid dustbin_id is required.' };
    }
    if (!Number.isFinite(fill) || fill < 0 || fill > 100) {
      return { valid: false, error: 'fill_percentage must be between 0 and 100.' };
    }
    if (!Number.isFinite(weight) || weight < 0 || weight > 500) {
      return { valid: false, error: 'weight must be between 0 and 500 kg.' };
    }
    if (!Number.isFinite(temp) || temp < -10 || temp > 120) {
      return { valid: false, error: 'temperature is outside the DHT22 operating range.' };
    }

    return {
      valid: true,
      normalized: {
        dustbin_id: payload.dustbin_id.trim(),
        fill_percentage: Math.round(fill),
        waste_type: payload.waste_type,
        weight: Number(weight.toFixed(1)),
        temperature: Number(temp.toFixed(1)),
        humidity: payload.humidity !== undefined ? Math.min(100, Math.max(0, Math.round(Number(payload.humidity)))) : undefined,
        gas_ppm: payload.gas_ppm !== undefined ? Math.max(0, Math.round(Number(payload.gas_ppm))) : undefined,
        battery_level:
          payload.battery_level !== undefined
            ? Math.min(100, Math.max(0, Math.round(Number(payload.battery_level))))
            : undefined,
        solar_charging: payload.solar_charging,
        sensor_status: payload.sensor_status ?? 'online',
        timestamp: payload.timestamp || new Date().toISOString(),
      },
    };
  },

  // TODO: missing backend route — POST /api/issues/report (currently stored in app_state.qrReports)
  buildQrIssueReport(input: {
    dustbin_id: string;
    reporter_role: QrIssueReport['reporter_role'];
    issue_type: QrIssueReport['issue_type'];
    comment: string;
  }): QrIssueReport {
    return {
      id: createClientId('QR'),
      dustbin_id: input.dustbin_id,
      reporter_role: input.reporter_role,
      issue_type: input.issue_type,
      comment: input.comment.trim() || `${input.issue_type} flagged via bin QR sticker.`,
      created_at: new Date().toISOString(),
      resolved: false,
    };
  },
};
