import React, { useEffect, useState } from 'react';
import {
  FormField,
  Modal,
  inputBaseClass,
  primaryBtnClass,
  secondaryBtnClass,
  selectBaseClass,
} from '../../components/ui/Primitives';
import type { CampusZone, Dustbin, User } from '../../types/api';

const CAMPUS_ZONES: CampusZone[] = [
  'Academic Block',
  'Central Library',
  'Hostel Zone',
  'Cafeteria & Food Court',
  'Sports Complex',
  'Main Gate & Admin',
];

const WASTE_CATEGORIES = ['Paper', 'Wet', 'Dry', 'Plastic', 'Metal', 'Mixed'];

const ZONE_DEFAULT_COORDS: Record<CampusZone, { x: number; y: number }> = {
  'Academic Block': { x: 23, y: 31 },
  'Central Library': { x: 52, y: 26 },
  'Hostel Zone': { x: 80, y: 36 },
  'Cafeteria & Food Court': { x: 43, y: 60 },
  'Sports Complex': { x: 74, y: 74 },
  'Main Gate & Admin': { x: 20, y: 75 },
};

interface BinFormModalProps {
  open: boolean;
  editingBin: Dustbin | null;
  staffOptions: User[];
  onClose: () => void;
  onSave: (bin: Dustbin, isEdit: boolean) => void;
}

export const BinFormModal: React.FC<BinFormModalProps> = ({
  open,
  editingBin,
  staffOptions,
  onClose,
  onSave,
}) => {
  const [id, setId] = useState('');
  const [name, setName] = useState('');
  const [zone, setZone] = useState<CampusZone>('Academic Block');
  const [address, setAddress] = useState('');
  const [wasteCategory, setWasteCategory] = useState('Mixed');
  const [operationalStatus, setOperationalStatus] = useState('Active');
  const [assignedStaffId, setAssignedStaffId] = useState('');
  const [notes, setNotes] = useState('');
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    if (!open) return;
    setError(null);
    if (editingBin) {
      setId(editingBin.id);
      setName(editingBin.name);
      setZone((editingBin.campus_zone as CampusZone) || 'Academic Block');
      setAddress(editingBin.address);
      setWasteCategory(editingBin.waste_category);
      setOperationalStatus(editingBin.operational_status);
      setAssignedStaffId(editingBin.assigned_staff_id);
      setNotes(editingBin.notes);
    } else {
      setId(`BIN-${String(Math.floor(100 + Math.random() * 899))}`);
      setName('');
      setZone('Academic Block');
      setAddress('VIT Bhopal University Campus');
      setWasteCategory('Dry');
      setOperationalStatus('Active');
      setAssignedStaffId(staffOptions[0]?.id || 'USR-STAFF-1');
      setNotes('120L ESP32 + HC-SR04 + 6V Solar node.');
    }
  }, [open, editingBin, staffOptions]);

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!id.trim() || !name.trim()) {
      setError('Bin ID and display name are required.');
      return;
    }

    const nowIso = new Date().toISOString();
    const today = nowIso.slice(0, 10);
    const defaultPos = ZONE_DEFAULT_COORDS[zone];

    const payload: Dustbin = editingBin
      ? {
          ...editingBin,
          name: name.trim(),
          campus_zone: zone,
          location_name: zone,
          address: address.trim(),
          waste_category: wasteCategory,
          operational_status: operationalStatus,
          assigned_staff_id: assignedStaffId,
          notes: notes.trim(),
        }
      : {
          id: id.trim().toUpperCase(),
          name: name.trim(),
          campus_zone: zone,
          location_name: zone,
          address: address.trim() || `${zone}, VIT Bhopal`,
          latitude: 23.077 + (Math.random() - 0.5) * 0.004,
          longitude: 76.851 + (Math.random() - 0.5) * 0.004,
          map_x: defaultPos.x + Math.round((Math.random() - 0.5) * 8),
          map_y: defaultPos.y + Math.round((Math.random() - 0.5) * 8),
          installation_date: today,
          waste_category: wasteCategory,
          operational_status: operationalStatus,
          sensor_status: 'online',
          fill_percentage: 0,
          weight: 0,
          temperature: 29.0,
          humidity: 52,
          gas_ppm: 90,
          battery_level: 100,
          solar_charging: true,
          last_collection_date: today,
          last_collection_time: '08:00',
          next_scheduled_collection: today,
          assigned_staff_id: assignedStaffId,
          device_api_key: `TS-VITB-${id.trim().toUpperCase().replace(/[^A-Z0-9]/g, '')}`,
          last_sensor_update: nowIso,
          notes: notes.trim(),
        };

    onSave(payload, Boolean(editingBin));
    onClose();
  };

  return (
    <Modal
      open={open}
      onClose={onClose}
      title={editingBin ? `Edit Smart Bin · ${editingBin.id}` : 'Register New Campus Smart Bin'}
      subtitle="Add a 120L ESP32 ultrasonic node to the VIT Bhopal monitoring grid."
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        {error && <p className="text-xs text-clay bg-clay-soft border border-clay-border rounded p-2.5">{error}</p>}

        <div className="grid sm:grid-cols-2 gap-3.5">
          <FormField label="Bin ID" required>
            <input
              value={id}
              onChange={e => setId(e.target.value)}
              disabled={Boolean(editingBin)}
              className={`${inputBaseClass} font-mono`}
              placeholder="BIN-008"
            />
          </FormField>
          <FormField label="Campus Zone" required>
            <select
              value={zone}
              onChange={e => setZone(e.target.value as CampusZone)}
              className={`${selectBaseClass} w-full`}
            >
              {CAMPUS_ZONES.map(z => (
                <option key={z} value={z}>
                  {z}
                </option>
              ))}
            </select>
          </FormField>
        </div>

        <FormField label="Bin Name / Placement" required>
          <input
            value={name}
            onChange={e => setName(e.target.value)}
            className={inputBaseClass}
            placeholder="e.g., Academic Block 2 — West Stairwell"
          />
        </FormField>

        <FormField label="Exact Address / Landmark">
          <input
            value={address}
            onChange={e => setAddress(e.target.value)}
            className={inputBaseClass}
          />
        </FormField>

        <div className="grid sm:grid-cols-3 gap-3.5">
          <FormField label="Waste Category">
            <select
              value={wasteCategory}
              onChange={e => setWasteCategory(e.target.value)}
              className={`${selectBaseClass} w-full`}
            >
              {WASTE_CATEGORIES.map(c => (
                <option key={c} value={c}>
                  {c}
                </option>
              ))}
            </select>
          </FormField>

          <FormField label="Status">
            <select
              value={operationalStatus}
              onChange={e => setOperationalStatus(e.target.value)}
              className={`${selectBaseClass} w-full`}
            >
              <option value="Active">Active</option>
              <option value="Maintenance">Maintenance</option>
              <option value="Inactive">Inactive</option>
            </select>
          </FormField>

          <FormField label="Assigned Staff">
            <select
              value={assignedStaffId}
              onChange={e => setAssignedStaffId(e.target.value)}
              className={`${selectBaseClass} w-full`}
            >
              {staffOptions.length === 0 ? (
                <option value="USR-STAFF-1">Default Crew</option>
              ) : (
                staffOptions.map(u => (
                  <option key={u.id} value={u.id}>
                    {u.full_name}
                  </option>
                ))
              )}
            </select>
          </FormField>
        </div>

        <FormField label="Maintenance Notes">
          <textarea
            rows={2}
            value={notes}
            onChange={e => setNotes(e.target.value)}
            className={inputBaseClass}
          />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className={secondaryBtnClass}>
            Cancel
          </button>
          <button type="submit" className={primaryBtnClass}>
            {editingBin ? 'Save Changes' : 'Register Bin'}
          </button>
        </div>
      </form>
    </Modal>
  );
};

interface CollectionModalProps {
  bin: Dustbin | null;
  defaultStaffName: string;
  onClose: () => void;
  onConfirm: (input: {
    dustbinId: string;
    collectedBy: string;
    collectionDate: string;
    collectionTime: string;
    wasteQuantity: number;
    notes: string;
  }) => void;
}

export const CollectionModal: React.FC<CollectionModalProps> = ({
  bin,
  defaultStaffName,
  onClose,
  onConfirm,
}) => {
  const [collectedBy, setCollectedBy] = useState(defaultStaffName);
  const [date, setDate] = useState(new Date().toISOString().slice(0, 10));
  const [time, setTime] = useState(new Date().toTimeString().slice(0, 5));
  const [quantity, setQuantity] = useState('');
  const [notes, setNotes] = useState('');

  useEffect(() => {
    if (!bin) return;
    setCollectedBy(defaultStaffName);
    setDate(new Date().toISOString().slice(0, 10));
    setTime(new Date().toTimeString().slice(0, 5));
    setQuantity(String(bin.weight || 12));
    setNotes('Cleared bin and wiped HC-SR04 ultrasonic sensor.');
  }, [bin, defaultStaffName]);

  if (!bin) return null;

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    onConfirm({
      dustbinId: bin.id,
      collectedBy: collectedBy.trim() || defaultStaffName,
      collectionDate: date,
      collectionTime: time,
      wasteQuantity: Number(quantity) || bin.weight || 10,
      notes,
    });
    onClose();
  };

  return (
    <Modal
      open={Boolean(bin)}
      onClose={onClose}
      title={`Log Collection · ${bin.id}`}
      subtitle={`${bin.name} (${bin.campus_zone || bin.location_name}) — resets ultrasonic fill to 0%.`}
      maxWidthClass="max-w-md"
    >
      <form onSubmit={handleSubmit} className="space-y-4">
        <div className="p-3 rounded border border-border bg-surface-alt/60 flex items-center justify-between text-xs">
          <span className="text-bark">Current Reading</span>
          <span className="font-mono font-semibold text-ink">
            {bin.fill_percentage}% full · {bin.weight} kg · {bin.waste_category}
          </span>
        </div>

        <FormField label="Collected By" required>
          <input
            value={collectedBy}
            onChange={e => setCollectedBy(e.target.value)}
            className={inputBaseClass}
          />
        </FormField>

        <div className="grid grid-cols-2 gap-3">
          <FormField label="Date" required>
            <input type="date" value={date} onChange={e => setDate(e.target.value)} className={inputBaseClass} />
          </FormField>
          <FormField label="Time" required>
            <input type="time" value={time} onChange={e => setTime(e.target.value)} className={inputBaseClass} />
          </FormField>
        </div>

        <FormField label="Cleared Waste Weight (kg)" required>
          <input
            type="number"
            step="0.1"
            min="0"
            value={quantity}
            onChange={e => setQuantity(e.target.value)}
            className={`${inputBaseClass} font-mono`}
          />
        </FormField>

        <FormField label="Crew Remarks">
          <textarea rows={2} value={notes} onChange={e => setNotes(e.target.value)} className={inputBaseClass} />
        </FormField>

        <div className="flex items-center justify-end gap-2 pt-2 border-t border-border">
          <button type="button" onClick={onClose} className={secondaryBtnClass}>
            Cancel
          </button>
          <button type="submit" className={primaryBtnClass}>
            Confirm Collection
          </button>
        </div>
      </form>
    </Modal>
  );
};
