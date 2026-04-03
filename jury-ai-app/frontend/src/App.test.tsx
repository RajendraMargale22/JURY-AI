import React from 'react';
import { render, screen } from '@testing-library/react';
import { vi } from 'vitest';
import App from './App';

vi.mock('axios', () => ({
  defaults: {
    baseURL: '',
    withCredentials: false,
    headers: { common: {} },
  },
  interceptors: {
    request: { use: vi.fn() },
    response: { use: vi.fn() },
  },
  create: vi.fn(() => ({
    interceptors: {
      request: { use: vi.fn() },
      response: { use: vi.fn() },
    },
    defaults: { headers: { common: {} } },
  })),
  get: vi.fn(),
  post: vi.fn(),
}));

test('renders jury ai landing page', () => {
  render(<App />);
  const matches = screen.getAllByText(/Jury AI/i);
  expect(matches.length).toBeGreaterThan(0);
});
