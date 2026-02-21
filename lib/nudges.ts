import { nudges } from '../data/nudges';
import { Nugget, NuggetCategory } from '../types/nudge';

export async function getNudges(): Promise<Nugget[]> {
  return nudges;
}

export function filterNudges(
  list: Nugget[],
  query: string,
  category: NuggetCategory | 'All'
): Nugget[] {
  const normalized = query.trim().toLowerCase();

  return list.filter((item) => {
    const matchesCategory = category === 'All' || item.category === category;
    if (!matchesCategory) return false;

    if (!normalized) return true;

    return [
      item.title,
      item.category,
      item.nugget,
      item.guestFullName,
      item.episodeTitle,
      `episode ${item.episodeNumber}`,
      item.episodeDate,
      item.companyStage,
      item.themeTags.join(' '),
      item.sourceSnippet
    ]
      .join(' ')
      .toLowerCase()
      .includes(normalized);
  });
}

export function getCategories(list: Nugget[]): NuggetCategory[] {
  return [...new Set(list.map((item) => item.category))];
}
