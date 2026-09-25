import type { Category, Complaint, Priority, Status } from '../types/complaints';

export type ComplaintListFilters = {
  category?: Category | 'all';
  priority?: Priority | 'all';
  status?: Status | 'all';
  page?: number;
  pageSize?: number;
};

export type ComplaintListResponse = {
  items: Complaint[];
  total: number;
  page: number;
  pageSize: number;
};

export class ApiError extends Error {
  status: number;

  constructor(status: number, message: string) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export type ComplaintSubmissionRequest = {
  text: string;
  location: string;
  reporter_contact?: string | null;
  category: Category;
  priority: Priority;
};

export type ComplaintSubmissionResult = {
  complaintId: string;
  category: Category;
  priority: Priority;
  aiSummary: string;
  triageProvider: string;
};

export async function submitComplaint(
  payload: ComplaintSubmissionRequest
): Promise<ComplaintSubmissionResult> {
  const trimmedText = payload.text.trim();
  const trimmedLocation = payload.location.trim();

  if (trimmedText.length < 10 || trimmedText.length > 2000) {
    throw new Error('Complaint text must be between 10 and 2000 characters.');
  }

  if (trimmedLocation.length < 3 || trimmedLocation.length > 200) {
    throw new Error('Location must be between 3 and 200 characters.');
  }

  await Promise.resolve();

  return {
    complaintId: `CIV-${Math.random().toString(36).slice(2, 9).toUpperCase()}`,
    category: payload.category,
    priority: payload.priority,
    aiSummary:
      trimmedText.length > 120 ? `${trimmedText.slice(0, 117).trim()}...` : trimmedText,
    triageProvider: 'local-frontend-preview',
  };
}

export async function listComplaints(
  filters: ComplaintListFilters = {}
): Promise<ComplaintListResponse> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;

  await Promise.resolve();
  throw new ApiError(
    501,
    'CivicPulse backend HTTP routes are not implemented yet. The dashboard will connect once the API is available.'
  );
}

export async function updateComplaintStatus(
  complaintId: string,
  status: Status
): Promise<Complaint> {
  await Promise.resolve();
  throw new ApiError(
    501,
    'CivicPulse backend HTTP routes are not implemented yet. Status updates will connect once the API is available.'
  );
}
