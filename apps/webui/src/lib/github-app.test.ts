import { afterEach, describe, expect, it } from 'bun:test';
import { createHmac, generateKeyPairSync } from 'node:crypto';
import { classifyRepository, createGitHubInstallState, listInstallationRepositoryPaths, readInstallationFile, verifyGitHubInstallState } from './github-app';

describe('GitHub App installation state', () => {
  const originalSecret = process.env.AUTH_SECRET;

  afterEach(() => {
    if (originalSecret === undefined) delete process.env.AUTH_SECRET;
    else process.env.AUTH_SECRET = originalSecret;
  });

  it('round-trips a signed, unexpired workspace state', () => {
    process.env.AUTH_SECRET = 'test-secret';
    const signed = createGitHubInstallState('workspace-1', '33443311');
    expect(verifyGitHubInstallState(signed)).toMatchObject({
      workspaceId: 'workspace-1',
      ownerGithubId: '33443311',
    });
  });

  it('rejects tampered state', () => {
    process.env.AUTH_SECRET = 'test-secret';
    const signed = createGitHubInstallState('workspace-1', '33443311');
    const [payload, signature] = signed.split('.');
    const tampered = `${Buffer.from(JSON.stringify({ workspaceId: 'other', ownerGithubId: '33443311', expiresAt: Date.now() + 60_000 })).toString('base64url')}.${signature}`;
    expect(verifyGitHubInstallState(tampered)).toBeNull();
    expect(verifyGitHubInstallState(`${payload}.${signature}x`)).toBeNull();
  });

  it('rejects expired state even with a valid signature', () => {
    process.env.AUTH_SECRET = 'test-secret';
    const payload = Buffer.from(JSON.stringify({
      workspaceId: 'workspace-1',
      ownerGithubId: '33443311',
      expiresAt: Date.now() - 1,
    })).toString('base64url');
    const signature = createHmac('sha256', 'test-secret').update(payload).digest('base64url');
    expect(verifyGitHubInstallState(`${payload}.${signature}`)).toBeNull();
  });

  it('reads selected repo content with a repo-scoped read-only token', async () => {
    const originalFetch = globalThis.fetch;
    const originalAppId = process.env.GITHUB_APP_ID;
    const originalPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    process.env.GITHUB_APP_ID = 'app-client-id';
    process.env.GITHUB_APP_PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();
    const requested: string[] = [];

    const mockFetch = async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      requested.push(url);
      if (url.endsWith('/app/installations/44/access_tokens')) {
        expect(JSON.parse(String(init?.body))).toEqual({ repository_ids: [123], permissions: { contents: 'read' } });
        return new Response(JSON.stringify({ token: 'installation-token' }), { status: 201 });
      }
      expect(url).toBe('https://api.github.com/repos/example/private-repo/contents/README.md?ref=main');
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer installation-token');
      return new Response(JSON.stringify({
        type: 'file',
        encoding: 'base64',
        content: Buffer.from('# Workspace context').toString('base64'),
        sha: 'file-sha',
        size: 19,
      }));
    };
    globalThis.fetch = Object.assign(mockFetch, { preconnect: originalFetch.preconnect });

    try {
      const result = await readInstallationFile('44', '123', 'example/private-repo', 'README.md', 'main');
      expect(result).toEqual({ content: '# Workspace context', sha: 'file-sha' });
      await expect(readInstallationFile('44', '123', 'example/private-repo', '../secret', 'main'))
        .rejects.toThrow('dot segments');
      expect(requested).toHaveLength(2);
    } finally {
      globalThis.fetch = originalFetch;
      if (originalAppId === undefined) delete process.env.GITHUB_APP_ID;
      else process.env.GITHUB_APP_ID = originalAppId;
      if (originalPrivateKey === undefined) delete process.env.GITHUB_APP_PRIVATE_KEY;
      else process.env.GITHUB_APP_PRIVATE_KEY = originalPrivateKey;
    }
  });
});

describe('repository discovery classification', () => {
  it('identifies workspace metadata, playbook, and OpenKB markers', () => {
    expect(classifyRepository('SMA-UII-Yogyakarta/playbook', 'SMA-UII-Yogyakarta', [
      '.github/workflows/docs.yml',
      '.openkb/SHARED/glossary.md',
      '.opencode/docs/playbook-template.md',
    ])).toEqual({
      sourceKinds: ['workspace-meta', 'project', 'playbook'],
      markers: ['.github', '.openkb', 'playbook'],
      openkbPath: '.openkb',
      playbookPaths: ['.opencode/docs/playbook-template.md'],
    });
  });

  it('identifies personal profile and GitHub Pages repositories', () => {
    expect(classifyRepository('konxc/konxc', 'konxc', ['README.md'])).toMatchObject({
      sourceKinds: ['profile'],
      markers: ['profile'],
    });
    expect(classifyRepository('konxc/konxc.github.io', 'konxc', ['index.md'])).toMatchObject({
      sourceKinds: ['github-pages'],
      markers: ['github-pages'],
    });
  });

  it('defaults an unmarked repository to a project', () => {
    expect(classifyRepository('org/ammapreneur', 'org', ['src/index.ts'])).toMatchObject({
      sourceKinds: ['project'],
      markers: [],
      openkbPath: null,
    });
  });
});

describe('repository tree discovery', () => {
  it('reads repository paths using a repository-scoped installation token', async () => {
    const originalFetch = globalThis.fetch;
    const originalAppId = process.env.GITHUB_APP_ID;
    const originalPrivateKey = process.env.GITHUB_APP_PRIVATE_KEY;
    const { privateKey } = generateKeyPairSync('rsa', { modulusLength: 2048 });
    process.env.GITHUB_APP_ID = 'app-client-id';
    process.env.GITHUB_APP_PRIVATE_KEY = privateKey.export({ type: 'pkcs8', format: 'pem' }).toString();

    globalThis.fetch = Object.assign(async (input: RequestInfo | URL, init?: RequestInit) => {
      const url = String(input);
      if (url.endsWith('/app/installations/44/access_tokens')) {
        expect(JSON.parse(String(init?.body))).toEqual({ repository_ids: [123], permissions: { contents: 'read' } });
        return new Response(JSON.stringify({ token: 'installation-token' }), { status: 201 });
      }
      expect(url).toBe('https://api.github.com/repos/example/project/git/trees/main?recursive=1');
      expect(new Headers(init?.headers).get('authorization')).toBe('Bearer installation-token');
      return new Response(JSON.stringify({ tree: [
        { path: '.openkb/SHARED/glossary.md', type: 'blob' },
        { path: 'src/index.ts', type: 'blob' },
      ], truncated: false }));
    }, { preconnect: originalFetch.preconnect });

    try {
      await expect(listInstallationRepositoryPaths('44', '123', 'example/project', 'main'))
        .resolves.toEqual(['.openkb/SHARED/glossary.md', 'src/index.ts']);
    } finally {
      globalThis.fetch = originalFetch;
      if (originalAppId === undefined) delete process.env.GITHUB_APP_ID;
      else process.env.GITHUB_APP_ID = originalAppId;
      if (originalPrivateKey === undefined) delete process.env.GITHUB_APP_PRIVATE_KEY;
      else process.env.GITHUB_APP_PRIVATE_KEY = originalPrivateKey;
    }
  });
});
