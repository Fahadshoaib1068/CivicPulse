import { useEffect, useState } from 'react';
import { Card, StatCard } from '../components/ui';
import { getComplaintStats, type ComplaintStatsResult } from '../api';

export function StatsPage() {
  const [data, setData] = useState<ComplaintStatsResult | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    let isMounted = true;

    setLoading(true);
    setError(null);

    getComplaintStats()
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
        setError(err instanceof Error ? err.message : 'Unable to load complaint statistics.');
      })
      .finally(() => {
        if (isMounted) {
          setLoading(false);
        }
      });

    return () => {
      isMounted = false;
    };
  }, []);

  if (loading) {
    return (
      <Card title="Stats">
        <p aria-live="polite">Loading statistics...</p>
      </Card>
    );
  }

  if (error) {
    return (
      <Card title="Stats">
        <div role="alert" aria-live="assertive" className="status-message error">
          {error}
        </div>
      </Card>
    );
  }

  if (!data) {
    return (
      <Card title="Stats">
        <div className="empty-state">No complaint statistics are available yet.</div>
      </Card>
    );
  }

  const categoryCounts = data.by_category;
  const priorityCounts = data.by_priority;
  const cacheStatus = data.cacheStatus;
  const totalComplaints = Object.values(categoryCounts).reduce((total, value) => total + value, 0);

  return (
    <Card title="Stats">
      <div className="summary-row compact">
        <StatCard label="Total complaints" value={totalComplaints} />
        <StatCard label="Categories tracked" value={Object.keys(categoryCounts).length} />
        <StatCard label="Cache status" value={cacheStatus} />
      </div>

      <div className="stats-grid">
        <div>
          <h4>By category</h4>
          {Object.entries(categoryCounts).length > 0 ? (
            Object.entries(categoryCounts).map(([label, count]) => (
              <div key={label} className="stat-line">
                <span>{label}</span>
                <strong>{count}</strong>
              </div>
            ))
          ) : (
            <p className="empty-state">No category data available.</p>
          )}
        </div>

        <div>
          <h4>By priority</h4>
          {Object.entries(priorityCounts).length > 0 ? (
            Object.entries(priorityCounts).map(([label, count]) => (
              <div key={label} className="stat-line">
                <span>{label}</span>
                <strong>{count}</strong>
              </div>
            ))
          ) : (
            <p className="empty-state">No priority data available.</p>
          )}
        </div>
      </div>
    </Card>
  );
}
