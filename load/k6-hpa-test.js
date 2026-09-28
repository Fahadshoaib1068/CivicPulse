import http from 'k6/http';
import { check } from 'k6';

const baseUrl = __ENV.BASE_URL || 'http://localhost:8000';

export const options = {
  scenarios: {
    civicpulse_load_ramp: {
      executor: 'ramping-arrival-rate',
      startRate: 2,
      timeUnit: '1s',
      preAllocatedVUs: 20,
      maxVUs: 100,
      stages: [
        { target: 2, duration: '1m' },
        { target: 10, duration: '2m' },
        { target: 25, duration: '2m' },
        { target: 50, duration: '3m' },
        { target: 75, duration: '3m' },
        { target: 0, duration: '1m' },
      ],
    },
  },
  thresholds: {
    http_req_failed: ['rate<0.05'],
    http_req_duration: ['p(95)<2000'],
  },
};

export default function () {
  const response = http.get(`${baseUrl}/api/complaints?page=1&page_size=20`, {
    tags: { endpoint: 'list_complaints' },
  });

  check(response, {
    'complaints endpoint responds': (result) => result.status === 200,
  });
}