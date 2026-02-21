import fs from 'node:fs';
import path from 'node:path';

const workspace = '/Users/sejalnaik/CodeX';
const transcriptDir = path.join(workspace, 'data', 'transcripts');
const outFile = path.join(workspace, 'data', 'episode-metadata.template.json');

const files = fs
  .readdirSync(transcriptDir)
  .filter((name) => name.toLowerCase().endsWith('.txt'))
  .sort((a, b) => a.localeCompare(b));

const template = {
  _notes:
    'Fill with canonical podcast metadata, then copy entries into episode-metadata.json and run npm run generate:nudges.'
};

files.forEach((file, idx) => {
  const key = file.replace(/\.txt$/i, '');
  template[key] = {
    episodeTitle: `Conversation with ${key}`,
    episodeNumber: idx + 1,
    episodeDate: 'YYYY-MM-DD',
    listenUrl: ''
  };
});

fs.writeFileSync(outFile, `${JSON.stringify(template, null, 2)}\n`);
console.log(`Wrote ${outFile}`);
