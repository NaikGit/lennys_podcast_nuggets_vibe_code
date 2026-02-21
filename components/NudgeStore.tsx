'use client';

import { useEffect, useMemo, useState } from 'react';
import { Nugget, NuggetCategory } from '../types/nudge';
import { filterNudges, getCategories } from '../lib/nudges';
import styles from './NudgeStore.module.css';

type Props = {
  initialNudges?: Nugget[];
};

const FAVORITES_KEY = 'nugget-store-favorites';
const ALL_TOPICS = 'All topics';
const NUGGET_RUBRIC = [
  {
    title: 'Atomic',
    description: 'One clear idea in 1-3 lines, not a long summary.'
  },
  {
    title: 'Actionable',
    description: 'Someone can apply it this week in a real workflow.'
  },
  {
    title: 'Transferable',
    description: 'Useful beyond one company-specific scenario.'
  },
  {
    title: 'Source-grounded',
    description: 'Linked to guest, episode number, date, and source snippet.'
  },
  {
    title: 'Thematic fit',
    description: 'Mapped to category and topic tags (AI, leadership, etc.).'
  },
  {
    title: 'Non-duplicate',
    description: 'Adds a distinct angle; otherwise synthesized with existing nuggets.'
  }
] as const;

function formatDate(dateValue: string): string {
  const parsed = new Date(dateValue);
  if (Number.isNaN(parsed.getTime())) {
    return dateValue;
  }

  return new Intl.DateTimeFormat('en-US', {
    month: 'short',
    day: 'numeric',
    year: 'numeric'
  }).format(parsed);
}

function splitNugget(nugget: string): { core: string; takeaway: string } {
  const corePart = nugget.split('Practical takeaway:')[0] ?? '';
  const takeawayPart = nugget.split('Practical takeaway:')[1] ?? '';

  const core = corePart.replace(/^Core idea:\s*/i, '').trim();
  const takeaway = takeawayPart.trim();

  return { core, takeaway };
}

function buildSynthesisSummary(
  source: Nugget[],
  selectedTopic: string
): { insights: string[]; references: Nugget[] } {
  if (!source.length) {
    return {
      insights: ['No nuggets match this synthesis scope yet.'],
      references: []
    };
  }

  const categoryCounts = new Map<string, number>();
  const stageCounts = new Map<string, number>();

  source.forEach((nugget) => {
    categoryCounts.set(
      nugget.category,
      (categoryCounts.get(nugget.category) ?? 0) + 1
    );
    stageCounts.set(
      nugget.companyStage,
      (stageCounts.get(nugget.companyStage) ?? 0) + 1
    );
  });

  const categoryRanking = [...categoryCounts.entries()].sort((a, b) => b[1] - a[1]);
  const stageRanking = [...stageCounts.entries()].sort((a, b) => b[1] - a[1]);
  const guestCount = new Set(source.map((nugget) => nugget.guestFullName)).size;

  const sortedByDate = [...source].sort((a, b) => {
    return new Date(b.episodeDate).getTime() - new Date(a.episodeDate).getTime();
  });

  const latest = sortedByDate[0];

  return {
    insights: [
      `${selectedTopic}: ${source.length} nuggets across ${guestCount} guests and ${new Set(source.map((nugget) => nugget.episodeNumber)).size} episodes.`,
      `Top category in this scope: ${categoryRanking[0][0]} (${categoryRanking[0][1]}).`,
      `Dominant company-size lens: ${stageRanking[0][0]} (${stageRanking[0][1]}).`,
      `Most recent reference: Episode #${latest.episodeNumber} on ${formatDate(latest.episodeDate)}.`
    ],
    references: sortedByDate.slice(0, 5)
  };
}

export function NudgeStore({ initialNudges }: Props) {
  const [nudges, setNudges] = useState<Nugget[] | null>(initialNudges ?? null);
  const [query, setQuery] = useState('');
  const [category, setCategory] = useState<NuggetCategory | 'All'>('All');
  const [selectedId, setSelectedId] = useState<string | null>(null);
  const [favoritesOnly, setFavoritesOnly] = useState(false);
  const [favorites, setFavorites] = useState<string[]>([]);
  const [synthesisTopic, setSynthesisTopic] = useState(ALL_TOPICS);
  const [status, setStatus] = useState<'idle' | 'loading' | 'error'>('idle');

  useEffect(() => {
    if (typeof window === 'undefined') return;

    try {
      const stored = window.localStorage.getItem(FAVORITES_KEY);
      if (!stored) return;
      const parsed = JSON.parse(stored) as string[];
      if (Array.isArray(parsed)) {
        setFavorites(parsed);
      }
    } catch {
      setFavorites([]);
    }
  }, []);

  useEffect(() => {
    if (typeof window === 'undefined') return;
    window.localStorage.setItem(FAVORITES_KEY, JSON.stringify(favorites));
  }, [favorites]);

  useEffect(() => {
    if (initialNudges) return;

    let isMounted = true;

    const loadNuggets = async () => {
      try {
        setStatus('loading');
        const response = await fetch('/api/nudges');

        if (!response.ok) {
          throw new Error('Failed to load nuggets');
        }

        const data = (await response.json()) as { nudges: Nugget[] };

        if (isMounted) {
          setNudges(data.nudges);
          setSelectedId(data.nudges[0]?.id ?? null);
          setStatus('idle');
        }
      } catch {
        if (isMounted) {
          setStatus('error');
        }
      }
    };

    loadNuggets();

    return () => {
      isMounted = false;
    };
  }, [initialNudges]);

  const categories = useMemo(() => {
    return nudges ? getCategories(nudges) : [];
  }, [nudges]);

  const topicOptions = useMemo(() => {
    if (!nudges) return [ALL_TOPICS];
    const uniqueTags = [...new Set(nudges.flatMap((nugget) => nugget.themeTags))].sort();
    return [ALL_TOPICS, ...uniqueTags];
  }, [nudges]);

  const filtered = useMemo(() => {
    if (!nudges) return [];

    const base = filterNudges(nudges, query, category);

    if (!favoritesOnly) {
      return base;
    }

    return base.filter((nugget) => favorites.includes(nugget.id));
  }, [nudges, query, category, favoritesOnly, favorites]);

  const synthesisSource = useMemo(() => {
    if (!nudges) return [];

    const categoryScoped =
      category === 'All'
        ? nudges
        : nudges.filter((nugget) => nugget.category === category);

    if (synthesisTopic === ALL_TOPICS) {
      return categoryScoped;
    }

    return categoryScoped.filter((nugget) => nugget.themeTags.includes(synthesisTopic));
  }, [nudges, category, synthesisTopic]);

  const synthesisSummary = useMemo(() => {
    return buildSynthesisSummary(synthesisSource, synthesisTopic);
  }, [synthesisSource, synthesisTopic]);

  const totalCount = nudges?.length ?? 0;
  const aiCount = nudges?.filter((nugget) => nugget.category === 'AI').length ?? 0;

  useEffect(() => {
    if (!topicOptions.includes(synthesisTopic)) {
      setSynthesisTopic(ALL_TOPICS);
    }
  }, [topicOptions, synthesisTopic]);

  useEffect(() => {
    if (!filtered.length) {
      setSelectedId(null);
      return;
    }

    const stillVisible = filtered.some((nugget) => nugget.id === selectedId);

    if (!stillVisible) {
      setSelectedId(filtered[0].id);
    }
  }, [filtered, selectedId]);

  const selected = filtered.find((nugget) => nugget.id === selectedId) ?? null;
  const selectedParts = selected ? splitNugget(selected.nugget) : null;

  const toggleFavorite = (id: string) => {
    setFavorites((current) => {
      if (current.includes(id)) {
        return current.filter((item) => item !== id);
      }

      return [...current, id];
    });
  };

  return (
    <main className={styles.page}>
      <header className={styles.hero}>
        <p className={styles.eyebrow}>Insight Atlas</p>
        <h1>Lessons from Lenny&apos;s Podcast</h1>
        <p className={styles.subtitle}>
          Browse concise, reusable learnings across leadership and AI topics,
          with episode traceability and cross-conversation synthesis.
        </p>
      </header>

      <section className={styles.controls}>
        <div className={styles.searchRow}>
          <input
            type="search"
            className={styles.search}
            placeholder="Search by nugget, guest, episode number/date, tags, or category"
            value={query}
            onChange={(event) => setQuery(event.target.value)}
            aria-label="Search nuggets"
          />
          <button
            type="button"
            className={favoritesOnly ? styles.activeToggle : styles.toggle}
            onClick={() => setFavoritesOnly((current) => !current)}
            aria-pressed={favoritesOnly}
          >
            {favoritesOnly ? 'Showing saved only' : 'Saved only'}
          </button>
        </div>

        <div className={styles.chips}>
          <button
            type="button"
            className={category === 'All' ? styles.activeChip : styles.chip}
            onClick={() => setCategory('All')}
          >
            All
          </button>
          {categories.map((item) => (
            <button
              key={item}
              type="button"
              className={category === item ? styles.activeChip : styles.chip}
              onClick={() => setCategory(item)}
            >
              {item}
            </button>
          ))}
        </div>

        <div className={styles.statsRow}>
          <p>
            Total <strong>{totalCount}</strong>
          </p>
          <p>
            Showing <strong>{filtered.length}</strong>
          </p>
          <p>
            AI <strong>{aiCount}</strong>
          </p>
          <p>
            Saved <strong>{favorites.length}</strong>
          </p>
        </div>
      </section>

      {status === 'loading' && <p className={styles.status}>Loading nuggets…</p>}
      {status === 'error' && (
        <p className={styles.status} role="alert">
          Unable to load nuggets right now.
        </p>
      )}

      {nudges && (
        <section className={styles.layout}>
          <aside className={styles.listPane}>
            <div className={styles.listHeader}>
              <h2>Library</h2>
              <span>{filtered.length} nuggets</span>
            </div>
            <ul className={styles.list}>
              {filtered.map((nugget) => {
                const isFavorite = favorites.includes(nugget.id);
                const parts = splitNugget(nugget.nugget);

                return (
                  <li key={nugget.id}>
                    <div
                      className={
                        selectedId === nugget.id
                          ? styles.activeCard
                          : styles.cardButton
                      }
                    >
                      <button
                        type="button"
                        className={styles.selectCard}
                        onClick={() => setSelectedId(nugget.id)}
                      >
                        <p className={styles.cardCategory}>{nugget.category}</p>
                        <h3>{nugget.title}</h3>
                        <p className={styles.cardCore}>{parts.core}</p>
                        <p className={styles.cardTakeaway}>{parts.takeaway}</p>
                        <p className={styles.cardMeta}>
                          {nugget.guestFullName} | Ep #{nugget.episodeNumber} |{' '}
                          {formatDate(nugget.episodeDate)}
                        </p>
                      </button>

                      <button
                        type="button"
                        className={isFavorite ? styles.activeSave : styles.save}
                        onClick={() => toggleFavorite(nugget.id)}
                        aria-label={
                          isFavorite
                            ? `Remove ${nugget.title} from saved`
                            : `Save ${nugget.title}`
                        }
                      >
                        {isFavorite ? 'Saved' : 'Save'}
                      </button>
                    </div>
                  </li>
                );
              })}
            </ul>
            {filtered.length === 0 && (
              <p className={styles.empty}>No nuggets match this filter.</p>
            )}
          </aside>

          <article className={styles.detailPane}>
            {selected ? (
              <>
                <div className={styles.detailHeader}>
                  <div>
                    <p className={styles.detailCategory}>{selected.category}</p>
                    <h2>{selected.title}</h2>
                  </div>
                  <button
                    type="button"
                    className={
                      favorites.includes(selected.id)
                        ? styles.activeSave
                        : styles.save
                    }
                    onClick={() => toggleFavorite(selected.id)}
                  >
                    {favorites.includes(selected.id) ? 'Saved' : 'Save nugget'}
                  </button>
                </div>

                <div className={styles.detailBlocks}>
                  <div className={styles.detailBlock}>
                    <p className={styles.detailBlockLabel}>Core idea</p>
                    <p className={styles.detailNugget}>{selectedParts?.core}</p>
                  </div>
                  <div className={styles.detailBlock}>
                    <p className={styles.detailBlockLabel}>Practical takeaway</p>
                    <p className={styles.detailNugget}>{selectedParts?.takeaway}</p>
                  </div>
                </div>

                <dl className={styles.detailGrid}>
                  <div>
                    <dt>Guest</dt>
                    <dd>{selected.guestFullName}</dd>
                  </div>
                  <div>
                    <dt>Episode title</dt>
                    <dd>{selected.episodeTitle}</dd>
                  </div>
                  <div>
                    <dt>Episode #</dt>
                    <dd>{selected.episodeNumber}</dd>
                  </div>
                  <div>
                    <dt>Date</dt>
                    <dd>{formatDate(selected.episodeDate)}</dd>
                  </div>
                  <div>
                    <dt>Metadata</dt>
                    <dd>
                      {selected.metadataStatus === 'verified'
                        ? 'Verified'
                        : 'Inferred'}
                    </dd>
                  </div>
                  <div>
                    <dt>Company lens</dt>
                    <dd>{selected.companyStage}</dd>
                  </div>
                </dl>

                <div className={styles.sourceBlock}>
                  <h3>Source snippet</h3>
                  <p>{selected.sourceSnippet}</p>
                </div>

                <div className={styles.tagRow}>
                  {selected.themeTags.map((tag) => (
                    <span key={tag} className={styles.tag}>
                      {tag}
                    </span>
                  ))}
                </div>

                <p className={styles.listenRow}>
                  <a href={selected.listenUrl} target="_blank" rel="noreferrer">
                    Find and play this episode
                  </a>
                </p>
              </>
            ) : (
              <p className={styles.empty}>Choose a nugget to see details.</p>
            )}

            <section className={styles.synthesis}>
              <div className={styles.synthesisHeader}>
                <h3>Synthesis</h3>
                <div className={styles.topicFilter}>
                  <label htmlFor="topic-select">Topic</label>
                  <select
                    id="topic-select"
                    value={synthesisTopic}
                    onChange={(event) => setSynthesisTopic(event.target.value)}
                  >
                    {topicOptions.map((topic) => (
                      <option key={topic} value={topic}>
                        {topic}
                      </option>
                    ))}
                  </select>
                </div>
              </div>

              <ul className={styles.synthesisInsights}>
                {synthesisSummary.insights.map((insight) => (
                  <li key={insight}>{insight}</li>
                ))}
              </ul>

              {synthesisSummary.references.length > 0 && (
                <ul className={styles.references}>
                  {synthesisSummary.references.map((nugget) => (
                    <li key={`ref-${nugget.id}`}>
                      <a href={nugget.listenUrl} target="_blank" rel="noreferrer">
                        #{nugget.episodeNumber} ({formatDate(nugget.episodeDate)}) -{' '}
                        {nugget.guestFullName}
                      </a>
                    </li>
                  ))}
                </ul>
              )}
            </section>

            <details className={styles.rubric}>
              <summary>Nugget Quality Rubric</summary>
              <ul>
                {NUGGET_RUBRIC.map((rule) => (
                  <li key={rule.title}>
                    <strong>{rule.title}:</strong> {rule.description}
                  </li>
                ))}
              </ul>
            </details>
          </article>
        </section>
      )}
    </main>
  );
}
