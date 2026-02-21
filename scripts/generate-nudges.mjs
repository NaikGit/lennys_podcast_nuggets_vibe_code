import fs from 'node:fs';
import path from 'node:path';

const workspace = '/Users/sejalnaik/CodeX';
const transcriptDir = path.join(workspace, 'data', 'transcripts');
const outFile = path.join(workspace, 'data', 'nudges.ts');
const metadataFile = path.join(workspace, 'data', 'episode-metadata.json');

const CATEGORY_RULES = [
  {
    category: 'AI',
    tags: [
      'ai',
      'gpt',
      'llm',
      'model',
      'models',
      'agent',
      'agents',
      'prompt',
      'prompts',
      'vibe coding',
      'coding',
      'automation',
      'inference',
      'token',
      'anthropic',
      'openai',
      'claude',
      'chatgpt',
      'cursor',
      'copilot'
    ]
  },
  {
    category: 'Leadership',
    tags: ['ceo', 'leadership', 'vision', 'executive', 'founder', 'board', 'decision']
  },
  {
    category: 'Team Management',
    tags: ['manager', 'team', '1:1', 'organization', 'org', 'operating cadence', 'accountability']
  },
  {
    category: 'Hiring',
    tags: ['hire', 'hiring', 'recruiting', 'candidate', 'interview', 'talent']
  },
  {
    category: 'Strategy',
    tags: ['strategy', 'moat', 'positioning', 'pricing', 'prioritization', 'focus']
  },
  {
    category: 'Culture',
    tags: ['culture', 'trust', 'values', 'motivation', 'morale']
  },
  {
    category: 'Communication',
    tags: ['story', 'messaging', 'narrative', 'communication', 'write', 'memo']
  }
];

const STAGE_RULES = [
  { stage: 'Enterprise', tags: ['enterprise', 'fortune 500', 'global org', 'large company'] },
  { stage: 'Startup', tags: ['startup', 'early stage', 'seed', 'series a'] },
  { stage: 'Scale-up', tags: ['scale', 'hypergrowth', 'growth stage', 'series b', 'series c'] }
];

const JUNK_PHRASES = [
  'this episode is brought to you',
  'don\'t forget to subscribe',
  'after a short word from our sponsors',
  'check it out at',
  'with that, i bring you',
  'welcome back to the podcast',
  'thanks for having me',
  'longtime listener',
  'instrumental music',
  'music'
];

const FILLER_START = /^(yeah|yes|right|so|well|i mean|you know|sort of|kind of|okay|totally|exactly|for sure|absolutely)\b[,.\s-]*/i;
const CONVERSATIONAL_START = /^(and|but|so|because|also|then|anyway)\b/i;
const STOPWORDS = new Set([
  'the',
  'a',
  'an',
  'and',
  'or',
  'to',
  'of',
  'for',
  'on',
  'at',
  'with',
  'in',
  'is',
  'are',
  'it',
  'that',
  'this',
  'we',
  'i',
  'you',
  'they',
  'be',
  'as',
  'by',
  'if',
  'from'
]);

const SUBJECT_BY_CATEGORY = {
  AI: 'AI teams',
  Leadership: 'Leaders',
  'Team Management': 'Managers',
  Hiring: 'Hiring teams',
  Strategy: 'Product teams',
  Culture: 'Leaders',
  Communication: 'Teams'
};

function normalizeGuest(fileName) {
  return fileName
    .replace(/\.txt$/i, '')
    .replace(/_/g, ' ')
    .replace(/\s+\d+\.\d+$/g, '')
    .replace(/\s+/g, ' ')
    .trim();
}

function extractBlocks(text) {
  const lines = text.split(/\r?\n/);
  const blocks = [];

  let i = 0;
  while (i < lines.length) {
    const line = lines[i];
    const match = line.match(/^(.+?) \((\d{2}:\d{2}:\d{2})\):\s*$/);

    if (!match) {
      i += 1;
      continue;
    }

    const speaker = match[1].trim();
    const timestamp = match[2];
    i += 1;

    const body = [];
    while (i < lines.length && !/^.+? \(\d{2}:\d{2}:\d{2}\):\s*$/.test(lines[i])) {
      if (lines[i].trim()) {
        body.push(lines[i].trim());
      }
      i += 1;
    }

    const textBody = body.join(' ').replace(/\s+/g, ' ').trim();
    if (!textBody) continue;

    blocks.push({ speaker, timestamp, text: textBody });
  }

  return blocks;
}

function classify(text) {
  const lower = text.toLowerCase();
  let bestCategory = 'Communication';
  let bestScore = -1;
  const foundTags = new Set();

  CATEGORY_RULES.forEach((rule) => {
    let score = 0;
    rule.tags.forEach((tag) => {
      if (lower.includes(tag)) {
        score += tag.includes(' ') ? 3 : 2;
        foundTags.add(tag);
      }
    });

    if (score > bestScore) {
      bestScore = score;
      bestCategory = rule.category;
    }
  });

  const themeTags = [...foundTags].slice(0, 5);
  if (!themeTags.length) themeTags.push(bestCategory.toLowerCase());

  let companyStage = 'Cross-stage';
  for (const rule of STAGE_RULES) {
    if (rule.tags.some((tag) => lower.includes(tag))) {
      companyStage = rule.stage;
      break;
    }
  }

  if (bestCategory === 'AI' && companyStage === 'Cross-stage') {
    companyStage = 'Scale-up';
  }

  return { category: bestCategory, themeTags, companyStage, score: bestScore };
}

function normalizeSentence(raw) {
  let text = raw
    .replace(/[“”]/g, '"')
    .replace(/[‘’]/g, "'")
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\(\d{2}:\d{2}:\d{2}\):?/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  text = text.replace(FILLER_START, '');
  text = text.replace(/^I think\s+/i, '');
  text = text.replace(/^I feel like\s+/i, '');
  text = text.replace(/\bwe need to\b/gi, 'teams need to');
  text = text.replace(/\bwe have to\b/gi, 'teams should');
  text = text.replace(/\byou need to\b/gi, 'teams need to');
  text = text.replace(/\bI would say\b/gi, '');
  text = text.replace(/\bkind of\b/gi, '');
  text = text.replace(/\bsort of\b/gi, '');
  text = text.replace(/\s+/g, ' ').trim();

  if (!/[.!?]$/.test(text)) {
    text = `${text}.`;
  }

  return text.charAt(0).toUpperCase() + text.slice(1);
}

function isJunk(text) {
  const lower = text.toLowerCase();
  if (JUNK_PHRASES.some((p) => lower.includes(p))) return true;
  if (lower.startsWith('today, my guest is')) return true;
  if (lower.startsWith('welcome to lenny')) return true;
  if (lower.includes('sponsor')) return true;
  if (lower.includes('thank you for having me')) return true;
  if (lower.includes('this feels like therapy')) return true;
  if (lower.includes('tell me about your mother')) return true;
  if (/\?$/.test(text)) return true;
  if (/^(what|why|how|where|when)\b/i.test(lower)) return true;
  if (/\b(inaudible|laughs|applause)\b/i.test(lower)) return true;
  if (/\b(awesome|cool|totally|great to be here)\b/i.test(text) && text.length < 120) return true;
  if (text.length < 65) return true;
  return false;
}

function sentenceScore(text, speaker, guestName) {
  const lower = text.toLowerCase();
  let score = 0;

  if (/\b(should|need to|must|important|focus|strategy|measure|avoid|instead|decide|prioritize|scale|improve)\b/i.test(text)) score += 5;
  if (/\b(because|so that|therefore|which means|in order to|so you can)\b/i.test(text)) score += 4;
  if (/\b(product|team|leader|growth|customer|market|engineering|design|ai|model|manager|execution|outcome)\b/i.test(text)) score += 3;
  if (text.length >= 90 && text.length <= 220) score += 3;
  if (CONVERSATIONAL_START.test(lower) && text.length < 110) score -= 2;
  if (/\b(yeah|yes|right|so)\b/i.test(text.slice(0, 12))) score -= 4;
  if (/["][^"]{4,}["]/.test(text)) score -= 1;

  const guestTokens = guestName.toLowerCase().split(/\s+/).filter((t) => t.length > 2);
  const speakerLower = speaker.toLowerCase();
  if (guestTokens.some((t) => speakerLower.includes(t))) score += 2;
  if (speakerLower.includes('lenny rachitsky') || speakerLower.includes('music')) score -= 20;

  const meta = classify(lower);
  score += Math.max(meta.score, 0);

  return { score, meta };
}

function refineSentence(text) {
  let refined = text
    .replace(/^[^A-Za-z0-9]+/, '')
    .replace(/\(\d{2}:\d{2}:\d{2}\):?/g, ' ')
    .replace(/\[[^\]]+\]/g, ' ')
    .replace(/\bI think\b/gi, ' ')
    .replace(/\bI mean\b/gi, ' ')
    .replace(/\bat the end of the day\b/gi, ' ')
    .replace(/\bkind of\b/gi, ' ')
    .replace(/\bsort of\b/gi, ' ')
    .replace(/\s+/g, ' ')
    .trim();

  refined = refined.replace(/^And\s+/i, '');
  refined = refined.replace(/^But\s+/i, '');
  refined = refined.replace(/^So\s+/i, '');
  refined = refined.replace(/^Because\s+/i, '');

  const words = refined.split(/\s+/);
  if (words.length > 30) {
    const clipped = words.slice(0, 30).join(' ');
    const cutAt = Math.max(clipped.lastIndexOf(','), clipped.lastIndexOf(';'));
    refined = cutAt > 70 ? clipped.slice(0, cutAt) : clipped;
    refined = `${refined}.`;
  }

  refined = refined.replace(/\s+[,.!?]/g, (m) => m.trim());
  refined = refined.replace(/\bwhen I was [^,]+,\s*/i, '');
  refined = refined.replace(/\bfor example,\s*/i, '');
  refined = refined.replace(/\bthis is maybe\b/i, 'This is');
  refined = refined.trim();
  if (!/[.!?]$/.test(refined)) refined += '.';
  return refined.charAt(0).toUpperCase() + refined.slice(1);
}

function extractActionClause(text) {
  const refined = refineSentence(text).replace(/[.!?]$/, '');

  const actorModal = refined.match(
    /\b(teams?|leaders?|managers?|founders?|companies?|organizations?)\s+(should|need to|must|can)\s+(.+)$/i
  );
  if (actorModal && actorModal[3].split(/\s+/).length >= 4) {
    const actor = actorModal[1][0].toUpperCase() + actorModal[1].slice(1).toLowerCase();
    return `${actor} ${actorModal[2].toLowerCase()} ${actorModal[3]}`;
  }

  const modalAnywhere = refined.match(/\b(should|need to|must|can)\s+(.+)$/i);
  if (modalAnywhere && modalAnywhere[2].split(/\s+/).length >= 4) {
    return `${modalAnywhere[1].charAt(0).toUpperCase()}${modalAnywhere[1].slice(1).toLowerCase()} ${modalAnywhere[2]}`;
  }

  return '';
}

function toTakeaway(text, category) {
  const explicit = extractActionClause(text);
  if (explicit) return `${explicit}.`;

  const subject = SUBJECT_BY_CATEGORY[category] ?? 'Teams';
  const base = refineSentence(text).replace(/[.!?]$/, '').toLowerCase();
  const trimmed = base
    .replace(/^(it|this|that|they)\s+(is|are|was|were)\s+/i, '')
    .replace(/^(there|here)\s+is\s+/i, '')
    .trim();

  if (trimmed.split(/\s+/).length >= 5) {
    return `${subject} should ${trimmed}.`;
  }

  return `${subject} should turn this insight into a repeatable operating habit.`;
}

function buildCoreIdea(primary, secondary, category) {
  const p = refineSentence(primary);
  const s = secondary ? refineSentence(secondary) : '';

  if (s && /\b(because|so that|which means|therefore)\b/i.test(s)) {
    const reason = s
      .replace(/^.*?\b(because|so that|which means|therefore)\b/i, '')
      .replace(/^[,\s]+/, '')
      .trim();
    if (reason.length >= 20) {
      return refineSentence(`${p.replace(/[.!?]$/, '')} because ${reason}`);
    }
  }

  const prefix = SUBJECT_BY_CATEGORY[category] ?? 'Teams';
  const normalized = p
    .replace(/^(it|this|that)\s+/i, `${prefix} `)
    .replace(/^there is /i, `${prefix} face `);

  return refineSentence(normalized);
}

function uniqueTopTokens(text, max = 5) {
  const tokens = text
    .toLowerCase()
    .replace(/[^a-z0-9\s]/g, ' ')
    .split(/\s+/)
    .filter((token) => token.length >= 4 && !STOPWORDS.has(token));

  const counts = new Map();
  tokens.forEach((token) => counts.set(token, (counts.get(token) ?? 0) + 1));
  return [...counts.entries()]
    .sort((a, b) => b[1] - a[1])
    .map(([token]) => token)
    .slice(0, max);
}

function pickInsights(blocks, guestName) {
  const candidates = [];

  blocks.forEach((block) => {
    const speaker = block.speaker;
    if (/lenny rachitsky|music/i.test(speaker)) return;

    const sentences = block.text
      .split(/(?<=[.!?])\s+/)
      .map((s) => normalizeSentence(s))
      .filter((s) => s.length >= 65 && s.length <= 280 && !isJunk(s));

    sentences.forEach((sentence) => {
      const scored = sentenceScore(sentence, speaker, guestName);
      candidates.push({
        sentence,
        speaker,
        ...scored
      });
    });
  });

  candidates.sort((a, b) => b.score - a.score);

  if (!candidates.length) return null;

  const first = candidates[0];
  const second = candidates.find((c) => c.sentence !== first.sentence && c.meta.category === first.meta.category && c.speaker === first.speaker) ||
    candidates.find((c) => c.sentence !== first.sentence && c.meta.category === first.meta.category) ||
    candidates.find((c) => c.sentence !== first.sentence) ||
    first;

  const combined = `${first.sentence} ${second.sentence}`;
  const inferredTags = uniqueTopTokens(combined);

  return {
    primary: first,
    secondary: second,
    category: first.meta.category,
    themeTags: [...new Set([...first.meta.themeTags, ...inferredTags])].slice(0, 5),
    companyStage: first.meta.companyStage
  };
}

function buildTitleFromInsight(sentence) {
  const clean = refineSentence(sentence).replace(/[.!?]+$/, '');
  const lowered = clean.toLowerCase();
  const tokens = clean.split(/\s+/).filter(Boolean);

  const starts = ['Teams should', 'Leaders should', 'AI teams should', 'Managers should', 'Product teams should'];
  if (starts.some((prefix) => clean.startsWith(prefix))) {
    return clean;
  }

  if (/\bmeasure\b/.test(lowered)) return 'Measure outcomes, not activity';
  if (/\bprioriti|focus|tradeoff\b/.test(lowered)) return 'Make deliberate tradeoffs to keep focus';
  if (/\bai|model|agent|prompt|coding\b/.test(lowered)) return 'Turn AI usage into reliable workflows';
  if (/\bleader|manager|team\b/.test(lowered)) return 'Lead with clarity and operating discipline';

  return tokens.slice(0, 8).join(' ').replace(/[.,;:!?]+$/, '');
}

function toSentence(text) {
  const clean = text.replace(/\s+/g, ' ').trim();
  if (!clean) return '';
  return /[.!?]$/.test(clean) ? clean : `${clean}.`;
}

function synthesizeByCategory(category, combined, tags) {
  const lower = combined.toLowerCase();

  if (category === 'AI') {
    if (/\b(measure|metric|roi|impact|outcome|productivity|baseline)\b/.test(lower)) {
      return {
        title: 'Measure AI impact with business outcomes',
        core: 'AI value becomes durable when teams measure business outcomes, not just model performance.',
        takeaway:
          'Define a baseline workflow, track cycle-time and quality deltas, and review adoption plus ROI every sprint.'
      };
    }

    if (/\b(model|models|prompt|agent|coding|code|copilot|cursor|claude|openai)\b/.test(lower)) {
      return {
        title: 'Operationalize AI with clear workflows',
        core: 'Model access alone is not a moat; repeatable AI workflows create the real advantage.',
        takeaway:
          'Pick one high-value workflow, standardize prompting and review gates, and capture best practices in a shared playbook.'
      };
    }

    return {
      title: 'Treat AI as an operating system change',
      core: 'AI adoption works when teams redesign how work gets done, not when they add isolated tools.',
      takeaway:
        'Start with one role-level workflow, define ownership, and run weekly improvement loops based on real usage.'
    };
  }

  if (category === 'Leadership') {
    if (/\b(decision|decide|tradeoff|priorit|focus|board|ceo|founder)\b/.test(lower)) {
      return {
        title: 'Leaders create clarity through tradeoffs',
        core: 'Leadership quality shows up in explicit tradeoffs, especially when stakes are high.',
        takeaway:
          'State what will not be prioritized, explain why, and align teams on the single decision that matters most now.'
      };
    }

    return {
      title: 'Leadership sets direction and standards',
      core: 'Teams move faster when leaders combine clear direction with consistent standards.',
      takeaway:
        'Translate strategy into visible operating principles and reinforce them through reviews, staffing, and goals.'
    };
  }

  if (category === 'Team Management') {
    if (/\b(feedback|coach|1:1|manager|cadence|delegat|accountab)\b/.test(lower)) {
      return {
        title: 'Managers scale through coaching systems',
        core: 'Strong managers build systems for feedback and accountability instead of relying on ad hoc heroics.',
        takeaway:
          'Create a repeatable cadence for 1:1s, decision follow-ups, and explicit ownership on cross-functional work.'
      };
    }

    return {
      title: 'Great teams need explicit operating norms',
      core: 'Execution quality improves when teams clarify how decisions are made and who owns outcomes.',
      takeaway:
        'Document decision rights, review rhythm, and escalation paths so coordination does not depend on personalities.'
    };
  }

  if (category === 'Hiring') {
    return {
      title: 'Hiring quality compounds over time',
      core: 'Hiring is a product decision: quality and role fit matter more than speed alone.',
      takeaway:
        'Define role scorecards up front, calibrate interviewers regularly, and close feedback loops after each hire.'
    };
  }

  if (category === 'Strategy') {
    if (/\b(pricing|positioning|market|moat|customer|segment)\b/.test(lower)) {
      return {
        title: 'Strategy wins when choices fit the market',
        core: 'Strong strategy aligns positioning, pricing, and product bets around a clear customer problem.',
        takeaway:
          'Name the target segment, define the core value proposition, and cut initiatives that do not reinforce that wedge.'
      };
    }

    return {
      title: 'Focus is the core strategic discipline',
      core: 'Strategy is less about adding initiatives and more about choosing what to stop.',
      takeaway:
        'Set a short list of must-win priorities and pair each with a no-list to protect execution capacity.'
    };
  }

  if (category === 'Culture') {
    return {
      title: 'Culture is built through repeated behavior',
      core: 'Culture becomes real when values are reflected in everyday decisions, not just stated principles.',
      takeaway:
        'Turn values into observable behaviors and use performance reviews, hiring, and rituals to reinforce them.'
    };
  }

  const hasNarrative = /\b(write|memo|story|communicat|narrative|message)\b/.test(lower);
  if (hasNarrative) {
    return {
      title: 'Clear narratives improve execution',
      core: 'Teams execute better when communication makes decisions and tradeoffs easy to understand.',
      takeaway:
        'Use concise memos with context, recommendation, and next steps so collaborators can act quickly.'
    };
  }

  return {
    title: tags.includes('ai') ? 'Operationalize AI with clear workflows' : 'Turn insights into repeatable execution',
    core: 'Reusable learnings are most useful when teams convert insights into operating practices.',
    takeaway:
      'Capture the principle, assign an owner, and revisit outcomes after implementation to refine the approach.'
  };
}

function synthesizeNugget(primary, secondary, category, tags) {
  const combined = `${primary.sentence} ${secondary?.sentence ?? ''}`;
  const synthesized = synthesizeByCategory(category, combined, tags);
  return {
    title: synthesized.title,
    nugget: `Core idea: ${toSentence(synthesized.core)} Practical takeaway: ${toSentence(synthesized.takeaway)}`
  };
}

function toIsoDate(mtimeMs) {
  return new Date(mtimeMs).toISOString().slice(0, 10);
}

function makeListenUrl(guest) {
  const query = encodeURIComponent(`Lenny Rachitsky podcast ${guest}`);
  return `https://www.youtube.com/results?search_query=${query}`;
}

const files = fs
  .readdirSync(transcriptDir)
  .filter((name) => name.toLowerCase().endsWith('.txt'))
  .sort((a, b) => a.localeCompare(b));

const nuggets = [];
let overrides = {};

if (fs.existsSync(metadataFile)) {
  try {
    overrides = JSON.parse(fs.readFileSync(metadataFile, 'utf8'));
  } catch {
    overrides = {};
  }
}

files.forEach((file, index) => {
  const filePath = path.join(transcriptDir, file);
  const raw = fs.readFileSync(filePath, 'utf8');
  const blocks = extractBlocks(raw);
  const guestFullName = normalizeGuest(file);
  const fileKey = file.replace(/\.txt$/i, '');
  const stat = fs.statSync(filePath);

  const insights = pickInsights(blocks, guestFullName);
  if (!insights) return;

  const synthesized = synthesizeNugget(
    insights.primary,
    insights.secondary,
    insights.category,
    insights.themeTags
  );
  const nuggetText = synthesized.nugget.slice(0, 460);
  const sourceSnippet = refineSentence(insights.primary.sentence).slice(0, 220);

  const override = overrides[fileKey] ?? {};
  const episodeNumber = Number.isInteger(override.episodeNumber)
    ? override.episodeNumber
    : index + 1;
  const episodeDate = typeof override.episodeDate === 'string'
    ? override.episodeDate
    : toIsoDate(stat.mtimeMs);
  const episodeTitle = typeof override.episodeTitle === 'string'
    ? override.episodeTitle
    : `Conversation with ${guestFullName}`;
  const listenUrl = typeof override.listenUrl === 'string'
    ? override.listenUrl
    : makeListenUrl(guestFullName);
  const metadataStatus = override.metadataStatus === 'verified' ? 'verified' : 'inferred';

  nuggets.push({
    id: `ep-${String(index + 1).padStart(3, '0')}`,
    title: synthesized.title || buildTitleFromInsight(insights.primary.sentence),
    category: insights.category,
    nugget: nuggetText,
    guestFullName,
    episodeTitle,
    episodeNumber,
    episodeDate,
    companyStage: insights.companyStage,
    themeTags: insights.themeTags,
    sourceSnippet,
    metadataStatus,
    listenUrl
  });
});

const output = `import { Nugget } from '../types/nudge';\n\nexport const nudges: Nugget[] = ${JSON.stringify(
  nuggets,
  null,
  2
)};\n`;

fs.writeFileSync(outFile, output);
console.log(`Generated ${nuggets.length} nuggets to ${outFile}`);
