# Transcript Drop Folder

Place one transcript per episode in this folder (`.txt`).

## Current ingestion flow

1. Drop transcript files here.
2. Generate inferred metadata from filenames/timestamps: `npm run generate:metadata-inferred`.
3. Optional: edit `/Users/sejalnaik/CodeX/data/episode-metadata.json` with canonical metadata for any episode you know.
4. Run `npm run generate:nudges`.

The generator creates `/Users/sejalnaik/CodeX/data/nudges.ts`.
