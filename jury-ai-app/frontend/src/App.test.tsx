import React from 'react';
import { render, screen } from '@testing-library/react';
import App from './App';

jest.mock('axios', () => ({
  defaults: {
    baseURL: '',
    withCredentials: false,
    headers: { common: {} },
  },
  interceptors: {
    request: { use: jest.fn() },
    response: { use: jest.fn() },
  },
  create: jest.fn(() => ({
    interceptors: {
      request: { use: jest.fn() },
      response: { use: jest.fn() },
    },
    defaults: { headers: { common: {} } },
  })),
  get: jest.fn(),
  post: jest.fn(),
}));

test('renders jury ai landing page', () => {
  render(<App />);
  const matches = screen.getAllByText(/Jury AI/i);
  expect(matches.length).toBeGreaterThan(0);
});
