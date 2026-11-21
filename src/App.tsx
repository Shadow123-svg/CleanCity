import React, { useState, useEffect, useMemo, useCallback, useRef } from 'react';
import {
  Trash2, MapPin, Bell, BarChart3, Users, Settings, LogOut, Shield,
  Plus, Search, Filter, RefreshCw, CheckCircle2, AlertTriangle,
  Wifi, WifiOff, Thermometer, Scale, Clock, Calendar, FileDown,
  Eye, EyeOff, Terminal, Cpu, Play, Pause, ChevronRight, Edit3,
  Check, X, ArrowUpDown, Activity, Layers, Lock, UserCheck, Code, Copy, Info
} from 'lucide-react';
import {
  LineChart, Line, BarChart, Bar, PieChart, Pie, Cell,
  XAxis, YAxis, CartesianGrid, Tooltip, Legend, ResponsiveContainer, AreaChart, Area
} from 'recharts';
import { ApiError, apiRequest } from './api';

// ============================================================================
// TYPES
// ============================================================================
type Role = 'Super Admin' | 'Administrator' | 'Field Staff';
type AccountStatus = 'Active' | 'Pending Approval' | 'Deactivated';
type SensorStatus = 'online' | 'offline';

interface User {
  id: string;
  full_name: string;
  email: string;
  phone: string;
  organization: string;
  role: Role;
  employee_id: string;
  account_status: AccountStatus;
  created_at: string;
}

interface Dustbin {
  id: string;
  name: string;
  location_name: string;
  address: string;
  latitude: number;
  longitude: number;
  installation_date: string;
  waste_category: string;
  operational_status: string;
  sensor_status: SensorStatus;
  fill_percentage: number;
  weight: number;
  temperature: number;
  last_collection_date: string;
  last_collection_time: string;
  next_scheduled_collection: string;
  assigned_staff_id: string;
  device_api_key: string;
  last_sensor_update: string;
  notes: string;
}

interface SensorReading {
  id: string;
  dustbin_id: string;
  fill_percentage: number;
  waste_type: string;
  weight: number;
  temperature: number;
  sensor_status: SensorStatus;
  recorded_at: string;
  source: 'Hardware' | 'Simulation' | 'Collection Reset';
}

interface Collection {
  id: string;
  dustbin_id: string;
  collected_by: string;
  staff_id: string;
  collection_date: string;
  collection_time: string;
  waste_quantity: number;
  notes: string;
  created_at: string;
}

interface Notification {
  id: string;
  dustbin_id: string;
  location: string;
  alert_type: string;
  severity: 'Critical' | 'High' | 'Warning' | 'Info';
  message: string;
  is_read: boolean;
  created_at: string;
}

interface AuditLog {
  id: string;
  user_name: string;
  role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}

interface Thresholds {
  normalMax: number;
  moderateMax: number;
  urgentMin: number;
  offlineTimeoutHours: number;
  maxSafeTemp: number;
}

// ============================================================================
// ID GENERATOR (collision-safe)
// ============================================================================
let __idCounter = 0;
const uid = (prefix: string) => {
  __idCounter = (__idCounter + 1) % 10000;
  return `${prefix}-${Date.now().toString(36)}${__idCounter.toString(36).padStart(2, '0')}`;
};

// ============================================================================
// INITIAL SEED DATA
// ============================================================================
const TODAY_DATE = '2026-11-17';

const EMPTY_USER: User = {
  id: '', full_name: '', email: '', phone: '', organization: '',
  role: 'Field Staff', employee_id: '', account_status: 'Deactivated', created_at: '',
};

const INITIAL_DUSTBINS: Dustbin[] = [
  { id: 'DB001', name: 'Central Market Plaza Bin A', location_name: 'Connaught Sector 4', address: 'Block A, Inner Circle, Main Market Road', latitude: 23.2599, longitude: 77.4126, installation_date: '2026-05-10', waste_category: 'Plastic', operational_status: 'Active', sensor_status: 'online', fill_percentage: 86, weight: 18.4, temperature: 31.5, last_collection_date: '2026-11-16', last_collection_time: '14:20', next_scheduled_collection: '2026-11-18', assigned_staff_id: 'USR-003', device_api_key: 'DEV-KEY-DB001', last_sensor_update: '2026-11-17T16:30:00Z', notes: 'High footfall commercial zone.' },
  { id: 'DB002', name: 'City Hospital Gate 2', location_name: 'Medical Enclave', address: 'Gate 2, District Civil Hospital Campus', latitude: 23.2645, longitude: 77.4051, installation_date: '2026-06-01', waste_category: 'Wet', operational_status: 'Active', sensor_status: 'online', fill_percentage: 96, weight: 27.8, temperature: 34.1, last_collection_date: '2026-11-15', last_collection_time: '09:10', next_scheduled_collection: '2026-11-17', assigned_staff_id: 'USR-003', device_api_key: 'DEV-KEY-DB002', last_sensor_update: '2026-11-17T16:42:00Z', notes: 'Requires daily prioritized pickup.' },
  { id: 'DB003', name: 'Tech Park Tower B', location_name: 'IT Corridor Phase 1', address: 'Plot 12, Cyber Park Avenue', latitude: 23.2488, longitude: 77.4289, installation_date: '2026-07-15', waste_category: 'Paper', operational_status: 'Active', sensor_status: 'online', fill_percentage: 42, weight: 8.2, temperature: 28.4, last_collection_date: '2026-11-17', last_collection_time: '08:00', next_scheduled_collection: '2026-11-19', assigned_staff_id: 'USR-004', device_api_key: 'DEV-KEY-DB003', last_sensor_update: '2026-11-17T16:40:00Z', notes: 'Dry paper and cardboard recyclables.' },
  { id: 'DB004', name: 'Railway Station West Exit', location_name: 'Junction Transit Hub', address: 'Platform 6 Exit Road, West Wing', latitude: 23.2712, longitude: 77.4190, installation_date: '2026-04-20', waste_category: 'Mixed', operational_status: 'Active', sensor_status: 'online', fill_percentage: 72, weight: 16.0, temperature: 32.0, last_collection_date: '2026-11-16', last_collection_time: '18:45', next_scheduled_collection: '2026-11-18', assigned_staff_id: 'USR-004', device_api_key: 'DEV-KEY-DB004', last_sensor_update: '2026-11-17T16:38:00Z', notes: 'Check twin ultrasonic sensors weekly.' },
  { id: 'DB005', name: 'Green Valley Botanical Park', location_name: 'Lakefront Promenade', address: 'North Walkway, Upper Lake Road', latitude: 23.2510, longitude: 77.3965, installation_date: '2026-08-05', waste_category: 'Dry', operational_status: 'Maintenance', sensor_status: 'offline', fill_percentage: 54, weight: 11.1, temperature: 29.0, last_collection_date: '2026-11-14', last_collection_time: '11:30', next_scheduled_collection: '2026-11-18', assigned_staff_id: 'USR-003', device_api_key: 'DEV-KEY-DB005', last_sensor_update: '2026-11-16T21:10:00Z', notes: 'LoRaWAN node battery low.' },
  { id: 'DB006', name: 'Industrial Metal Scrap Yard 3', location_name: 'MIDC Sector 9', address: 'Lane 4, Heavy Engineering Zone', latitude: 23.2801, longitude: 77.4342, installation_date: '2026-09-01', waste_category: 'Metal', operational_status: 'Active', sensor_status: 'online', fill_percentage: 28, weight: 22.5, temperature: 30.2, last_collection_date: '2026-11-17', last_collection_time: '10:15', next_scheduled_collection: '2026-11-20', assigned_staff_id: 'USR-004', device_api_key: 'DEV-KEY-DB006', last_sensor_update: '2026-11-17T16:44:00Z', notes: 'High-density metallic waste.' },
];

const INITIAL_SENSOR_HISTORY: SensorReading[] = [
  { id: 'SR-101', dustbin_id: 'DB001', fill_percentage: 35, waste_type: 'Plastic', weight: 7.2, temperature: 29.5, sensor_status: 'online', recorded_at: '2026-11-17T08:00:00Z', source: 'Hardware' },
  { id: 'SR-102', dustbin_id: 'DB001', fill_percentage: 58, waste_type: 'Plastic', weight: 12.1, temperature: 30.4, sensor_status: 'online', recorded_at: '2026-11-17T12:00:00Z', source: 'Hardware' },
  { id: 'SR-103', dustbin_id: 'DB001', fill_percentage: 86, waste_type: 'Plastic', weight: 18.4, temperature: 31.5, sensor_status: 'online', recorded_at: '2026-11-17T16:30:00Z', source: 'Hardware' },
  { id: 'SR-104', dustbin_id: 'DB002', fill_percentage: 62, waste_type: 'Wet', weight: 17.5, temperature: 32.0, sensor_status: 'online', recorded_at: '2026-11-17T09:00:00Z', source: 'Hardware' },
  { id: 'SR-105', dustbin_id: 'DB002', fill_percentage: 84, waste_type: 'Wet', weight: 24.0, temperature: 33.4, sensor_status: 'online', recorded_at: '2026-11-17T13:00:00Z', source: 'Hardware' },
  { id: 'SR-106', dustbin_id: 'DB002', fill_percentage: 96, waste_type: 'Wet', weight: 27.8, temperature: 34.1, sensor_status: 'online', recorded_at: '2026-11-17T16:42:00Z', source: 'Hardware' },
  { id: 'SR-107', dustbin_id: 'DB003', fill_percentage: 42, waste_type: 'Paper', weight: 8.2, temperature: 28.4, sensor_status: 'online', recorded_at: '2026-11-17T16:40:00Z', source: 'Hardware' },
  { id: 'SR-108', dustbin_id: 'DB004', fill_percentage: 72, waste_type: 'Mixed', weight: 16.0, temperature: 32.0, sensor_status: 'online', recorded_at: '2026-11-17T16:38:00Z', source: 'Hardware' },
  { id: 'SR-109', dustbin_id: 'DB005', fill_percentage: 54, waste_type: 'Dry', weight: 11.1, temperature: 29.0, sensor_status: 'offline', recorded_at: '2026-11-16T21:10:00Z', source: 'Hardware' },
  { id: 'SR-110', dustbin_id: 'DB006', fill_percentage: 28, waste_type: 'Metal', weight: 22.5, temperature: 30.2, sensor_status: 'online', recorded_at: '2026-11-17T16:44:00Z', source: 'Hardware' },
];

const INITIAL_COLLECTIONS: Collection[] = [
  { id: 'COL-201', dustbin_id: 'DB003', collected_by: 'Suresh Solanki', staff_id: 'USR-004', collection_date: '2026-11-17', collection_time: '08:00', waste_quantity: 19.5, notes: 'Cleared full paper recyclables.', created_at: '2026-11-17T08:05:00Z' },
  { id: 'COL-202', dustbin_id: 'DB006', collected_by: 'Suresh Solanki', staff_id: 'USR-004', collection_date: '2026-11-17', collection_time: '10:15', waste_quantity: 38.0, notes: 'Heavy scrap metal canister emptied.', created_at: '2026-11-17T10:20:00Z' },
  { id: 'COL-203', dustbin_id: 'DB001', collected_by: 'Ramesh Verma', staff_id: 'USR-003', collection_date: '2026-11-16', collection_time: '14:20', waste_quantity: 21.2, notes: 'Routine afternoon collection.', created_at: '2026-11-16T14:25:00Z' },
  { id: 'COL-204', dustbin_id: 'DB004', collected_by: 'Suresh Solanki', staff_id: 'USR-004', collection_date: '2026-11-16', collection_time: '18:45', waste_quantity: 24.6, notes: 'Evening rush hour clearance.', created_at: '2026-11-16T18:50:00Z' },
];

const INITIAL_NOTIFICATIONS: Notification[] = [
  { id: 'ALT-301', dustbin_id: 'DB002', location: 'Medical Enclave', alert_type: 'Critical Capacity (>=95%)', severity: 'Critical', message: 'Dustbin DB002 (City Hospital Gate 2) has reached 96% capacity. Urgent collection required!', is_read: false, created_at: '2026-11-17T16:42:00Z' },
  { id: 'ALT-302', dustbin_id: 'DB001', location: 'Connaught Sector 4', alert_type: 'High Capacity (>=80%)', severity: 'High', message: 'Dustbin DB001 (Central Market Plaza Bin A) crossed 80% threshold (currently 86%).', is_read: false, created_at: '2026-11-17T16:30:00Z' },
  { id: 'ALT-303', dustbin_id: 'DB005', location: 'Lakefront Promenade', alert_type: 'Sensor Offline', severity: 'Warning', message: 'Dustbin DB005 has not transmitted telemetry for over 18 hours. Check ESP32 node connectivity.', is_read: false, created_at: '2026-11-17T09:15:00Z' },
];

const INITIAL_AUDIT_LOGS: AuditLog[] = [
  { id: 'LOG-01', user_name: 'ESP32 Gateway (DB002)', role: 'IoT Device', action: 'SENSOR_DATA_INGESTED', entity_type: 'SensorReading', entity_id: 'DB002', details: 'POST /api/sensors/data -> Fill: 96%, Weight: 27.8kg, Temp: 34.1°C', created_at: '2026-11-17T16:42:00Z' },
  { id: 'LOG-02', user_name: 'Suresh Solanki', role: 'Field Staff', action: 'COLLECTION_CONFIRMED', entity_type: 'Collection', entity_id: 'DB006', details: 'Marked DB006 as collected (38.0 kg). Fill reset to 0%.', created_at: '2026-11-17T10:20:00Z' },
  { id: 'LOG-03', user_name: 'Arjun Mehta', role: 'Super Admin', action: 'THRESHOLD_CONFIG_VERIFIED', entity_type: 'SystemSettings', entity_id: 'GLOBAL', details: 'Verified capacity thresholds: Normal <=60%, Moderate 61-80%, Critical >80%.', created_at: '2026-11-17T08:30:00Z' },
];

const DEFAULT_THRESHOLDS: Thresholds = {
  normalMax: 60,
  moderateMax: 80,
  urgentMin: 95,
  offlineTimeoutHours: 12,
  maxSafeTemp: 45,
};

// ============================================================================
// HELPERS
// ============================================================================
function calculateDaysBetween(dateString: string, referenceDateStr: string = TODAY_DATE): number {
  if (!dateString) return 0;
  const d1 = new Date(dateString);
  const d2 = new Date(referenceDateStr);
  if (Number.isNaN(d1.getTime()) || Number.isNaN(d2.getTime())) return 0;
  return Math.max(0, Math.floor((d2.getTime() - d1.getTime()) / 86_400_000));
}

function getBinVisualStatus(bin: Dustbin, t: Thresholds) {
  if (bin.sensor_status === 'offline' || bin.operational_status !== 'Active') {
    return {
      label: 'Offline / Disconnected', short: 'Offline',
      color: 'bg-slate-400 text-white',
      badge: 'bg-slate-100 text-slate-700 border-slate-300',
      hex: '#94a3b8', priority: 'Offline Inspection',
    };
  }
  if (bin.fill_percentage > t.moderateMax) {
    return {
      label: 'Critical', short: 'Critical',
      color: 'bg-red-600 text-white',
      badge: 'bg-red-50 text-red-700 border-red-200',
      hex: '#dc2626',
      priority: bin.fill_percentage >= t.urgentMin ? 'Urgent Collection (≥' + t.urgentMin + '%)' : 'High Priority (81–' + (t.urgentMin - 1) + '%)',
    };
  }
  if (bin.fill_percentage > t.normalMax) {
    return {
      label: 'Moderate', short: 'Moderate',
      color: 'bg-amber-500 text-white',
      badge: 'bg-amber-50 text-amber-800 border-amber-200',
      hex: '#f59e0b', priority: 'Collection Approaching (61–' + t.moderateMax + '%)',
    };
  }
  return {
    label: 'Normal', short: 'Normal',
    color: 'bg-emerald-600 text-white',
    badge: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    hex: '#059669', priority: 'Normal (0–' + t.normalMax + '%)',
  };
}

function escapeCsv(value: unknown): string {
  const s = String(value ?? '').replace(/"/g, '""');
  return `"${s}"`;
}

function timeAgo(iso: string): string {
  const ms = Date.now() - new Date(iso).getTime();
  const mins = Math.floor(ms / 60000);
  if (mins < 1) return 'just now';
  if (mins < 60) return `${mins}m ago`;
  const hrs = Math.floor(mins / 60);
  if (hrs < 24) return `${hrs}h ago`;
  return `${Math.floor(hrs / 24)}d ago`;
}

// ============================================================================
// SMALL UI PRIMITIVES
// ============================================================================
const Card: React.FC<{ className?: string; children: React.ReactNode }> = ({ className = '', children }) => (
  <div className={`bg-white rounded-2xl shadow-sm border border-slate-200/80 ${className}`}>{children}</div>
);

const SectionTitle: React.FC<{ title: string; subtitle?: string; action?: React.ReactNode }> = ({ title, subtitle, action }) => (
  <div className="flex flex-wrap items-end justify-between gap-3 border-b border-slate-200/80 pb-4 mb-5">
    <div>
      <h2 className="text-[15px] font-bold text-slate-800 tracking-tight">{title}</h2>
      {subtitle && <p className="text-xs text-slate-500 mt-0.5">{subtitle}</p>}
    </div>
    {action}
  </div>
);

const Badge: React.FC<{ tone?: 'emerald' | 'amber' | 'red' | 'slate' | 'blue'; children: React.ReactNode }> = ({ tone = 'slate', children }) => {
  const tones: Record<string, string> = {
    emerald: 'bg-emerald-50 text-emerald-800 border-emerald-200',
    amber: 'bg-amber-50 text-amber-800 border-amber-200',
    red: 'bg-red-50 text-red-700 border-red-200',
    slate: 'bg-slate-100 text-slate-700 border-slate-300',
    blue: 'bg-blue-50 text-blue-800 border-blue-200',
  };
  return <span className={`inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold border ${tones[tone]}`}>{children}</span>;
};

const StatCard: React.FC<{ label: string; value: string | number; sub?: string; tone?: 'emerald' | 'amber' | 'red' | 'slate' | 'blue' | 'teal'; icon?: React.ElementType }> = ({ label, value, sub, tone = 'emerald', icon: Icon }) => {
  const borderTone: Record<string, string> = {
    emerald: 'border-l-emerald-600 text-emerald-700',
    amber: 'border-l-amber-500 text-amber-700',
    red: 'border-l-red-600 text-red-600',
    slate: 'border-l-slate-400 text-slate-600',
    blue: 'border-l-blue-600 text-blue-700',
    teal: 'border-l-teal-600 text-teal-700',
  };
  return (
    <div className={`bg-white p-4 rounded-xl border border-slate-200 border-l-4 ${borderTone[tone]} shadow-sm hover:shadow-md transition`}>
      <div className="flex items-start justify-between">
        <p className="text-[10px] font-semibold text-slate-500 uppercase tracking-wide">{label}</p>
        {Icon && <Icon className="w-4 h-4 opacity-50" />}
      </div>
      <p className="text-2xl font-extrabold mt-1.5 tabular-nums">{value}</p>
      {sub && <p className="text-[10px] text-slate-400 mt-0.5">{sub}</p>}
    </div>
  );
};

const Field: React.FC<{ label: string; children: React.ReactNode; className?: string }> = ({ label, children, className = '' }) => (
  <label className={`block ${className}`}>
    <span className="block text-[11px] font-semibold text-slate-700 mb-1">{label}</span>
    {children}
  </label>
);

const inputClass = 'w-full px-3 py-2 text-xs border border-slate-300 rounded-lg bg-white focus:outline-none focus:ring-2 focus:ring-emerald-500 focus:border-transparent transition';

// ============================================================================
// MAIN APP
// ============================================================================
export default function App() {
  // --- Auth ---
  const [authenticatedUser, setAuthenticatedUser] = useState<User | null>(null);
  const currentUser = authenticatedUser || EMPTY_USER;
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [authLoading, setAuthLoading] = useState(true);
  const [databaseReady, setDatabaseReady] = useState(false);
  const [authTab, setAuthTab] = useState<'login' | 'register' | 'forgot'>('login');
  const [loginEmail, setLoginEmail] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [showPassword, setShowPassword] = useState(false);
  const [rememberMe, setRememberMe] = useState(false);
  const [authBusy, setAuthBusy] = useState(false);
  const [authMessage, setAuthMessage] = useState<{ type: 'error' | 'success'; text: string } | null>(null);
  const [regForm, setRegForm] = useState({ full_name: '', email: '', phone: '', password: '', confirm_password: '', organization: 'Municipal Sanitation Wing', auth_code: '' });

  // --- Nav ---
  const [activeNav, setActiveNav] = useState('dashboard');
  const [selectedBinId, setSelectedBinId] = useState<string | null>(null);

  // --- Data ---
  const [users, setUsers] = useState<User[]>([]);
  const [dustbins, setDustbins] = useState<Dustbin[]>(INITIAL_DUSTBINS);
  const [sensorHistory, setSensorHistory] = useState<SensorReading[]>(INITIAL_SENSOR_HISTORY);
  const [collections, setCollections] = useState<Collection[]>(INITIAL_COLLECTIONS);
  const [notifications, setNotifications] = useState<Notification[]>(INITIAL_NOTIFICATIONS);
  const [auditLogs, setAuditLogs] = useState<AuditLog[]>(INITIAL_AUDIT_LOGS);
  const [thresholds, setThresholds] = useState<Thresholds>(DEFAULT_THRESHOLDS);

  // --- Simulator ---
  const [simulationRunning, setSimulationRunning] = useState(false);
  const [simulationIntervalSec, setSimulationIntervalSec] = useState(5);

  // --- Toast ---
  const [toast, setToast] = useState<{ msg: string; type: 'success' | 'error' } | null>(null);
  const toastTimer = useRef<number | null>(null);
  const triggerToast = useCallback((msg: string, type: 'success' | 'error' = 'success') => {
    if (toastTimer.current) window.clearTimeout(toastTimer.current);
    setToast({ msg, type });
    toastTimer.current = window.setTimeout(() => setToast(null), 4000);
  }, []);

  const loadSession = useCallback(async (user: User) => {
    const [userResult, stateResult] = await Promise.all([
      user.role !== 'Field Staff'
        ? apiRequest<{ users: User[] }>('/users')
        : Promise.resolve({ users: [user] }),
      apiRequest<{ state: Partial<{
        dustbins: Dustbin[];
        sensorHistory: SensorReading[];
        collections: Collection[];
        notifications: Notification[];
        auditLogs: AuditLog[];
        thresholds: Thresholds;
      }> | null }>('/state'),
    ]);
    setAuthenticatedUser(user);
    setUsers(userResult.users);
    if (stateResult.state) {
      const state = stateResult.state;
      if (Array.isArray(state.dustbins)) setDustbins(state.dustbins);
      if (Array.isArray(state.sensorHistory)) setSensorHistory(state.sensorHistory);
      if (Array.isArray(state.collections)) setCollections(state.collections);
      if (Array.isArray(state.notifications)) setNotifications(state.notifications);
      if (Array.isArray(state.auditLogs)) setAuditLogs(state.auditLogs);
      if (state.thresholds) setThresholds(state.thresholds);
    }
    setDatabaseReady(true);
    setIsAuthenticated(true);
    setAuthLoading(false);
  }, []);

  useEffect(() => {
    let active = true;
    apiRequest<{ user: User }>('/auth/me')
      .then(({ user }) => loadSession(user))
      .catch(error => {
        if (!active) return;
        if (!(error instanceof ApiError) || error.status !== 401) {
          setAuthMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to connect to the server.' });
        }
        setAuthLoading(false);
      });
    return () => { active = false; };
  }, [loadSession]);

  useEffect(() => {
    if (!isAuthenticated || !databaseReady) return;
    const timer = window.setTimeout(() => {
      apiRequest('/state', {
        method: 'PUT',
        body: JSON.stringify({ dustbins, sensorHistory, collections, notifications, auditLogs, thresholds }),
      }).catch(error => {
        triggerToast(error instanceof Error ? `Database save failed: ${error.message}` : 'Database save failed.', 'error');
      });
    }, 700);
    return () => window.clearTimeout(timer);
  }, [isAuthenticated, databaseReady, dustbins, sensorHistory, collections, notifications, auditLogs, thresholds, triggerToast]);

  // --- Dustbin filters ---
  const [searchQuery, setSearchQuery] = useState('');
  const [wasteFilter, setWasteFilter] = useState('All');
  const [statusFilter, setStatusFilter] = useState('All');
  const [capacityFilter, setCapacityFilter] = useState('All');
  const [sortBy, setSortBy] = useState('fill_desc');

  // --- Modals ---
  const [showBinModal, setShowBinModal] = useState(false);
  const [editingBin, setEditingBin] = useState<Dustbin | null>(null);
  const [binForm, setBinForm] = useState({
    id: '', name: '', location_name: '', address: '',
    latitude: 23.2599, longitude: 77.4126,
    waste_category: 'Mixed', operational_status: 'Active',
    assigned_staff_id: 'USR-003', notes: '',
  });
  const [collectionModalBin, setCollectionModalBin] = useState<Dustbin | null>(null);
  const [collectionForm, setCollectionForm] = useState({
    collection_date: TODAY_DATE, collection_time: '17:00',
    collected_by: 'Ramesh Verma', waste_quantity: '', notes: '',
  });

  // --- Map ---
  const [mapFilterStatus, setMapFilterStatus] = useState('All');
  const [mapFilterWaste, setMapFilterWaste] = useState('All');
  const [selectedMapBinId, setSelectedMapBinId] = useState<string | null>(INITIAL_DUSTBINS[1].id);

  // --- Collections filters ---
  const [colFilterStaff, setColFilterStaff] = useState('All');
  const [colFilterBin, setColFilterBin] = useState('All');

  // --- Webhook ---
  const [webhookPayload, setWebhookPayload] = useState({
    dustbin_id: 'DB001', device_api_key: 'DEV-KEY-DB001',
    fill_percentage: 91, waste_type: 'Plastic', weight: 21.4,
    temperature: 33.8, sensor_status: 'online' as SensorStatus,
  });

  // Role-based visible dustbins
  const accessibleDustbins = useMemo(() => {
    if (!currentUser) return [];
    if (currentUser.role === 'Field Staff') return dustbins.filter(b => b.assigned_staff_id === currentUser.id);
    return dustbins;
  }, [dustbins, currentUser]);

  // ============================================================================
  // CORE API ENGINE
  // ============================================================================
  const ingestSensorData = useCallback((payload: {
    dustbin_id: string; fill_percentage: number; waste_type?: string;
    weight: number; temperature: number; sensor_status?: SensorStatus;
    timestamp?: string;
  }, sourceType: 'Hardware' | 'Simulation' = 'Hardware'): boolean => {
    const numericFill = Number(payload.fill_percentage);
    const numericWeight = Number(payload.weight);
    const numericTemp = Number(payload.temperature);
    const sensor_status = payload.sensor_status ?? 'online';
    const timestamp = payload.timestamp ?? new Date().toISOString();

    if (!Number.isFinite(numericFill) || numericFill < 0 || numericFill > 100) {
      triggerToast('Rejected: fill_percentage must be between 0 and 100.', 'error');
      return false;
    }
    if (!Number.isFinite(numericWeight) || numericWeight < 0 || numericWeight > 500) {
      triggerToast('Rejected: weight out of valid sensor range.', 'error');
      return false;
    }

    const targetBin = dustbins.find(b => b.id === payload.dustbin_id);
    if (!targetBin) {
      triggerToast(`Rejected: Dustbin ID ${payload.dustbin_id} does not exist.`, 'error');
      return false;
    }

    // Append history
    const newReading: SensorReading = {
      id: uid('SR'),
      dustbin_id: payload.dustbin_id,
      fill_percentage: numericFill,
      waste_type: payload.waste_type || targetBin.waste_category,
      weight: numericWeight,
      temperature: numericTemp,
      sensor_status,
      recorded_at: timestamp,
      source: sourceType,
    };
    setSensorHistory(prev => [...prev, newReading]);

    // Update telemetry
    setDustbins(prev => prev.map(b => b.id === payload.dustbin_id ? {
      ...b, fill_percentage: numericFill,
      waste_category: payload.waste_type || b.waste_category,
      weight: numericWeight, temperature: numericTemp, sensor_status,
      last_sensor_update: timestamp,
    } : b));

    // Alerts
    const alerts: Notification[] = [];
    const base = { dustbin_id: payload.dustbin_id, location: targetBin.location_name, is_read: false, created_at: timestamp };
    if (sensor_status === 'offline') {
      alerts.push({ ...base, id: uid('ALT'), alert_type: 'Sensor Offline', severity: 'Warning', message: `[${sourceType}] Sensor on ${payload.dustbin_id} (${targetBin.name}) reported OFFLINE status.` });
    } else if (numericFill >= thresholds.urgentMin) {
      alerts.push({ ...base, id: uid('ALT'), alert_type: `Critical Capacity (≥${thresholds.urgentMin}%)`, severity: 'Critical', message: `[${sourceType}] ${payload.dustbin_id} (${targetBin.name}) reached ${numericFill}% capacity! Immediate collection required.` });
    } else if (numericFill > thresholds.moderateMax) {
      alerts.push({ ...base, id: uid('ALT'), alert_type: `High Capacity (>${thresholds.moderateMax}%)`, severity: 'High', message: `[${sourceType}] ${payload.dustbin_id} (${targetBin.name}) is at ${numericFill}% capacity.` });
    }
    if (numericTemp >= thresholds.maxSafeTemp) {
      alerts.push({ ...base, id: uid('ALT'), alert_type: 'Abnormal Temperature Alert', severity: 'Critical', message: `[${sourceType}] Heat risk! ${payload.dustbin_id} internal temperature reached ${numericTemp}°C.` });
    }
    if (alerts.length) setNotifications(prev => [...alerts, ...prev]);

    // Audit
    setAuditLogs(prev => [{
      id: uid('LOG'),
      user_name: sourceType === 'Simulation' ? `Simulator Service (${payload.dustbin_id})` : `ESP32 Node (${payload.dustbin_id})`,
      role: sourceType === 'Simulation' ? 'Simulation Mode' : 'IoT Hardware',
      action: 'SENSOR_DATA_INGESTED', entity_type: 'SensorReading', entity_id: payload.dustbin_id,
      details: `POST /api/sensors/data [${sourceType}] -> Fill: ${numericFill}%, Wt: ${numericWeight}kg, Temp: ${numericTemp}°C`,
      created_at: timestamp,
    }, ...prev]);

    return true;
  }, [dustbins, thresholds, triggerToast]);

  // ============================================================================
  // SIMULATOR LOOP (fixed stale closure)
  // ============================================================================
  useEffect(() => {
    if (!simulationRunning) return;
    const timer = window.setInterval(() => {
      const onlineBins = dustbins.filter(b => b.operational_status === 'Active');
      if (!onlineBins.length) return;
      const randomBin = onlineBins[Math.floor(Math.random() * onlineBins.length)];
      const deltaFill = Math.floor(Math.random() * 8) + 2;
      ingestSensorData({
        dustbin_id: randomBin.id,
        fill_percentage: Math.min(100, randomBin.fill_percentage + deltaFill),
        waste_type: randomBin.waste_category,
        weight: Number((randomBin.weight + deltaFill * 0.25).toFixed(1)),
        temperature: Number((28 + Math.random() * 7).toFixed(1)),
        sensor_status: 'online',
        timestamp: new Date().toISOString(),
      }, 'Simulation');
    }, simulationIntervalSec * 1000);
    return () => window.clearInterval(timer);
  }, [simulationRunning, simulationIntervalSec, dustbins, ingestSensorData]);

  // ============================================================================
  // COLLECTION CONFIRM
  // ============================================================================
  const handleConfirmCollection = (e: React.FormEvent) => {
    e.preventDefault();
    if (!collectionModalBin || !currentUser) return;

    const qty = Number(collectionForm.waste_quantity) || collectionModalBin.weight || 10.0;
    const nowIso = new Date().toISOString();

    const newCol: Collection = {
      id: uid('COL'),
      dustbin_id: collectionModalBin.id,
      collected_by: collectionForm.collected_by,
      staff_id: currentUser.id,
      collection_date: collectionForm.collection_date,
      collection_time: collectionForm.collection_time,
      waste_quantity: qty,
      notes: collectionForm.notes || 'Standard waste collection completed.',
      created_at: nowIso,
    };
    setCollections(prev => [newCol, ...prev]);

    const postColReading: SensorReading = {
      id: uid('SR'),
      dustbin_id: collectionModalBin.id,
      fill_percentage: 0,
      waste_type: collectionModalBin.waste_category,
      weight: 0,
      temperature: collectionModalBin.temperature,
      sensor_status: 'online',
      recorded_at: nowIso,
      source: 'Collection Reset',
    };
    setSensorHistory(prev => [...prev, postColReading]);

    setDustbins(prev => prev.map(b => b.id === collectionModalBin.id ? {
      ...b, fill_percentage: 0, weight: 0, sensor_status: 'online',
      operational_status: 'Active',
      last_collection_date: collectionForm.collection_date,
      last_collection_time: collectionForm.collection_time,
      last_sensor_update: nowIso,
    } : b));

    setAuditLogs(prev => [{
      id: uid('LOG'), user_name: currentUser.full_name, role: currentUser.role,
      action: 'COLLECTION_CONFIRMED', entity_type: 'Collection', entity_id: collectionModalBin.id,
      details: `Emptied ${collectionModalBin.id} (${qty} kg collected by ${collectionForm.collected_by}). Fill reset to 0%.`,
      created_at: nowIso,
    }, ...prev]);

    triggerToast(`Collection confirmed for ${collectionModalBin.id}. Fill reset to 0%!`);
    setCollectionModalBin(null);
  };

  // ============================================================================
  // KPI
  // ============================================================================
  const kpiStats = useMemo(() => {
    const total = accessibleDustbins.length;
    const active = accessibleDustbins.filter(b => b.sensor_status === 'online' && b.operational_status === 'Active').length;
    const offline = accessibleDustbins.filter(b => b.sensor_status === 'offline' || b.operational_status !== 'Active').length;
    const above80 = accessibleDustbins.filter(b => b.fill_percentage > thresholds.moderateMax && b.sensor_status === 'online').length;
    const immediate = accessibleDustbins.filter(b => b.fill_percentage >= thresholds.urgentMin && b.sensor_status === 'online').length;
    const totalWasteKg = collections.reduce((acc, c) => acc + Number(c.waste_quantity || 0), 0).toFixed(1);
    const completedToday = collections.filter(c => c.collection_date === TODAY_DATE).length;
    return { total, active, offline, above80, immediate, totalWasteKg, completedToday };
  }, [accessibleDustbins, collections, thresholds]);

  // ============================================================================
  // FILTERED DUSTBINS
  // ============================================================================
  const filteredDustbins = useMemo(() => {
    return accessibleDustbins
      .filter(b => {
        const q = searchQuery.toLowerCase();
        const matchesSearch = b.id.toLowerCase().includes(q) || b.name.toLowerCase().includes(q) || b.location_name.toLowerCase().includes(q);
        const matchesWaste = wasteFilter === 'All' || b.waste_category === wasteFilter;
        const vStatus = getBinVisualStatus(b, thresholds).short;
        const matchesStatus = statusFilter === 'All' || vStatus === statusFilter;
        let matchesCap = true;
        if (capacityFilter === '0-60') matchesCap = b.fill_percentage <= 60;
        if (capacityFilter === '61-80') matchesCap = b.fill_percentage > 60 && b.fill_percentage <= 80;
        if (capacityFilter === '81-100') matchesCap = b.fill_percentage > 80;
        return matchesSearch && matchesWaste && matchesStatus && matchesCap;
      })
      .sort((a, b) => {
        if (sortBy === 'fill_desc') return b.fill_percentage - a.fill_percentage;
        if (sortBy === 'fill_asc') return a.fill_percentage - b.fill_percentage;
        if (sortBy === 'date_desc') return new Date(b.last_collection_date).getTime() - new Date(a.last_collection_date).getTime();
        if (sortBy === 'date_asc') return new Date(a.last_collection_date).getTime() - new Date(b.last_collection_date).getTime();
        return 0;
      });
  }, [accessibleDustbins, searchQuery, wasteFilter, statusFilter, capacityFilter, sortBy, thresholds]);

  // Keep selected map bin valid when filters change
  const filteredMapBins = useMemo(() => {
    return dustbins.filter(b => {
      const st = getBinVisualStatus(b, thresholds).short;
      return (mapFilterStatus === 'All' || st === mapFilterStatus) && (mapFilterWaste === 'All' || b.waste_category === mapFilterWaste);
    });
  }, [dustbins, mapFilterStatus, mapFilterWaste, thresholds]);

  useEffect(() => {
    if (selectedMapBinId && !filteredMapBins.some(b => b.id === selectedMapBinId)) {
      setSelectedMapBinId(filteredMapBins[0]?.id ?? null);
    }
  }, [filteredMapBins, selectedMapBinId]);

  const selectedMapBin = filteredMapBins.find(b => b.id === selectedMapBinId) ?? null;

  // ============================================================================
  // CSV EXPORT (proper escaping)
  // ============================================================================
  const handleExportCSV = (reportType: 'dustbins' | 'collections') => {
    let csvContent = '';
    if (reportType === 'dustbins') {
      csvContent = 'Dustbin ID,Name,Location,Waste Category,Fill %,Weight (kg),Temp (C),Sensor Status,Last Collection\n';
      dustbins.forEach(b => {
        csvContent += `${b.id},"${b.name}","${b.location_name}",${b.waste_category},${b.fill_percentage},${b.weight},${b.temperature},${b.sensor_status},${b.last_collection_date}\n`;
      });
    } else {
      csvContent = 'Collection ID,Dustbin ID,Collected By,Date,Time,Quantity (kg),Notes\n';
      collections.forEach(c => {
        csvContent += `${c.id},${c.dustbin_id},${escapeCsv(c.collected_by)},${c.collection_date},${c.collection_time},${c.waste_quantity},${escapeCsv(c.notes)}\n`;
      });
    }
    const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `municipal_${reportType}_report_${TODAY_DATE}.csv`;
    a.click();
    URL.revokeObjectURL(url);
    triggerToast(`Exported ${reportType.toUpperCase()} report as CSV.`);
  };

  // ============================================================================
  // AUTH HANDLERS
  // ============================================================================
  const handleLoginSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    try {
      const { user } = await apiRequest<{ user: User }>('/auth/login', {
        method: 'POST',
        body: JSON.stringify({ email: loginEmail, password: loginPassword, remember_me: rememberMe }),
      });
      await loadSession(user);
      setAuthMessage(null);
      triggerToast(`Welcome back, ${user.full_name} (${user.role})`);
    } catch (error) {
      setAuthMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to sign in.' });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleRegisterSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setAuthBusy(true);
    try {
      const result = await apiRequest<{ message: string }>('/auth/register', {
        method: 'POST',
        body: JSON.stringify(regForm),
      });
      setAuthMessage({ type: 'success', text: result.message });
      setAuthTab('login');
      setLoginEmail(regForm.email);
      setLoginPassword('');
    } catch (error) {
      setAuthMessage({ type: 'error', text: error instanceof Error ? error.message : 'Unable to submit registration.' });
    } finally {
      setAuthBusy(false);
    }
  };

  const handleUserUpdate = async (user: User, changes: Pick<User, 'role' | 'account_status'>) => {
    try {
      const result = await apiRequest<{ user: User }>(`/users/${encodeURIComponent(user.id)}`, {
        method: 'PUT',
        body: JSON.stringify(changes),
      });
      setUsers(prev => prev.map(item => item.id === user.id ? result.user : item));
      setAuthenticatedUser(prev => prev?.id === user.id ? result.user : prev);
      triggerToast(`Updated ${user.full_name}.`);
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Could not update account.', 'error');
    }
  };

  const handleLogout = async () => {
    try {
      await apiRequest('/auth/logout', { method: 'POST', body: '{}' });
      setIsAuthenticated(false);
      setDatabaseReady(false);
      setAuthenticatedUser(null);
      setSelectedBinId(null);
    } catch (error) {
      triggerToast(error instanceof Error ? error.message : 'Could not sign out.', 'error');
    }
  };

  // ============================================================================
  // ADD / EDIT DUSTBIN
  // ============================================================================
  const handleSaveDustbin = (e: React.FormEvent) => {
    e.preventDefault();
    if (currentUser.role === 'Field Staff') {
      return triggerToast('Permission denied: Field Staff cannot create or reconfigure dustbins.', 'error');
    }
    if (editingBin) {
      setDustbins(prev => prev.map(b => b.id === editingBin.id ? {
        ...b,
        name: binForm.name, location_name: binForm.location_name, address: binForm.address,
        latitude: Number(binForm.latitude), longitude: Number(binForm.longitude),
        waste_category: binForm.waste_category, operational_status: binForm.operational_status,
        assigned_staff_id: binForm.assigned_staff_id, notes: binForm.notes,
      } : b));
      setAuditLogs(prev => [{
        id: uid('LOG'), user_name: currentUser.full_name, role: currentUser.role,
        action: 'DUSTBIN_UPDATED', entity_type: 'Dustbin', entity_id: editingBin.id,
        details: `Updated configuration for ${editingBin.id} (${binForm.name}).`,
        created_at: new Date().toISOString(),
      }, ...prev]);
      triggerToast(`Updated dustbin ${editingBin.id}`);
    } else {
      const newId = binForm.id.trim() || `DB${String(dustbins.length + 1).padStart(3, '0')}`;
      if (dustbins.some(b => b.id === newId)) return triggerToast(`Dustbin ID ${newId} already exists!`, 'error');
      const newBin: Dustbin = {
        id: newId, name: binForm.name, location_name: binForm.location_name, address: binForm.address,
        latitude: Number(binForm.latitude), longitude: Number(binForm.longitude),
        installation_date: TODAY_DATE, waste_category: binForm.waste_category,
        operational_status: binForm.operational_status, sensor_status: 'online',
        fill_percentage: 0, weight: 0, temperature: 28.0,
        last_collection_date: TODAY_DATE, last_collection_time: '09:00',
        next_scheduled_collection: '2026-11-20',
        assigned_staff_id: binForm.assigned_staff_id,
        device_api_key: `DEV-KEY-${newId}`,
        last_sensor_update: new Date().toISOString(),
        notes: binForm.notes,
      };
      setDustbins(prev => [newBin, ...prev]);
      setAuditLogs(prev => [{
        id: uid('LOG'), user_name: currentUser.full_name, role: currentUser.role,
        action: 'DUSTBIN_CREATED', entity_type: 'Dustbin', entity_id: newId,
        details: `Registered new smart dustbin ${newId} at ${newBin.location_name}.`,
        created_at: new Date().toISOString(),
      }, ...prev]);
      triggerToast(`Registered new smart dustbin ${newId}`);
    }
    setShowBinModal(false);
    setEditingBin(null);
  };

  const unreadAlertsCount = notifications.filter(n => !n.is_read).length;

  // ============================================================================
  // LOGIN SCREEN
  // ============================================================================
  if (authLoading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center text-sm text-emerald-100">
        Connecting to CleanCity…
      </div>
    );
  }

  if (!isAuthenticated) {
    return (
      <div className="min-h-screen bg-slate-900 flex flex-col justify-center items-center p-4 relative overflow-hidden">
        <div className="absolute inset-0 bg-gradient-to-br from-emerald-950 via-slate-900 to-emerald-800 opacity-90" />
        <div className="absolute -top-40 -right-40 w-96 h-96 rounded-full bg-emerald-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -left-40 w-96 h-96 rounded-full bg-emerald-400/10 blur-3xl" />
        <div className="relative z-10 w-full max-w-md bg-white rounded-2xl shadow-2xl border border-emerald-800/20 overflow-hidden">
          <div className="bg-gradient-to-br from-emerald-900 to-emerald-700 text-white p-7 text-center">
            <div className="w-14 h-14 rounded-2xl bg-white/10 border border-white/20 flex items-center justify-center mx-auto mb-3 backdrop-blur">
              <Trash2 className="w-7 h-7 text-emerald-200" />
            </div>
            <h1 className="text-lg font-bold tracking-tight">Municipal Smart Waste Portal</h1>
            <p className="text-xs text-emerald-200/80 mt-1">Centralized IoT Dustbin Telemetry & Sanitation Command</p>
          </div>
          <div className="flex border-b border-slate-200 bg-slate-50 text-xs font-semibold text-slate-600">
            {[
              { id: 'login', label: 'Login' },
              { id: 'register', label: 'Register' },
              { id: 'forgot', label: 'Reset' },
            ].map(t => (
              <button key={t.id} onClick={() => { setAuthTab(t.id as any); setAuthMessage(null); }}
                className={`flex-1 py-3 text-center border-b-2 transition ${authTab === t.id ? 'border-emerald-700 text-emerald-900 bg-white' : 'border-transparent hover:bg-slate-100'}`}>
                {t.label}
              </button>
            ))}
          </div>
          <div className="p-6">
            {authMessage && (
              <div className={`mb-4 p-3 rounded-lg text-xs font-medium flex items-start gap-2 ${authMessage.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' : 'bg-emerald-50 text-emerald-800 border border-emerald-200'}`}>
                <AlertTriangle className="w-4 h-4 shrink-0 mt-0.5" />
                <span>{authMessage.text}</span>
              </div>
            )}

            {authTab === 'login' && (
              <form onSubmit={handleLoginSubmit} className="space-y-4">
                <Field label="Official Municipal Email">
                  <input type="email" required value={loginEmail} onChange={e => setLoginEmail(e.target.value)} className={inputClass} placeholder="name@municipal.gov.in" />
                </Field>
                <Field label="Password">
                  <div className="relative">
                    <input type={showPassword ? 'text' : 'password'} required value={loginPassword} onChange={e => setLoginPassword(e.target.value)} className={inputClass} />
                    <button type="button" onClick={() => setShowPassword(v => !v)} className="absolute right-2.5 top-2.5 text-slate-400 hover:text-slate-600" aria-label="Toggle password">
                      {showPassword ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
                    </button>
                  </div>
                </Field>
                <div className="flex items-center justify-between text-xs">
                  <label className="flex items-center gap-2 text-slate-600 cursor-pointer">
                    <input type="checkbox" checked={rememberMe} onChange={e => setRememberMe(e.target.checked)} className="rounded text-emerald-600 focus:ring-emerald-500" />
                    Remember me
                  </label>
                  <button type="button" onClick={() => setAuthTab('forgot')} className="text-emerald-700 font-semibold hover:underline">Forgot?</button>
                </div>
                <button type="submit" disabled={authBusy} className="w-full py-2.5 bg-emerald-900 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold rounded-lg shadow transition text-sm">
                  {authBusy ? 'Signing in…' : 'Sign In to Command Center'}
                </button>
              </form>
            )}

            {authTab === 'register' && (
              <form onSubmit={handleRegisterSubmit} className="space-y-3">
                <div className="p-2.5 bg-amber-50 border border-amber-200 rounded-lg text-[11px] text-amber-900">
                  <strong>Restricted:</strong> Registration requires a code from your system administrator. New accounts need administrator approval.
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Full Name"><input type="text" required value={regForm.full_name} onChange={e => setRegForm({ ...regForm, full_name: e.target.value })} className={inputClass} placeholder="Vikram Rathore" /></Field>
                  <Field label="Phone"><input type="text" required value={regForm.phone} onChange={e => setRegForm({ ...regForm, phone: e.target.value })} className={inputClass} placeholder="+91 98201 XXXXX" /></Field>
                </div>
                <Field label="Official Email"><input type="email" required value={regForm.email} onChange={e => setRegForm({ ...regForm, email: e.target.value })} className={inputClass} placeholder="vikram@municipal.gov.in" /></Field>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Department"><input type="text" required value={regForm.organization} onChange={e => setRegForm({ ...regForm, organization: e.target.value })} className={inputClass} /></Field>
                  <Field label="Registration Code"><input type="password" required value={regForm.auth_code} onChange={e => setRegForm({ ...regForm, auth_code: e.target.value })} className={`${inputClass} border-emerald-400 bg-emerald-50/40 font-mono`} /></Field>
                </div>
                <div className="grid grid-cols-2 gap-2">
                  <Field label="Password"><input type="password" required minLength={12} value={regForm.password} onChange={e => setRegForm({ ...regForm, password: e.target.value })} className={inputClass} /></Field>
                  <Field label="Confirm Password"><input type="password" required minLength={12} value={regForm.confirm_password} onChange={e => setRegForm({ ...regForm, confirm_password: e.target.value })} className={inputClass} /></Field>
                </div>
                <button type="submit" disabled={authBusy} className="w-full py-2 bg-emerald-900 hover:bg-emerald-800 disabled:opacity-60 text-white font-semibold rounded-lg shadow text-xs">{authBusy ? 'Submitting…' : 'Submit Account Request'}</button>
              </form>
            )}

            {authTab === 'forgot' && (
              <p className="text-xs text-slate-600">Password recovery is not configured. Contact your Super Admin to reset your account password.</p>
            )}
          </div>
        </div>
      </div>
    );
  }

  // ============================================================================
  // INSPECTED BIN
  // ============================================================================
  const inspectedBin = dustbins.find(b => b.id === selectedBinId) || null;

  // ============================================================================
  // MAIN LAYOUT
  // ============================================================================
  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col md:flex-row font-sans">
      {/* Toast */}
      {toast && (
        <div className={`fixed bottom-5 right-5 z-50 px-4 py-3 rounded-xl shadow-xl border flex items-center gap-2.5 text-xs font-semibold animate-in fade-in slide-in-from-bottom-2 ${toast.type === 'error' ? 'bg-red-900 text-white border-red-700' : 'bg-emerald-900 text-white border-emerald-500'}`}>
          {toast.type === 'error' ? <AlertTriangle className="w-4 h-4 text-red-300 shrink-0" /> : <CheckCircle2 className="w-4 h-4 text-emerald-300 shrink-0" />}
          <span>{toast.msg}</span>
        </div>
      )}

      {/* SIDEBAR */}
      <aside className="w-full md:w-64 bg-emerald-950 text-white flex flex-col justify-between shrink-0 shadow-xl md:h-screen md:sticky md:top-0">
        <div>
          <div className="p-5 border-b border-emerald-800/80">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-xl bg-emerald-700 flex items-center justify-center shadow-inner border border-emerald-400/30">
                <Trash2 className="w-5 h-5 text-emerald-100" />
              </div>
              <div>
                <h1 className="font-bold text-sm tracking-wide leading-tight">CleanCity IoT</h1>
                <p className="text-[11px] text-emerald-300">Smart Waste Command</p>
              </div>
            </div>
          </div>

          <div className="px-4 py-3 bg-emerald-950/80 border-b border-emerald-800/60">
            <div className="flex items-center justify-between text-[11px] text-emerald-300 mb-1">
              <span>Active Role</span>
              <span className="px-1.5 py-0.5 rounded bg-emerald-700 text-white font-semibold">{currentUser.role}</span>
            </div>
            <p className="text-xs text-white font-medium">{currentUser.full_name}</p>
          </div>

          <nav className="p-3 space-y-1 text-xs font-medium">
            {[
              { id: 'dashboard', label: 'Dashboard', icon: BarChart3 },
              { id: 'dustbins', label: 'Dustbin Management', icon: Trash2 },
              { id: 'map', label: 'Live Map', icon: MapPin },
              { id: 'collections', label: 'Collections', icon: CheckCircle2 },
              { id: 'alerts', label: 'Alerts', icon: Bell, badge: unreadAlertsCount },
              { id: 'analytics', label: 'Analytics & Reports', icon: Activity },
              { id: 'users', label: 'User Management', icon: Users, restricted: currentUser.role !== 'Super Admin' },
              { id: 'simulator', label: 'IoT API & Architecture', icon: Cpu },
              { id: 'settings', label: 'Settings', icon: Settings },
            ].map(item => {
              const IconComp = item.icon;
              const isActive = activeNav === item.id && !selectedBinId;
              return (
                <button key={item.id} onClick={() => { setSelectedBinId(null); setActiveNav(item.id); }}
                  className={`w-full flex items-center justify-between px-3.5 py-2.5 rounded-xl transition ${isActive ? 'bg-emerald-700 text-white font-semibold shadow-sm' : 'text-emerald-100/80 hover:bg-emerald-800/60 hover:text-white'}`}>
                  <div className="flex items-center gap-3">
                    <IconComp className="w-4 h-4 shrink-0" />
                    <span>{item.label}</span>
                  </div>
                  {item.badge && item.badge > 0 && <span className="px-1.5 py-0.5 text-[10px] font-bold rounded-full bg-red-500 text-white">{item.badge}</span>}
                  {item.restricted && <Lock className="w-3.5 h-3.5 text-emerald-400/70" />}
                </button>
              );
            })}
          </nav>
        </div>

        <div className="p-4 border-t border-emerald-800/80 space-y-3">
          <div className={`p-3 rounded-xl border text-xs ${simulationRunning ? 'bg-amber-500/20 border-amber-400/40 text-amber-100' : 'bg-emerald-900/60 border-emerald-700 text-emerald-200'}`}>
            <div className="flex items-center justify-between font-semibold mb-1">
              <span className="flex items-center gap-1.5"><Cpu className="w-3.5 h-3.5" />{simulationRunning ? 'SIMULATION' : 'HARDWARE READY'}</span>
              <button onClick={() => { setSimulationRunning(v => !v); triggerToast(!simulationRunning ? 'Simulation started.' : 'Simulation stopped. Awaiting ESP32 webhooks.'); }}
                className="px-2 py-0.5 rounded bg-white/10 hover:bg-white/20 text-white text-[10px]">
                {simulationRunning ? 'Stop' : 'Run'}
              </button>
            </div>
            <p className="text-[10px] opacity-85">{simulationRunning ? `Every ${simulationIntervalSec}s` : 'POST /api/sensors/data active'}</p>
          </div>
          <button onClick={handleLogout}
            className="w-full flex items-center justify-center gap-2 px-3 py-2 rounded-xl bg-red-600/90 hover:bg-red-600 text-white text-xs font-semibold transition">
            <LogOut className="w-4 h-4" /><span>Logout ({currentUser.full_name.split(' ')[0]})</span>
          </button>
        </div>
      </aside>

      {/* MAIN */}
      <div className="flex-1 flex flex-col min-w-0">
        <header className="bg-white border-b border-slate-200 px-6 py-3.5 flex flex-wrap items-center justify-between gap-4 sticky top-0 z-30">
          <div className="flex items-center gap-3 min-w-0">
            <h2 className="text-base md:text-lg font-bold text-slate-800 truncate">
              {selectedBinId ? `Dustbin — ${selectedBinId}` :
                activeNav === 'dashboard' ? 'Command Dashboard' :
                activeNav === 'dustbins' ? 'Dustbin Registry & Management' :
                activeNav === 'map' ? 'Live GPS Dustbin Map' :
                activeNav === 'collections' ? 'Collection Priority & Dispatch' :
                activeNav === 'alerts' ? 'Real-Time Alerts' :
                activeNav === 'analytics' ? 'Analytics & CSV Reports' :
                activeNav === 'users' ? 'User & RBAC Administration' :
                activeNav === 'simulator' ? 'ESP32 Webhook & Architecture' :
                'Thresholds & System Settings'}
            </h2>
            {simulationRunning && (
              <Badge tone="amber"><Activity className="w-3 h-3" /> SIM</Badge>
            )}
          </div>
          <div className="flex items-center gap-2">
            <button onClick={() => { setSelectedBinId(null); setActiveNav('simulator'); }}
              className="hidden sm:flex px-3 py-1.5 rounded-lg text-xs font-semibold bg-emerald-50 text-emerald-900 border border-emerald-200 hover:bg-emerald-100 items-center gap-1.5">
              <Terminal className="w-3.5 h-3.5" /> Test Webhook
            </button>
            <button onClick={() => { setSelectedBinId(null); setActiveNav('alerts'); }}
              className="relative p-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700" aria-label="Notifications">
              <Bell className="w-4 h-4" />
              {unreadAlertsCount > 0 && <span className="absolute -top-1 -right-1 w-4 h-4 rounded-full bg-red-600 text-white text-[10px] font-bold flex items-center justify-center">{unreadAlertsCount}</span>}
            </button>
          </div>
        </header>

        <main className="flex-1 p-4 md:p-6 overflow-y-auto space-y-6">
          {/* ============================================================
              BIN DETAIL
          ============================================================ */}
          {selectedBinId && inspectedBin ? (
            <div className="space-y-6">
              <div className="flex flex-wrap items-center justify-between gap-4">
                <button onClick={() => setSelectedBinId(null)} className="px-3.5 py-2 rounded-lg bg-white border border-slate-300 text-xs font-semibold text-slate-700 hover:bg-slate-50">← Back to Registry</button>
                <button onClick={() => {
                  setCollectionModalBin(inspectedBin);
                  setCollectionForm({ collection_date: TODAY_DATE, collection_time: new Date().toTimeString().slice(0, 5), collected_by: currentUser.full_name, waste_quantity: String(inspectedBin.weight || 12.0), notes: '' });
                }} className="px-4 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold shadow flex items-center gap-2">
                  <CheckCircle2 className="w-4 h-4" /> Mark Collected
                </button>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="p-6 flex flex-col items-center justify-center text-center">
                  <span className={`px-3 py-1 rounded-full text-xs font-bold border mb-4 ${getBinVisualStatus(inspectedBin, thresholds).badge}`}>
                    {getBinVisualStatus(inspectedBin, thresholds).label}
                  </span>
                  <div className="relative w-40 h-40">
                    <svg className="w-full h-full -rotate-90" viewBox="0 0 120 120">
                      <circle cx="60" cy="60" r="50" stroke="#e2e8f0" strokeWidth="12" fill="none" />
                      <circle cx="60" cy="60" r="50" stroke={getBinVisualStatus(inspectedBin, thresholds).hex} strokeWidth="12"
                        strokeDasharray={`${(inspectedBin.fill_percentage / 100) * 314} 314`} strokeLinecap="round" fill="none" />
                    </svg>
                    <div className="absolute inset-0 flex flex-col items-center justify-center">
                      <span className="text-3xl font-extrabold text-slate-800 tabular-nums">{inspectedBin.fill_percentage}%</span>
                      <span className="text-[11px] text-slate-500 font-medium">Filled</span>
                    </div>
                  </div>
                  <div className="w-full grid grid-cols-3 gap-2 mt-6 pt-4 border-t border-slate-100 text-xs">
                    <div className="p-2 rounded-lg bg-slate-50"><p className="text-slate-400 text-[10px]">Weight</p><p className="font-bold">{inspectedBin.weight} kg</p></div>
                    <div className="p-2 rounded-lg bg-slate-50"><p className="text-slate-400 text-[10px]">Temp</p><p className="font-bold">{inspectedBin.temperature} °C</p></div>
                    <div className="p-2 rounded-lg bg-slate-50"><p className="text-slate-400 text-[10px]">Link</p><p className={`font-bold uppercase ${inspectedBin.sensor_status === 'online' ? 'text-emerald-600' : 'text-red-500'}`}>{inspectedBin.sensor_status}</p></div>
                  </div>
                  <p className="text-[11px] text-slate-400 mt-3">Last packet: {inspectedBin.last_sensor_update}</p>
                </Card>

                <Card className="p-6 space-y-4">
                  <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider border-b pb-2">Metadata</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div><p className="text-slate-400">ID</p><p className="font-bold font-mono">{inspectedBin.id}</p></div>
                    <div><p className="text-slate-400">Name</p><p className="font-bold">{inspectedBin.name}</p></div>
                    <div><p className="text-slate-400">Sector</p><p className="font-semibold">{inspectedBin.location_name}</p></div>
                    <div><p className="text-slate-400">Category</p><Badge tone="emerald">{inspectedBin.waste_category}</Badge></div>
                    <div className="col-span-2"><p className="text-slate-400">Address</p><p className="font-medium">{inspectedBin.address}</p></div>
                    <div><p className="text-slate-400">GPS</p><p className="font-mono">{inspectedBin.latitude}, {inspectedBin.longitude}</p></div>
                    <div><p className="text-slate-400">Assigned</p><p className="font-semibold">{users.find(u => u.id === inspectedBin.assigned_staff_id)?.full_name || 'Unassigned'}</p></div>
                    <div><p className="text-slate-400">Installed</p><p className="font-semibold">{inspectedBin.installation_date} ({calculateDaysBetween(inspectedBin.installation_date)}d ago)</p></div>
                    <div><p className="text-slate-400">API Key</p><p className="font-mono text-[11px]">{inspectedBin.device_api_key}</p></div>
                  </div>
                </Card>

                <Card className="p-6 space-y-4">
                  <h3 className="text-sm font-bold text-emerald-900 uppercase tracking-wider border-b pb-2">Lifecycle</h3>
                  <div className="grid grid-cols-2 gap-3 text-xs">
                    <div className="p-3 rounded-xl bg-emerald-50 border border-emerald-200">
                      <p className="text-emerald-800 text-[11px]">Days Since Collection</p>
                      <p className="text-2xl font-extrabold text-emerald-900 mt-0.5">{calculateDaysBetween(inspectedBin.last_collection_date)}d</p>
                    </div>
                    <div className="p-3 rounded-xl bg-slate-50 border border-slate-200">
                      <p className="text-slate-500 text-[11px]">Total Pickups</p>
                      <p className="text-2xl font-extrabold mt-0.5">{collections.filter(c => c.dustbin_id === inspectedBin.id).length}</p>
                    </div>
                    <div><p className="text-slate-400">Last Collection</p><p className="font-bold">{inspectedBin.last_collection_date} @ {inspectedBin.last_collection_time}</p></div>
                    <div><p className="text-slate-400">Next Scheduled</p><p className="font-bold text-emerald-700">{inspectedBin.next_scheduled_collection}</p></div>
                    <div className="col-span-2"><p className="text-slate-400">Total Collected (this bin)</p>
                      <p className="font-bold text-sm">{collections.filter(c => c.dustbin_id === inspectedBin.id).reduce((s, c) => s + Number(c.waste_quantity || 0), 0).toFixed(1)} kg</p>
                    </div>
                    <div className="col-span-2 p-2.5 bg-slate-50 rounded-lg border border-slate-200">
                      <p className="text-slate-400 text-[11px]">Notes</p><p className="text-slate-700 mt-0.5">{inspectedBin.notes}</p>
                    </div>
                  </div>
                </Card>
              </div>

              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h4 className="text-sm font-bold mb-1">Historical Fill Trend</h4>
                  <p className="text-xs text-slate-500 mb-4">Preserves readings even after resets.</p>
                  <div className="h-60">
                    <ResponsiveContainer width="100%" height="100%">
                      <AreaChart data={sensorHistory.filter(s => s.dustbin_id === inspectedBin.id).map(s => ({ time: s.recorded_at.slice(11, 16), fillPercentage: s.fill_percentage, weight: s.weight }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="time" tick={{ fontSize: 11 }} />
                        <YAxis domain={[0, 100]} tick={{ fontSize: 11 }} />
                        <Tooltip />
                        <Area type="monotone" dataKey="fillPercentage" stroke="#047857" fill="#10b981" fillOpacity={0.25} name="Fill %" />
                      </AreaChart>
                    </ResponsiveContainer>
                  </div>
                </Card>

                <Card className="p-5">
                  <h4 className="text-sm font-bold mb-1">Telemetry Ledger</h4>
                  <p className="text-xs text-slate-500 mb-3">Immutable time-series of all packets.</p>
                  <div className="overflow-y-auto max-h-60 border rounded-xl">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-slate-50 text-slate-600 border-b sticky top-0">
                        <tr><th className="p-2.5">Timestamp</th><th className="p-2.5">Fill %</th><th className="p-2.5">Weight</th><th className="p-2.5">Source</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {sensorHistory.filter(s => s.dustbin_id === inspectedBin.id).slice().reverse().map(s => (
                          <tr key={s.id} className="hover:bg-slate-50">
                            <td className="p-2.5 font-mono text-[11px]">{s.recorded_at.replace('T', ' ').slice(0, 19)}</td>
                            <td className="p-2.5 font-bold">{s.fill_percentage}%</td>
                            <td className="p-2.5">{s.weight} kg</td>
                            <td className="p-2.5">
                              <Badge tone={s.source === 'Simulation' ? 'amber' : s.source === 'Collection Reset' ? 'blue' : 'emerald'}>{s.source}</Badge>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </Card>
              </div>
            </div>
          ) : null}

          {/* ============================================================
              DASHBOARD
          ============================================================ */}
          {!selectedBinId && activeNav === 'dashboard' && (
            <div className="space-y-6">
              <div className="grid grid-cols-2 sm:grid-cols-3 xl:grid-cols-7 gap-3">
                <StatCard label="Registered" value={kpiStats.total} sub="Total Network" tone="emerald" icon={Layers} />
                <StatCard label="Active Online" value={kpiStats.active} sub="Transmitting" tone="emerald" icon={Wifi} />
                <StatCard label="Offline" value={kpiStats.offline} sub="Check Node" tone="slate" icon={WifiOff} />
                <StatCard label="Above 80%" value={kpiStats.above80} sub="High Level" tone="amber" icon={AlertTriangle} />
                <StatCard label="Immediate" value={kpiStats.immediate} sub={`≥${thresholds.urgentMin}% Critical`} tone="red" icon={AlertTriangle} />
                <StatCard label="Collected" value={`${kpiStats.totalWasteKg} kg`} sub="Cumulative" tone="teal" icon={Scale} />
                <StatCard label="Today" value={kpiStats.completedToday} sub={TODAY_DATE} tone="blue" icon={Calendar} />
              </div>

              <Card className="p-5 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-3 text-xs font-semibold">
                  <span className="text-slate-700 font-bold">Thresholds:</span>
                  <Badge tone="emerald">Normal 0–{thresholds.normalMax}%</Badge>
                  <Badge tone="amber">Moderate {thresholds.normalMax + 1}–{thresholds.moderateMax}%</Badge>
                  <Badge tone="red">Critical {thresholds.moderateMax + 1}–100%</Badge>
                  <Badge tone="slate">Offline</Badge>
                </div>
                <button onClick={() => setActiveNav('settings')} className="text-xs font-semibold text-emerald-700 hover:underline">Configure →</button>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 p-5">
                  <SectionTitle title="Dustbin Network" subtitle="Click any bin to inspect live telemetry"
                    action={<button onClick={() => setActiveNav('dustbins')} className="text-xs font-semibold text-emerald-700 hover:underline">Open Table →</button>} />
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                    {accessibleDustbins.map(bin => {
                      const st = getBinVisualStatus(bin, thresholds);
                      return (
                        <div key={bin.id} onClick={() => setSelectedBinId(bin.id)}
                          className="p-4 rounded-xl border border-slate-200 hover:border-emerald-600 hover:shadow-md transition cursor-pointer bg-white">
                          <div className="flex items-start justify-between gap-2">
                            <div className="min-w-0">
                              <span className="font-mono text-xs font-bold text-emerald-900">{bin.id}</span>
                              <h4 className="font-bold text-sm text-slate-800 truncate">{bin.name}</h4>
                              <p className="text-xs text-slate-500 truncate">{bin.location_name}</p>
                            </div>
                            <Badge tone={st.short === 'Critical' ? 'red' : st.short === 'Moderate' ? 'amber' : st.short === 'Normal' ? 'emerald' : 'slate'}>{st.short}</Badge>
                          </div>
                          <div className="mt-3">
                            <div className="flex justify-between text-xs font-semibold mb-1"><span>Fill ({bin.waste_category})</span><span>{bin.fill_percentage}%</span></div>
                            <div className="w-full h-2.5 bg-slate-200 rounded-full overflow-hidden">
                              <div className="h-full rounded-full transition-all duration-500" style={{ width: `${bin.fill_percentage}%`, backgroundColor: st.hex }} />
                            </div>
                          </div>
                          <div className="mt-3 pt-2.5 border-t border-slate-200/80 flex items-center justify-between text-[11px] text-slate-500">
                            <span>{bin.weight} kg | {bin.temperature}°C</span>
                            <span>Last: {bin.last_collection_date}</span>
                          </div>
                        </div>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-5 flex flex-col">
                  <SectionTitle title="Recent Activity" subtitle="Sensor, collection, admin log" />
                  <div className="space-y-2.5 overflow-y-auto max-h-[480px] pr-1">
                    {auditLogs.slice(0, 12).map(log => (
                      <div key={log.id} className="p-3 rounded-xl bg-slate-50 border border-slate-200/80 text-xs">
                        <div className="flex items-center justify-between font-semibold">
                          <span className="text-emerald-900 text-[11px]">{log.action}</span>
                          <span className="text-[10px] text-slate-400 font-mono">{timeAgo(log.created_at)}</span>
                        </div>
                        <p className="text-slate-600 mt-1 text-[11px]">{log.details}</p>
                        <p className="text-[10px] text-slate-400 mt-1">By {log.user_name} · {log.role}</p>
                      </div>
                    ))}
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ============================================================
              DUSTBINS
          ============================================================ */}
          {!selectedBinId && activeNav === 'dustbins' && (
            <div className="space-y-5">
              <Card className="p-4 flex flex-wrap items-center justify-between gap-3">
                <div className="flex flex-wrap items-center gap-2 flex-1 min-w-0">
                  <div className="relative min-w-[200px] flex-1 max-w-xs">
                    <Search className="w-4 h-4 text-slate-400 absolute left-3 top-2.5" />
                    <input type="text" value={searchQuery} onChange={e => setSearchQuery(e.target.value)} placeholder="Search ID, name, location..." className={`${inputClass} pl-9`} />
                  </div>
                  <select value={wasteFilter} onChange={e => setWasteFilter(e.target.value)} className={inputClass}>
                    <option value="All">All Waste</option>
                    {['Wet', 'Dry', 'Plastic', 'Metal', 'Paper', 'Mixed'].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                  <select value={capacityFilter} onChange={e => setCapacityFilter(e.target.value)} className={inputClass}>
                    <option value="All">All Levels</option>
                    <option value="0-60">0–60%</option>
                    <option value="61-80">61–80%</option>
                    <option value="81-100">81–100%</option>
                  </select>
                  <select value={statusFilter} onChange={e => setStatusFilter(e.target.value)} className={inputClass}>
                    <option value="All">All Status</option>
                    <option value="Normal">Normal</option>
                    <option value="Moderate">Moderate</option>
                    <option value="Critical">Critical</option>
                    <option value="Offline">Offline</option>
                  </select>
                  <select value={sortBy} onChange={e => setSortBy(e.target.value)} className={`${inputClass} font-semibold text-emerald-900`}>
                    <option value="fill_desc">Highest Fill</option>
                    <option value="fill_asc">Lowest Fill</option>
                    <option value="date_desc">Newest Collection</option>
                    <option value="date_asc">Oldest Collection</option>
                  </select>
                </div>
                {currentUser.role !== 'Field Staff' && (
                  <button onClick={() => {
                    setEditingBin(null);
                    setBinForm({ id: `DB${String(dustbins.length + 1).padStart(3, '0')}`, name: '', location_name: '', address: '', latitude: 23.2610, longitude: 77.4150, waste_category: 'Mixed', operational_status: 'Active', assigned_staff_id: 'USR-003', notes: '' });
                    setShowBinModal(true);
                  }} className="px-4 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-2 shadow">
                    <Plus className="w-4 h-4" /> Add Dustbin
                  </button>
                )}
              </Card>

              <Card className="overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-emerald-950 text-white uppercase text-[11px]">
                      <tr>
                        <th className="p-3.5">ID</th>
                        <th className="p-3.5">Name & Location</th>
                        <th className="p-3.5">Waste</th>
                        <th className="p-3.5">Fill</th>
                        <th className="p-3.5">Telemetry</th>
                        <th className="p-3.5">Last Collection</th>
                        <th className="p-3.5">Staff</th>
                        <th className="p-3.5">Status</th>
                        <th className="p-3.5 text-right">Actions</th>
                      </tr>
                    </thead>
                    <tbody className="divide-y divide-slate-200">
                      {filteredDustbins.map(bin => {
                        const st = getBinVisualStatus(bin, thresholds);
                        const staffName = users.find(u => u.id === bin.assigned_staff_id)?.full_name || 'Unassigned';
                        return (
                          <tr key={bin.id} className="hover:bg-slate-50">
                            <td className="p-3.5 font-mono font-bold text-emerald-900">{bin.id}</td>
                            <td className="p-3.5"><p className="font-bold">{bin.name}</p><p className="text-slate-500 text-[11px]">{bin.location_name}</p></td>
                            <td className="p-3.5"><Badge>{bin.waste_category}</Badge></td>
                            <td className="p-3.5 w-40">
                              <div className="flex items-center justify-between font-bold mb-1"><span>{bin.fill_percentage}%</span><span className="text-[10px] text-slate-400">{bin.weight} kg</span></div>
                              <div className="w-full h-2 bg-slate-200 rounded-full overflow-hidden">
                                <div className="h-full rounded-full" style={{ width: `${bin.fill_percentage}%`, backgroundColor: st.hex }} />
                              </div>
                            </td>
                            <td className="p-3.5 text-[11px] text-slate-600"><div>{bin.temperature}°C</div><div className="text-slate-400">{bin.sensor_status}</div></td>
                            <td className="p-3.5"><p className="font-semibold">{bin.last_collection_date}</p><p className="text-[10px] text-slate-400">{calculateDaysBetween(bin.last_collection_date)}d ago</p></td>
                            <td className="p-3.5 font-medium">{staffName}</td>
                            <td className="p-3.5"><Badge tone={st.short === 'Critical' ? 'red' : st.short === 'Moderate' ? 'amber' : st.short === 'Normal' ? 'emerald' : 'slate'}>{st.short}</Badge></td>
                            <td className="p-3.5 text-right space-x-1.5 whitespace-nowrap">
                              <button onClick={() => setSelectedBinId(bin.id)} className="px-2.5 py-1 rounded-lg bg-emerald-50 text-emerald-900 hover:bg-emerald-100 font-semibold border border-emerald-200">Details</button>
                              <button onClick={() => {
                                setCollectionModalBin(bin);
                                setCollectionForm({ collection_date: TODAY_DATE, collection_time: new Date().toTimeString().slice(0, 5), collected_by: currentUser.full_name, waste_quantity: String(bin.weight || 10.0), notes: '' });
                              }} className="px-2.5 py-1 rounded-lg bg-emerald-900 text-white hover:bg-emerald-800 font-semibold">Collect</button>
                              {currentUser.role !== 'Field Staff' && (
                                <button onClick={() => {
                                  setEditingBin(bin);
                                  setBinForm({ id: bin.id, name: bin.name, location_name: bin.location_name, address: bin.address, latitude: bin.latitude, longitude: bin.longitude, waste_category: bin.waste_category, operational_status: bin.operational_status, assigned_staff_id: bin.assigned_staff_id, notes: bin.notes });
                                  setShowBinModal(true);
                                }} className="px-2 py-1 rounded-lg bg-slate-100 text-slate-700 hover:bg-slate-200">Edit</button>
                              )}
                            </td>
                          </tr>
                        );
                      })}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ============================================================
              MAP
          ============================================================ */}
          {!selectedBinId && activeNav === 'map' && (
            <div className="space-y-5">
              <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div className="flex flex-wrap items-center gap-2">
                  <span className="text-xs font-bold text-slate-700 mr-1">Filter:</span>
                  {['All', 'Critical', 'Moderate', 'Normal', 'Offline'].map(st => (
                    <button key={st} onClick={() => setMapFilterStatus(st)}
                      className={`px-3 py-1.5 rounded-xl text-xs font-semibold border transition ${mapFilterStatus === st ? 'bg-emerald-900 text-white border-emerald-900' : 'bg-slate-50 text-slate-700 border-slate-300 hover:bg-slate-100'}`}>
                      {st}
                    </button>
                  ))}
                  <select value={mapFilterWaste} onChange={e => setMapFilterWaste(e.target.value)} className={`${inputClass} ml-2`}>
                    <option value="All">All Waste</option>
                    {['Wet', 'Dry', 'Plastic', 'Metal', 'Paper', 'Mixed'].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </div>
                <div className="flex items-center gap-3 text-xs font-semibold">
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-emerald-600 inline-block" /> Normal</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-amber-500 inline-block" /> Moderate</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-red-600 inline-block" /> Critical</span>
                  <span className="flex items-center gap-1"><span className="w-3 h-3 rounded-full bg-slate-400 inline-block" /> Offline</span>
                </div>
              </Card>

              <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
                <Card className="lg:col-span-2 overflow-hidden flex flex-col min-h-[460px]">
                  <div className="px-4 py-2.5 bg-slate-800 text-white text-xs flex items-center justify-between">
                    <span className="font-semibold flex items-center gap-2"><MapPin className="w-4 h-4 text-emerald-400" />Municipal GIS Live Telemetry</span>
                    <span className="font-mono text-[11px] text-slate-300">23.2599° N, 77.4126° E</span>
                  </div>
                  <div className="relative flex-1 bg-[#e5efe9] overflow-hidden select-none">
                    <svg className="w-full h-full" viewBox="0 0 800 450" preserveAspectRatio="none">
                      <rect x="40" y="30" width="220" height="140" rx="20" fill="#d1fae5" />
                      <rect x="520" y="250" width="240" height="160" rx="24" fill="#d1fae5" />
                      <path d="M 0 320 Q 180 290 290 380 L 290 450 L 0 450 Z" fill="#bae6fd" />
                      <g stroke="#cbd5e1" strokeWidth="14" fill="none">
                        <line x1="0" y1="120" x2="800" y2="120" />
                        <line x1="0" y1="260" x2="800" y2="260" />
                        <line x1="220" y1="0" x2="220" y2="450" />
                        <line x1="480" y1="0" x2="480" y2="450" />
                        <path d="M 100 0 L 680 450" strokeWidth="10" />
                      </g>
                      <g stroke="#ffffff" strokeWidth="2" strokeDasharray="8 8" fill="none">
                        <line x1="0" y1="120" x2="800" y2="120" /><line x1="0" y1="260" x2="800" y2="260" />
                        <line x1="220" y1="0" x2="220" y2="450" /><line x1="480" y1="0" x2="480" y2="450" />
                      </g>
                      <text x="60" y="65" fill="#065f46" fontSize="12" fontWeight="bold" opacity="0.6">MEDICAL ENCLAVE</text>
                      <text x="260" y="100" fill="#334155" fontSize="12" fontWeight="bold" opacity="0.6">CONNAUGHT SECTOR 4</text>
                      <text x="530" y="95" fill="#334155" fontSize="12" fontWeight="bold" opacity="0.6">TRANSIT HUB & MIDC</text>
                      <text x="550" y="300" fill="#065f46" fontSize="12" fontWeight="bold" opacity="0.6">IT CORRIDOR</text>
                      <text x="40" y="410" fill="#0369a1" fontSize="12" fontWeight="bold" opacity="0.7">LAKEFRONT</text>
                    </svg>
                    {filteredMapBins.map(bin => {
                      const st = getBinVisualStatus(bin, thresholds);
                      const leftPct = Math.min(90, Math.max(10, ((bin.longitude - 77.39) / 0.05) * 80 + 10));
                      const topPct = Math.min(88, Math.max(12, ((23.285 - bin.latitude) / 0.04) * 75 + 12));
                      const isSelected = selectedMapBinId === bin.id;
                      return (
                        <button key={bin.id} onClick={() => setSelectedMapBinId(bin.id)} style={{ left: `${leftPct}%`, top: `${topPct}%` }}
                          className={`absolute -translate-x-1/2 -translate-y-1/2 group focus:outline-none transition-transform ${isSelected ? 'scale-125 z-20' : 'hover:scale-110 z-10'}`}>
                          <div className="px-2.5 py-1 rounded-full shadow-lg border-2 border-white flex items-center gap-1.5 text-white font-bold text-xs" style={{ backgroundColor: st.hex }}>
                            <Trash2 className="w-3.5 h-3.5" />
                            <span>{bin.id}</span>
                            <span className="bg-black/25 px-1.5 rounded-full text-[10px]">{bin.fill_percentage}%</span>
                          </div>
                        </button>
                      );
                    })}
                  </div>
                </Card>

                <Card className="p-5 flex flex-col justify-between">
                  {selectedMapBin ? (
                    <div className="space-y-4">
                      <div className="flex items-start justify-between border-b pb-3">
                        <div><span className="font-mono text-xs font-bold text-emerald-700">{selectedMapBin.id}</span><h3 className="text-base font-bold">{selectedMapBin.name}</h3><p className="text-xs text-slate-500">{selectedMapBin.location_name}</p></div>
                        <Badge tone={getBinVisualStatus(selectedMapBin, thresholds).short === 'Critical' ? 'red' : getBinVisualStatus(selectedMapBin, thresholds).short === 'Moderate' ? 'amber' : getBinVisualStatus(selectedMapBin, thresholds).short === 'Normal' ? 'emerald' : 'slate'}>{getBinVisualStatus(selectedMapBin, thresholds).short}</Badge>
                      </div>
                      <div className="space-y-2 text-xs">
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">Fill %</span><span className="font-bold">{selectedMapBin.fill_percentage}%</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">Waste</span><span className="font-bold text-emerald-900">{selectedMapBin.waste_category}</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">Wt / Temp</span><span className="font-semibold">{selectedMapBin.weight} kg | {selectedMapBin.temperature}°C</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">GPS</span><span className="font-mono">{selectedMapBin.latitude}, {selectedMapBin.longitude}</span></div>
                        <div className="flex justify-between py-1 border-b border-slate-100"><span className="text-slate-500">Last Collection</span><span className="font-semibold">{selectedMapBin.last_collection_date}</span></div>
                        <div className="flex justify-between py-1"><span className="text-slate-500">Status</span><span className="font-semibold">{selectedMapBin.operational_status}</span></div>
                      </div>
                      <div className="pt-3 flex gap-2">
                        <button onClick={() => setSelectedBinId(selectedMapBin.id)} className="flex-1 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 font-semibold text-xs border border-emerald-200">Full Details</button>
                        <button onClick={() => {
                          setCollectionModalBin(selectedMapBin);
                          setCollectionForm({ collection_date: TODAY_DATE, collection_time: new Date().toTimeString().slice(0, 5), collected_by: currentUser.full_name, waste_quantity: String(selectedMapBin.weight || 12.0), notes: '' });
                        }} className="flex-1 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs">Empty Bin</button>
                      </div>
                    </div>
                  ) : (
                    <p className="text-xs text-slate-400 m-auto text-center py-10">No bins match the current filter.<br />Try resetting filters above.</p>
                  )}
                </Card>
              </div>
            </div>
          )}

          {/* ============================================================
              COLLECTIONS
          ============================================================ */}
          {!selectedBinId && activeNav === 'collections' && (
            <div className="space-y-6">
              <Card className="p-5">
                <SectionTitle title="Priority Dispatch Queue" subtitle="Sorted by fill % (Urgent ≥95%, High 81–95%, Moderate 61–80%, Normal 0–60%)" />
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                  {accessibleDustbins.slice().sort((a, b) => b.fill_percentage - a.fill_percentage).map(bin => {
                    const st = getBinVisualStatus(bin, thresholds);
                    return (
                      <div key={bin.id} className="p-4 rounded-xl border border-slate-200 bg-slate-50/60 flex flex-col justify-between">
                        <div>
                          <div className="flex items-center justify-between gap-2">
                            <span className="font-mono text-xs font-bold text-emerald-900">{bin.id}</span>
                            <Badge tone={st.short === 'Critical' ? 'red' : st.short === 'Moderate' ? 'amber' : st.short === 'Normal' ? 'emerald' : 'slate'}>{st.priority}</Badge>
                          </div>
                          <h4 className="font-bold text-sm mt-1">{bin.name}</h4>
                          <p className="text-xs text-slate-500">{bin.location_name} • {bin.waste_category}</p>
                        </div>
                        <div className="mt-4 flex items-center justify-between pt-3 border-t border-slate-200">
                          <div><span className="text-lg font-extrabold tabular-nums">{bin.fill_percentage}%</span><span className="text-xs text-slate-500 ml-1">({bin.weight} kg)</span></div>
                          <button onClick={() => {
                            setCollectionModalBin(bin);
                            setCollectionForm({ collection_date: TODAY_DATE, collection_time: new Date().toTimeString().slice(0, 5), collected_by: currentUser.full_name, waste_quantity: String(bin.weight || 10.0), notes: '' });
                          }} className="px-3 py-1.5 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold">Record Collection</button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              </Card>

              <Card className="p-5">
                <SectionTitle title="Completed Collection Ledger" subtitle="Historical audit trail of all verified pickups"
                  action={
                    <div className="flex items-center gap-2 flex-wrap">
                      <select value={colFilterBin} onChange={e => setColFilterBin(e.target.value)} className={inputClass}>
                        <option value="All">All Dustbins</option>
                        {dustbins.map(b => <option key={b.id} value={b.id}>{b.id} – {b.name}</option>)}
                      </select>
                      <select value={colFilterStaff} onChange={e => setColFilterStaff(e.target.value)} className={inputClass}>
                        <option value="All">All Staff</option>
                        {Array.from(new Set(collections.map(c => c.collected_by))).map(name => <option key={name} value={name}>{name}</option>)}
                      </select>
                      <button onClick={() => handleExportCSV('collections')} className="px-3 py-2 rounded-xl bg-emerald-50 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5"><FileDown className="w-3.5 h-3.5" /> Export</button>
                    </div>
                  } />
                <div className="overflow-x-auto">
                  <table className="w-full text-left text-xs">
                    <thead className="bg-slate-100 text-slate-700 uppercase text-[11px]">
                      <tr><th className="p-3">ID</th><th className="p-3">Dustbin</th><th className="p-3">Collected By</th><th className="p-3">Date & Time</th><th className="p-3">Quantity</th><th className="p-3">Notes</th></tr>
                    </thead>
                    <tbody className="divide-y">
                      {collections.filter(c => (colFilterBin === 'All' || c.dustbin_id === colFilterBin) && (colFilterStaff === 'All' || c.collected_by === colFilterStaff)).map(col => (
                        <tr key={col.id} className="hover:bg-slate-50">
                          <td className="p-3 font-mono font-bold">{col.id}</td>
                          <td className="p-3 font-mono font-bold text-emerald-900">{col.dustbin_id}</td>
                          <td className="p-3 font-semibold">{col.collected_by}</td>
                          <td className="p-3">{col.collection_date} @ {col.collection_time}</td>
                          <td className="p-3 font-bold text-emerald-700">{col.waste_quantity} kg</td>
                          <td className="p-3 text-slate-600">{col.notes}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </Card>
            </div>
          )}

          {/* ============================================================
              ALERTS
          ============================================================ */}
          {!selectedBinId && activeNav === 'alerts' && (
            <Card className="p-5 space-y-4">
              <SectionTitle title="System Alerts" subtitle="Triggered on ≥80% fill, ≥95% critical, offline, or abnormal temperature"
                action={<button onClick={() => { setNotifications(prev => prev.map(n => ({ ...n, is_read: true }))); triggerToast('All marked as read.'); }} className="px-3 py-1.5 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">Mark All Read</button>} />
              <div className="space-y-3">
                {notifications.length === 0 && <p className="text-xs text-slate-400 text-center py-10">No alerts. Everything is healthy.</p>}
                {notifications.map(alert => (
                  <div key={alert.id} className={`p-4 rounded-xl border flex flex-wrap items-center justify-between gap-4 ${alert.is_read ? 'bg-slate-50 border-slate-200 opacity-70' : 'bg-white border-red-200 shadow-sm'}`}>
                    <div className="flex items-start gap-3">
                      <div className={`p-2 rounded-xl mt-0.5 ${alert.severity === 'Critical' ? 'bg-red-100 text-red-700' : alert.severity === 'High' ? 'bg-amber-100 text-amber-800' : 'bg-slate-200 text-slate-700'}`}>
                        <AlertTriangle className="w-4 h-4" />
                      </div>
                      <div>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="font-mono text-xs font-bold text-emerald-900">{alert.dustbin_id}</span>
                          <span className="text-xs font-bold">{alert.alert_type}</span>
                          <Badge tone={alert.severity === 'Critical' ? 'red' : alert.severity === 'High' ? 'amber' : 'slate'}>{alert.severity}</Badge>
                          {!alert.is_read && <Badge tone="emerald">NEW</Badge>}
                        </div>
                        <p className="text-xs text-slate-600 mt-1">{alert.message}</p>
                        <p className="text-[10px] text-slate-400 mt-1">{alert.location} · {alert.created_at.replace('T', ' ').slice(0, 19)}</p>
                      </div>
                    </div>
                    <div className="flex items-center gap-2">
                      <button onClick={() => setSelectedBinId(alert.dustbin_id)} className="px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-900 text-xs font-semibold border border-emerald-200">Inspect</button>
                      {!alert.is_read && <button onClick={() => setNotifications(prev => prev.map(n => n.id === alert.id ? { ...n, is_read: true } : n))} className="px-3 py-1.5 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold">Mark Read</button>}
                    </div>
                  </div>
                ))}
              </div>
            </Card>
          )}

          {/* ============================================================
              ANALYTICS
          ============================================================ */}
          {!selectedBinId && activeNav === 'analytics' && (
            <div className="space-y-6">
              <Card className="p-4 flex flex-wrap items-center justify-between gap-4">
                <div>
                  <h3 className="text-sm font-bold">Waste Analytics & Performance Reports</h3>
                  <p className="text-xs text-slate-500">Live charts from sensor readings and collection records</p>
                </div>
                <div className="flex items-center gap-2">
                  <button onClick={() => handleExportCSV('dustbins')} className="px-3.5 py-2 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold flex items-center gap-1.5 shadow"><FileDown className="w-4 h-4" /> Dustbins CSV</button>
                  <button onClick={() => handleExportCSV('collections')} className="px-3.5 py-2 rounded-xl bg-emerald-50 hover:bg-emerald-100 text-emerald-900 border border-emerald-200 text-xs font-semibold flex items-center gap-1.5"><FileDown className="w-4 h-4" /> Collections CSV</button>
                </div>
              </Card>
              <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
                <Card className="p-5">
                  <h4 className="text-sm font-bold mb-4">Dustbin Fill & Weight</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <BarChart data={dustbins.map(b => ({ name: b.id, fillPercentage: b.fill_percentage, weight: b.weight }))}>
                        <CartesianGrid strokeDasharray="3 3" stroke="#e2e8f0" />
                        <XAxis dataKey="name" tick={{ fontSize: 12 }} />
                        <YAxis tick={{ fontSize: 12 }} />
                        <Tooltip />
                        <Legend />
                        <Bar dataKey="fillPercentage" fill="#047857" name="Fill %" radius={[6, 6, 0, 0]} />
                        <Bar dataKey="weight" fill="#0f766e" name="Weight (kg)" radius={[6, 6, 0, 0]} />
                      </BarChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
                <Card className="p-5">
                  <h4 className="text-sm font-bold mb-4">Waste Category Distribution</h4>
                  <div className="h-64">
                    <ResponsiveContainer width="100%" height="100%">
                      <PieChart>
                        <Pie data={['Plastic', 'Wet', 'Paper', 'Mixed', 'Dry', 'Metal'].map(cat => ({ name: cat, value: dustbins.filter(b => b.waste_category === cat).length }))}
                          dataKey="value" nameKey="name" cx="50%" cy="50%" outerRadius={85} labelLine={false} label={({ name, value }: { name?: string; value?: number | string }) => value !== undefined && value !== null && value !== 0 ? `${name ?? 'Category'}: ${value}` : ''}>
                          {['#047857', '#059669', '#10b981', '#f59e0b', '#64748b', '#0d9488'].map((c, i) => <Cell key={i} fill={c} />)}
                        </Pie>
                        <Tooltip />
                      </PieChart>
                    </ResponsiveContainer>
                  </div>
                </Card>
              </div>
            </div>
          )}

          {/* ============================================================
              USERS
          ============================================================ */}
          {!selectedBinId && activeNav === 'users' && (
            <div className="space-y-6">
              {currentUser.role !== 'Super Admin' ? (
                <Card className="p-8 text-center space-y-2 border-amber-300 bg-amber-50">
                  <Lock className="w-8 h-8 text-amber-700 mx-auto" />
                  <h3 className="text-base font-bold text-amber-900">Super Admin Required</h3>
                  <p className="text-xs text-amber-800 max-w-md mx-auto">Your current role is <strong>{currentUser.role}</strong>. Only a Super Admin can manage user accounts.</p>
                </Card>
              ) : (
                <Card className="p-5">
                  <SectionTitle title="Personnel & RBAC Directory" subtitle="Approve requests, manage roles, review assignments" />
                  <div className="overflow-x-auto">
                    <table className="w-full text-left text-xs">
                      <thead className="bg-emerald-950 text-white uppercase text-[11px]">
                        <tr><th className="p-3">User ID</th><th className="p-3">Name & Email</th><th className="p-3">Department</th><th className="p-3">Role</th><th className="p-3">Bins</th><th className="p-3">Status</th><th className="p-3 text-right">Actions</th></tr>
                      </thead>
                      <tbody className="divide-y">
                        {users.map(u => {
                          const assignedCount = dustbins.filter(b => b.assigned_staff_id === u.id).length;
                          return (
                            <tr key={u.id} className="hover:bg-slate-50">
                              <td className="p-3 font-mono font-bold text-emerald-900">{u.id}</td>
                              <td className="p-3"><p className="font-bold">{u.full_name}</p><p className="text-slate-500 text-[11px]">{u.email}</p></td>
                              <td className="p-3">{u.organization}</td>
                              <td className="p-3">
                                <select value={u.role} onChange={e => {
                                  const newRole = e.target.value as Role;
                                  void handleUserUpdate(u, { role: newRole, account_status: u.account_status });
                                }} className="px-2 py-1 border border-slate-300 rounded-lg bg-white font-semibold">
                                  <option value="Super Admin">Super Admin</option>
                                  <option value="Administrator">Administrator</option>
                                  <option value="Field Staff">Field Staff</option>
                                </select>
                              </td>
                              <td className="p-3 font-bold">{assignedCount}</td>
                              <td className="p-3"><Badge tone={u.account_status === 'Active' ? 'emerald' : u.account_status === 'Pending Approval' ? 'amber' : 'slate'}>{u.account_status}</Badge></td>
                              <td className="p-3 text-right space-x-2">
                                {u.account_status !== 'Active' ? (
                                  <button onClick={() => { void handleUserUpdate(u, { role: u.role, account_status: 'Active' }); }} className="px-2.5 py-1 rounded-lg bg-emerald-900 text-white font-semibold">Approve</button>
                                ) : (
                                  <button onClick={() => {
                                    if (u.id === currentUser.id) return triggerToast('Cannot deactivate your own account.', 'error');
                                    void handleUserUpdate(u, { role: u.role, account_status: 'Deactivated' });
                                  }} className="px-2.5 py-1 rounded-lg bg-red-50 text-red-700 border border-red-200 font-semibold">Deactivate</button>
                                )}
                              </td>
                            </tr>
                          );
                        })}
                      </tbody>
                    </table>
                  </div>
                </Card>
              )}
            </div>
          )}

          {/* ============================================================
              SIMULATOR / API
          ============================================================ */}
          {!selectedBinId && activeNav === 'simulator' && (
            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <Card className="p-6 space-y-4">
                <div className="flex items-center justify-between border-b pb-3">
                  <div>
                    <Badge tone="emerald">POST /api/sensors/data</Badge>
                    <h3 className="text-base font-bold mt-1">ESP32 Telemetry Endpoint</h3>
                  </div>
                  <Cpu className="w-6 h-6 text-emerald-700" />
                </div>
                <p className="text-xs text-slate-600">Dispatch a JSON payload to test ingestion, or use the sidebar Simulator toggle.</p>
                <div className="grid grid-cols-2 gap-3 text-xs">
                  <Field label="Dustbin">
                    <select value={webhookPayload.dustbin_id} onChange={e => {
                      const b = dustbins.find(item => item.id === e.target.value);
                      setWebhookPayload({ ...webhookPayload, dustbin_id: e.target.value, device_api_key: b ? b.device_api_key : 'DEV-KEY-DB001', waste_type: b ? b.waste_category : 'Mixed' });
                    }} className={inputClass}>
                      {dustbins.map(b => <option key={b.id} value={b.id}>{b.id} ({b.name})</option>)}
                    </select>
                  </Field>
                  <Field label="Fill % (0–100)">
                    <input type="number" min={0} max={100} value={webhookPayload.fill_percentage} onChange={e => setWebhookPayload({ ...webhookPayload, fill_percentage: Number(e.target.value) })} className={inputClass} />
                  </Field>
                  <Field label="Waste Type">
                    <select value={webhookPayload.waste_type} onChange={e => setWebhookPayload({ ...webhookPayload, waste_type: e.target.value })} className={inputClass}>
                      {['Wet', 'Dry', 'Plastic', 'Metal', 'Paper', 'Mixed'].map(w => <option key={w} value={w}>{w}</option>)}
                    </select>
                  </Field>
                  <Field label="Weight (kg)">
                    <input type="number" step="0.1" value={webhookPayload.weight} onChange={e => setWebhookPayload({ ...webhookPayload, weight: Number(e.target.value) })} className={inputClass} />
                  </Field>
                  <Field label="Temperature (°C)">
                    <input type="number" step="0.1" value={webhookPayload.temperature} onChange={e => setWebhookPayload({ ...webhookPayload, temperature: Number(e.target.value) })} className={inputClass} />
                  </Field>
                  <Field label="Sensor">
                    <select value={webhookPayload.sensor_status} onChange={e => setWebhookPayload({ ...webhookPayload, sensor_status: e.target.value as SensorStatus })} className={inputClass}>
                      <option value="online">online</option>
                      <option value="offline">offline</option>
                    </select>
                  </Field>
                </div>
                <pre className="p-3 rounded-xl bg-slate-900 text-emerald-300 font-mono text-[11px] overflow-x-auto">
{JSON.stringify({ dustbin_id: webhookPayload.dustbin_id, fill_percentage: webhookPayload.fill_percentage, waste_type: webhookPayload.waste_type, weight: webhookPayload.weight, temperature: webhookPayload.temperature, sensor_status: webhookPayload.sensor_status, timestamp: new Date().toISOString() }, null, 2)}
                </pre>
                <button onClick={() => {
                  if (ingestSensorData({ ...webhookPayload, timestamp: new Date().toISOString() }, 'Hardware')) {
                    triggerToast(`Webhook ingested for ${webhookPayload.dustbin_id}.`);
                  }
                }} className="w-full py-2.5 rounded-xl bg-emerald-900 hover:bg-emerald-800 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow">
                  <Terminal className="w-4 h-4" /> Send Webhook
                </button>
              </Card>

              <Card className="p-6 space-y-4">
                <h3 className="text-base font-bold border-b pb-3">Backend Architecture Blueprint</h3>
                <p className="text-xs text-slate-600">Production stack: Node + Express + PostgreSQL + Prisma + Socket.IO. Split files by concern.</p>
                <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px]">
                  <p className="text-emerald-400 font-bold mb-1">// Folder structure</p>
                  <pre className="overflow-x-auto">{`smart-dustbin-platform/
├── backend/
│   ├── prisma/schema.prisma
│   ├── src/
│   │   ├── controllers/
│   │   ├── middleware/
│   │   ├── routes/
│   │   ├── services/
│   │   └── server.js
│   └── .env
└── frontend/`}</pre>
                </div>
                <div className="p-3 rounded-xl bg-slate-900 text-slate-100 font-mono text-[11px]">
                  <p className="text-emerald-400 font-bold mb-1">// Ingestion contract</p>
                  <pre className="overflow-x-auto">{`POST /api/sensors/data
Headers: { x-device-api-key }
Body: {
  dustbin_id, fill_percentage, waste_type,
  weight, temperature, sensor_status, timestamp
}
→ 201 { ok, reading_id, alerts }`}</pre>
                </div>
              </Card>
            </div>
          )}

          {/* ============================================================
              SETTINGS
          ============================================================ */}
          {!selectedBinId && activeNav === 'settings' && (
            <Card className="p-6 max-w-2xl space-y-5">
              <SectionTitle title="Thresholds & Telemetry Rules" subtitle="Applies across alerts, dashboard, and priority queue" />
              <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
                <Field label="Normal Max (Green %)">
                  <input type="number" value={thresholds.normalMax} onChange={e => setThresholds({ ...thresholds, normalMax: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} className={inputClass} />
                </Field>
                <Field label="Moderate Max (Yellow %)">
                  <input type="number" value={thresholds.moderateMax} onChange={e => setThresholds({ ...thresholds, moderateMax: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} className={inputClass} />
                </Field>
                <Field label="Urgent Pickup Alert (%)">
                  <input type="number" value={thresholds.urgentMin} onChange={e => setThresholds({ ...thresholds, urgentMin: Math.max(0, Math.min(100, Number(e.target.value) || 0)) })} className={inputClass} />
                </Field>
                <Field label="Abnormal Temp Alert (°C)">
                  <input type="number" value={thresholds.maxSafeTemp} onChange={e => setThresholds({ ...thresholds, maxSafeTemp: Math.max(0, Number(e.target.value) || 0) })} className={inputClass} />
                </Field>
                <Field label="Offline Timeout (hours)">
                  <input type="number" value={thresholds.offlineTimeoutHours} onChange={e => setThresholds({ ...thresholds, offlineTimeoutHours: Math.max(1, Number(e.target.value) || 1) })} className={inputClass} />
                </Field>
                <Field label="Simulator Interval (seconds)">
                  <input type="number" min={1} max={60} value={simulationIntervalSec} onChange={e => setSimulationIntervalSec(Math.max(1, Math.min(60, Number(e.target.value) || 5)))} className={inputClass} />
                </Field>
              </div>
              <div className="flex items-center justify-between pt-3 border-t">
                <button onClick={() => { setThresholds(DEFAULT_THRESHOLDS); triggerToast('Reset to default thresholds.'); }} className="px-3 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold">Reset Defaults</button>
                <button onClick={() => {
                  setAuditLogs(prev => [{ id: uid('LOG'), user_name: currentUser.full_name, role: currentUser.role, action: 'THRESHOLD_CONFIG_UPDATED', entity_type: 'SystemSettings', entity_id: 'GLOBAL', details: `Normal ${thresholds.normalMax}%, Moderate ${thresholds.moderateMax}%, Urgent ${thresholds.urgentMin}%, Temp ${thresholds.maxSafeTemp}°C`, created_at: new Date().toISOString() }, ...prev]);
                  triggerToast('Settings saved.');
                }} className="px-4 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold">Save Settings</button>
              </div>
            </Card>
          )}
        </main>
      </div>

      {/* ============================================================
          ADD / EDIT DUSTBIN MODAL
      ============================================================ */}
      {showBinModal && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setShowBinModal(false)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-lg max-h-[90vh] overflow-y-auto" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b flex items-center justify-between">
              <h3 className="text-base font-bold">{editingBin ? `Edit ${editingBin.id}` : 'Add New Dustbin'}</h3>
              <button onClick={() => setShowBinModal(false)} className="p-1 rounded-lg hover:bg-slate-100" aria-label="Close"><X className="w-4 h-4" /></button>
            </div>
            <form onSubmit={handleSaveDustbin} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Dustbin ID">
                  <input type="text" required value={binForm.id} onChange={e => setBinForm({ ...binForm, id: e.target.value })} className={inputClass} disabled={!!editingBin} />
                </Field>
                <Field label="Name">
                  <input type="text" required value={binForm.name} onChange={e => setBinForm({ ...binForm, name: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Location Sector">
                  <input type="text" required value={binForm.location_name} onChange={e => setBinForm({ ...binForm, location_name: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Waste Category">
                  <select value={binForm.waste_category} onChange={e => setBinForm({ ...binForm, waste_category: e.target.value })} className={inputClass}>
                    {['Wet', 'Dry', 'Plastic', 'Metal', 'Paper', 'Mixed'].map(w => <option key={w} value={w}>{w}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Full Address">
                <input type="text" required value={binForm.address} onChange={e => setBinForm({ ...binForm, address: e.target.value })} className={inputClass} />
              </Field>
              <div className="grid grid-cols-2 gap-3">
                <Field label="Latitude">
                  <input type="number" step="0.0001" required value={binForm.latitude} onChange={e => setBinForm({ ...binForm, latitude: Number(e.target.value) })} className={inputClass} />
                </Field>
                <Field label="Longitude">
                  <input type="number" step="0.0001" required value={binForm.longitude} onChange={e => setBinForm({ ...binForm, longitude: Number(e.target.value) })} className={inputClass} />
                </Field>
                <Field label="Operational Status">
                  <select value={binForm.operational_status} onChange={e => setBinForm({ ...binForm, operational_status: e.target.value })} className={inputClass}>
                    <option value="Active">Active</option>
                    <option value="Maintenance">Maintenance</option>
                    <option value="Inactive">Inactive</option>
                  </select>
                </Field>
                <Field label="Assigned Staff">
                  <select value={binForm.assigned_staff_id} onChange={e => setBinForm({ ...binForm, assigned_staff_id: e.target.value })} className={inputClass}>
                    {users.filter(u => u.role === 'Field Staff').map(u => <option key={u.id} value={u.id}>{u.full_name}</option>)}
                  </select>
                </Field>
              </div>
              <Field label="Notes">
                <textarea rows={2} value={binForm.notes} onChange={e => setBinForm({ ...binForm, notes: e.target.value })} className={inputClass} />
              </Field>
              <div className="flex gap-2 pt-3">
                <button type="button" onClick={() => setShowBinModal(false)} className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold">{editingBin ? 'Save Changes' : 'Register Dustbin'}</button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* ============================================================
          COLLECTION MODAL
      ============================================================ */}
      {collectionModalBin && (
        <div className="fixed inset-0 bg-black/50 z-50 flex items-center justify-center p-4" onClick={() => setCollectionModalBin(null)}>
          <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md" onClick={e => e.stopPropagation()}>
            <div className="p-5 border-b">
              <h3 className="text-base font-bold flex items-center gap-2"><CheckCircle2 className="w-4 h-4 text-emerald-700" /> Record Collection — {collectionModalBin.id}</h3>
              <p className="text-xs text-slate-500 mt-1">{collectionModalBin.name} · Current fill: {collectionModalBin.fill_percentage}%</p>
            </div>
            <form onSubmit={handleConfirmCollection} className="p-5 space-y-3">
              <div className="grid grid-cols-2 gap-3">
                <Field label="Collection Date">
                  <input type="date" required value={collectionForm.collection_date} onChange={e => setCollectionForm({ ...collectionForm, collection_date: e.target.value })} className={inputClass} />
                </Field>
                <Field label="Time">
                  <input type="time" required value={collectionForm.collection_time} onChange={e => setCollectionForm({ ...collectionForm, collection_time: e.target.value })} className={inputClass} />
                </Field>
              </div>
              <Field label="Collected By">
                <input type="text" required value={collectionForm.collected_by} onChange={e => setCollectionForm({ ...collectionForm, collected_by: e.target.value })} className={inputClass} />
              </Field>
              <Field label="Waste Quantity (kg)">
                <input type="number" step="0.1" required value={collectionForm.waste_quantity} onChange={e => setCollectionForm({ ...collectionForm, waste_quantity: e.target.value })} className={inputClass} placeholder={`Suggested: ${collectionModalBin.weight}`} />
              </Field>
              <Field label="Notes">
                <textarea rows={2} value={collectionForm.notes} onChange={e => setCollectionForm({ ...collectionForm, notes: e.target.value })} className={inputClass} placeholder="Optional field notes" />
              </Field>
              <div className="p-3 rounded-lg bg-emerald-50 border border-emerald-200 text-xs text-emerald-900">
                Confirming will <strong>reset fill to 0%</strong> and append a "Collection Reset" entry to history.
              </div>
              <div className="flex gap-2 pt-2">
                <button type="button" onClick={() => setCollectionModalBin(null)} className="flex-1 py-2 rounded-lg bg-slate-100 hover:bg-slate-200 text-xs font-semibold">Cancel</button>
                <button type="submit" className="flex-1 py-2 rounded-lg bg-emerald-900 hover:bg-emerald-800 text-white text-xs font-semibold">Confirm Collection</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}