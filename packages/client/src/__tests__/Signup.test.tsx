/**
 * Signup form test suite.
 *
 * These tests define the expected behaviour of the form — they pass once you
 * have implemented Signup.tsx correctly.  Read the guide in packages/docs/signup-form.md
 * alongside these tests.
 *
 * Required data-testid attributes
 * ────────────────────────────────
 * Add these to the matching elements in your implementation:
 *
 *   signup-form          <form> element
 *   email-input          email <input>
 *   password-input       password <input>
 *   password-rule-length <li> for the "8 chars" rule  — data-met="true|false"
 *   password-rule-upper  <li> for the uppercase rule  — data-met="true|false"
 *   password-rule-special<li> for the special-char rule — data-met="true|false"
 *   role-learner         LEARNER radio <input>
 *   role-manager         MANAGER radio <input>
 *   team-name-input      team name <input>  (only rendered when role = MANAGER)
 *   department-select    department <select>
 *   experience-junior    JUNIOR radio <input>
 *   experience-mid       MID   radio <input>
 *   experience-senior    SENIOR radio <input>
 *   add-address-btn      "Add an address" <button>
 *   address-group        wrapper <div> for each address group
 *   remove-address-btn   remove <button> inside each address group
 *   address-label-input  label <input> inside each address group
 *   address-street1-input street1 <input> inside each address group
 *   address-city-input   city <input> inside each address group
 *   address-state-input  state <input> inside each address group
 *   address-zip-input    zip <input> inside each address group
 *   address-country-input country <input> inside each address group
 *   submit-btn           submit <button>
 *   error-message        error <p> or <div>
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter } from 'react-router-dom';
import Signup from '@/pages/Signup';

// ── Mocks ─────────────────────────────────────────────────────────────────────

const mockNavigate = vi.fn();

vi.mock('react-router-dom', async (importOriginal) => {
  const actual = await importOriginal<typeof import('react-router-dom')>();
  return { ...actual, useNavigate: () => mockNavigate };
});

function mockFetchSuccess() {
  global.fetch = vi.fn().mockResolvedValue({
    ok: true,
    json: async () => ({
      accessToken: 'test-access-token',
      user: { id: '1', email: 'test@company.com' },
    }),
  });
}

function mockFetchError(message = 'Email already in use') {
  global.fetch = vi.fn().mockResolvedValue({
    ok: false,
    json: async () => ({ message }),
  });
}

// ── Helpers ───────────────────────────────────────────────────────────────────

function renderSignup() {
  return render(
    <MemoryRouter>
      <Signup />
    </MemoryRouter>,
  );
}

/** Fill the minimum required fields so the form can be submitted. */
async function fillRequiredFields(user: ReturnType<typeof userEvent.setup>) {
  await user.type(screen.getByTestId('email-input'), 'test@company.com');
  await user.type(screen.getByTestId('password-input'), 'Secret123!');
  await user.selectOptions(screen.getByTestId('department-select'), 'Engineering');
  // role defaults to LEARNER, experience defaults to JUNIOR — no extra clicks needed
}

// ── Tests ─────────────────────────────────────────────────────────────────────

beforeEach(() => {
  mockNavigate.mockReset();
  vi.restoreAllMocks();
});

// ── Rendering ────────────────────────────────────────────────────────────────

describe('Field rendering', () => {
  it('renders the email input', () => {
    renderSignup();
    expect(screen.getByTestId('email-input')).toBeInTheDocument();
  });

  it('renders the password input', () => {
    renderSignup();
    expect(screen.getByTestId('password-input')).toBeInTheDocument();
  });

  it('renders all three password validation rules', () => {
    renderSignup();
    expect(screen.getByTestId('password-rule-length')).toBeInTheDocument();
    expect(screen.getByTestId('password-rule-upper')).toBeInTheDocument();
    expect(screen.getByTestId('password-rule-special')).toBeInTheDocument();
  });

  it('renders both role options', () => {
    renderSignup();
    expect(screen.getByTestId('role-learner')).toBeInTheDocument();
    expect(screen.getByTestId('role-manager')).toBeInTheDocument();
  });

  it('renders the department select', () => {
    renderSignup();
    expect(screen.getByTestId('department-select')).toBeInTheDocument();
  });

  it('renders department select with all seven options plus the placeholder', () => {
    renderSignup();
    const select = screen.getByTestId('department-select');
    const options = Array.from((select as HTMLSelectElement).options).map((o) => o.value);
    for (const dept of ['Engineering', 'Product', 'Design', 'Marketing', 'Operations', 'HR', 'Other']) {
      expect(options).toContain(dept);
    }
  });

  it('renders all three experience level options', () => {
    renderSignup();
    expect(screen.getByTestId('experience-junior')).toBeInTheDocument();
    expect(screen.getByTestId('experience-mid')).toBeInTheDocument();
    expect(screen.getByTestId('experience-senior')).toBeInTheDocument();
  });

  it('renders the submit button', () => {
    renderSignup();
    expect(screen.getByTestId('submit-btn')).toBeInTheDocument();
  });
});

// ── Password validation rules ─────────────────────────────────────────────────

describe('Password validation rules', () => {
  it('all rules start as unmet', () => {
    renderSignup();
    expect(screen.getByTestId('password-rule-length')).toHaveAttribute('data-met', 'false');
    expect(screen.getByTestId('password-rule-upper')).toHaveAttribute('data-met', 'false');
    expect(screen.getByTestId('password-rule-special')).toHaveAttribute('data-met', 'false');
  });

  it('marks the length rule met when password reaches 8 characters', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.type(screen.getByTestId('password-input'), 'abcdefgh');
    expect(screen.getByTestId('password-rule-length')).toHaveAttribute('data-met', 'true');
  });

  it('keeps the length rule unmet for fewer than 8 characters', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.type(screen.getByTestId('password-input'), 'abc');
    expect(screen.getByTestId('password-rule-length')).toHaveAttribute('data-met', 'false');
  });

  it('marks the uppercase rule met when a capital letter is entered', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.type(screen.getByTestId('password-input'), 'A');
    expect(screen.getByTestId('password-rule-upper')).toHaveAttribute('data-met', 'true');
  });

  it('keeps the uppercase rule unmet when only lowercase is entered', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.type(screen.getByTestId('password-input'), 'abcdefgh');
    expect(screen.getByTestId('password-rule-upper')).toHaveAttribute('data-met', 'false');
  });

  it('marks the special character rule met when a special char is entered', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.type(screen.getByTestId('password-input'), '!');
    expect(screen.getByTestId('password-rule-special')).toHaveAttribute('data-met', 'true');
  });

  it('all rules met with "Secret123!"', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.type(screen.getByTestId('password-input'), 'Secret123!');
    expect(screen.getByTestId('password-rule-length')).toHaveAttribute('data-met', 'true');
    expect(screen.getByTestId('password-rule-upper')).toHaveAttribute('data-met', 'true');
    expect(screen.getByTestId('password-rule-special')).toHaveAttribute('data-met', 'true');
  });
});

// ── Conditional: team name ────────────────────────────────────────────────────

describe('Conditional team name field', () => {
  it('does not render team name when Learner is selected', () => {
    renderSignup();
    expect(screen.queryByTestId('team-name-input')).not.toBeInTheDocument();
  });

  it('renders team name when Manager is selected', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.click(screen.getByTestId('role-manager'));
    expect(screen.getByTestId('team-name-input')).toBeInTheDocument();
  });

  it('hides team name again when switching back to Learner', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.click(screen.getByTestId('role-manager'));
    await user.click(screen.getByTestId('role-learner'));
    expect(screen.queryByTestId('team-name-input')).not.toBeInTheDocument();
  });

  it('clears team name value when switching back to Learner then Manager', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.click(screen.getByTestId('role-manager'));
    await user.type(screen.getByTestId('team-name-input'), 'Platform Team');
    await user.click(screen.getByTestId('role-learner'));
    await user.click(screen.getByTestId('role-manager'));
    expect(screen.getByTestId('team-name-input')).toHaveValue('');
  });
});

// ── Address groups ────────────────────────────────────────────────────────────

describe('Address groups', () => {
  it('renders no address groups initially', () => {
    renderSignup();
    expect(screen.queryAllByTestId('address-group')).toHaveLength(0);
  });

  it('adds one address group when the button is clicked', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.click(screen.getByTestId('add-address-btn'));
    expect(screen.getAllByTestId('address-group')).toHaveLength(1);
  });

  it('adds multiple address groups on repeated clicks', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.click(screen.getByTestId('add-address-btn'));
    await user.click(screen.getByTestId('add-address-btn'));
    await user.click(screen.getByTestId('add-address-btn'));
    expect(screen.getAllByTestId('address-group')).toHaveLength(3);
  });

  it('removes an address group when its remove button is clicked', async () => {
    const user = userEvent.setup();
    renderSignup();
    await user.click(screen.getByTestId('add-address-btn'));
    await user.click(screen.getByTestId('add-address-btn'));
    const groups = screen.getAllByTestId('address-group');
    await user.click(within(groups[0]).getByTestId('remove-address-btn'));
    expect(screen.getAllByTestId('address-group')).toHaveLength(1);
  });
});

// ── Form submission ───────────────────────────────────────────────────────────

describe('Form submission', () => {
  it('submits the correct payload for a Learner with no addresses', async () => {
    mockFetchSuccess();
    const user = userEvent.setup();
    renderSignup();

    await fillRequiredFields(user);
    await user.click(screen.getByTestId('submit-btn'));

    expect(global.fetch).toHaveBeenCalledOnce();
    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body).toMatchObject({
      email: 'test@company.com',
      role: 'LEARNER',
      department: 'Engineering',
      addresses: [],
    });
    expect(body.teamName).toBeUndefined();
  });

  it('includes teamName in the payload when role is Manager', async () => {
    mockFetchSuccess();
    const user = userEvent.setup();
    renderSignup();

    await user.type(screen.getByTestId('email-input'), 'mgr@company.com');
    await user.type(screen.getByTestId('password-input'), 'Secret123!');
    await user.click(screen.getByTestId('role-manager'));
    await user.type(screen.getByTestId('team-name-input'), 'Platform Team');
    await user.selectOptions(screen.getByTestId('department-select'), 'Product');
    await user.click(screen.getByTestId('submit-btn'));

    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.teamName).toBe('Platform Team');
    expect(body.role).toBe('MANAGER');
  });

  it('includes address data and strips client-only fields', async () => {
    mockFetchSuccess();
    const user = userEvent.setup();
    renderSignup();

    await fillRequiredFields(user);
    await user.click(screen.getByTestId('add-address-btn'));

    const group = screen.getByTestId('address-group');
    await user.type(within(group).getByTestId('address-label-input'), 'Home');
    await user.type(within(group).getByTestId('address-street1-input'), '1 Main St');
    await user.type(within(group).getByTestId('address-city-input'), 'New York');
    await user.type(within(group).getByTestId('address-state-input'), 'NY');
    await user.type(within(group).getByTestId('address-zip-input'), '10001');
    await user.type(within(group).getByTestId('address-country-input'), 'US');

    await user.click(screen.getByTestId('submit-btn'));

    const body = JSON.parse((global.fetch as ReturnType<typeof vi.fn>).mock.calls[0][1].body);
    expect(body.addresses).toHaveLength(1);
    expect(body.addresses[0]).toMatchObject({ label: 'Home', street1: '1 Main St', city: 'New York' });
    // client-only fields must not leak into the payload
    expect(body.addresses[0].id).toBeUndefined();
    expect(body.addresses[0].isOpen).toBeUndefined();
  });

  it('shows an error message when the API returns an error', async () => {
    mockFetchError('Email already in use');
    const user = userEvent.setup();
    renderSignup();

    await fillRequiredFields(user);
    await user.click(screen.getByTestId('submit-btn'));

    expect(await screen.findByTestId('error-message')).toHaveTextContent('Email already in use');
  });

  it('navigates to / on successful signup', async () => {
    mockFetchSuccess();
    const user = userEvent.setup();
    renderSignup();

    await fillRequiredFields(user);
    await user.click(screen.getByTestId('submit-btn'));

    await vi.waitFor(() => {
      expect(mockNavigate).toHaveBeenCalledWith('/');
    });
  });
});
