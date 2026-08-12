/** @vitest-environment happy-dom */
import { cleanup, render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it } from 'vitest';
import DevelopersPage from './page';

describe('MCP page', () => {
  afterEach(cleanup);

  it('is framed for personal MCP use', () => {
    const { container } = render(<DevelopersPage />);

    // Asserts primary framing
    expect(screen.getAllByText(/Claude MCP/).length).toBeGreaterThan(0);
    expect(
      screen.getByText(/Connect your own Druthers account/i)
    ).toBeDefined();

    // Asserts we removed the Postman collection
    expect(container.textContent).not.toMatch(/Postman collection/i);
    expect(container.textContent).not.toMatch(/druthers-api\.postman_collection\.json/);
  });

  it('keeps the MCP connection snippet and tool overview', () => {
    const { container } = render(<DevelopersPage />);

    // Tools list exists
    expect(screen.getByText(/search_\*/)).toBeDefined();
    expect(screen.getByText(/add_\*/)).toBeDefined();

    // Command snippet exists
    expect(container.textContent).toMatch(/claude mcp add druthers/);
    expect(container.textContent).toMatch(/API_TOKEN=drk_your_key_here/);
  });

  it('tells users where to get their API key', () => {
    render(<DevelopersPage />);
    // Verify there's a link to settings for the key
    const link = screen.getByRole('link', { name: /Settings → API keys/ });
    expect(link.getAttribute('href')).toBe('/settings');
  });
});
