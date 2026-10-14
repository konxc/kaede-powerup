/**
 * Native GitHub API client — no @octokit/rest dependency.
 * Uses web-standard fetch() under Bun/Node.js.
 */

const BASE = 'https://api.github.com';

function headers(): HeadersInit {
  return {
    'Authorization': `Bearer ${process.env.GITHUB_TOKEN ?? ''}`,
    'Accept': 'application/vnd.github.v3+json',
    'User-Agent': 'KAEDE-App',
  };
}

async function gh<T>(path: string, opts?: RequestInit): Promise<T> {
  const res = await fetch(`${BASE}${path}`, { ...opts, headers: { ...headers(), ...opts?.headers } });
  if (!res.ok) throw new Error(`GitHub ${res.status}: ${res.statusText} (${path})`);
  return res.json() as Promise<T>;
}

export async function getOrgMembers(org: string) {
  return gh<unknown[]>(`/orgs/${org}/members`);
}

export async function getOrgTeams(org: string) {
  return gh<unknown[]>(`/orgs/${org}/teams`);
}

export async function getTeamMembers(org: string, teamSlug: string) {
  return gh<unknown[]>(`/orgs/${org}/teams/${teamSlug}/members`);
}

export async function addMemberToTeam(org: string, teamSlug: string, username: string) {
  await gh(`/orgs/${org}/teams/${teamSlug}/memberships/${username}`, { method: 'PUT' });
}

export async function removeMemberFromTeam(org: string, teamSlug: string, username: string) {
  await gh(`/orgs/${org}/teams/${teamSlug}/memberships/${username}`, { method: 'DELETE' });
}

export async function getRepoCollaborators(owner: string, repo: string) {
  return gh<unknown[]>(`/repos/${owner}/${repo}/collaborators`);
}

export async function inviteCollaborator(owner: string, repo: string, username: string, permission: 'admin' | 'write' | 'read') {
  await gh(`/repos/${owner}/${repo}/collaborators/${username}`, {
    method: 'PUT',
    body: JSON.stringify({ permission }),
    headers: { 'Content-Type': 'application/json' },
  });
}

export async function removeCollaborator(owner: string, repo: string, username: string) {
  await gh(`/repos/${owner}/${repo}/collaborators/${username}`, { method: 'DELETE' });
}

export async function getFileContent(owner: string, repo: string, path: string, ref?: string) {
  try {
    const qs = ref ? `?ref=${ref}` : '';
    const data = await gh<{ content?: string }>(`/repos/${owner}/${repo}/contents/${path}${qs}`);
    if (data.content) return Buffer.from(data.content, 'base64').toString('utf-8');
    return null;
  } catch {
    return null;
  }
}
