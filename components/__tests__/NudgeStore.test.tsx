import { fireEvent, render, screen } from '@testing-library/react';
import { NudgeStore } from '../NudgeStore';
import { Nugget } from '../../types/nudge';

describe('NudgeStore', () => {
  const nudges: Nugget[] = [
    {
      id: 'n-200',
      title: 'Vibe coding needs hard quality rails',
      category: 'AI',
      nugget:
        'Prompt-generated code accelerates prototyping, but merge gates and tests must stay strict.',
      guestFullName: 'Guillermo Rauch',
      episodeTitle: 'Vibe Coding in Real Teams',
      episodeNumber: 412,
      episodeDate: '2025-05-16',
      companyStage: 'Scale-up',
      themeTags: ['vibe coding', 'quality'],
      sourceSnippet: 'Speed works only with strong review discipline.',
      metadataStatus: 'verified',
      listenUrl: 'https://example.com/episode-412'
    },
    {
      id: 'n-201',
      title: 'Stop-doing lists protect strategic focus',
      category: 'Strategy',
      nugget: 'Prioritization fails when teams never subtract work.',
      guestFullName: 'Richard Paul Rumelt',
      episodeTitle: 'Focus at Scale',
      episodeNumber: 364,
      episodeDate: '2024-06-14',
      companyStage: 'Cross-stage',
      themeTags: ['focus'],
      sourceSnippet: 'Strategy is mostly subtraction.',
      metadataStatus: 'verified',
      listenUrl: 'https://example.com/episode-364'
    }
  ];

  it('filters by category and query and supports saved-only flow', () => {
    render(<NudgeStore initialNudges={nudges} />);

    fireEvent.click(screen.getByRole('button', { name: 'AI' }));

    expect(
      screen.getAllByText('Vibe coding needs hard quality rails').length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText('Stop-doing lists protect strategic focus')
    ).not.toBeInTheDocument();

    fireEvent.change(screen.getByLabelText('Search nuggets'), {
      target: { value: 'episode 412' }
    });

    expect(
      screen.getAllByText('Vibe coding needs hard quality rails').length
    ).toBeGreaterThan(0);

    fireEvent.click(
      screen.getByRole('button', {
        name: 'Save Vibe coding needs hard quality rails'
      })
    );

    fireEvent.click(screen.getByRole('button', { name: 'Saved only' }));

    expect(
      screen.getAllByText('Vibe coding needs hard quality rails').length
    ).toBeGreaterThan(0);
    expect(
      screen.queryByText('Stop-doing lists protect strategic focus')
    ).not.toBeInTheDocument();
  });
});
