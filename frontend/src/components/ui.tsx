import type { ReactNode } from 'react';

export function Button({
  children,
  variant = 'primary',
  onClick,
  type = 'button',
  disabled = false,
}: {
  children: ReactNode;
  variant?: 'primary' | 'secondary';
  onClick?: () => void;
  type?: 'button' | 'submit' | 'reset';
  disabled?: boolean;
}) {
  return (
    <button className={`button ${variant}`} type={type} onClick={onClick} disabled={disabled}>
      {children}
    </button>
  );
}

export function Badge({ children, tone = 'default' }: { children: ReactNode; tone?: 'default' | 'high' | 'normal' | 'low' }) {
  return <span className={`badge ${tone}`}>{children}</span>;
}

export function Card({ title, children }: { title?: string; children: ReactNode }) {
  return (
    <div className="card">
      {title ? <h3>{title}</h3> : null}
      {children}
    </div>
  );
}

export function StatCard({ label, value }: { label: string; value: string | number }) {
  return (
    <div className="stat-card">
      <span>{label}</span>
      <strong>{value}</strong>
    </div>
  );
}
