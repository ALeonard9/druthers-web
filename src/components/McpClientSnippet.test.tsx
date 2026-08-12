/** @vitest-environment happy-dom */
import { render, screen, fireEvent } from '@testing-library/react';
import { expect, test } from 'vitest';
import { McpClientSnippet } from './McpClientSnippet';

test('McpClientSnippet defaults to Claude and switches snippets', () => {
  render(<McpClientSnippet />);

  // Should show Claude by default
  const claudeButton = screen.getByRole('button', { name: /Claude/i });
  expect(claudeButton.className).toContain('text-paper'); // Active state

  // Claude text and snippet should be present
  expect(screen.getByText(/claude mcp add druthers/i)).toBeDefined();
  expect(screen.getByText(/Claude Desktop uses the same env vars/i)).toBeDefined();

  // Switch to Codex
  const codexButton = screen.getByRole('button', { name: /Codex/i });
  fireEvent.click(codexButton);

  // Should show JSON configuration instead
  expect(screen.queryByText(/claude mcp add druthers/i)).toBeNull();
  expect(screen.getByText(/"mcpServers":/i)).toBeDefined();
  expect(screen.getByText(/"API_BASE_URL":/i)).toBeDefined();

  // Switch to OpenCode
  const opencodeButton = screen.getByRole('button', { name: /OpenCode/i });
  fireEvent.click(opencodeButton);

  // Should show OpenCode JSON configuration
  expect(screen.queryByText(/claude mcp add druthers/i)).toBeNull();
  expect(screen.getByText(/"type": "stdio"/i)).toBeDefined();
  expect(screen.getByText(/"API_BASE_URL":/i)).toBeDefined();
});
