import { useEffect, useMemo, useState } from 'react';
import { Badge, Button, Card } from '../components/ui';
import { ApiError, listComplaints, updateComplaintStatus } from '../api';
import type { Category, Complaint, Priority, Status } from '../types/complaints';

const PAGE_SIZE = 5;

const emptyFilters = {
  category: 'all',
  priority: 'all',
  status: 'all',
} as const;

export function DashboardPage() {
  const [filters, setFilters] = useState(emptyFilters);
  const [page, setPage] = useState(1);
  const [data, setData] = useState<{ items: Complaint[]; total: number; page: number; pageSize: number } | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [pendingStatusId, setPendingStatusId] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError(null);

    listComplaints({
      category: filters.category === 'all' ? undefined : filters.category,
      priority: filters.priority === 'all' ? undefined : filters.priority,
      status: filters.status === 'all' ? undefined : filters.status,
      page,
      pageSize: PAGE_SIZE,
    })
      .then((result) => {
        if (!isMounted) {
          return;
        }

        setData(result);
      })
      .catch((err) => {
        if (!isMounted) {
          return;
        }

        setData(null);
        setError(err instanceof Error ? err.message : 'Unable to load complaints.');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, [filters, page]);

  const totalPages = useMemo(() => {
    if (!data) {
      return 1;
    }

    return Math.max(1, Math.ceil(data.total / data.pageSize));
  }, [data]);

  const handleFilterChange = (key: 'category' | 'priority' | 'status', value: string) => {
    setPage(1);
    setFilters((current) => ({ ...current, [key]: value }));
  };

  const handleStatusUpdate = async (complaintId: string, nextStatus: Status) => {
    if (pendingStatusId === complaintId) {
      return;
    }

    setPendingStatusId(complaintId);
    setError(null);

    try {
      const updatedComplaint = await updateComplaintStatus(complaintId, nextStatus);
      setData((current) => {
        if (!current) {
          return current;
        }

        return {
          ...current,
          items: current.items.map((item) => (item.id === complaintId ? updatedComplaint : item)),
        };
      });
    } catch (err) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else if (err instanceof Error) {
        setError(err.message);
      } else {
        setError('Unable to update complaint status.');
      }
    } finally {
      setPendingStatusId(null);
    }
  };

  const compliantCategories: Array<Category | 'all'> = [
    'all',
    'water',
    'electricity',
    'sanitation',
    'roads',
    'streetlights',
    'other',
  ];

  const compliantPriorities: Array<Priority | 'all'> = ['all', 'high', 'normal', 'low'];
  const compliantStatuses: Array<Status | 'all'> = ['all', 'open', 'in_progress', 'resolved', 'rejected'];

  if (loading) {
    return (
      <Card title="Dashboard">
        <p aria-live="polite">Loading complaints...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Dashboard">
        <div role="alert" aria-live="assertive" className="status-message error">
          {error}
        </div>
      </Card>
    );
  }

  if (!data || data.items.length === 0) {
    return (
      <Card title="Dashboard">
        <div className="empty-state">
          <p>No complaints match the selected filters.</p>
        </div>
      </Card>
    );
  }

  return (
    <Card title="Dashboard">
      <div className="filters-panel" aria-label="Complaint filters">
        <label>
          Category
          <select
            aria-label="Filter by category"
            value={filters.category}
            onChange={(event) => handleFilterChange('category', event.target.value)}
          >
            {compliantCategories.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All categories' : option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Priority
          <select
            aria-label="Filter by priority"
            value={filters.priority}
            onChange={(event) => handleFilterChange('priority', event.target.value)}
          >
            {compliantPriorities.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All priorities' : option}
              </option>
            ))}
          </select>
        </label>

        <label>
          Status
          <select
            aria-label="Filter by status"
            value={filters.status}
            onChange={(event) => handleFilterChange('status', event.target.value)}
          >
            {compliantStatuses.map((option) => (
              <option key={option} value={option}>
                {option === 'all' ? 'All statuses' : option}
              </option>
            ))}
          </select>
        </label>
      </div>

      <div className="list" aria-live="polite">
        {data.items.map((complaint) => (
          <article key={complaint.id} className="list-item">
            <div className="row-between">
              <div>
                <p className="complaint-id">ID: {complaint.id}</p>
                <strong>{complaint.location}</strong>
              </div>
              <Badge
                tone={
                  complaint.priority === 'high'
                    ? 'high'
                    : complaint.priority === 'normal'
                      ? 'normal'
                      : 'low'
                }
              >
                {complaint.priority}
              </Badge>
            </div>

            <p>{complaint.text || complaint.ai_summary || 'No complaint text provided.'}</p>

            <div className="meta-row">
              <span>{complaint.category}</span>
              <span>{new Date(complaint.created_at).toLocaleDateString()}</span>
            </div>

            <div className="status-row">
              <label htmlFor={`status-${complaint.id}`}>Status</label>
              <select
                id={`status-${complaint.id}`}
                aria-label={`Update status for complaint ${complaint.id}`}
                value={complaint.status}
                disabled={pendingStatusId === complaint.id}
                onChange={(event) => handleStatusUpdate(complaint.id, event.target.value as Status)}
              >
                <option value="open">open</option>
                <option value="in_progress">in_progress</option>
                <option value="resolved">resolved</option>
                <option value="rejected">rejected</option>
              </select>

              {pendingStatusId === complaint.id ? <span className="status-pending">Updating...</span> : null}
            </div>
          </article>
        ))}
      </div>

      <div className="pagination" aria-label="Complaint pagination">
        <Button variant="secondary" type="button" onClick={() => setPage((current) => Math.max(1, current - 1))} disabled={page <= 1}>
          Previous
        </Button>
        <span>
          Page {page} of {totalPages}
        </span>
        <Button variant="secondary" type="button" onClick={() => setPage((current) => Math.min(totalPages, current + 1))} disabled={page >= totalPages}>
          Next
        </Button>
      </div>
    </Card>
  );
}
