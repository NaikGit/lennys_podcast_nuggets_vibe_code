# Nudge Store

A transcript-driven learning library inspired by themes from Lenny's Podcast.

Nudge Store turns long-form conversations into concise, reusable nuggets across categories like:
- AI
- Leadership
- Team Management
- Strategy
- Hiring
- Culture
- Communication

Each nugget includes traceability metadata so you can jump back to source episodes quickly.

## What this app does

- Browses a library of categorized nuggets
- Emphasizes AI learnings (scaling, measurement, operating models)
- Shows full guest name, episode number, episode date, and listen link
- Supports search, category filtering, and saved nuggets
- Provides topic-level synthesis across multiple conversations
- Displays a quality rubric for nugget curation

## Tech stack

- Next.js 14 (App Router)
- React 18
- TypeScript
- Jest + Testing Library

## Project structure

- `/app` - Next.js pages and API route
- `/components` - UI components (`NudgeStore`)
- `/data/transcripts` - source transcript files (`.txt`)
- `/data/nudges.ts` - generated nugget dataset used by the app
- `/scripts` - metadata + nugget generation scripts
- `/types` - shared TypeScript types

## Local setup

```bash
npm install
npm run dev
```

Open [http://localhost:3000](http://localhost:3000).

## Core commands

```bash
# run app
npm run dev

# production build
npm run build
npm run start

# tests
npm test

# regenerate nugget dataset from transcripts
npm run generate:nudges

# export metadata template from transcript files
npm run generate:metadata-template

# infer metadata from transcript files
npm run generate:metadata-inferred
```

## Data workflow

1. Add/update transcript files in `/data/transcripts`.
2. (Optional) update `/data/episode-metadata.json` with verified episode metadata.
3. Run `npm run generate:nudges`.
4. Start the app and validate quality + traceability.

## Nugget quality rubric

Nudges are expected to be:
- Atomic: one clear idea
- Actionable: can be applied in practice
- Transferable: useful beyond one company
- Source-grounded: tied to episode metadata/snippet
- Thematic: mapped to category/tags
- Non-duplicate: adds distinct value

## Notes

- Metadata fields may be marked `inferred` when not yet verified.
- Transcript quality varies; generator heuristics are designed to keep output concise and useful.

## License

No license file is included yet. Add one if you plan to make this public.
