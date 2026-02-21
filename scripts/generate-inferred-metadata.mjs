import fs from 'node:fs';
import path from 'node:path';

const workspace = '/Users/sejalnaik/CodeX';
const transcriptDir = path.join(workspace, 'data', 'transcripts');
const outFile = path.join(workspace, 'data', 'episode-metadata.json');

function normalizeGuest(fileName) {
  return fileName
    .replace(/\.txt$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();
}

function toIsoDate(ms) {
  return new Date(ms).toISOString().slice(0, 10);
}

function makeListenUrl(guest) {
  const query = encodeURIComponent(`Lenny Rachitsky podcast ${guest}`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

const files = fs
  .readdirSync(transcriptDir)
  .filter((name) => name.toLowerCase().endsWith('.txt'))
  .sort((a, b) => a.localeCompare(b));

const metadata = {
  _notes:
    'Auto-generated inferred metadata from transcript files. Replace any entry with canonical episode details when available.',
  _source: 'transcript filename + file modified date + generated search link',
  _generatedAt: new Date().toISOString()
};

files.forEach((file, idx) => {
  const filePath = path.join(transcriptDir, file);
  const stat = fs.statSync(filePath);
  const guest = normalizeGuest(file);

  metadata[file.replace(/\.txt$/i, '')] = {
    episodeTitle: `Conversation with ${guest}`,
    episodeNumber: idx + 1,
    episodeDate: toIsoDate(stat.mtimeMs),
    listenUrl: makeListenUrl(guest),
    metadataStatus: 'inferred'
  };
});

fs.writeFileSync(outFile, `${JSON.stringify(metadata, null, 2)}\n`);
console.log(`Wrote inferred metadata for ${files.length} transcripts to ${outFile}`);
