import { useState } from 'react';
import { Button, Card } from './components/ui';
import { DashboardPage } from './pages/DashboardPage';
import { StatsPage } from './pages/StatsPage';
import { SubmitPage } from './pages/SubmitPage';

const navItems = [
  { key: 'submit', label: 'Submit' },
  { key: 'dashboard', label: 'Dashboard' },
  { key: 'stats', label: 'Stats' },
] as const;

type View = (typeof navItems)[number]['key'];

export default function App() {
  const [currentView, setCurrentView] = useState<View>('submit');

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
        {currentView === 'submit' ? <SubmitPage /> : null}
        {currentView === 'dashboard' ? <DashboardPage /> : null}
        {currentView === 'stats' ? <StatsPage /> : null}

        <Card title="Assignment note">
          <p>
            CivicPulse stats are loaded through the typed API boundary and display the backend&apos;s
            category and priority totals along with the cache status read from the X-Cache response
            header.
          </p>
        </Card>
      </main>
    </div>
  );
}
