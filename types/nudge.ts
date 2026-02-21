export type NuggetCategory =
  | 'AI'
  | 'Leadership'
  | 'Team Management'
  | 'Hiring'
  | 'Strategy'
  | 'Culture'
  | 'Communication';

export type CompanyStage =
  | 'Startup'
  | 'Scale-up'
  | 'Enterprise'
  | 'Cross-stage';

export type Nugget = {
  id: string;
  title: string;
  category: NuggetCategory;
  nugget: string;
  guestFullName: string;
  episodeTitle: string;
  episodeNumber: number;
  episodeDate: string;
  companyStage: CompanyStage;
  themeTags: string[];
  sourceSnippet: string;
  metadataStatus: 'verified' | 'inferred';
  listenUrl: string;
};
