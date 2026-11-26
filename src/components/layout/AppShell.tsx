import React, { useState } from 'react';
import { NavLink, Outlet } from 'react-router-dom';
import {
  BarChart3,
  Bell,
  ClipboardCheck,
  Cpu,
  LayoutDashboard,
  LogOut,
  Map as MapIcon,
  Menu,
  Radio,
  Settings,
  Trash2,
  Users,
  X,
} from 'lucide-react';
import { BrandLeafBuildingMark, LeafSprig } from '../illustrations/CampusMotifs';
import { useAuth } from '../../features/auth/AuthContext';
import { useAppState } from '../../features/campus/AppStateContext';

interface NavItem {
  to: string;
  label: string;
  icon: React.ElementType;
  badge?: number;
  adminOnly?: boolean;
}

export const AppShell: React.FC = () => {
  const { user, logout } = useAuth();
  const {
    state,
    realtimeStatus,
    savingState,
    simulationRunning,
    toast,
    dismissToast,
  } = useAppState();
  const [mobileOpen, setMobileOpen] = useState(false);

  const unreadAlerts = state.notifications.filter(n => !n.is_read).length;
  const pendingUsersCount = user?.role === 'Super Admin' ? 0 : 0; // Shown inside Users page

  const navItems: NavItem[] = [
    { to: '/', label: 'Campus Overview', icon: LayoutDashboard },
    { to: '/bins', label: 'Smart Bins', icon: Trash2 },
    { to: '/campus-map', label: 'Campus Map', icon: MapIcon },
    { to: '/collections', label: 'Collections', icon: ClipboardCheck },
    { to: '/alerts', label: 'Alerts & QR', icon: Bell, badge: unreadAlerts || undefined },
    { to: '/analytics', label: 'Analytics & BOM', icon: BarChart3 },
    { to: '/iot-console', label: 'IoT Console', icon: Cpu },
    { to: '/users', label: 'Staff & Access', icon: Users, badge: pendingUsersCount || undefined, adminOnly: true },
    { to: '/settings', label: 'Settings & Audit', icon: Settings },
  ].filter(item => !item.adminOnly || user?.role !== 'Field Staff');

  const rtTone =
    realtimeStatus === 'connected'
      ? 'bg-forest'
      : realtimeStatus === 'mock'
        ? 'bg-ochre'
        : realtimeStatus === 'connecting'
          ? 'bg-cedar'
          : 'bg-clay';

  const rtLabel =
    realtimeStatus === 'connected'
      ? 'WS Live'
      : realtimeStatus === 'mock'
        ? 'Mock Mode'
        : realtimeStatus === 'connecting'
          ? 'Syncing…'
          : 'WS Offline';

  const sidebarContent = (
    <div className="flex flex-col h-full bg-surface border-r border-border">
      {/* Brand Header */}
      <div className="px-5 py-4 border-b border-border flex items-center justify-between gap-2">
        <div className="flex items-center gap-2.5">
          <BrandLeafBuildingMark className="w-8 h-8 shrink-0" />
          <div className="min-w-0">
            <p className="font-mono text-[10px] uppercase tracking-wider text-cedar truncate">
              VIT Bhopal Campus
            </p>
            <p className="text-sm font-semibold text-ink tracking-tight truncate">
              CleanCity Smart Bin
            </p>
          </div>
        </div>
        <button
          type="button"
          onClick={() => setMobileOpen(false)}
          className="lg:hidden p-1 text-soil hover:text-ink"
          aria-label="Close navigation"
        >
          <X className="w-4 h-4" />
        </button>
      </div>

      {/* Navigation */}
      <nav className="flex-1 overflow-y-auto px-3 py-4 space-y-0.5" aria-label="Primary navigation">
        <p className="px-2.5 pb-1.5 text-[10px] font-mono uppercase tracking-wider text-soil">
          Operations
        </p>
        {navItems.map(item => {
          const Icon = item.icon;
          return (
            <NavLink
              key={item.to}
              to={item.to}
              end={item.to === '/'}
              onClick={() => setMobileOpen(false)}
              className={({ isActive }) =>
                `flex items-center justify-between gap-2 px-2.5 py-2 rounded text-[13px] font-medium transition-colors ${
                  isActive
                    ? 'bg-forest text-surface'
                    : 'text-bark hover:bg-surface-alt hover:text-ink'
                }`
              }
            >
              <span className="flex items-center gap-2.5 min-w-0">
                <Icon className="w-4 h-4 shrink-0 opacity-90" />
                <span className="truncate">{item.label}</span>
              </span>
              {item.badge !== undefined && item.badge > 0 && (
                <span className="font-mono text-[10px] px-1.5 py-0.5 rounded bg-clay text-surface tabular-nums">
                  {item.badge}
                </span>
              )}
            </NavLink>
          );
        })}
      </nav>

      {/* Subtle Botanical Footer & User Profile */}
      <div className="p-3.5 border-t border-border bg-surface-alt/40 space-y-3">
        <div className="flex items-center justify-between text-[11px] px-1">
          <span className="inline-flex items-center gap-1.5 text-bark font-mono">
            <span className={`w-2 h-2 rounded-full ${rtTone}`} />
            {rtLabel}
          </span>
          <span className="inline-flex items-center gap-1 text-soil">
            <LeafSprig className="w-3.5 h-3.5 text-leaf" />
            <span className="font-mono text-[10px]">{savingState ? 'Saving…' : 'Synced'}</span>
          </span>
        </div>

        <div className="p-2.5 rounded border border-border bg-surface flex items-center justify-between gap-2">
          <div className="min-w-0">
            <p className="text-xs font-semibold text-ink truncate">{user?.full_name}</p>
            <p className="text-[11px] text-cedar font-mono truncate">{user?.role}</p>
          </div>
          <button
            type="button"
            onClick={() => void logout()}
            title="Sign out"
            className="p-1.5 rounded text-soil hover:text-clay hover:bg-clay-soft transition-colors cursor-pointer"
          >
            <LogOut className="w-4 h-4" />
          </button>
        </div>
      </div>
    </div>
  );

  return (
    <div className="min-h-screen bg-canvas flex">
      {/* Desktop Sidebar */}
      <aside className="hidden lg:block w-60 shrink-0 sticky top-0 h-screen">{sidebarContent}</aside>

      {/* Mobile Drawer */}
      {mobileOpen && (
        <div className="fixed inset-0 z-40 lg:hidden flex">
          <div className="w-64 h-full">{sidebarContent}</div>
          <div className="flex-1 bg-ink/40" onClick={() => setMobileOpen(false)} />
        </div>
      )}

      {/* Main Content */}
      <div className="flex-1 min-w-0 flex flex-col">
        {/* Top Utility Strip */}
        <header className="h-12 bg-surface border-b border-border px-4 lg:px-8 flex items-center justify-between gap-3 sticky top-0 z-20">
          <div className="flex items-center gap-3 min-w-0">
            <button
              type="button"
              onClick={() => setMobileOpen(true)}
              className="lg:hidden p-1.5 rounded border border-border text-ink"
              aria-label="Open menu"
            >
              <Menu className="w-4 h-4" />
            </button>
            <span className="text-xs text-bark truncate">
              <strong className="text-ink font-semibold">Facilities Management Office</strong>
              <span className="hidden sm:inline text-soil"> · Kothri Kalan Campus IoT Grid</span>
            </span>
          </div>

          <div className="flex items-center gap-3">
            {simulationRunning && (
              <span className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded border border-forest-border bg-forest-soft text-forest font-mono text-[11px]">
                <Radio className="w-3 h-3 animate-pulse" />
                Simulator Active
              </span>
            )}
            <span className="hidden md:inline font-mono text-[11px] text-soil">
              {user?.employee_id || 'STAFF'}
            </span>
          </div>
        </header>

        <main className="flex-1 p-5 sm:p-6 lg:p-8 max-w-[1440px] w-full mx-auto">
          <Outlet />
        </main>
      </div>

      {/* Crisp Toast Banner */}
      {toast && (
        <div
          role="status"
          className={`fixed bottom-5 right-5 z-50 max-w-sm px-4 py-3 rounded-md border text-xs font-medium flex items-center justify-between gap-3 ${
            toast.tone === 'error'
              ? 'bg-clay-soft border-clay-border text-clay'
              : toast.tone === 'info'
                ? 'bg-cedar-soft border-cedar-border text-cedar'
                : 'bg-forest text-surface border-forest-hover'
          }`}
        >
          <span>{toast.message}</span>
          <button
            type="button"
            onClick={dismissToast}
            className="opacity-80 hover:opacity-100 cursor-pointer"
            aria-label="Dismiss notification"
          >
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
      )}
    </div>
  );
};
