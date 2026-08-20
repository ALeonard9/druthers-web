'use client';

import { useEffect, useMemo, useState } from 'react';
import type { AdminReportBucket, AdminReportName, AdminReportPoint, AdminReportResponse } from '@/lib/types';

type ReportDefinition = {
  name: AdminReportName;
  title: string;
  description: string;
  ranked?: boolean;
  funnel?: boolean;
};

const OPERATIONAL_REPORTS: ReportDefinition[] = [
  { name: 'signups', title: 'Sign-ups over time', description: 'New accounts created in each period.' },
  { name: 'active_users', title: 'DAU / WAU', description: 'Distinct people who tracked or otherwise engaged.' },
  { name: 'tracking_volume', title: 'Tracking volume', description: 'Items tracked across movies, TV, books, and games.' },
  { name: 'top_titles', title: 'Most-tracked titles', description: 'Titles with the most tracking activity.', ranked: true },
  { name: 'top_users', title: 'Most-active users', description: 'People with the most tracking activity.', ranked: true },
  { name: 'engagement_by_tier', title: 'Engagement by tier', description: 'Activity distribution by engagement tier.' },
];

const FUNNEL_REPORTS: ReportDefinition[] = [
  { name: 'activation', title: 'Activation', description: 'New people reaching their first activation event.', funnel: true },
  { name: 'retention', title: 'D7 and D28 retention', description: 'Cohort retention curves with their denominators.', funnel: true },
  { name: 'conversion', title: 'Conversion', description: 'Share-to-sign-up and sign-up-to-activation conversion.', funnel: true },
];

function isoDate(date: Date) {
  return date.toISOString().slice(0, 10);
}

function rangeFor(days: number) {
  const to = new Date();
  const from = new Date(to);
  from.setDate(from.getDate() - days);
  return { from: isoDate(from), to: isoDate(to) };
}

function labelFor(key: string) {
  return key.replaceAll('_', ' ').replace(/\b\w/g, (letter) => letter.toUpperCase());
}

function metricKeys(series: AdminReportPoint[]) {
  return [...new Set(series.flatMap((point) => Object.keys(point.values)))].filter(
    (key) => key !== 'cohort_size',
  );
}

function Rate({ numerator, denominator }: { numerator: number; denominator: number }) {
  return (
    <span>
      {numerator} of {denominator} ({denominator ? Math.round((numerator / denominator) * 100) : 0}%)
    </span>
  );
}

function LineChart({ series }: { series: AdminReportPoint[] }) {
  const keys = metricKeys(series);
  if (!series.length || !keys.length) return null;
  const width = 640;
  const height = 180;
  const maximum = Math.max(1, ...series.flatMap((point) => keys.map((key) => point.values[key] ?? 0)));
  const x = (index: number) => (series.length === 1 ? width / 2 : (index / (series.length - 1)) * width);
  const y = (value: number) => height - (value / maximum) * (height - 18) - 9;

  return (
    <div className="mt-4 overflow-x-auto" aria-label="Trend chart">
      <svg viewBox={`0 0 ${width} ${height}`} className="h-44 min-w-96 w-full" role="img" aria-label="Report series over time">
        <line x1="0" x2={width} y1={height - 9} y2={height - 9} stroke="currentColor" className="text-line" />
        {keys.map((key, keyIndex) => {
          const points = series.map((point, index) => `${x(index)},${y(point.values[key] ?? 0)}`).join(' ');
          return <polyline key={key} points={points} fill="none" stroke={keyIndex ? '#d1a865' : '#e8e1d5'} strokeWidth="3" />;
        })}
      </svg>
      <div className="flex flex-wrap gap-x-4 gap-y-1 text-xs text-neutral-400">
        {keys.map((key, index) => <span key={key}><span className={index ? 'text-brass' : 'text-paper'}>●</span> {labelFor(key)}</span>)}
      </div>
    </div>
  );
}

function ReportCard({ definition, data, error, exportHref }: {
  definition: ReportDefinition;
  data?: AdminReportResponse;
  error?: string;
  exportHref: string;
}) {
  return (
    <section className="rounded-lg border border-line bg-panel p-5" aria-labelledby={`${definition.name}-heading`}>
      <div className="flex flex-wrap items-start justify-between gap-3">
        <div>
          <h3 id={`${definition.name}-heading`} className="font-display text-xl text-paper">{definition.title}</h3>
          <p className="mt-1 text-sm text-neutral-400">{definition.description}</p>
        </div>
        <a href={exportHref} download className="text-sm text-brass hover:text-brass-bright">Export CSV</a>
      </div>
      {!data && !error && <p className="mt-5 text-sm text-neutral-400">Loading report…</p>}
      {error && <p role="alert" className="mt-5 text-sm text-red-300">Could not load this report: {error}</p>}
      {data && definition.funnel && data.instrumented === false && (
        <p className="mt-5 rounded border border-brass/30 bg-brass/10 p-3 text-sm text-brass-bright">Not instrumented yet. No product events were recorded for this range.</p>
      )}
      {data && !(definition.funnel && data.instrumented === false) && definition.ranked && (
        data.rows?.length ? <RankedRows rows={data.rows} /> : <Empty />
      )}
      {data && !(definition.funnel && data.instrumented === false) && !definition.ranked && (
        data.series.length ? <SeriesReport data={data} retention={definition.name === 'retention'} /> : <Empty />
      )}
    </section>
  );
}

function Empty() {
  return <p className="mt-5 text-sm text-neutral-400">No data for this range.</p>;
}

function RankedRows({ rows }: { rows: NonNullable<AdminReportResponse['rows']> }) {
  return <div className="mt-5 overflow-x-auto"><table className="w-full text-left text-sm"><thead className="text-neutral-400"><tr><th className="pb-2 font-medium">Name</th><th className="pb-2 font-medium">Domain</th><th className="pb-2 text-right font-medium">Count</th></tr></thead><tbody>{rows.map((row) => <tr key={`${row.domain ?? ''}-${row.label}`} className="border-t border-line text-neutral-200"><td className="py-2">{row.label}</td><td className="py-2 text-neutral-400">{row.domain ?? '-'}</td><td className="py-2 text-right">{row.count}</td></tr>)}</tbody></table></div>;
}

function SeriesReport({ data, retention }: { data: AdminReportResponse; retention: boolean }) {
  const latest = data.series.at(-1)!;
  const keys = metricKeys(data.series);
  return <>
    <div className="mt-5 flex flex-wrap gap-x-5 gap-y-2 text-sm text-neutral-300">
      {keys.map((key) => retention && latest.values.cohort_size !== undefined ? (
        <span key={key}><span className="text-neutral-500">{labelFor(key)}:</span> <Rate numerator={latest.values[key] ?? 0} denominator={latest.values.cohort_size} /></span>
      ) : <span key={key}><span className="text-neutral-500">{labelFor(key)}:</span> {latest.values[key] ?? 0}</span>)}
      {retention && latest.values.cohort_size !== undefined && <span className="text-neutral-500">Latest cohort: {latest.values.cohort_size}</span>}
    </div>
    <LineChart series={data.series} />
    {retention && <RetentionCohorts series={data.series} keys={keys} />}
  </>;
}

function RetentionCohorts({ series, keys }: { series: AdminReportPoint[]; keys: string[] }) {
  return <div className="mt-4 overflow-x-auto"><table className="w-full text-left text-xs"><thead className="text-neutral-400"><tr><th className="pb-2 font-medium">Cohort</th><th className="pb-2 font-medium">Cohort size</th>{keys.map((key) => <th key={key} className="pb-2 font-medium">{labelFor(key)}</th>)}</tr></thead><tbody>{series.map((point) => {
    const cohort = point.values.cohort_size ?? 0;
    return <tr key={point.period} className="border-t border-line text-neutral-300"><td className="py-2">{point.period}</td><td className="py-2">{cohort}</td>{keys.map((key) => <td key={key} className="py-2"><Rate numerator={point.values[key] ?? 0} denominator={cohort} /></td>)}</tr>;
  })}</tbody></table></div>;
}

export function AdminReportsDashboard() {
  const [days, setDays] = useState(90);
  const [bucket, setBucket] = useState<AdminReportBucket>('week');
  const [reports, setReports] = useState<Record<string, AdminReportResponse | undefined>>({});
  const [errors, setErrors] = useState<Record<string, string | undefined>>({});
  const range = useMemo(() => rangeFor(days), [days]);
  const query = useMemo(() => new URLSearchParams({ ...range, bucket }).toString(), [range, bucket]);

  useEffect(() => {
    let cancelled = false;
    setReports({});
    setErrors({});
    const definitions = [...OPERATIONAL_REPORTS, ...FUNNEL_REPORTS];
    Promise.all(definitions.map(async ({ name }) => {
      try {
        const response = await fetch(`/api/admin/reports/${name}?${query}`);
        const body = await response.json();
        if (!response.ok) throw new Error(body.error ?? 'Request failed');
        if (!cancelled) setReports((current) => ({ ...current, [name]: body }));
      } catch (err) {
        if (!cancelled) setErrors((current) => ({ ...current, [name]: err instanceof Error ? err.message : 'Request failed' }));
      }
    }));
    return () => { cancelled = true; };
  }, [query]);

  const card = (definition: ReportDefinition) => <ReportCard key={definition.name} definition={definition} data={reports[definition.name]} error={errors[definition.name]} exportHref={`/api/admin/reports/${definition.name}?${query}&format=csv`} />;
  return <div className="flex flex-col gap-8">
    <div className="flex flex-wrap items-end gap-4 rounded-lg border border-line bg-panel p-4">
      <label className="flex flex-col gap-1 text-sm text-neutral-300">Range<select value={days} onChange={(event) => setDays(Number(event.target.value))} className="rounded border border-line bg-ink px-3 py-2 text-paper"><option value={30}>Last 30 days</option><option value={90}>Last 90 days</option><option value={365}>Last year</option></select></label>
      <label className="flex flex-col gap-1 text-sm text-neutral-300">Bucket<select value={bucket} onChange={(event) => setBucket(event.target.value as AdminReportBucket)} className="rounded border border-line bg-ink px-3 py-2 text-paper"><option value="day">Day</option><option value="week">Week</option><option value="month">Month</option></select></label>
      <p className="pb-2 text-sm text-neutral-500">{range.from} to {range.to}</p>
    </div>
    <div><h2 className="font-display text-2xl text-paper">Operational reports</h2><p className="mt-1 text-sm text-neutral-400">Growth, activity, and tracking volume.</p><div className="mt-4 grid gap-4 xl:grid-cols-2">{OPERATIONAL_REPORTS.map(card)}</div></div>
    <div><h2 className="font-display text-2xl text-paper">Funnel</h2><p className="mt-1 text-sm text-neutral-400">Activation, retention, and conversion trends.</p><div className="mt-4 grid gap-4 xl:grid-cols-2">{FUNNEL_REPORTS.map(card)}</div></div>
  </div>;
}
