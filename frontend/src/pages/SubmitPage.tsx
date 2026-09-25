import { useState } from 'react';
import { Button, Card } from '../components/ui';
import type { Category, Priority } from '../types/complaints';

const categoryOptions: Category[] = [
  'water',
  'electricity',
  'sanitation',
  'roads',
  'streetlights',
  'other',
];

const priorityOptions: Priority[] = ['high', 'normal', 'low'];

export function SubmitPage() {
  const [text, setText] = useState('');
  const [location, setLocation] = useState('');
  const [reporterContact, setReporterContact] = useState('');
  const [category, setCategory] = useState<Category>('other');
  const [priority, setPriority] = useState<Priority>('normal');
  const [submitted, setSubmitted] = useState(false);

  const handleSubmit = (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();
    setSubmitted(true);
  };

  return (
    <Card title="Submit a complaint">
      <form className="submit-form" onSubmit={handleSubmit}>
        <label>
          Complaint text
          <textarea
            value={text}
            onChange={(event) => setText(event.target.value)}
            placeholder="Describe the issue in detail"
            rows={5}
          />
        </label>

        <div className="field-row">
          <label>
            Location
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="Street, sector or landmark"
            />
          </label>

          <label>
            Reporter contact
            <input
              value={reporterContact}
              onChange={(event) => setReporterContact(event.target.value)}
              placeholder="Optional contact"
            />
          </label>
        </div>

        <div className="field-row">
          <label>
            Category
            <select value={category} onChange={(event) => setCategory(event.target.value as Category)}>
              {categoryOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>

          <label>
            Priority
            <select value={priority} onChange={(event) => setPriority(event.target.value as Priority)}>
              {priorityOptions.map((option) => (
                <option key={option} value={option}>
                  {option}
                </option>
              ))}
            </select>
          </label>
        </div>

        <div className="form-actions">
          <Button type="submit">Submit complaint</Button>
        </div>

        {submitted ? (
          <p className="status-message">
            Complaint draft prepared. Backend submission route will be connected when the REST API is
            implemented.
          </p>
        ) : null}
      </form>
    </Card>
  );
}
