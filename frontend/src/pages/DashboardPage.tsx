import { Badge, Card } from '../components/ui';
import type { Complaint } from '../types/complaints';

export function DashboardPage({ complaints }: { complaints: Complaint[] }) {
  return (
    <Card title="Dashboard">
      <div className="list">
        {complaints.map((complaint) => (
          <div key={complaint.id} className="list-item">
            <div className="row-between">
              <strong>{complaint.location}</strong>
              <Badge tone={complaint.priority === 'high' ? 'high' : complaint.priority === 'normal' ? 'normal' : 'low'}>
                {complaint.priority}
              </Badge>
            </div>

            <p>{complaint.text}</p>

            <div className="meta-row">
              <span>{complaint.category}</span>
              <Badge tone="default">{complaint.status}</Badge>
            </div>
          </div>
        ))}
      </div>
    </Card>
  );
}
