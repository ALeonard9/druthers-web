'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';

export interface AdminAuditFilterValues {
  actor: string;
  target: string;
  action: string;
}

// Every action name the API's admin_audit.record() call sites actually use
// (app/router/v1/router_admin.py) - a free-text box against dotted names
// like "admin.user.disable" invites exactly the placeholder-typo bug this
// replaced ("e.g. user.view" matched nothing, real names are
// "admin.user.view"). A select can't have that problem, and can't drift
// from the real list silently the way a placeholder string can.
const ACTIONS = [
  'admin.user.search',
  'admin.user.view',
  'admin.user.disable',
  'admin.user.enable',
  'admin.audit.view',
  'admin.impersonation.list',
  'admin.impersonation.start',
  'admin.impersonation.stop',
] as const;

// Plain filter form, not debounced: unlike the directory search box this
// isn't typed against on every keystroke, so a submit-on-Apply round trip is
// the right amount of network chatter here.
export function AdminAuditFilters({ initial }: { initial: AdminAuditFilterValues }) {
  const router = useRouter();
  const [values, setValues] = useState(initial);

  const apply = (e: React.FormEvent) => {
    e.preventDefault();
    const params = new URLSearchParams();
    if (values.actor.trim()) params.set('actor', values.actor.trim());
    if (values.target.trim()) params.set('target', values.target.trim());
    if (values.action.trim()) params.set('action', values.action.trim());
    router.push(params.toString() ? `/admin/audit?${params}` : '/admin/audit');
  };

  const clear = () => {
    setValues({ actor: '', target: '', action: '' });
    router.push('/admin/audit');
  };

  const hasFilter = Boolean(values.actor || values.target || values.action);

  return (
    <form onSubmit={apply} className="flex flex-wrap items-end gap-3">
      <label className="flex flex-col gap-1 text-xs text-neutral-500">
        Actor
        <input
          type="text"
          value={values.actor}
          onChange={(e) => setValues((v) => ({ ...v, actor: e.target.value }))}
          placeholder="handle or id"
          className="w-40 rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-paper placeholder:text-neutral-600 focus:border-brass focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-500">
        Target
        <input
          type="text"
          value={values.target}
          onChange={(e) => setValues((v) => ({ ...v, target: e.target.value }))}
          placeholder="handle or id"
          className="w-40 rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-paper placeholder:text-neutral-600 focus:border-brass focus:outline-none"
        />
      </label>
      <label className="flex flex-col gap-1 text-xs text-neutral-500">
        Action
        <select
          value={values.action}
          onChange={(e) => setValues((v) => ({ ...v, action: e.target.value }))}
          className="w-48 rounded-lg border border-line bg-panel px-2 py-1.5 text-sm text-paper focus:border-brass focus:outline-none"
        >
          <option value="">All actions</option>
          {ACTIONS.map((action) => (
            <option key={action} value={action}>
              {action}
            </option>
          ))}
        </select>
      </label>
      <button
        type="submit"
        className="rounded-lg bg-brass px-3 py-1.5 text-sm font-medium text-ink hover:bg-brass-bright"
      >
        Apply
      </button>
      {hasFilter && (
        <button
          type="button"
          onClick={clear}
          className="text-sm text-neutral-500 hover:text-paper"
        >
          Clear
        </button>
      )}
    </form>
  );
}
