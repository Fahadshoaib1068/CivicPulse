export type Category =
  | 'water'
  | 'electricity'
  | 'sanitation'
  | 'roads'
  | 'streetlights'
  | 'other';

export type Priority = 'high' | 'normal' | 'low';

export type Status = 'open' | 'in_progress' | 'resolved' | 'rejected';

export type TriageResult = {
  category: Category;
  priority: Priority;
  summary: string;
  confidence: number;
};

export type Complaint = {
  id: string;
  text: string;
  location: string;
  reporter_contact?: string | null;
  category: Category;
  priority: Priority;
  status: Status;
  ai_summary?: string | null;
  triaged_by: string;
  triage_latency_ms: number;
  created_at: string;
  updated_at?: string | null;
};
