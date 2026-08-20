/**
 * KAEDE Git & GitHub Integration
 * 
 * Mendukung multiple auth strategies:
 * - GitHub CLI (gh) — primary
 * - Git native (SSH/HTTPS)
 * - GitHub API (via gh api)
 * - GitHub Kraken (gk) — future support
 */

import { execSync, exec } from 'child_process';
import { existsSync } from 'fs';
import { resolve } from 'path';

// ── Types ──

export interface GitHubUser {
  login: string;
  name?: string;
  email?: string;
  type: 'User' | 'Organization';
}

export interface GitHubPR {
  number: number;
  title: string;
  state: 'open' | 'closed';
  user: { login: string };
  created_at: string;
  updated_at: string;
  merged_at: string | null;
  merged: boolean;
  merge_commit_sha?: string;
  body?: string;
  head: { ref: string; sha: string };
  base: { ref: string; sha: string };
}

export interface GitHubCommit {
  sha: string;
  message: string;
  author: { login?: string; name?: string; email?: string };
  date: string;
  files?: Array<{ filename: string; status: string; additions: number; deletions: number }>;
}

export interface GitStatus {
  branch: string;
  ahead: number;
  behind: number;
  files: Array<{ path: string; status: string }>;
}

export interface GitBranch {
  name: string;
  isCurrent: boolean;
  isRemote: boolean;
  upstream?: string;
}

export interface AuthStatus {
  method: 'gh-cli' | 'ssh' | 'https' | 'token' | 'unknown';
  user?: string;
  token?: string;
  sshKey?: string;
  authenticated: boolean;
}

export interface CardReviewResult {
  cardId: string;
  cardName: string;
  status: 'complete' | 'partial' | 'not-started' | 'needs-review';
  matchedCommits: GitHubCommit[];
  matchedPRs: GitHubPR[];
  acceptanceCriteria: Array<{ criterion: string; verified: boolean; evidence?: string }>;
  gaps: string[];
  recommendations: string[];
}

// ── Auth Detection ──

export function detectAuthStatus(): AuthStatus {
  // 1. Check gh CLI
  try {
    const ghStatus = execSync('gh auth status 2>&1', { encoding: 'utf8' });
    const activeMatch = ghStatus.match(/✓ Logged in to github\.com account (\w+)/);
    if (activeMatch) {
      return {
        method: 'gh-cli',
        user: activeMatch[1],
        authenticated: true,
      };
    }
  } catch (e) {
    // gh not available or not logged in
  }

  // 2. Check SSH key
  const sshKeys = [
    resolve(process.env.USERPROFILE || '~', '.ssh', 'id_ed25519'),
    resolve(process.env.USERPROFILE || '~', '.ssh', 'id_rsa'),
  ];
  for (const key of sshKeys) {
    if (existsSync(key)) {
      return {
        method: 'ssh',
        sshKey: key,
        authenticated: true,
      };
    }
  }

  // 3. Check GH_TOKEN or GITHUB_TOKEN
  const token = process.env.GH_TOKEN || process.env.GITHUB_TOKEN;
  if (token) {
    return {
      method: 'token',
      token: token.substring(0, 8) + '...',
      authenticated: true,
    };
  }

  // 4. Check git remote (HTTPS with credentials)
  try {
    const remote = execSync('git remote get-url origin 2>&1', { encoding: 'utf8' }).trim();
    if (remote.startsWith('https://')) {
      return { method: 'https', authenticated: true };
    }
  } catch (e) {
    // no remote
  }

  return { method: 'unknown', authenticated: false };
}

// ── GitHub CLI Operations ──

export function getCurrentUser(): GitHubUser | null {
  try {
    const output = execSync('gh api user', { encoding: 'utf8' });
    return JSON.parse(output) as GitHubUser;
  } catch (e) {
    return null;
  }
}

export function listPullRequests(owner: string, repo: string, state?: 'open' | 'closed' | 'all'): GitHubPR[] {
  try {
    const stateParam = state || 'open';
    const output = execSync(`gh api repos/${owner}/${repo}/pulls?state=${stateParam}&per_page=100`, { encoding: 'utf8' });
    return JSON.parse(output) as GitHubPR[];
  } catch (e) {
    console.error('Failed to list PRs:', e);
    return [];
  }
}

export function getPullRequest(owner: string, repo: string, prNumber: number): GitHubPR | null {
  try {
    const output = execSync(`gh api repos/${owner}/${repo}/pulls/${prNumber}`, { encoding: 'utf8' });
    return JSON.parse(output) as GitHubPR;
  } catch (e) {
    return null;
  }
}

export function getPRCommits(owner: string, repo: string, prNumber: number): GitHubCommit[] {
  try {
    const output = execSync(`gh api repos/${owner}/${repo}/pulls/${prNumber}/commits`, { encoding: 'utf8' });
    return JSON.parse(output) as GitHubCommit[];
  } catch (e) {
    return [];
  }
}

export function searchCommits(owner: string, repo: string, query: string): GitHubCommit[] {
  try {
    // GitHub Search API for commits
    const output = execSync(`gh api repos/${owner}/${repo}/commits --paginate`, { encoding: 'utf8' });
    const commits = JSON.parse(output) as any[];
    
    // Filter by query (message, author, date)
    const lowerQuery = query.toLowerCase();
    return commits
      .filter(c => c.commit?.message?.toLowerCase().includes(lowerQuery))
      .map(c => ({
        sha: c.sha,
        message: c.commit.message,
        author: {
          login: c.author?.login,
          name: c.commit.author?.name,
          email: c.commit.author?.email,
        },
        date: c.commit.author?.date || c.commit.committer?.date,
      })) as GitHubCommit[];
  } catch (e) {
    return [];
  }
}

export function getCommit(owner: string, repo: string, sha: string): GitHubCommit | null {
  try {
    const output = execSync(`gh api repos/${owner}/${repo}/commits/${sha}`, { encoding: 'utf8' });
    const commit = JSON.parse(output) as any;
    return {
      sha: commit.sha,
      message: commit.commit.message,
      author: {
        login: commit.author?.login,
        name: commit.commit.author?.name,
        email: commit.commit.author?.email,
      },
      date: commit.commit.author?.date,
      files: commit.files?.map((f: any) => ({
        filename: f.filename,
        status: f.status,
        additions: f.additions,
        deletions: f.deletions,
      })),
    };
  } catch (e) {
    return null;
  }
}

// ── Git Native Operations ──

export function getGitStatus(): GitStatus {
  try {
    const branch = execSync('git rev-parse --abbrev-ref HEAD', { encoding: 'utf8' }).trim();
    const statusOutput = execSync('git status --porcelain --branch', { encoding: 'utf8' });
    
    const files: Array<{ path: string; status: string }> = [];
    const lines = statusOutput.split('\n').filter(l => l.trim());
    
    for (const line of lines) {
      if (line.startsWith('##')) {
        // Branch info
        const match = line.match(/## ([\w\-/]+)(?:\.\.\.([\w\-/]+))?(?: \[(?:ahead (\d+))?(?:, )?(?:behind (\d+))?\])?/);
        if (match) {
          // Continue to parse files
        }
      } else {
        const status = line.substring(0, 3).trim();
        const path = line.substring(3).trim();
        files.push({ path, status });
      }
    }
    
    return {
      branch,
      ahead: 0,
      behind: 0,
      files,
    };
  } catch (e) {
    return { branch: 'unknown', ahead: 0, behind: 0, files: [] };
  }
}

export function getGitBranches(): GitBranch[] {
  try {
    const output = execSync('git branch -av', { encoding: 'utf8' });
    const branches: GitBranch[] = [];
    
    for (const line of output.split('\n')) {
      if (!line.trim()) continue;
      
      const isCurrent = line.startsWith('*');
      const isRemote = line.includes('remotes/');
      const parts = line.trim().split(/\s+/);
      let name = parts[0];
      
      if (name === 'HEAD') continue;
      
      branches.push({
        name: name.replace('remotes/', ''),
        isCurrent,
        isRemote,
      });
    }
    
    return branches;
  } catch (e) {
    return [];
  }
}

export function getGitLog(limit: number = 50, pattern?: string): GitHubCommit[] {
  try {
    const patternArg = pattern ? `--grep="${pattern}"` : '';
    const output = execSync(`git log --oneline --format="%H|%an|%ae|%ad|%s" ${patternArg} -n ${limit}`, { encoding: 'utf8' });
    
    return output.split('\n').filter(l => l.trim()).map(line => {
      const [sha, authorName, authorEmail, date, ...messageParts] = line.split('|');
      return {
        sha,
        message: messageParts.join('|'),
        author: { name: authorName, email: authorEmail },
        date: date,
      };
    }) as GitHubCommit[];
  } catch (e) {
    return [];
  }
}

export function getCommitDiff(sha: string): string {
  try {
    return execSync(`git show ${sha} --stat`, { encoding: 'utf8' });
  } catch (e) {
    return '';
  }
}

export function getStashes(): Array<{ index: number; message: string }> {
  try {
    const output = execSync('git stash list', { encoding: 'utf8' });
    return output.split('\n').filter(l => l.trim()).map((line, index) => ({
      index,
      message: line.split(':').slice(1).join(':').trim(),
    }));
  } catch (e) {
    return [];
  }
}

// ── Repository Detection ──

export function getRepoInfo(): { owner: string; repo: string } | null {
  try {
    const remote = execSync('git remote get-url origin', { encoding: 'utf8' }).trim();
    
    // SSH: git@github.com:owner/repo.git
    // HTTPS: https://github.com/owner/repo.git
    const sshMatch = remote.match(/git@github\.com:([\w\-]+)\/([\w\-]+)\.git/);
    const httpsMatch = remote.match(/https:\/\/github\.com\/([\w\-]+)\/([\w\-]+)/);
    
    if (sshMatch) {
      return { owner: sshMatch[1], repo: sshMatch[2] };
    }
    if (httpsMatch) {
      return { owner: httpsMatch[1], repo: httpsMatch[2] };
    }
    
    return null;
  } catch (e) {
    return null;
  }
}

// ── Card Review Integration ──

export function findRelatedCommits(cardId: string, cardName: string): GitHubCommit[] {
  const repo = getRepoInfo();
  if (!repo) return [];
  
  // Search by card ID in commit message
  const commitsById = searchCommits(repo.owner, repo.repo, cardId);
  
  // Search by keywords from card name
  const keywords = cardName.split(/\s+/).filter(w => w.length > 3);
  const commitsByKeyword = keywords.flatMap(kw => searchCommits(repo.owner, repo.repo, kw));
  
  // Deduplicate by SHA
  const all = [...commitsById, ...commitsByKeyword];
  const seen = new Set<string>();
  return all.filter(c => {
    if (seen.has(c.sha)) return false;
    seen.add(c.sha);
    return true;
  });
}

export function findRelatedPRs(cardId: string, cardName: string): GitHubPR[] {
  const repo = getRepoInfo();
  if (!repo) return [];
  
  const prs = listPullRequests(repo.owner, repo.repo, 'all');
  
  // Filter by card ID in title or body
  return prs.filter(pr => 
    pr.title.toLowerCase().includes(cardId.toLowerCase()) ||
    pr.body?.toLowerCase().includes(cardId.toLowerCase()) ||
    pr.title.toLowerCase().includes(cardName.toLowerCase().substring(0, 20))
  );
}

// ── Helper: Parse Acceptance Criteria from Card Description ──

export function parseAcceptanceCriteria(description: string): string[] {
  const criteria: string[] = [];
  
  // Match patterns:
  // - [ ] Criterion text
  // - [x] Criterion text
  // - ✓ Criterion text
  // - ✅ Criterion text
  const checkboxPattern = /^[\s]*[-*]\s*\[([ x])\]\s*(.+)$/gm;
  const checkmarkPattern = /^[\s]*(?:✓|✅)\s*(.+)$/gm;
  
  let match;
  while ((match = checkboxPattern.exec(description)) !== null) {
    criteria.push(match[2].trim());
  }
  
  while ((match = checkmarkPattern.exec(description)) !== null) {
    criteria.push(match[1].trim());
  }
  
  return criteria;
}