import React, {
  createContext,
  useCallback,
  useContext,
  useEffect,
  useMemo,
  useRef,
  useState,
} from 'react';
import { createClientId } from '../../lib/formatters';
import { SEED_CAMPUS_STATE } from '../../services/mockStore';
import { connectRealtime, type RealtimeStatus } from '../../services/realtimeService';
import { sensorService, type SensorTelemetryPayload } from '../../services/sensorService';
import { stateService } from '../../services/stateService';
import { userService } from '../../services/userService';
import type {
  AlertNotification,
  AppState,
  AuditLogEntry,
  CollectionRecord,
  Dustbin,
  QrIssueReport,
  SensorReading,
  Thresholds,
  UpdateUserRequest,
  User,
} from '../../types/api';
import { useAuth } from '../auth/AuthContext';

export interface ToastNotice {
  id: number;
  message: string;
  tone: 'success' | 'error' | 'info';
}

interface AppStateContextValue {
  state: AppState;
  accessibleBins: Dustbin[];
  users: User[];
  loadingData: boolean;
  savingState: boolean;
  realtimeStatus: RealtimeStatus;
  simulationRunning: boolean;
  simulationIntervalSec: number;
  setSimulationRunning: React.Dispatch<React.SetStateAction<boolean>>;
  setSimulationIntervalSec: React.Dispatch<React.SetStateAction<number>>;
  toast: ToastNotice | null;
  dismissToast: () => void;
  notify: (message: string, tone?: ToastNotice['tone']) => void;
  upsertDustbin: (bin: Dustbin, isEdit: boolean) => void;
  deleteDustbin: (binId: string) => void;
  recordCollection: (input: {
    dustbinId: string;
    collectedBy: string;
    collectionDate: string;
    collectionTime: string;
    wasteQuantity: number;
    notes: string;
  }) => void;
  ingestTelemetry: (
    payload: SensorTelemetryPayload,
    source?: 'Hardware' | 'Simulation',
  ) => { ok: boolean; message: string };
  markAlertRead: (alertId: string) => void;
  markAllAlertsRead: () => void;
  updateThresholds: (next: Thresholds) => void;
  submitQrReport: (input: {
    dustbin_id: string;
    reporter_role: QrIssueReport['reporter_role'];
    issue_type: QrIssueReport['issue_type'];
    comment: string;
  }) => void;
  resolveQrReport: (reportId: string) => void;
  updateUserAccount: (userId: string, payload: UpdateUserRequest) => Promise<void>;
  reloadAll: () => Promise<void>;
}

const AppStateContext = createContext<AppStateContextValue | null>(null);

function normalizeLoadedState(raw: Partial<AppState> | null): AppState {
  if (!raw) return SEED_CAMPUS_STATE;
  return {
    dustbins: Array.isArray(raw.dustbins) && raw.dustbins.length > 0 ? raw.dustbins : SEED_CAMPUS_STATE.dustbins,
    sensorHistory: Array.isArray(raw.sensorHistory) ? raw.sensorHistory : SEED_CAMPUS_STATE.sensorHistory,
    collections: Array.isArray(raw.collections) ? raw.collections : SEED_CAMPUS_STATE.collections,
    notifications: Array.isArray(raw.notifications) ? raw.notifications : SEED_CAMPUS_STATE.notifications,
    auditLogs: Array.isArray(raw.auditLogs) ? raw.auditLogs : SEED_CAMPUS_STATE.auditLogs,
    thresholds: { ...SEED_CAMPUS_STATE.thresholds, ...(raw.thresholds || {}) },
    qrReports: Array.isArray(raw.qrReports) ? raw.qrReports : SEED_CAMPUS_STATE.qrReports,
  };
}

export const AppStateProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, status: authStatus, updateCurrentUser } = useAuth();
  const [state, setState] = useState<AppState>(SEED_CAMPUS_STATE);
  const [users, setUsers] = useState<User[]>([]);
  const [loadingData, setLoadingData] = useState(false);
  const [savingState, setSavingState] = useState(false);
  const [realtimeStatus, setRealtimeStatus] = useState<RealtimeStatus>('disconnected');
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationIntervalSec, setSimulationIntervalSec] = useState(6);
  const [toast, setToast] = useState<ToastNotice | null>(null);

  const hydratedRef = useRef(false);
  const skipNextSaveRef = useRef(false);
  const toastTimerRef = useRef<number | null>(null);

  const dismissToast = useCallback(() => setToast(null), []);

  const notify = useCallback((message: string, tone: ToastNotice['tone'] = 'success') => {
    if (toastTimerRef.current) window.clearTimeout(toastTimerRef.current);
    setToast({ id: Date.now(), message, tone });
    toastTimerRef.current = window.setTimeout(() => setToast(null), 4200);
  }, []);

  const reloadAll = useCallback(async () => {
    if (!user) return;
    setLoadingData(true);
    try {
      const [userRes, stateRes] = await Promise.all([
        userService.listUsers(),
        stateService.getState(),
      ]);
      setUsers(userRes.users);
      skipNextSaveRef.current = true;
      setState(normalizeLoadedState(stateRes.state));
      hydratedRef.current = true;
    } catch (err) {
      notify(err instanceof Error ? err.message : 'Failed to load campus data.', 'error');
    } finally {
      setLoadingData(false);
    }
  }, [user, notify]);

  useEffect(() => {
    if (authStatus === 'authenticated' && user) {
      void reloadAll();
    } else {
      hydratedRef.current = false;
      setSimulationRunning(false);
      setUsers([]);
    }
  }, [authStatus, user, reloadAll]);

  // Debounced persistence to PUT /api/state whenever local user-triggered state changes
  useEffect(() => {
    if (authStatus !== 'authenticated' || !hydratedRef.current) return;
    if (skipNextSaveRef.current) {
      skipNextSaveRef.current = false;
      return;
    }

    const timer = window.setTimeout(() => {
      setSavingState(true);
      stateService
        .saveState(state)
        .catch(err => {
          notify(err instanceof Error ? `Save failed: ${err.message}` : 'Could not save state.', 'error');
        })
        .finally(() => setSavingState(false));
    }, 650);

    return () => window.clearTimeout(timer);
  }, [state, authStatus, notify]);

  // Real-time WebSocket subscription (/ws)
  useEffect(() => {
    if (authStatus !== 'authenticated') {
      setRealtimeStatus('disconnected');
      return;
    }

    const conn = connectRealtime({
      onStatusChange: setRealtimeStatus,
      onMessage: message => {
        if (message.type === 'state.updated' && message.state) {
          skipNextSaveRef.current = true;
          setState(normalizeLoadedState(message.state));
        } else if (message.type === 'user.updated' && message.user) {
          const updated = message.user;
          setUsers(prev => {
            const exists = prev.some(u => u.id === updated.id);
            return exists ? prev.map(u => (u.id === updated.id ? updated : u)) : [...prev, updated];
          });
          updateCurrentUser(updated);
        }
      },
    });

    return () => conn.close();
  }, [authStatus, updateCurrentUser]);

  const accessibleBins = useMemo(() => {
    if (!user) return [];
    if (user.role === 'Field Staff') {
      const assigned = state.dustbins.filter(b => b.assigned_staff_id === user.id);
      return assigned.length > 0 ? assigned : state.dustbins;
    }
    return state.dustbins;
  }, [state.dustbins, user]);

  const upsertDustbin = useCallback(
    (bin: Dustbin, isEdit: boolean) => {
      const nowIso = new Date().toISOString();
      setState(prev => {
        const dustbins = isEdit
          ? prev.dustbins.map(item => (item.id === bin.id ? bin : item))
          : [bin, ...prev.dustbins];

        const log: AuditLogEntry = {
          id: createClientId('LOG'),
          user_name: user?.full_name || 'Operator',
          role: user?.role || 'Staff',
          action: isEdit ? 'BIN_UPDATED' : 'BIN_REGISTERED',
          entity_type: 'Dustbin',
          entity_id: bin.id,
          details: `${isEdit ? 'Updated' : 'Registered'} ${bin.name} (${bin.campus_zone || bin.location_name}).`,
          created_at: nowIso,
        };
        return { ...prev, dustbins, auditLogs: [log, ...prev.auditLogs].slice(0, 120) };
      });
      notify(isEdit ? `Updated ${bin.id}.` : `Registered new smart bin ${bin.id}.`);
    },
    [user, notify],
  );

  const deleteDustbin = useCallback(
    (binId: string) => {
      const nowIso = new Date().toISOString();
      setState(prev => {
        const target = prev.dustbins.find(b => b.id === binId);
        const log: AuditLogEntry = {
          id: createClientId('LOG'),
          user_name: user?.full_name || 'Operator',
          role: user?.role || 'Staff',
          action: 'BIN_REMOVED',
          entity_type: 'Dustbin',
          entity_id: binId,
          details: `Removed ${target?.name || binId} from active registry.`,
          created_at: nowIso,
        };
        return {
          ...prev,
          dustbins: prev.dustbins.filter(b => b.id !== binId),
          auditLogs: [log, ...prev.auditLogs].slice(0, 120),
        };
      });
      notify(`Removed bin ${binId}.`, 'info');
    },
    [user, notify],
  );

  const recordCollection = useCallback(
    (input: {
      dustbinId: string;
      collectedBy: string;
      collectionDate: string;
      collectionTime: string;
      wasteQuantity: number;
      notes: string;
    }) => {
      const nowIso = new Date().toISOString();
      setState(prev => {
        const target = prev.dustbins.find(b => b.id === input.dustbinId);
        if (!target) return prev;

        const collection: CollectionRecord = {
          id: createClientId('COL'),
          dustbin_id: input.dustbinId,
          collected_by: input.collectedBy.trim() || user?.full_name || 'Campus Crew',
          staff_id: user?.id || target.assigned_staff_id,
          collection_date: input.collectionDate,
          collection_time: input.collectionTime,
          waste_quantity: Number(input.wasteQuantity.toFixed(1)),
          notes: input.notes.trim() || 'Standard campus bin clearance.',
          created_at: nowIso,
        };

        const resetReading: SensorReading = {
          id: createClientId('SR'),
          dustbin_id: input.dustbinId,
          fill_percentage: 0,
          waste_type: target.waste_category,
          weight: 0,
          temperature: target.temperature,
          humidity: target.humidity,
          gas_ppm: 85,
          battery_level: target.battery_level,
          sensor_status: 'online',
          recorded_at: nowIso,
          source: 'Collection Reset',
        };

        const dustbins = prev.dustbins.map(b =>
          b.id === input.dustbinId
            ? {
                ...b,
                fill_percentage: 0,
                weight: 0,
                gas_ppm: 85,
                sensor_status: 'online' as const,
                last_collection_date: input.collectionDate,
                last_collection_time: input.collectionTime,
                last_sensor_update: nowIso,
              }
            : b,
        );

        const notifications = prev.notifications.map(n =>
          n.dustbin_id === input.dustbinId && !n.is_read ? { ...n, is_read: true } : n,
        );

        const log: AuditLogEntry = {
          id: createClientId('LOG'),
          user_name: user?.full_name || input.collectedBy,
          role: user?.role || 'Field Staff',
          action: 'COLLECTION_LOGGED',
          entity_type: 'Collection',
          entity_id: input.dustbinId,
          details: `Cleared ${collection.waste_quantity} kg from ${target.name}. Ultrasonic fill reset to 0%.`,
          created_at: nowIso,
        };

        return {
          ...prev,
          dustbins,
          collections: [collection, ...prev.collections],
          sensorHistory: [...prev.sensorHistory, resetReading].slice(-250),
          notifications,
          auditLogs: [log, ...prev.auditLogs].slice(0, 120),
        };
      });
      notify(`Collection logged for ${input.dustbinId}. Fill level reset to 0%.`);
    },
    [user, notify],
  );

  const ingestTelemetry = useCallback(
    (payload: SensorTelemetryPayload, source: 'Hardware' | 'Simulation' = 'Hardware') => {
      const check = sensorService.validateTelemetryPayload(payload);
      if (!check.valid || !check.normalized) {
        return { ok: false, message: check.error || 'Invalid telemetry payload.' };
      }

      const norm = check.normalized;
      let matched = false;

      setState(prev => {
        const target = prev.dustbins.find(b => b.id === norm.dustbin_id);
        if (!target) return prev;
        matched = true;

        const reading: SensorReading = {
          id: createClientId('SR'),
          dustbin_id: norm.dustbin_id,
          fill_percentage: norm.fill_percentage,
          waste_type: norm.waste_type || target.waste_category,
          weight: norm.weight,
          temperature: norm.temperature,
          humidity: norm.humidity ?? target.humidity,
          gas_ppm: norm.gas_ppm ?? target.gas_ppm,
          battery_level: norm.battery_level ?? target.battery_level,
          sensor_status: norm.sensor_status,
          recorded_at: norm.timestamp,
          source,
        };

        const dustbins = prev.dustbins.map(b =>
          b.id === norm.dustbin_id
            ? {
                ...b,
                fill_percentage: norm.fill_percentage,
                waste_category: norm.waste_type || b.waste_category,
                weight: norm.weight,
                temperature: norm.temperature,
                humidity: norm.humidity ?? b.humidity,
                gas_ppm: norm.gas_ppm ?? b.gas_ppm,
                battery_level: norm.battery_level ?? b.battery_level,
                solar_charging: norm.solar_charging ?? b.solar_charging,
                sensor_status: norm.sensor_status,
                last_sensor_update: norm.timestamp,
              }
            : b,
        );

        const newAlerts: AlertNotification[] = [];
        const alertBase = {
          dustbin_id: norm.dustbin_id,
          location: target.campus_zone || target.location_name,
          is_read: false,
          created_at: norm.timestamp,
        };

        if (norm.sensor_status === 'offline') {
          newAlerts.push({
            ...alertBase,
            id: createClientId('ALT'),
            alert_type: 'Sensor Offline',
            severity: 'Warning',
            message: `[${source}] ${norm.dustbin_id} (${target.name}) went offline on campus Wi-Fi.`,
          });
        } else if (norm.fill_percentage >= prev.thresholds.urgentMin) {
          newAlerts.push({
            ...alertBase,
            id: createClientId('ALT'),
            alert_type: `Overflowing (>= ${prev.thresholds.urgentMin}%)`,
            severity: 'Critical',
            message: `[${source}] ${norm.dustbin_id} (${target.name}) reached ${norm.fill_percentage}% capacity. Immediate collection needed.`,
          });
        } else if (norm.fill_percentage > prev.thresholds.moderateMax) {
          newAlerts.push({
            ...alertBase,
            id: createClientId('ALT'),
            alert_type: `Full Bin (> ${prev.thresholds.moderateMax}%)`,
            severity: 'High',
            message: `[${source}] ${norm.dustbin_id} (${target.name}) crossed ${prev.thresholds.moderateMax}% (${norm.fill_percentage}%).`,
          });
        }

        if (norm.gas_ppm !== undefined && norm.gas_ppm >= (prev.thresholds.maxSafeGasPpm ?? 400)) {
          newAlerts.push({
            ...alertBase,
            id: createClientId('ALT'),
            alert_type: 'High Odor / Gas (MQ-135)',
            severity: 'Critical',
            message: `[${source}] ${norm.dustbin_id} odor reading reached ${norm.gas_ppm} ppm.`,
          });
        }

        if (norm.battery_level !== undefined && norm.battery_level <= (prev.thresholds.lowBatteryThreshold ?? 25)) {
          newAlerts.push({
            ...alertBase,
            id: createClientId('ALT'),
            alert_type: 'Low Li-ion Battery',
            severity: 'Warning',
            message: `[${source}] ${norm.dustbin_id} battery dropped to ${norm.battery_level}%. Inspect 6V solar panel.`,
          });
        }

        const log: AuditLogEntry = {
          id: createClientId('LOG'),
          user_name: source === 'Simulation' ? `Campus Simulator (${norm.dustbin_id})` : `ESP32 Node (${norm.dustbin_id})`,
          role: source === 'Simulation' ? 'Simulation' : 'IoT Hardware',
          action: 'TELEMETRY_RECEIVED',
          entity_type: 'SensorReading',
          entity_id: norm.dustbin_id,
          details: `Fill ${norm.fill_percentage}% · Weight ${norm.weight}kg · Temp ${norm.temperature}°C${
            norm.gas_ppm !== undefined ? ` · Gas ${norm.gas_ppm}ppm` : ''
          }${norm.battery_level !== undefined ? ` · Batt ${norm.battery_level}%` : ''}`,
          created_at: norm.timestamp,
        };

        return {
          ...prev,
          dustbins,
          sensorHistory: [...prev.sensorHistory, reading].slice(-250),
          notifications: [...newAlerts, ...prev.notifications].slice(0, 100),
          auditLogs: [log, ...prev.auditLogs].slice(0, 120),
        };
      });

      if (!matched) {
        return { ok: false, message: `Dustbin ID ${norm.dustbin_id} was not found.` };
      }
      return { ok: true, message: `Telemetry ingested for ${norm.dustbin_id}.` };
    },
    [],
  );

  // Live simulation interval
  useEffect(() => {
    if (!simulationRunning) return;
    const timer = window.setInterval(() => {
      const online = state.dustbins.filter(b => b.operational_status === 'Active' && b.sensor_status === 'online');
      if (online.length === 0) return;
      const target = online[Math.floor(Math.random() * online.length)];
      const delta = Math.floor(Math.random() * 7) + 2;
      const nextFill = Math.min(100, target.fill_percentage + delta);
      ingestTelemetry(
        {
          dustbin_id: target.id,
          fill_percentage: nextFill,
          waste_type: target.waste_category,
          weight: Number((target.weight + delta * 0.24).toFixed(1)),
          temperature: Number((28.5 + Math.random() * 5.8).toFixed(1)),
          humidity: Math.round(48 + Math.random() * 20),
          gas_ppm: Math.round((target.gas_ppm ?? 140) + delta * 4),
          battery_level: Math.max(15, (target.battery_level ?? 88) - (Math.random() > 0.7 ? 1 : 0)),
          solar_charging: target.solar_charging ?? true,
          sensor_status: 'online',
        },
        'Simulation',
      );
    }, simulationIntervalSec * 1000);

    return () => window.clearInterval(timer);
  }, [simulationRunning, simulationIntervalSec, state.dustbins, ingestTelemetry]);

  const markAlertRead = useCallback((alertId: string) => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => (n.id === alertId ? { ...n, is_read: true } : n)),
    }));
  }, []);

  const markAllAlertsRead = useCallback(() => {
    setState(prev => ({
      ...prev,
      notifications: prev.notifications.map(n => ({ ...n, is_read: true })),
    }));
    notify('All campus alerts marked as read.', 'info');
  }, [notify]);

  const updateThresholds = useCallback(
    (next: Thresholds) => {
      const nowIso = new Date().toISOString();
      setState(prev => ({
        ...prev,
        thresholds: next,
        auditLogs: [
          {
            id: createClientId('LOG'),
            user_name: user?.full_name || 'Administrator',
            role: user?.role || 'Super Admin',
            action: 'THRESHOLDS_UPDATED',
            entity_type: 'SystemSettings',
            entity_id: 'CAMPUS-GLOBAL',
            details: `Normal <=${next.normalMax}%, Moderate <=${next.moderateMax}%, Urgent >=${next.urgentMin}%, Max Gas ${next.maxSafeGasPpm ?? 400}ppm.`,
            created_at: nowIso,
          },
          ...prev.auditLogs,
        ].slice(0, 120),
      }));
      notify('Campus alert thresholds saved.');
    },
    [user, notify],
  );

  const submitQrReport = useCallback(
    (input: {
      dustbin_id: string;
      reporter_role: QrIssueReport['reporter_role'];
      issue_type: QrIssueReport['issue_type'];
      comment: string;
    }) => {
      const report = sensorService.buildQrIssueReport(input);
      setState(prev => {
        const target = prev.dustbins.find(b => b.id === input.dustbin_id);
        const alert: AlertNotification = {
          id: createClientId('ALT'),
          dustbin_id: input.dustbin_id,
          location: target?.campus_zone || target?.location_name || 'Campus',
          alert_type: `QR Report · ${input.issue_type}`,
          severity: input.issue_type === 'Overflowing' || input.issue_type === 'Odor Alert' ? 'High' : 'Warning',
          message: `[Campus QR · ${input.reporter_role}] ${report.comment}`,
          is_read: false,
          created_at: report.created_at,
        };
        return {
          ...prev,
          qrReports: [report, ...(prev.qrReports || [])],
          notifications: [alert, ...prev.notifications],
        };
      });
      notify(`QR issue logged for ${input.dustbin_id}.`);
    },
    [notify],
  );

  const resolveQrReport = useCallback((reportId: string) => {
    setState(prev => ({
      ...prev,
      qrReports: (prev.qrReports || []).map(r => (r.id === reportId ? { ...r, resolved: true } : r)),
    }));
  }, []);

  const updateUserAccount = useCallback(
    async (userId: string, payload: UpdateUserRequest) => {
      const { user: updated } = await userService.updateUser(userId, payload);
      setUsers(prev => prev.map(u => (u.id === updated.id ? updated : u)));
      updateCurrentUser(updated);
      notify(`Updated ${updated.full_name} (${updated.role} · ${updated.account_status}).`);
    },
    [updateCurrentUser, notify],
  );

  return (
    <AppStateContext.Provider
      value={{
        state,
        accessibleBins,
        users,
        loadingData,
        savingState,
        realtimeStatus,
        simulationRunning,
        simulationIntervalSec,
        setSimulationRunning,
        setSimulationIntervalSec,
        toast,
        dismissToast,
        notify,
        upsertDustbin,
        deleteDustbin,
        recordCollection,
        ingestTelemetry,
        markAlertRead,
        markAllAlertsRead,
        updateThresholds,
        submitQrReport,
        resolveQrReport,
        updateUserAccount,
        reloadAll,
      }}
    >
      {children}
    </AppStateContext.Provider>
  );
};

export function useAppState(): AppStateContextValue {
  const ctx = useContext(AppStateContext);
  if (!ctx) throw new Error('useAppState must be used inside AppStateProvider.');
  return ctx;
}
