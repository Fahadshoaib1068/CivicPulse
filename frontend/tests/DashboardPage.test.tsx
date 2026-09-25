import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import { DashboardPage } from '../src/pages/DashboardPage';

describe('DashboardPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('applies category, priority, and status filters', async () => {
    const user = userEvent.setup();

    const complaints = [
      {
        id: 'c-1001',
        text: 'Water leak near the market',
        location: 'Main Market',
        reporter_contact: null,
        category: 'water',
        priority: 'high',
        status: 'open',
        ai_summary: 'Water leak',
        triaged_by: 'rules',
        triage_latency_ms: 100,
        created_at: '2026-09-20T10:00:00Z',
      },
      {
        id: 'c-2001',
        text: 'Streetlight outage in park',
        location: 'Park Road',
        reporter_contact: null,
        category: 'streetlights',
        priority: 'normal',
        status: 'resolved',
        ai_summary: 'Streetlight outage',
        triaged_by: 'rules',
        triage_latency_ms: 110,
        created_at: '2026-09-21T10:00:00Z',
      },
    ];

    vi.spyOn(api, 'listComplaints').mockImplementation(async (filters = {}) => ({
      items: complaints.filter((complaint) => {
        if (filters.category && filters.category !== 'all' && complaint.category !== filters.category) {
          return false;
        }
        if (filters.priority && filters.priority !== 'all' && complaint.priority !== filters.priority) {
          return false;
        }
        if (filters.status && filters.status !== 'all' && complaint.status !== filters.status) {
          return false;
        }
        return true;
      }),
      total: complaints.length,
      page: filters.page ?? 1,
      pageSize: filters.pageSize ?? 5,
    }));

    render(<DashboardPage />);

    await waitFor(() => expect(api.listComplaints).toHaveBeenCalled());

    await user.selectOptions(screen.getByLabelText(/filter by category/i), 'water');
    await waitFor(() =>
      expect(api.listComplaints).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: 'water', page: 1, pageSize: 5 })
      )
    );

    await user.selectOptions(screen.getByLabelText(/filter by priority/i), 'high');
    await waitFor(() =>
      expect(api.listComplaints).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: 'water', priority: 'high', page: 1, pageSize: 5 })
      )
    );

    await user.selectOptions(screen.getByLabelText(/filter by status/i), 'open');
    await waitFor(() =>
      expect(api.listComplaints).toHaveBeenLastCalledWith(
        expect.objectContaining({ category: 'water', priority: 'high', status: 'open', page: 1, pageSize: 5 })
      )
    );
  });

  it('renders pagination controls and advances pages', async () => {
    const user = userEvent.setup();
    const complaints = Array.from({ length: 12 }, (_, index) => ({
      id: `c-${index + 1}`,
      text: `Complaint ${index + 1}`,
      location: `Location ${index + 1}`,
      reporter_contact: null,
      category: 'water',
      priority: 'normal',
      status: 'open',
      ai_summary: `Summary ${index + 1}`,
      triaged_by: 'rules',
      triage_latency_ms: 80,
      created_at: '2026-09-20T10:00:00Z',
    }));

    vi.spyOn(api, 'listComplaints').mockImplementation(async (filters = {}) => {
      const page = filters.page ?? 1;
      const start = (page - 1) * 5;
      const pageItems = complaints.slice(start, start + 5);

      return {
        items: pageItems,
        total: complaints.length,
        page,
        pageSize: 5,
      };
    });

    render(<DashboardPage />);

    expect(await screen.findByText('Page 1 of 3')).toBeInTheDocument();
    expect(screen.getByText('Complaint 1')).toBeInTheDocument();

    await user.click(screen.getByRole('button', { name: /next/i }));

    await waitFor(() => expect(api.listComplaints).toHaveBeenLastCalledWith(
      expect.objectContaining({ page: 2, pageSize: 5 })
    ));

    expect(await screen.findByText('Page 2 of 3')).toBeInTheDocument();
  });

  it('shows a loading state while complaints are being fetched', async () => {
    let resolvePromise: (value: any) => void;
    const pending = new Promise((resolve) => {
      resolvePromise = resolve;
    });

    vi.spyOn(api, 'listComplaints').mockReturnValue(pending as Promise<any>);

    render(<DashboardPage />);

    expect(screen.getByText('Loading complaints...')).toBeInTheDocument();

    resolvePromise!({
      items: [],
      total: 0,
      page: 1,
      pageSize: 5,
    });

    await waitFor(() => expect(screen.getByText('No complaints match the selected filters.')).toBeInTheDocument());
  });

  it('displays an error state when complaint loading fails', async () => {
    vi.spyOn(api, 'listComplaints').mockRejectedValue(new api.ApiError(500, 'Unable to load complaints.'));

    render(<DashboardPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load complaints.');
  });

  it('updates complaint status successfully', async () => {
    const user = userEvent.setup();
    const complaint = {
      id: 'c-1001',
      text: 'Water leak near the market',
      location: 'Main Market',
      reporter_contact: null,
      category: 'water',
      priority: 'high',
      status: 'open',
      ai_summary: 'Water leak',
      triaged_by: 'rules',
      triage_latency_ms: 100,
      created_at: '2026-09-20T10:00:00Z',
    };

    vi.spyOn(api, 'listComplaints').mockResolvedValue({
      items: [complaint],
      total: 1,
      page: 1,
      pageSize: 5,
    });

    vi.spyOn(api, 'updateComplaintStatus').mockResolvedValue({
      ...complaint,
      status: 'in_progress',
    });

    render(<DashboardPage />);

    const select = await screen.findByLabelText(/update status for complaint c-1001/i);
    await user.selectOptions(select, 'in_progress');

    await waitFor(() => expect(api.updateComplaintStatus).toHaveBeenCalledWith('c-1001', 'in_progress'));
    expect(await screen.findByDisplayValue('in_progress')).toBeInTheDocument();
  });

  it('shows the exact HTTP 409 server message when status update fails', async () => {
    const user = userEvent.setup();
    const complaint = {
      id: 'c-1002',
      text: 'Streetlight outage in park',
      location: 'Park Road',
      reporter_contact: null,
      category: 'streetlights',
      priority: 'normal',
      status: 'open',
      ai_summary: 'Streetlight outage',
      triaged_by: 'rules',
      triage_latency_ms: 110,
      created_at: '2026-09-21T10:00:00Z',
    };

    vi.spyOn(api, 'listComplaints').mockResolvedValue({
      items: [complaint],
      total: 1,
      page: 1,
      pageSize: 5,
    });

    vi.spyOn(api, 'updateComplaintStatus').mockRejectedValue(
      new api.ApiError(409, 'Complaint is already in_progress.')
    );

    render(<DashboardPage />);

    const select = await screen.findByLabelText(/update status for complaint c-1002/i);
    await user.selectOptions(select, 'in_progress');

    expect(await screen.findByRole('alert')).toHaveTextContent('Complaint is already in_progress.');
  });
});
