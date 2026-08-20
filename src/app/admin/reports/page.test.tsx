/** @vitest-environment happy-dom */
import { render, screen } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';
import Page from './page';

vi.mock('@/components/AdminReportsDashboard', () => ({
  AdminReportsDashboard: () => <div data-testid="reports-dashboard">dashboard</div>,
}));

describe('AdminReportsPage', () => {
  it('mounts the dashboard inside the parent admin shell', () => {
    render(<Page />);
    expect(screen.getByTestId('reports-dashboard')).toBeTruthy();
  });
});
