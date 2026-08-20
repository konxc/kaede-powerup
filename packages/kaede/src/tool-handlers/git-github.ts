/**
 * KAEDE Git & GitHub Tools Handler
 * 
 * Tools:
 * - get_git_status — Get current branch, ahead/behind, uncommitted files
 * - get_git_branches — List all branches (local + remote)
 * - get_git_log — Get commit history with optional pattern filter
 * - get_commit_diff — Get diff/stats for a specific commit
 * - scan_pull_requests — List PRs with state filter
 * - get_pr_details — Get PR info + commits
 * - search_commits — Search commits by message/author/date
 * - get_repo_info — Get owner/repo from git remote
 * - detect_auth_status — Check gh CLI / SSH / token auth
 * - review_card_implementation — Full card review (Trello + Git + GitHub)
 */

import type { PlaybookResult } from '../types';
import type {
  GitStatus,
  GitBranch,
  GitHubCommit,
  GitHubPR,
  AuthStatus,
  CardReviewResult,
} from '../git-github-integration';
import {
  getGitStatus as gitStatus,
  getGitBranches as gitBranches,
  getGitLog as gitLog,
  getCommitDiff as gitDiff,
  getStashes as gitStashes,
  listPullRequests as ghListPRs,
  getPullRequest as ghGetPR,
  getPRCommits as ghGetPRCommits,
  searchCommits as ghSearchCommits,
  getCommit as ghGetCommit,
  getRepoInfo,
  detectAuthStatus,
  getCurrentUser,
  findRelatedCommits,
  findRelatedPRs,
  parseAcceptanceCriteria,
} from '../git-github-integration';
import { reviewCardImplementation, parseCardComments, checkLabelConsistency } from '../card-review';

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

function asString(v: unknown): string {
  return typeof v === 'string' ? v : '';
}

function asNumber(v: unknown, fallback: number): number {
  return typeof v === 'number' && !Number.isNaN(v) ? v : fallback;
}

export function handleGetGitStatus(_args: Record<string, unknown> = {}): GitStatus {
  return gitStatus();
}

export function handleGetGitBranches(_args: Record<string, unknown> = {}): GitBranch[] {
  return gitBranches();
}

export function handleGetGitLog(args: Record<string, unknown> = {}): GitHubCommit[] {
  const limit = asNumber(args.limit, 50);
  const pattern = asString(args.pattern) || undefined;
  return gitLog(limit, pattern);
}

export function handleGetCommitDiff(args: Record<string, unknown> = {}): string {
  return gitDiff(asString(args.sha));
}

export function handleGetStashes(_args: Record<string, unknown> = {}): Array<{ index: number; message: string }> {
  return gitStashes();
}

export function handleScanPullRequests(args: Record<string, unknown> = {}): GitHubPR[] {
  const repo = getRepoInfo();
  if (!repo) return [];
  const state = (['open', 'closed', 'all'] as const).find((s) => s === args.state) as
    | 'open'
    | 'closed'
    | 'all'
    | undefined;
  return ghListPRs(repo.owner, repo.repo, state);
}

export function handleGetPRDetails(args: Record<string, unknown> = {}): { pr: GitHubPR | null; commits: GitHubCommit[] } {
  const repo = getRepoInfo();
  if (!repo) return { pr: null, commits: [] };

  const prNumber = asNumber(args.prNumber, 0);
  const pr = prNumber ? ghGetPR(repo.owner, repo.repo, prNumber) : null;
  const commits = pr ? ghGetPRCommits(repo.owner, repo.repo, prNumber) : [];

  return { pr, commits };
}

export function handleSearchCommits(args: Record<string, unknown> = {}): GitHubCommit[] {
  const repo = getRepoInfo();
  if (!repo) return [];

  const commits = ghSearchCommits(repo.owner, repo.repo, asString(args.query));
  return commits.slice(0, asNumber(args.limit, 50));
}

export function handleGetCommit(args: Record<string, unknown> = {}): GitHubCommit | null {
  const repo = getRepoInfo();
  if (!repo) return null;
  return ghGetCommit(repo.owner, repo.repo, asString(args.sha));
}

export function handleGetRepoInfo(_args: Record<string, unknown> = {}): { owner: string; repo: string } | null {
  return getRepoInfo();
}

export function handleDetectAuthStatus(_args: Record<string, unknown> = {}): AuthStatus {
  return detectAuthStatus();
}

export function handleGetCurrentUser(_args: Record<string, unknown> = {}): { login: string; name?: string } | null {
  return getCurrentUser();
}

export async function handleReviewCardImplementation(args: Record<string, unknown> = {}): Promise<CardReviewResult> {
  return await reviewCardImplementation(args.card as TrelloCard);
}

export function handleParseAcceptanceCriteria(args: Record<string, unknown> = {}): string[] {
  return parseAcceptanceCriteria(asString(args.description));
}

export function handleParseCardComments(args: Record<string, unknown> = {}): {
  lastUpdate?: string;
  blockers: string[];
  notes: string[];
} {
  return parseCardComments((args.comments as Array<{ text: string; date: string }>) || []);
}

export function handleCheckLabelConsistency(args: Record<string, unknown> = {}): {
  consistent: boolean;
  suggestions: string[];
} {
  const labels = (args.labels as Array<{ name: string; color: string }>) || [];
  return checkLabelConsistency(labels, asString(args.status) as any);
}