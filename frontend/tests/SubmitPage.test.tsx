import { render, screen, waitFor } from '@testing-library/react';
import userEvent from '@testing-library/user-event';
import { describe, expect, it, vi } from 'vitest';
import { SubmitPage } from '../src/pages/SubmitPage';
import * as api from '../src/api';

describe('SubmitPage', () => {
  it('shows validation errors for invalid form data', async () => {
    const user = userEvent.setup();
    const submitSpy = vi.spyOn(api, 'submitComplaint');

    render(<SubmitPage />);

    await user.type(screen.getByLabelText(/complaint text/i), 'short');
    await user.type(screen.getByLabelText(/location/i), 'ab');
    await user.click(screen.getByRole('button', { name: /submit complaint/i }));

    expect(screen.getByText('Complaint text must be between 10 and 2000 characters.')).toBeInTheDocument();
    expect(screen.getByText('Location must be between 3 and 200 characters.')).toBeInTheDocument();
    expect(submitSpy).not.toHaveBeenCalled();
  });

  it('shows a loading state and prevents duplicate submits while pending', async () => {
    const user = userEvent.setup();
    let resolveSubmission: (value: any) => void;
    const pending = new Promise((resolve) => {
      resolveSubmission = resolve;
    });

    vi.spyOn(api, 'submitComplaint').mockReturnValue(pending as Promise<any>);

    render(<SubmitPage />);

    await user.type(
      screen.getByLabelText(/complaint text/i),
      'Water pipe burst on Main Street and water is spreading across the road.'
    );
    await user.type(screen.getByLabelText(/location/i), 'Main Street, Sector 4');
    await user.click(screen.getByRole('button', { name: /submit complaint/i }));

    const button = screen.getByRole('button', { name: /submitting/i });
    expect(button).toBeDisabled();

    await user.click(button);
    expect(api.submitComplaint).toHaveBeenCalledTimes(1);

    resolveSubmission!({
      complaintId: 'CIV-123',
      category: 'water',
      priority: 'high',
      aiSummary: 'Burst water pipe near Main Street',
      triageProvider: 'local-frontend-preview',
    });

    await waitFor(() => expect(screen.getByText('Complaint ID:')).toBeInTheDocument());
  });

  it('displays the success result after submission', async () => {
    const user = userEvent.setup();
    vi.spyOn(api, 'submitComplaint').mockResolvedValue({
      complaintId: 'CIV-ABC123',
      category: 'electricity',
      priority: 'high',
      aiSummary: 'Power outage affecting nearby homes',
      triageProvider: 'local-frontend-preview',
    });

    render(<SubmitPage />);

    await user.type(
      screen.getByLabelText(/complaint text/i),
      'Transformer near the market is sparking and power is out in the surrounding homes.'
    );
    await user.type(screen.getByLabelText(/location/i), 'Market Road, Block B');
    await user.click(screen.getByRole('button', { name: /submit complaint/i }));

    expect(await screen.findByText('Complaint ID:')).toBeInTheDocument();
    expect(screen.getByText('CIV-ABC123')).toBeInTheDocument();
    expect(screen.getByText('electricity')).toBeInTheDocument();
    expect(screen.getByText('high')).toBeInTheDocument();
    expect(screen.getByText('Power outage affecting nearby homes')).toBeInTheDocument();
    expect(screen.getByText('local-frontend-preview')).toBeInTheDocument();
  });
});
