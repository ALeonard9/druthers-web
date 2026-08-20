/** @vitest-environment happy-dom */
import { cleanup, fireEvent, render, screen, waitFor } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import { AdminReportsDashboard } from './AdminReportsDashboard';

const NAMES = ['signups', 'active_users', 'tracking_volume', 'top_titles', 'top_users', 'engagement_by_tier', 'activation', 'retention', 'conversion'];

function report(name: string, overrides = {}) {
  return {
    report: name,
    bucket: 'week',
    from: '2026-06-01',
    to: '2026-08-20',
    series: [{ period: '2026-08-10', values: { count: 12 } }],
    totals: { count: 12 },
    ...overrides,
  };
}

describe('AdminReportsDashboard', () => {
  afterEach(() => { cleanup(); vi.unstubAllGlobals(); });

  it('shows loading states for every report before the shared range queries resolve', () => {
    vi.stubGlobal('fetch', vi.fn(() => new Promise(() => {})));
    render(<AdminReportsDashboard />);

    expect(screen.getAllByText('Loading report…')).toHaveLength(9);
    expect(screen.getByRole('heading', { name: 'Operational reports' })).toBeTruthy();
    expect(screen.getByRole('heading', { name: 'Funnel' })).toBeTruthy();
  });

  it('renders ranked data as a table and honest retention and instrumentation states', async () => {
    vi.stubGlobal('fetch', vi.fn((input: string) => {
      const name = input.match(/reports\/([^?]+)/)?.[1] ?? '';
      const body = name === 'top_titles'
        ? report(name, { series: [], rows: [{ label: 'Arrival', domain: 'movies', count: 8 }] })
        : name === 'retention'
          ? report(name, { series: [{ period: '2026-08-10', values: { cohort_size: 14, retained_d7: 5, retained_d28: 2 } }] })
          : name === 'conversion'
            ? report(name, { series: [], instrumented: false })
            : report(name);
      return Promise.resolve(new Response(JSON.stringify(body)));
    }));
    render(<AdminReportsDashboard />);

    expect(await screen.findByText('Arrival')).toBeTruthy();
    expect(screen.getAllByText('5 of 14 (36%)')).toHaveLength(2);
    expect(screen.getByRole('columnheader', { name: 'Cohort size' })).toBeTruthy();
    expect(screen.getByText('Not instrumented yet. No product events were recorded for this range.')).toBeTruthy();
    expect(screen.getAllByRole('link', { name: 'Export CSV' })[0].getAttribute('href')).toContain('format=csv');
  });

  it('refetches every report when the one range selector changes and surfaces report errors', async () => {
    const fetchMock = vi.fn((input: string) => {
      const name = input.match(/reports\/([^?]+)/)?.[1] ?? '';
      return Promise.resolve(name === 'top_users'
        ? new Response(JSON.stringify({ error: 'Upstream unavailable' }), { status: 502 })
        : new Response(JSON.stringify(report(name))));
    });
    vi.stubGlobal('fetch', fetchMock);
    render(<AdminReportsDashboard />);

    expect((await screen.findByRole('alert')).textContent).toContain('Could not load this report: Upstream unavailable');
    fireEvent.change(screen.getByLabelText('Range'), { target: { value: '30' } });
    await waitFor(() => expect(fetchMock).toHaveBeenCalledTimes(NAMES.length * 2));
    expect(fetchMock.mock.calls.at(-1)?.[0]).toContain('bucket=week');
  });
});
