/**
 * KAEDE Card Review Module
 * 
 * Review implementasi card dengan membandingkan:
 * - Acceptance criteria di card Trello
 * - Commits yang terkait (via git log, gh API)
 * - Pull requests yang terkait
 * - File changes yang sebenarnya
 */

import type { CardReviewResult, GitHubCommit, GitHubPR } from './git-github-integration';
import { 
  findRelatedCommits, 
  findRelatedPRs, 
  parseAcceptanceCriteria,
  getRepoInfo,
  getCommit,
  getPRCommits,
} from './git-github-integration';

interface TrelloCard {
  id: string;
  name: string;
  desc: string;
  due?: string;
  labels: Array<{ name: string; color: string }>;
  members: Array<{ fullName: string; username: string }>;
  checklist?: Array<{ name: string; items: Array<{ name: string; state: string }> }>;
  comments?: Array<{ text: string; date: string }>;
}

export async function reviewCardImplementation(card: TrelloCard): Promise<CardReviewResult> {
  const repo = getRepoInfo();
  
  // 1. Parse acceptance criteria dari card description
  const criteria = parseAcceptanceCriteria(card.desc || '');
  
  // 2. Cari commits yang terkait
  const commits = findRelatedCommits(card.id, card.name);
  
  // 3. Cari PRs yang terkait
  const prs = findRelatedPRs(card.id, card.name);
  
  // 4. Verify setiap acceptance criterion
  const verifiedCriteria = await Promise.all(
    criteria.map(async (criterion) => {
      const verified = await verifyCriterion(criterion, commits, prs, card);
      return {
        criterion,
        verified,
        evidence: verified ? findEvidence(criterion, commits) : undefined,
      };
    })
  );
  
  // 5. Identifikasi gaps
  const gaps = verifiedCriteria
    .filter(c => !c.verified)
    .map(c => c.criterion);
  
  // 6. Generate recommendations
  const recommendations = generateRecommendations(card, commits, prs, verifiedCriteria);
  
  // 7. Determine overall status
  const status = determineStatus(verifiedCriteria, commits, prs);
  
  return {
    cardId: card.id,
    cardName: card.name,
    status,
    matchedCommits: commits,
    matchedPRs: prs,
    acceptanceCriteria: verifiedCriteria,
    gaps,
    recommendations,
  };
}

async function verifyCriterion(
  criterion: string,
  commits: GitHubCommit[],
  prs: GitHubPR[],
  card: TrelloCard
): Promise<boolean> {
  const lowerCriterion = criterion.toLowerCase();
  
  // Check if mentioned in commit messages
  const mentionedInCommits = commits.some(c => 
    c.message.toLowerCase().includes(lowerCriterion.substring(0, 30))
  );
  
  // Check if mentioned in PR descriptions
  const mentionedInPRs = prs.some(pr => 
    pr.body?.toLowerCase().includes(lowerCriterion.substring(0, 30))
  );
  
  // Check if files were changed that match the criterion
  // (e.g., "unit test" → check for test files, "migration" → check for migration files)
  const filePatternMatch = checkFilePatternMatch(criterion, commits);
  
  return mentionedInCommits || mentionedInPRs || filePatternMatch;
}

function findEvidence(criterion: string, commits: GitHubCommit[]): string | undefined {
  const lowerCriterion = criterion.toLowerCase();
  
  for (const commit of commits) {
    if (commit.message.toLowerCase().includes(lowerCriterion.substring(0, 30))) {
      return `Commit ${commit.sha.substring(0, 7)}: ${commit.message.split('\n')[0]}`;
    }
  }
  
  return undefined;
}

function checkFilePatternMatch(criterion: string, commits: GitHubCommit[]): boolean {
  const lowerCriterion = criterion.toLowerCase();
  
  // Keyword → file pattern mapping
  const patterns: Record<string, RegExp> = {
    'test': /test|spec/i,
    'migration': /database\/migrations|\.migration\./i,
    'model': /app\/Models?\/|\.model\./i,
    'controller': /app\/Http\/Controllers\/|Controller\.php/i,
    'service': /app\/Services\/|Service\.php/i,
    'route': /routes\/|web\.php|api\.php/i,
    'middleware': /app\/Http\/Middleware\/|Middleware\.php/i,
    'config': /config\/|\.env/i,
    'validation': /FormRequest|Request\.php|validation/i,
    'seed': /database\/seeders?\/|Seeder\.php/i,
  };
  
  for (const [keyword, pattern] of Object.entries(patterns)) {
    if (lowerCriterion.includes(keyword)) {
      return commits.some(c => 
        c.files?.some(f => pattern.test(f.filename)) ||
        pattern.test(c.message)
      );
    }
  }
  
  return false;
}

function generateRecommendations(
  card: TrelloCard,
  commits: GitHubCommit[],
  prs: GitHubPR[],
  verifiedCriteria: Array<{ criterion: string; verified: boolean }>
): string[] {
  const recommendations: string[] = [];
  
  // No commits found
  if (commits.length === 0 && prs.length === 0) {
    recommendations.push('Tidak ada commit atau PR yang terkait. Pastikan commit message menyertakan card ID (e.g., "BE-014").');
  }
  
  // Some criteria not verified
  const unverified = verifiedCriteria.filter(c => !c.verified);
  if (unverified.length > 0) {
    recommendations.push(`${unverified.length} acceptance criteria belum terpenuhi: ${unverified.map(c => c.criterion).join(', ')}`);
  }
  
  // PR not merged
  const openPRs = prs.filter(pr => pr.state === 'open');
  if (openPRs.length > 0) {
    recommendations.push(`PR #${openPRs.map(pr => pr.number).join(', ')} masih open — perlu code review dan merge.`);
  }
  
  // No tests found
  const hasTestCriterion = card.desc?.toLowerCase().includes('test');
  const hasTestCommits = commits.some(c => /test|spec/i.test(c.message));
  if (hasTestCriterion && !hasTestCommits) {
    recommendations.push('Card menyebutkan test, tapi tidak ada commit yang terkait dengan testing.');
  }
  
  return recommendations;
}

function determineStatus(
  verifiedCriteria: Array<{ criterion: string; verified: boolean }>,
  commits: GitHubCommit[],
  prs: GitHubPR[]
): 'complete' | 'partial' | 'not-started' | 'needs-review' {
  // All criteria verified + PR merged
  const allVerified = verifiedCriteria.length > 0 && verifiedCriteria.every(c => c.verified);
  const mergedPR = prs.some(pr => pr.merged);
  
  if (allVerified && mergedPR) {
    return 'complete';
  }
  
  // Some criteria verified or PR open
  const someVerified = verifiedCriteria.some(c => c.verified);
  const openPR = prs.some(pr => pr.state === 'open');
  
  if (someVerified || openPR) {
    return 'needs-review';
  }
  
  // Commits exist but no criteria verified
  if (commits.length > 0) {
    return 'partial';
  }
  
  return 'not-started';
}

// ── Helper: Scan Card Comments for Updates ──

export function parseCardComments(comments: Array<{ text: string; date: string }>): {
  lastUpdate?: string;
  blockers: string[];
  notes: string[];
} {
  const blockers: string[] = [];
  const notes: string[] = [];
  let lastUpdate: string | undefined;
  
  for (const comment of comments) {
    const text = comment.text.toLowerCase();
    
    // Detect blockers
    if (text.includes('blocked') || text.includes('stuck') || text.includes('issue')) {
      blockers.push(comment.text);
    }
    
    // Detect notes
    if (text.includes('note:') || text.includes('update:') || text.includes('progress')) {
      notes.push(comment.text);
    }
    
    lastUpdate = comment.date;
  }
  
  return { lastUpdate, blockers, notes };
}

// ── Helper: Check Label Consistency ──

export function checkLabelConsistency(
  labels: Array<{ name: string; color: string }>,
  status: 'complete' | 'partial' | 'not-started' | 'needs-review'
): { consistent: boolean; suggestions: string[] } {
  const suggestions: string[] = [];
  const labelNames = labels.map(l => l.name.toLowerCase());
  
  // Check if status matches labels
  if (status === 'complete' && !labelNames.includes('done')) {
    suggestions.push('Card marked complete tapi tidak ada label "Done" — pertimbangkan untuk menambahkan.');
  }
  
  if (status === 'needs-review' && !labelNames.includes('code-review')) {
    suggestions.push('Card perlu review tapi tidak ada label "Code Review" — pertimbangkan untuk menambahkan.');
  }
  
  if (status === 'partial' && !labelNames.includes('in-progress')) {
    suggestions.push('Card in progress tapi tidak ada label "In Progress" — pertimbangkan untuk menambahkan.');
  }
  
  return {
    consistent: suggestions.length === 0,
    suggestions,
  };
}