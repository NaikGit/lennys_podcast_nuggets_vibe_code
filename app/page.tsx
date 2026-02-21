import { NudgeStore } from '../components/NudgeStore';
import { getNudges } from '../lib/nudges';

export default async function HomePage() {
  const nudges = await getNudges();

  return <NudgeStore initialNudges={nudges} />;
}
