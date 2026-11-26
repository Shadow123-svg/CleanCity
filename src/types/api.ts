// ============================================================================
// CleanCity / VIT Bhopal Smart Bin Monitoring — Backend & Domain Contracts
// Mirrors server/index.js REST + WebSocket payloads and Smart Bin.pptx models
// ============================================================================

export type Role = 'Super Admin' | 'Administrator' | 'Field Staff';
export type AccountStatus = 'Active' | 'Pending Approval' | 'Deactivated';
export type SensorStatus = 'online' | 'offline';
export type WasteCategory = 'Plastic' | 'Wet' | 'Paper' | 'Dry' | 'Metal' | 'Mixed';
export type OperationalStatus = 'Active' | 'Maintenance' | 'Inactive';
export type AlertSeverity = 'Critical' | 'High' | 'Warning' | 'Info';

export type CampusZone =
  | 'Academic Block'
  | 'Central Library'
  | 'Hostel Zone'
  | 'Cafeteria & Food Court'
  | 'Sports Complex'
  | 'Main Gate & Admin';

export interface User {
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

export interface LoginRequest {
  email: string;
  password: string;
  remember_me?: boolean;
}

export interface LoginResponse {
  user: User;
  session_token: string;
  expires_at: string;
}

export interface RegisterRequest {
  full_name: string;
  email: string;
  phone: string;
  organization: string;
  password: string;
  confirm_password: string;
  auth_code: string;
}

export interface RegisterResponse {
  message: string;
}

export interface UpdateUserRequest {
  role: Role;
  account_status: AccountStatus;
}

export interface HealthResponse {
  status: string;
}

export interface Dustbin {
  id: string;
  name: string;
  location_name: string;
  campus_zone?: CampusZone;
  address: string;
  latitude: number;
  longitude: number;
  map_x?: number; // 0-100 percentage on campus blueprint
  map_y?: number; // 0-100 percentage on campus blueprint
  installation_date: string;
  waste_category: WasteCategory | string;
  operational_status: OperationalStatus | string;
  sensor_status: SensorStatus;
  fill_percentage: number;
  weight: number;
  temperature: number;
  humidity?: number; // DHT22 % RH
  gas_ppm?: number; // MQ-135 odor / methane ppm
  battery_level?: number; // 3.7V Li-ion %
  solar_charging?: boolean; // 6V 5W Solar panel active
  last_collection_date: string;
  last_collection_time: string;
  next_scheduled_collection: string;
  assigned_staff_id: string;
  device_api_key: string;
  last_sensor_update: string;
  notes: string;
}

export interface SensorReading {
  id: string;
  dustbin_id: string;
  fill_percentage: number;
  waste_type: string;
  weight: number;
  temperature: number;
  humidity?: number;
  gas_ppm?: number;
  battery_level?: number;
  sensor_status: SensorStatus;
  recorded_at: string;
  source: 'Hardware' | 'Simulation' | 'Collection Reset';
}

export interface CollectionRecord {
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

export interface AlertNotification {
  id: string;
  dustbin_id: string;
  location: string;
  alert_type: string;
  severity: AlertSeverity;
  message: string;
  is_read: boolean;
  created_at: string;
}

export interface AuditLogEntry {
  id: string;
  user_name: string;
  role: string;
  action: string;
  entity_type: string;
  entity_id: string;
  details: string;
  created_at: string;
}

export interface Thresholds {
  normalMax: number;
  moderateMax: number;
  urgentMin: number;
  offlineTimeoutHours: number;
  maxSafeTemp: number;
  maxSafeGasPpm?: number;
  lowBatteryThreshold?: number;
}

export interface QrIssueReport {
  id: string;
  dustbin_id: string;
  reporter_role: 'Student' | 'Faculty' | 'Visitor' | 'Staff';
  issue_type: 'Overflowing' | 'Odor Alert' | 'Damaged Lid' | 'Sensor Issue';
  comment: string;
  created_at: string;
  resolved: boolean;
}

export interface AppState {
  dustbins: Dustbin[];
  sensorHistory: SensorReading[];
  collections: CollectionRecord[];
  notifications: AlertNotification[];
  auditLogs: AuditLogEntry[];
  thresholds: Thresholds;
  qrReports?: QrIssueReport[];
}

export interface NormalizedApiError {
  status: number;
  code: string;
  message: string;
  fieldErrors?: Record<string, string>;
}

export interface RealtimeMessage {
  type: 'connected' | 'state.updated' | 'user.updated' | 'pong' | 'error' | string;
  state?: Partial<AppState> | null;
  user?: User;
  timestamp?: string;
  error?: string;
}

export interface HardwareBomItem {
  sno: number;
  component: string;
  spec: string;
  quantity: string;
  costInr: number;
}

export interface CloudCostTier {
  provider: string;
  stack: string;
  annualCostRange: string;
  remarks: string;
  recommended?: boolean;
}
