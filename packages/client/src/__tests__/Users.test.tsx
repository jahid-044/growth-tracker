/**
 * Users list page test suite.
 *
 * Required data-testid attributes: users-role-select, users-department-select,
 * users-experience-select, users-search-input, users-page-size-select,
 * users-table, users-empty, users-error, users-loading, users-prev-page,
 * users-next-page, users-page-{n} (numbered pagination buttons).
 */

import { describe, it, expect, beforeEach, vi } from 'vitest';
import { render, screen, within } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { MemoryRouter, Route, Routes, useSearchParams } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { AxiosError } from 'axios';
import Users from '@/pages/Users';
import type { UsersListResponse, UsersQuery } from '@/types/users';

const mockListUsers = vi.fn<(query: UsersQuery) => Promise<UsersListResponse>>();

vi.mock('@/lib/users', () => ({
  listUsers: (query: UsersQuery) => mockListUsers(query),
}));

function makeResponse(overrides: Partial<UsersListResponse> = {}): UsersListResponse {
  return {
    users: [
      {
        id: '1',
        email: 'alice@company.com',
        role: 'LEARNER',
        department: 'Engineering',
        experienceLevel: 'JUNIOR',
        teamName: 'Alpha',
        bio: null,
        birthdate: '2000-01-01',
        createdAt: '2026-01-01T00:00:00.000Z',
      },
    ],
    pagination: { page: 1, pageSize: 10, total: 1, totalPages: 1 },
    sort: { sortBy: 'createdAt', sortOrder: 'asc' },
    filters: { role: null, department: null, experienceLevel: null, search: null },
    ...overrides,
  };
}

/** Exposes the current query string so tests can assert on shareable-URL behavior. */
function LocationProbe() {
  const [searchParams] = useSearchParams();
  return <div data-testid="location-probe">{searchParams.toString()}</div>;
}

function currentParams(): URLSearchParams {
  return new URLSearchParams(screen.getByTestId('location-probe').textContent ?? '');
}

function renderUsers(initialEntries: string[] = ['/en/users']) {
  // A fresh client per render avoids cache leaking between tests; retry:false
  // keeps the "fetch fails" test from hanging through React Query's backoff.
  const queryClient = new QueryClient({
    defaultOptions: { queries: { retry: false, gcTime: 0 } },
  });
  return render(
    <QueryClientProvider client={queryClient}>
      <MemoryRouter initialEntries={initialEntries}>
        <LocationProbe />
        <Routes>
          <Route path="/:lang/users" element={<Users />} />
        </Routes>
      </MemoryRouter>
    </QueryClientProvider>,
  );
}

beforeEach(() => {
  vi.clearAllMocks();
});

describe('Rendering users', () => {
  it('renders rows from a fetched response', async () => {
    mockListUsers.mockResolvedValue(makeResponse());
    renderUsers();

    const table = await screen.findByTestId('users-table');
    expect(within(table).getByText('alice@company.com')).toBeInTheDocument();
  });

  it('shows an empty state when there are no users', async () => {
    mockListUsers.mockResolvedValue(makeResponse({ users: [], pagination: { page: 1, pageSize: 10, total: 0, totalPages: 1 } }));
    renderUsers();

    expect(await screen.findByTestId('users-empty')).toBeInTheDocument();
  });

  it('shows an error state when the fetch fails', async () => {
    mockListUsers.mockRejectedValue(new Error('network down'));
    renderUsers();

    expect(await screen.findByTestId('users-error')).toBeInTheDocument();
  });

  it('shows the server-provided (localized) message when the API responds with one', async () => {
    const axiosError = new AxiosError('Bad request', undefined, undefined, undefined, {
      status: 400,
      data: { code: 'VALIDATION_ERROR', message: 'خطأ في التحقق من الصحة' },
    } as never);
    mockListUsers.mockRejectedValue(axiosError);
    renderUsers();

    expect(await screen.findByTestId('users-error')).toHaveTextContent('خطأ في التحقق من الصحة');
  });
});

describe('Shareable URL', () => {
  it('fetches using page/filters/sort found in the URL on first load', async () => {
    mockListUsers.mockResolvedValue(
      makeResponse({ pagination: { page: 2, pageSize: 10, total: 20, totalPages: 2 } }),
    );
    renderUsers(['/en/users?page=2&role=MANAGER&sortBy=email&sortOrder=desc']);

    await screen.findByTestId('users-table');
    expect(mockListUsers).toHaveBeenCalledWith(
      expect.objectContaining({ page: 2, role: 'MANAGER', sortBy: 'email', sortOrder: 'desc' }),
    );
  });

  it('ignores an unknown role value in the URL instead of forwarding it', async () => {
    mockListUsers.mockResolvedValue(makeResponse());
    renderUsers(['/en/users?role=BOGUS']);

    await screen.findByTestId('users-table');
    expect(mockListUsers).toHaveBeenCalledWith(expect.objectContaining({ role: undefined }));
  });

  it('writes filter changes into the URL and resets the page', async () => {
    mockListUsers.mockResolvedValue(makeResponse());
    const user = userEvent.setup();
    renderUsers(['/en/users?page=2']);

    await screen.findByTestId('users-table');
    await user.selectOptions(screen.getByTestId('users-role-select'), 'MANAGER');

    await vi.waitFor(() => {
      const params = currentParams();
      expect(params.get('role')).toBe('MANAGER');
      expect(params.has('page')).toBe(false);
    });
  });
});

describe('Filtering', () => {
  it('refetches with the role filter and resets to page 1', async () => {
    mockListUsers.mockResolvedValue(makeResponse());
    const user = userEvent.setup();
    renderUsers();

    await screen.findByTestId('users-table');
    mockListUsers.mockClear();
    mockListUsers.mockResolvedValue(makeResponse());

    await user.selectOptions(screen.getByTestId('users-role-select'), 'MANAGER');

    await vi.waitFor(() => {
      expect(mockListUsers).toHaveBeenCalledWith(expect.objectContaining({ role: 'MANAGER', page: 1 }));
    });
  });

  it('debounces the search input before fetching', async () => {
    mockListUsers.mockResolvedValue(makeResponse());
    const user = userEvent.setup();
    renderUsers();

    await screen.findByTestId('users-table');
    mockListUsers.mockClear();
    mockListUsers.mockResolvedValue(makeResponse());

    await user.type(screen.getByTestId('users-search-input'), 'alice');

    await vi.waitFor(() => {
      expect(mockListUsers).toHaveBeenCalledWith(expect.objectContaining({ search: 'alice', page: 1 }));
    });
  });

  it('sends the selected page size and resets to page 1', async () => {
    mockListUsers.mockResolvedValue(makeResponse());
    const user = userEvent.setup();
    renderUsers(['/en/users?page=2']);

    await screen.findByTestId('users-table');
    mockListUsers.mockClear();
    mockListUsers.mockResolvedValue(makeResponse());

    await user.selectOptions(screen.getByTestId('users-page-size-select'), '25');

    await vi.waitFor(() => {
      expect(mockListUsers).toHaveBeenCalledWith(expect.objectContaining({ pageSize: 25, page: 1 }));
      expect(currentParams().has('page')).toBe(false);
    });
  });
});

describe('Pagination', () => {
  it('requests the next page when clicking next', async () => {
    mockListUsers.mockResolvedValue(
      makeResponse({ pagination: { page: 1, pageSize: 10, total: 20, totalPages: 2 } }),
    );
    const user = userEvent.setup();
    renderUsers();

    await screen.findByTestId('users-table');
    mockListUsers.mockClear();
    mockListUsers.mockResolvedValue(
      makeResponse({ pagination: { page: 2, pageSize: 10, total: 20, totalPages: 2 } }),
    );

    await user.click(screen.getByTestId('users-next-page'));

    await vi.waitFor(() => {
      expect(mockListUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 2 }));
      expect(currentParams().get('page')).toBe('2');
    });
  });

  it('disables prev on the first page', async () => {
    mockListUsers.mockResolvedValue(
      makeResponse({ pagination: { page: 1, pageSize: 10, total: 20, totalPages: 2 } }),
    );
    renderUsers();

    await screen.findByTestId('users-table');
    expect(screen.getByTestId('users-prev-page')).toBeDisabled();
  });

  it('jumps directly to a clicked page number', async () => {
    mockListUsers.mockResolvedValue(
      makeResponse({ pagination: { page: 1, pageSize: 10, total: 110, totalPages: 11 } }),
    );
    const user = userEvent.setup();
    renderUsers();

    await screen.findByTestId('users-table');
    expect(screen.getByTestId('users-page-1')).toHaveAttribute('aria-current', 'page');

    mockListUsers.mockClear();
    mockListUsers.mockResolvedValue(
      makeResponse({ pagination: { page: 3, pageSize: 10, total: 110, totalPages: 11 } }),
    );

    await user.click(screen.getByTestId('users-page-3'));

    await vi.waitFor(() => {
      expect(mockListUsers).toHaveBeenCalledWith(expect.objectContaining({ page: 3 }));
      expect(currentParams().get('page')).toBe('3');
    });
  });

  it('does not render page numbers when everything fits on one page', async () => {
    mockListUsers.mockResolvedValue(makeResponse());
    renderUsers();

    await screen.findByTestId('users-table');
    expect(screen.queryByTestId('users-prev-page')).not.toBeInTheDocument();
    expect(screen.queryByTestId('users-page-1')).not.toBeInTheDocument();
  });
});
