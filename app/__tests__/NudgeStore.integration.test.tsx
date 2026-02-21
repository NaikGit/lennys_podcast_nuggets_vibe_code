import { render, screen, waitFor } from '@testing-library/react';
import { NudgeStore } from '../../components/NudgeStore';

describe('NudgeStore integration', () => {
  const originalFetch = global.fetch;

  beforeEach(() => {
    Object.defineProperty(global, 'fetch', {
      writable: true,
      value: jest.fn()
    });
  });

  afterEach(() => {
    jest.restoreAllMocks();
    Object.defineProperty(global, 'fetch', {
      writable: true,
      value: originalFetch
    });
  });

  it('loads nuggets from the API and renders them', async () => {
    (global.fetch as jest.Mock).mockResolvedValue({
      ok: true,
      json: async () => ({
        nudges: [
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
            nugget:
              'Trust improves when leaders explain what they are not prioritizing yet.',
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
        ]
      })
    } as Response);

    render(<NudgeStore />);

    expect(screen.getByText('Loading nuggets…')).toBeInTheDocument();

    await waitFor(() => {
      expect(
        screen.getAllByText('AI scorecards need business metrics').length
      ).toBeGreaterThan(0);
      expect(
        screen.getAllByText('Leaders should explain tradeoffs explicitly').length
      ).toBeGreaterThan(0);
    });
  });
});
