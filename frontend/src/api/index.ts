import { getApiBaseUrl } from '../config';
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
};

export type ComplaintSubmissionResult = Complaint & {
  complaintId: string;
  aiSummary: string | null;
  triageProvider: string;
};

export type ComplaintStatsResponse = {
  by_category: Partial<Record<Category, number>>;
  by_priority: Partial<Record<Priority, number>>;
};

export type ComplaintStatsResult = ComplaintStatsResponse & {
  cacheStatus: 'HIT' | 'MISS';
};

function mapComplaint(raw: any): Complaint {
  return {
    id: raw.id,
    text: raw.text ?? '',
    location: raw.location ?? '',
    reporter_contact: raw.reporter_contact ?? null,
    category: raw.category,
    priority: raw.priority,
    status: raw.status,
    ai_summary: raw.ai_summary ?? null,
    triaged_by: raw.triaged_by ?? 'unknown',
    triage_latency_ms: raw.triage_latency_ms ?? 0,
    created_at: raw.created_at,
    updated_at: raw.updated_at ?? null,
  };
}

function mapSubmissionResult(raw: any): ComplaintSubmissionResult {
  const complaint = mapComplaint(raw);

  return {
    ...complaint,
    complaintId: complaint.id,
    aiSummary: complaint.ai_summary ?? '',
    triageProvider: complaint.triaged_by,
  };
}

export async function getComplaintStats(): Promise<ComplaintStatsResult> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/stats`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(
      response.status,
      detail || 'Unable to load complaint statistics.'
    );
  }

  const payload = (await response.json()) as Partial<ComplaintStatsResponse>;

  if (!payload.by_category || !payload.by_priority) {
    throw new ApiError(502, 'Complaint statistics response was missing the expected payload.');
  }

  const cacheHeader = response.headers.get('X-Cache');
  const cacheStatus = cacheHeader && cacheHeader.toUpperCase() === 'HIT' ? 'HIT' : 'MISS';

  return {
    by_category: payload.by_category,
    by_priority: payload.by_priority,
    cacheStatus,
  };
}

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

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/complaints`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({
      text: trimmedText,
      location: trimmedLocation,
      reporter_contact: payload.reporter_contact?.trim() || null,
    }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(
      response.status,
      detail || 'Unable to submit complaint.'
    );
  }

  const data = (await response.json()) as any;
  return mapSubmissionResult(data);
}

export async function listComplaints(
  filters: ComplaintListFilters = {}
): Promise<ComplaintListResponse> {
  const page = filters.page ?? 1;
  const pageSize = filters.pageSize ?? 10;

  const params = new URLSearchParams({
    page: String(page),
    page_size: String(pageSize),
  });

  if (filters.category && filters.category !== 'all') {
    params.set('category', filters.category);
  }

  if (filters.priority && filters.priority !== 'all') {
    params.set('priority', filters.priority);
  }

  if (filters.status && filters.status !== 'all') {
    params.set('status', filters.status);
  }

  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/complaints?${params.toString()}`, {
    method: 'GET',
    headers: {
      Accept: 'application/json',
    },
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(
      response.status,
      detail || 'Unable to load complaints.'
    );
  }

  const payload = (await response.json()) as {
    items: any[];
    total: number;
    page: number;
    page_size: number;
  };

  return {
    items: payload.items.map(mapComplaint),
    total: payload.total,
    page: payload.page,
    pageSize: payload.page_size,
  };
}

export async function updateComplaintStatus(
  complaintId: string,
  status: Status
): Promise<Complaint> {
  const baseUrl = getApiBaseUrl();
  const response = await fetch(`${baseUrl}/api/complaints/${complaintId}/status`, {
    method: 'PATCH',
    headers: {
      'Content-Type': 'application/json',
      Accept: 'application/json',
    },
    body: JSON.stringify({ status }),
  });

  if (!response.ok) {
    const detail = await response.text();
    throw new ApiError(
      response.status,
      detail || 'Unable to update complaint status.'
    );
  }

  const payload = (await response.json()) as any;
  return mapComplaint(payload);
}
