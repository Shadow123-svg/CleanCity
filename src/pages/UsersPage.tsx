import React, { useState } from 'react';
import { AlertCircle, ShieldCheck, UserCheck } from 'lucide-react';
import {
  EmptyState,
  PageHeader,
  Panel,
  StatusBadge,
  selectBaseClass,
} from '../components/ui/Primitives';
import { useAuth } from '../features/auth/AuthContext';
import { useAppState } from '../features/campus/AppStateContext';
import { ApiClientError } from '../lib/apiClient';
import type { AccountStatus, Role, User } from '../types/api';

const ROLES: Role[] = ['Super Admin', 'Administrator', 'Field Staff'];
const STATUSES: AccountStatus[] = ['Active', 'Pending Approval', 'Deactivated'];

export const UsersPage: React.FC = () => {
  const { user: currentUser } = useAuth();
  const { users, updateUserAccount } = useAppState();
  const [busyId, setBusyId] = useState<string | null>(null);
  const [errorMsg, setErrorMsg] = useState<string | null>(null);

  const isSuperAdmin = currentUser?.role === 'Super Admin';
  const pendingCount = users.filter(u => u.account_status === 'Pending Approval').length;

  const handleUpdate = async (target: User, role: Role, account_status: AccountStatus) => {
    setErrorMsg(null);
    setBusyId(target.id);
    try {
      await updateUserAccount(target.id, { role, account_status });
    } catch (err) {
      setErrorMsg(err instanceof ApiClientError ? err.message : 'Could not update staff account.');
    } finally {
      setBusyId(null);
    }
  };

  return (
    <div>
      <PageHeader
        eyebrow="MySQL Auth & Role Directory"
        title="Campus Staff & Access Control"
        subtitle="Approve pending staff registrations and assign Facilities Manager, Housekeeping Supervisor, or Field Staff roles."
        actions={
          pendingCount > 0 ? (
            <StatusBadge tone="ochre" dot>
              {pendingCount} Pending Approval
            </StatusBadge>
          ) : (
            <StatusBadge tone="forest" dot>
              All Accounts Reviewed
            </StatusBadge>
          )
        }
      />

      {errorMsg && (
        <div className="mb-4 p-3 rounded border border-clay-border bg-clay-soft text-clay text-xs flex items-center gap-2">
          <AlertCircle className="w-4 h-4 shrink-0" />
          <span>{errorMsg}</span>
        </div>
      )}

      {!isSuperAdmin && (
        <div className="mb-4 p-3.5 rounded border border-cedar-border bg-cedar-soft text-cedar text-xs flex items-center gap-2">
          <ShieldCheck className="w-4 h-4 shrink-0" />
          <span>
            Viewing active staff roster in read-only mode. Only <strong>Super Admin</strong> accounts can approve registrations or modify roles (<span className="font-mono">PUT /api/users/:id</span>).
          </span>
        </div>
      )}

      <Panel title="Registered Accounts" subtitle={`${users.length} staff records loaded from GET /api/users`} bodyClassName="p-0">
        {users.length === 0 ? (
          <EmptyState
            title="No staff accounts visible"
            description="Staff directory rows will appear once returned by the CleanCity MySQL backend."
          />
        ) : (
          <div className="overflow-x-auto">
            <table className="w-full text-left border-collapse text-sm">
              <thead>
                <tr className="border-b border-border bg-surface-alt/55 text-[11px] font-mono uppercase tracking-wider text-soil">
                  <th className="py-2.5 px-4 font-medium">Staff Member</th>
                  <th className="py-2.5 px-4 font-medium">Wing / Organization</th>
                  <th className="py-2.5 px-4 font-medium">Employee ID</th>
                  <th className="py-2.5 px-4 font-medium">Role</th>
                  <th className="py-2.5 px-4 font-medium">Account Status</th>
                  {isSuperAdmin && <th className="py-2.5 px-4 font-medium text-right">Quick Action</th>}
                </tr>
              </thead>
              <tbody className="divide-y divide-border">
                {users.map(member => {
                  const isSelf = member.id === currentUser?.id;
                  const isBusy = busyId === member.id;
                  const statusTone =
                    member.account_status === 'Active'
                      ? 'forest'
                      : member.account_status === 'Pending Approval'
                        ? 'ochre'
                        : 'clay';

                  return (
                    <tr key={member.id} className="hover:bg-surface-hover/50">
                      <td className="py-3 px-4">
                        <div className="font-medium text-ink text-xs">
                          {member.full_name} {isSelf && <span className="text-soil font-mono">(You)</span>}
                        </div>
                        <div className="text-xs text-soil">{member.email}</div>
                      </td>
                      <td className="py-3 px-4 text-xs text-bark">{member.organization}</td>
                      <td className="py-3 px-4 font-mono text-xs text-soil">{member.employee_id}</td>
                      <td className="py-3 px-4">
                        {isSuperAdmin ? (
                          <select
                            value={member.role}
                            disabled={isBusy}
                            onChange={e =>
                              void handleUpdate(member, e.target.value as Role, member.account_status)
                            }
                            className={`${selectBaseClass} text-xs py-1`}
                          >
                            {ROLES.map(r => (
                              <option key={r} value={r}>
                                {r}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <StatusBadge tone="cedar">{member.role}</StatusBadge>
                        )}
                      </td>
                      <td className="py-3 px-4">
                        {isSuperAdmin ? (
                          <select
                            value={member.account_status}
                            disabled={isBusy}
                            onChange={e =>
                              void handleUpdate(member, member.role, e.target.value as AccountStatus)
                            }
                            className={`${selectBaseClass} text-xs py-1`}
                          >
                            {STATUSES.map(st => (
                              <option key={st} value={st} disabled={isSelf && st !== 'Active'}>
                                {st}
                              </option>
                            ))}
                          </select>
                        ) : (
                          <StatusBadge tone={statusTone} dot>
                            {member.account_status}
                          </StatusBadge>
                        )}
                      </td>
                      {isSuperAdmin && (
                        <td className="py-3 px-4 text-right">
                          {member.account_status === 'Pending Approval' ? (
                            <button
                              type="button"
                              disabled={isBusy}
                              onClick={() => void handleUpdate(member, member.role, 'Active')}
                              className="inline-flex items-center gap-1 px-2.5 py-1 rounded text-xs font-medium bg-forest text-surface hover:bg-forest-hover disabled:opacity-50 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              <span>Approve</span>
                            </button>
                          ) : (
                            <span className="font-mono text-[11px] text-soil">
                              {isBusy ? 'Saving…' : '—'}
                            </span>
                          )}
                        </td>
                      )}
                    </tr>
                  );
                })}
              </tbody>
            </table>
          </div>
        )}
      </Panel>
    </div>
  );
};
