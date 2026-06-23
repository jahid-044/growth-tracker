/**
 * Login form test suite.
 *
 * Required data-testid attributes: login-form, email-input, password-input,
 * submit-btn, error-message, and signup-success (banner shown after signup).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import { AxiosError } from 'axios';
import Login from '@/pages/Login';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

const mockLogin = vi.fn();

vi.mock('@/context/AuthContext', () => ({
  useAuth: () => ({ login: mockLogin }),
}));

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderLogin(initialEntry: Parameters<typeof MemoryRouter>[0]['initialEntries'] = ['/login']) {
  return render(
    <MemoryRouter initialEntries={initialEntry}>
      <Login />
    </MemoryRouter>,
  );
}

async function fillCredentials(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId('email-input'), 'test@company.com');
  await user.type(screen.getByTestId('password-input'), 'Secret123!');
}

function make401(message = 'Invalid credentials') {
  return new AxiosError(message, undefined, undefined, undefined, {
    status: 401,
    data: { message },
  } as never);
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockNavigate.mockReset();
  vi.clearAllMocks();
});

describe('Field rendering', () => {
  it('renders the email and password inputs and submit button', () => {
    renderLogin();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
  });
});

describe('Login submission', () => {
  it('navigates to / on successful login', async () => {
    mockLogin.mockResolvedValue({ id: '1', email: 'test@company.com' });
    const user = userEvent.setup();
    renderLogin();

    await fillCredentials(user);
    await user.click(screen.getByTestId('submit-btn'));

    await vi.waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@company.com', 'Secret123!');
      expect(mockNavigate).toHaveBeenCalledWith('/', { replace: true });
    });
  });

  it('redirects to the intended location after login', async () => {
    mockLogin.mockResolvedValue({ id: '1', email: 'test@company.com' });
    const user = userEvent.setup();
    renderLogin([{ pathname: '/login', state: { from: { pathname: '/settings' } } }]);

    await fillCredentials(user);
    await user.click(screen.getByTestId('submit-btn'));

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/settings', { replace: true });
    });
  });

  it('shows "Invalid credentials" on a 401 response', async () => {
    mockLogin.mockRejectedValue(make401());
    const user = userEvent.setup();
    renderLogin();

    await fillCredentials(user);
    await user.click(screen.getByTestId('submit-btn'));

    expect(await screen.findByTestId('error-message')).toHaveTextContent('Invalid credentials');
    expect(mockNavigate).not.toHaveBeenCalled();
  });
});

describe('Post-signup banner', () => {
  it('shows the success banner when arriving from signup', () => {
    renderLogin([{ pathname: '/login', state: { justSignedUp: true } }]);
    expect(screen.getByTestId('signup-success')).toBeInTheDocument();
  });

  it('does not show the banner on a normal visit', () => {
    renderLogin();
    expect(screen.queryByTestId('signup-success')).not.toBeInTheDocument();
  });
});
