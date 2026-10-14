import { chmod, mkdtemp, rm, writeFile } from 'node:fs/promises';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { promisify } from 'node:util';
import { execFile } from 'node:child_process';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { workspaceIndexRuns, workspaceProjects } from '@/db/schema';
import { installationToken } from '@/lib/github-app';

const execFileAsync = promisify(execFile);

function commandPath(): string {
  return process.env.CODEBASE_MEMORY_MCP_PATH || 'codebase-memory-mcp';
}

function projectName(projectId: string): string {
  return `kaede-${projectId}`;
}

async function cloneWithInstallationToken(
  project: typeof workspaceProjects.$inferSelect,
  destination: string,
): Promise<void> {
  const token = await installationToken(project.installationId, project.repositoryId);
  const askpass = join(destination, '.git-askpass');
  await writeFile(askpass, `#!/bin/sh\nprintf '%s' '${token.replace(/'/g, "'\\''")}'\n`, { mode: 0o700 });
  await chmod(askpass, 0o700);
  const [owner, repository] = project.fullName.split('/');
  if (!owner || !repository) throw new Error('Invalid GitHub repository name.');

  const args = ['clone', '--depth', '1'];
  if (project.defaultBranch) args.push('--branch', project.defaultBranch);
  args.push(`https://github.com/${owner}/${repository}.git`, join(destination, 'repo'));
  try {
    await execFileAsync('git', args, {
      env: { ...process.env, GIT_ASKPASS: askpass, GIT_TERMINAL_PROMPT: '0' },
      timeout: 180_000,
      maxBuffer: 2 * 1024 * 1024,
    });
  } finally {
    await rm(askpass, { force: true });
  }
}

export async function indexProjectCodebase(projectId: string) {
  const [project] = await db.select().from(workspaceProjects).where(eq(workspaceProjects.id, projectId)).limit(1);
  if (!project) throw new Error('Project not found.');
  if (project.status !== 'active') throw new Error('Project must be approved before indexing.');

  const run = await db.insert(workspaceIndexRuns).values({
    projectId,
    kind: 'codebase-graph',
    status: 'running',
    ref: project.defaultBranch,
  }).returning({ id: workspaceIndexRuns.id });
  const runId = run[0]?.id;
  if (!runId) throw new Error('Could not create index run.');
  const workDir = await mkdtemp(join(tmpdir(), 'kaede-codebase-'));

  try {
    await cloneWithInstallationToken(project, workDir);
    const result = await execFileAsync(commandPath(), [
      'cli',
      'index_repository',
      '--repo-path', join(workDir, 'repo'),
      '--name', projectName(project.id),
      '--mode', 'moderate',
      '--persistence', 'false',
    ], {
      env: process.env,
      timeout: 600_000,
      maxBuffer: 8 * 1024 * 1024,
    });
    const commitSha = await getHeadCommit(project, workDir);
    await db.update(workspaceIndexRuns).set({
      status: 'completed',
      commitSha,
      generation: `codebase-memory:${projectName(project.id)}`,
      finishedAt: new Date(),
    }).where(eq(workspaceIndexRuns.id, runId));
    return { runId, project: projectName(project.id), commitSha, output: result.stdout.slice(-4000) };
  } catch (error) {
    await db.update(workspaceIndexRuns).set({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Codebase indexing failed.',
      finishedAt: new Date(),
    }).where(eq(workspaceIndexRuns.id, runId));
    throw error;
  } finally {
    await rm(workDir, { recursive: true, force: true });
  }
}

async function getHeadCommit(
  project: typeof workspaceProjects.$inferSelect,
  workDir: string,
): Promise<string | null> {
  try {
    const result = await execFileAsync('git', ['-C', join(workDir, 'repo'), 'rev-parse', 'HEAD'], {
      timeout: 10_000,
      maxBuffer: 100_000,
    });
    return result.stdout.trim() || null;
  } catch {
    return null;
  }
}
