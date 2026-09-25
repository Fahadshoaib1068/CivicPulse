import { useMemo, useState } from 'react';
import { Button, Card, StatCard } from './components/ui';
import { DashboardPage } from './pages/DashboardPage';
import { StatsPage } from './pages/StatsPage';
import { SubmitPage } from './pages/SubmitPage';
import type { Complaint } from './types/complaints';

const sampleComplaints: Complaint[] = [
  {
    id: 'c-1001',
    text: 'Burst water main flooding Street 12, homes are getting water inside.',
    location: 'Street 12, G-9',
    reporter_contact: 'citizen@example.com',
    category: 'water',
    priority: 'high',
    status: 'open',
    ai_summary: 'Water leak with flooding risk',
    triaged_by: 'rules',
    triage_latency_ms: 180,
    created_at: '2026-09-20T10:20:00Z',
  },
  {
    id: 'c-1002',
    text: 'Streetlight has been out since last night near the park.',
    location: 'F-10 Park',
    reporter_contact: null,
    category: 'streetlights',
    priority: 'normal',
    status: 'in_progress',
    ai_summary: 'Streetlight outage',
    triaged_by: 'rules',
    triage_latency_ms: 120,
    created_at: '2026-09-21T08:15:00Z',
  },
  {
    id: 'c-1003',
    text: 'Garbage pile has not been collected for many days near the market.',
    location: 'Main Market, F-7',
    reporter_contact: 'helpdesk@example.com',
    category: 'sanitation',
    priority: 'normal',
    status: 'resolved',
    ai_summary: 'Solid waste collection issue',
    triaged_by: 'rules',
    triage_latency_ms: 140,
    created_at: '2026-09-22T12:00:00Z',
  },
];

const navItems = [
  { key: 'submit', label: 'Submit' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'stats', label: 'Stats' },
] as const;

type View = (typeof navItems)[number]['key'];

export default function App() {
  const [currentView, setCurrentView] = useState<View>('submit');

  const summary = useMemo(() => {
    const open = sampleComplaints.filter((item) => item.status === 'open').length;
    const high = sampleComplaints.filter((item) => item.priority === 'high').length;
    const resolved = sampleComplaints.filter((item) => item.status === 'resolved').length;

    return { open, high, resolved };
  }, []);

  return (
    <div className="app-shell">
      <header className="topbar">
        <div>
          <p className="eyebrow">Municipal workflow</p>
          <h1>CivicPulse</h1>
        </div>

        <nav className="nav" aria-label="Main navigation">
          {navItems.map((item) => (
            <Button
              key={item.key}
              variant={currentView === item.key ? 'primary' : 'secondary'}
              onClick={() => setCurrentView(item.key)}
            >
              {item.label}
            </Button>
          ))}
        </nav>
      </header>

      <main className="content">
        <section className="summary-row">
          <StatCard label="Open" value={summary.open} />
          <StatCard label="High priority" value={summary.high} />
          <StatCard label="Resolved" value={summary.resolved} />
        </section>

        {currentView === 'submit' ? <SubmitPage /> : null}
        {currentView === 'dashboard' ? <DashboardPage /> : null}
        {currentView === 'stats' ? <StatsPage complaints={sampleComplaints} /> : null}

        <Card title="Assignment note">
          <p>
            This scaffold intentionally does not call any backend route yet. The app is set up so
            the later HTTP integration can be added without inventing endpoint contracts or fake API
            responses.
          </p>
        </Card>
      </main>
    </div>
  );
}
