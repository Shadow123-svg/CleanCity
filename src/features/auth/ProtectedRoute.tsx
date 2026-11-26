import React from 'react';
import { Navigate, useLocation } from 'react-router-dom';
import type { Role } from '../../types/api';
import { useAuth } from './AuthContext';
import { BrandLeafBuildingMark } from '../../components/illustrations/CampusMotifs';

interface ProtectedRouteProps {
  children: React.ReactNode;
  allowedRoles?: Role[];
}

export const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children, allowedRoles }) => {
  const { user, status } = useAuth();
  const location = useLocation();

  if (status === 'loading') {
    return (
      <div className="min-h-screen bg-canvas flex">
        {/* Sidebar skeleton */}
        <aside className="hidden lg:flex w-60 border-r border-border bg-surface flex-col p-5 gap-4">
          <div className="flex items-center gap-2.5 pb-4 border-b border-border">
            <BrandLeafBuildingMark className="w-7 h-7" />
            <div className="space-y-1.5">
              <div className="h-3.5 w-28 bg-surface-alt rounded animate-pulse" />
              <div className="h-2.5 w-20 bg-surface-alt rounded animate-pulse" />
            </div>
          </div>
          <div className="space-y-2 mt-2">
            {Array.from({ length: 7 }).map((_, i) => (
              <div key={i} className="h-8 w-full bg-surface-alt/80 rounded animate-pulse" />
            ))}
          </div>
        </aside>

        {/* Main workspace skeleton */}
        <main className="flex-1 p-6 lg:p-8 space-y-6">
          <div className="flex items-center justify-between border-b border-border pb-4">
            <div className="space-y-2">
              <div className="h-6 w-52 bg-surface-alt rounded animate-pulse" />
              <div className="h-3 w-72 bg-surface-alt/80 rounded animate-pulse" />
            </div>
            <div className="h-8 w-28 bg-surface-alt rounded animate-pulse" />
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
            {Array.from({ length: 4 }).map((_, i) => (
              <div key={i} className="h-24 bg-surface border border-border rounded-md p-4 space-y-2.5">
                <div className="h-3 w-24 bg-surface-alt rounded animate-pulse" />
                <div className="h-7 w-16 bg-surface-alt rounded animate-pulse" />
              </div>
            ))}
          </div>
          <div className="h-72 bg-surface border border-border rounded-md animate-pulse" />
        </main>
      </div>
    );
  }

  if (status === 'unauthenticated' || !user) {
    const redirectTarget = `${location.pathname}${location.search}`;
    const targetParam = redirectTarget && redirectTarget !== '/' ? `?redirect=${encodeURIComponent(redirectTarget)}` : '';
    return <Navigate to={`/login${targetParam}`} replace />;
  }

  if (allowedRoles && !allowedRoles.includes(user.role)) {
    return (
      <div className="p-8 max-w-xl">
        <div className="bg-surface border border-border rounded-md p-6">
          <p className="text-xs font-mono uppercase tracking-wider text-cedar mb-1">Access Restricted</p>
          <h2 className="text-xl font-semibold text-ink">Insufficient role permissions</h2>
          <p className="text-sm text-bark mt-2 leading-relaxed">
            Your account (<span className="font-mono text-xs">{user.role}</span>) does not have permission to open this
            section. Contact the VIT Bhopal Facilities Super Admin if you require elevated access.
          </p>
        </div>
      </div>
    );
  }

  return <>{children}</>;
};
