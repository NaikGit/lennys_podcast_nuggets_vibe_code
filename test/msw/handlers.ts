import { http, HttpResponse } from 'msw';
import { mockNudges } from '../mock-data';

export const handlers = [
  http.get('/api/nudges', () => {
    return HttpResponse.json({ nudges: mockNudges });
  })
];
