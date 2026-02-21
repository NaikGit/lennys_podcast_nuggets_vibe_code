import { Nugget } from '../types/nudge';

export const mockNudges: Nugget[] = [
  {
    id: 'n-901',
    title: 'AI scorecards need business metrics',
    category: 'AI',
    nugget:
      'Teams should report cycle-time and quality improvements, not model metrics alone.',
    guestFullName: 'Elena Verna',
    episodeTitle: 'How To Prove AI ROI',
    episodeNumber: 408,
    episodeDate: '2025-04-25',
    companyStage: 'Cross-stage',
    themeTags: ['impact', 'metrics'],
    sourceSnippet:
      'Business throughput improvement is what gets repeated investment.',
    metadataStatus: 'verified',
    listenUrl: 'https://example.com/episode-408'
  },
  {
    id: 'n-902',
    title: 'Leaders should explain tradeoffs explicitly',
    category: 'Leadership',
    nugget: 'Trust improves when leaders explain what they are not prioritizing yet.',
    guestFullName: 'Satya Narayana Nadella',
    episodeTitle: 'Leading Through the AI Shift',
    episodeNumber: 437,
    episodeDate: '2025-10-31',
    companyStage: 'Scale-up',
    themeTags: ['alignment', 'communication'],
    sourceSnippet: 'The no-list can be as important as the yes-list.',
    metadataStatus: 'verified',
    listenUrl: 'https://example.com/episode-437'
  }
];
