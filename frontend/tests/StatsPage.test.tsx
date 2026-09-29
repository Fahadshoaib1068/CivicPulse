import { render, screen } from '@testing-library/react';
import { afterEach, describe, expect, it, vi } from 'vitest';
import * as api from '../src/api';
import { StatsPage } from '../src/pages/StatsPage';

describe('StatsPage', () => {
  afterEach(() => {
    vi.restoreAllMocks();
  });

  it('displays successful statistics from the API response', async () => {
    vi.spyOn(api, 'getComplaintStats').mockResolvedValue({
      by_category: {
        water: 4,
        electricity: 2,
      },
      by_priority: {
        high: 3,
        normal: 2,
        low: 1,
      },
      cacheStatus: 'HIT',
    });

    render(<StatsPage />);

    expect(screen.getByText('Loading statistics...')).toBeInTheDocument();

    expect(await screen.findByText('Total complaints')).toBeInTheDocument();
    expect(screen.getByText('6')).toBeInTheDocument();
    expect(screen.getByText('water')).toBeInTheDocument();
    expect(screen.getByText('electricity')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('normal')).toBeInTheDocument();
    expect(screen.getByText('HIT')).toBeInTheDocument();
  });

  it('renders the X-Cache MISS status when the response is not cached', async () => {
    vi.spyOn(api, 'getComplaintStats').mockResolvedValue({
      by_category: { sanitation: 1 },
      by_priority: { high: 1 },
      cacheStatus: 'MISS',
    });

    render(<StatsPage />);

    expect(await screen.findByText('MISS')).toBeInTheDocument();
  });

  it('renders the X-Cache HIT status when the response is cached', async () => {
    vi.spyOn(api, 'getComplaintStats').mockResolvedValue({
      by_category: { roads: 2 },
      by_priority: { normal: 2 },
      cacheStatus: 'HIT',
    });

    render(<StatsPage />);

    expect(await screen.findByText('HIT')).toBeInTheDocument();
  });

  it('shows a loading state while statistics are being fetched', async () => {
    let resolveStats: (value: any) => void;
    const pending = new Promise((resolve) => {
      resolveStats = resolve;
    });

    vi.spyOn(api, 'getComplaintStats').mockReturnValue(pending as Promise<any>);

    render(<StatsPage />);

    expect(screen.getByText('Loading statistics...')).toBeInTheDocument();

    resolveStats!({
      by_category: { water: 1 },
      by_priority: { high: 1 },
      cacheStatus: 'MISS',
    });

    expect(await screen.findByText('Total complaints')).toBeInTheDocument();
  });

  it('shows an error state when statistics loading fails', async () => {
    vi.spyOn(api, 'getComplaintStats').mockRejectedValue(
      new api.ApiError(500, 'Unable to load complaint statistics.')
    );

    render(<StatsPage />);

    expect(await screen.findByRole('alert')).toHaveTextContent('Unable to load complaint statistics.');
  });
});
