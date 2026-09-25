import { Card, StatCard } from '../components/ui';
import type { Complaint } from '../types/complaints';

export function StatsPage({ complaints }: { complaints: Complaint[] }) {
  const categoryCounts = complaints.reduce<Record<string, number>>((acc, complaint) => {
    acc[complaint.category] = (acc[complaint.category] ?? 0) + 1;
    return acc;
  }, {});

  const priorityCounts = complaints.reduce<Record<string, number>>((acc, complaint) => {
    acc[complaint.priority] = (acc[complaint.priority] ?? 0) + 1;
    return acc;
  }, {});

  return (
    <Card title="Stats">
      <div className="stats-grid">
        <div>
          <h4>By category</h4>
          {Object.entries(categoryCounts).map(([label, count]) => (
            <div key={label} className="stat-line">
              <span>{label}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>

        <div>
          <h4>By priority</h4>
          {Object.entries(priorityCounts).map(([label, count]) => (
            <div key={label} className="stat-line">
              <span>{label}</span>
              <strong>{count}</strong>
            </div>
          ))}
        </div>
      </div>

      <div className="summary-row compact">
        <StatCard label="Total complaints" value={complaints.length} />
        <StatCard label="Open" value={complaints.filter((item) => item.status === 'open').length} />
        <StatCard label="In progress" value={complaints.filter((item) => item.status === 'in_progress').length} />
      </div>
    </Card>
  );
}
