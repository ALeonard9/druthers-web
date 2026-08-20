import { AdminReportsDashboard } from '@/components/AdminReportsDashboard';

// The parent AdminLayout owns the server-side authorization and impersonation
// gate. This client surface deliberately fetches through the admin BFF so a
// range change can refresh all reports without a page navigation.
export default function AdminReportsPage() {
  return <AdminReportsDashboard />;
}
