import { useState } from 'react';
import { Button, Card } from '../components/ui';
import { submitComplaint, type ComplaintSubmissionResult } from '../api';
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
  const [category, setCategory] = useState<Category>('water');
  const [priority, setPriority] = useState<Priority>('high');
  const [submitting, setSubmitting] = useState(false);
  const [errors, setErrors] = useState<string[]>([]);
  const [result, setResult] = useState<ComplaintSubmissionResult | null>(null);

  const handleSubmit = async (event: React.FormEvent<HTMLFormElement>) => {
    event.preventDefault();

    if (submitting) {
      return;
    }

    const trimmedText = text.trim();
    const trimmedLocation = location.trim();
    const nextErrors: string[] = [];

    if (trimmedText.length < 10 || trimmedText.length > 2000) {
      nextErrors.push('Complaint text must be between 10 and 2000 characters.');
    }

    if (trimmedLocation.length < 3 || trimmedLocation.length > 200) {
      nextErrors.push('Location must be between 3 and 200 characters.');
    }

    if (nextErrors.length > 0) {
      setErrors(nextErrors);
      setResult(null);
      return;
    }

    setErrors([]);
    setSubmitting(true);

    try {
      const data = await submitComplaint({
        text: trimmedText,
        location: trimmedLocation,
        reporter_contact: reporterContact.trim() || null,
      });

      setResult(data);
    } catch (submitError) {
      setResult(null);
      setErrors([
        submitError instanceof Error ? submitError.message : 'Unable to submit complaint.',
      ]);
    } finally {
      setSubmitting(false);
    }
  };

  if (result) {
    return (
      <Card title="Submit a complaint">
        <div className="status-message success" aria-live="polite">
          <p>
            <strong>Complaint ID:</strong> {result.complaintId}
          </p>
          <p>{result.category}</p>
          <p>{result.priority}</p>
          <p>{result.aiSummary}</p>
          <p>{result.triageProvider}</p>
        </div>
      </Card>
    );
  }

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
          <Button type="submit" disabled={submitting}>
            {submitting ? 'Submitting...' : 'Submit complaint'}
          </Button>
        </div>

        {errors.length > 0
          ? errors.map((message) => (
              <p key={message} className="status-message error" role="alert">
                {message}
              </p>
            ))
          : null}
      </form>
    </Card>
  );
}
