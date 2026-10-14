import { createHmac, createSign, createPrivateKey, timingSafeEqual } from 'node:crypto';

const API = 'https://api.github.com';
const API_VERSION = '2026-03-10';

export interface InstallationRepository {
  id: number;
  full_name: string;
  private: boolean;
  default_branch: string | null;
}

export type RepositorySourceKind = 'workspace-meta' | 'playbook' | 'project' | 'profile' | 'github-pages';

export interface RepositoryDiscovery {
  sourceKinds: RepositorySourceKind[];
  markers: string[];
  openkbPath: string | null;
  playbookPaths: string[];
}

export interface GitHubInstallState {
  workspaceId: string;
  ownerGithubId: string;
  expiresAt: number;
}

interface InstallationResponse {
  account: { id: number; login: string; type: string };
}

function appJwt(): string {
  const appId = process.env.GITHUB_APP_ID;
  const privatePem = process.env.GITHUB_APP_PRIVATE_KEY?.replace(/\\n/g, '\n');
  if (!appId || !privatePem) throw new Error('GitHub App is not configured on the server.');

  const encode = (value: unknown) => Buffer.from(JSON.stringify(value)).toString('base64url');
  const now = Math.floor(Date.now() / 1000);
  const unsigned = `${encode({ alg: 'RS256', typ: 'JWT' })}.${encode({ iat: now - 60, exp: now + 540, iss: appId })}`;
  const signature = createSign('RSA-SHA256').update(unsigned).end().sign(createPrivateKey(privatePem)).toString('base64url');
  return `${unsigned}.${signature}`;
}

export function createGitHubInstallState(workspaceId: string, ownerGithubId: string): string {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  if (!secret) throw new Error('AUTH_SECRET is required to connect a GitHub App.');
  const payload = Buffer.from(JSON.stringify({
    workspaceId,
    ownerGithubId,
    expiresAt: Date.now() + 10 * 60 * 1000,
  })).toString('base64url');
  const signature = createHmac('sha256', secret).update(payload).digest('base64url');
  return `${payload}.${signature}`;
}

export function verifyGitHubInstallState(value: string): GitHubInstallState | null {
  const secret = process.env.AUTH_SECRET || process.env.NEXTAUTH_SECRET;
  const [payload, signature, extra] = value.split('.');
  if (!secret || !payload || !signature || extra) return null;

  const expected = createHmac('sha256', secret).update(payload).digest();
  let received: Buffer;
  try {
    received = Buffer.from(signature, 'base64url');
  } catch {
    return null;
  }
  if (received.length !== expected.length || !timingSafeEqual(received, expected)) return null;

  try {
    const state = JSON.parse(Buffer.from(payload, 'base64url').toString('utf8')) as GitHubInstallState;
    if (!state.workspaceId || !state.ownerGithubId || state.expiresAt < Date.now()) return null;
    return state;
  } catch {
    return null;
  }
}

async function githubRequest<T>(path: string, token: string, init?: RequestInit): Promise<{ data: T; headers: Headers }> {
  const response = await fetch(`${API}${path}`, {
    ...init,
    headers: {
      Accept: 'application/vnd.github+json',
      Authorization: `Bearer ${token}`,
      'X-GitHub-Api-Version': API_VERSION,
      ...init?.headers,
    },
    cache: 'no-store',
  });

  if (!response.ok) {
    const message = response.status === 404
      ? 'GitHub resource not found or not available to this installation.'
      : response.status === 401 || response.status === 403
        ? 'GitHub App is not authorized for this installation or repository.'
        : `GitHub API request failed (${response.status}).`;
    throw new Error(message);
  }

  return { data: await response.json() as T, headers: response.headers };
}

export async function installationToken(installationId: string, repositoryId?: string): Promise<string> {
  const { data } = await githubRequest<{ token: string }>(
    `/app/installations/${encodeURIComponent(installationId)}/access_tokens`,
    appJwt(),
    {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(repositoryId ? {
        repository_ids: [Number(repositoryId)],
        permissions: { contents: 'read' },
      } : {}),
    },
  );
  return data.token;
}

export async function getGitHubInstallation(installationId: string): Promise<InstallationResponse> {
  return (await githubRequest<InstallationResponse>(
    `/app/installations/${encodeURIComponent(installationId)}`,
    appJwt(),
  )).data;
}

export async function listInstallationRepositories(installationId: string): Promise<InstallationRepository[]> {
  const token = await installationToken(installationId);
  const repositories: InstallationRepository[] = [];
  let url: string | null = `${API}/installation/repositories?per_page=100`;
  let pageCount = 0;

  while (url && pageCount < 50) {
    pageCount += 1;
    const response: Response = await fetch(url, {
      headers: {
        Accept: 'application/vnd.github+json',
        Authorization: `Bearer ${token}`,
        'X-GitHub-Api-Version': API_VERSION,
      },
      cache: 'no-store',
    });
    if (!response.ok) {
      if (response.status === 401 || response.status === 403) {
        throw new Error('GitHub App cannot list repositories for this installation.');
      }
      throw new Error(`GitHub repository listing failed (${response.status}).`);
    }

    const page = await response.json() as { repositories: InstallationRepository[] };
    repositories.push(...page.repositories);
    const next: RegExpMatchArray | null = response.headers.get('link')?.match(/<([^>]+)>;\s*rel="next"/) ?? null;
    if (next) {
      const nextUrl = new URL(next[1]);
      if (nextUrl.origin !== API) throw new Error('GitHub returned an unexpected pagination host.');
      url = nextUrl.toString();
    } else {
      url = null;
    }
  }

  if (url) throw new Error('Repository list is too large to load in one request.');
  return repositories;
}

export async function listInstallationRepositoryPaths(
  installationId: string,
  repositoryId: string,
  fullName: string,
  ref: string | null,
): Promise<string[]> {
  const [owner, repository] = fullName.split('/');
  if (!owner || !repository || fullName.split('/').length !== 2) throw new Error('Invalid GitHub repository name.');
  const token = await installationToken(installationId, repositoryId);
  const treeRef = ref || 'HEAD';
  const { data } = await githubRequest<{ tree?: Array<{ path?: string; type?: string }>; truncated?: boolean }>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/git/trees/${encodeURIComponent(treeRef)}?recursive=1`,
    token,
  );
  if (data.truncated) throw new Error('Repository tree is too large to inspect automatically.');
  return (data.tree || [])
    .filter((entry) => entry.type === 'blob' && typeof entry.path === 'string')
    .map((entry) => entry.path as string)
    .slice(0, 20_000);
}

export async function getInstallationRepositoryHeadSha(
  installationId: string,
  repositoryId: string,
  fullName: string,
  ref: string | null,
): Promise<string | null> {
  const [owner, repository] = fullName.split('/');
  if (!owner || !repository || fullName.split('/').length !== 2) throw new Error('Invalid GitHub repository name.');
  const token = await installationToken(installationId, repositoryId);
  const branch = ref || 'HEAD';
  const { data } = await githubRequest<Array<{ sha?: string }>>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/commits?sha=${encodeURIComponent(branch)}&per_page=1`,
    token,
  );
  return data[0]?.sha || null;
}

export function classifyRepository(fullName: string, accountLogin: string, paths: string[]): RepositoryDiscovery {
  const normalizedPaths = [...new Set(paths.map((path) => path.replace(/^\/+|\/+$/g, '')))].sort();
  const lowerPaths = normalizedPaths.map((path) => path.toLowerCase());
  const openkbPath = normalizedPaths.find((path) => path.toLowerCase() === '.openkb' || path.toLowerCase().startsWith('.openkb/'))
    ? '.openkb'
    : null;
  const playbookPaths = normalizedPaths.filter((path) =>
    /(^|\/)(playbook|playbook-template)(\.md|\/|$)/i.test(path) ||
    /(^|\/)\.opencode\/.*playbook.*\.md$/i.test(path),
  );
  const markers: string[] = [];
  const sourceKinds = new Set<RepositorySourceKind>();
  const repositoryName = fullName.split('/')[1]?.toLowerCase() || '';
  const account = accountLogin.toLowerCase();

  if (lowerPaths.some((path) => path === '.github' || path.startsWith('.github/'))) {
    markers.push('.github');
    sourceKinds.add('workspace-meta');
  }
  if (openkbPath) {
    markers.push('.openkb');
    sourceKinds.add('project');
  }
  if (playbookPaths.length) {
    markers.push('playbook');
    sourceKinds.add('playbook');
  }
  if (repositoryName === account) {
    markers.push('profile');
    sourceKinds.add('profile');
  }
  if (repositoryName === `${account}.github.io`) {
    markers.push('github-pages');
    sourceKinds.add('github-pages');
  }
  if (!sourceKinds.has('workspace-meta') && !sourceKinds.has('playbook') && !sourceKinds.has('profile') && !sourceKinds.has('github-pages')) {
    sourceKinds.add('project');
  }

  return { sourceKinds: [...sourceKinds], markers, openkbPath, playbookPaths };
}

export async function readInstallationFile(
  installationId: string,
  repositoryId: string,
  fullName: string,
  path: string,
  ref: string | null,
): Promise<{ content: string; sha: string }> {
  const [owner, repository] = fullName.split('/');
  if (!owner || !repository || fullName.split('/').length !== 2) throw new Error('Invalid GitHub repository name.');
  const safePath = path.split('/').every((segment) => segment && segment !== '.' && segment !== '..') &&
    !path.startsWith('/') && !path.includes('\\') && path.length <= 300;
  if (!safePath) throw new Error('File path must be a relative repository path without dot segments.');

  const token = await installationToken(installationId, repositoryId);
  const encodedPath = path.split('/').map(encodeURIComponent).join('/');
  const search = ref ? `?ref=${encodeURIComponent(ref)}` : '';
  const { data } = await githubRequest<{ type: string; encoding: string; content: string; sha: string; size: number }>(
    `/repos/${encodeURIComponent(owner)}/${encodeURIComponent(repository)}/contents/${encodedPath}${search}`,
    token,
  );
  if (data.type !== 'file' || data.encoding !== 'base64') throw new Error('The selected path is not a regular file.');
  if (data.size > 256 * 1024) throw new Error('Files over 256 KB are not available in the PoC preview.');
  return { content: Buffer.from(data.content.replace(/\n/g, ''), 'base64').toString('utf8'), sha: data.sha };
}