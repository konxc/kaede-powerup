import { and, eq } from 'drizzle-orm';
import { db } from '@/db';
import { workspaceContextDocuments, workspaceIndexRuns, workspaceProjects, workspaces } from '@/db/schema';
import { getInstallationRepositoryHeadSha, readInstallationFile } from '@/lib/github-app';

const CONTEXT_PATHS = [
  { path: 'README.md', sourceKind: 'project' },
  { path: '.openkb/SHARED/glossary.md', sourceKind: 'openkb' },
  { path: '.openkb/SHARED/references.md', sourceKind: 'openkb' },
  { path: '.openkb/SHARED/decision-log.md', sourceKind: 'openkb' },
  { path: '.opencode/docs/playbook-template.md', sourceKind: 'playbook' },
  { path: 'PLAYBOOK.md', sourceKind: 'playbook' },
  { path: 'playbook.md', sourceKind: 'playbook' },
  { path: '.github/README.md', sourceKind: 'workspace-meta' },
  { path: 'index.md', sourceKind: 'profile' },
];

export async function getOwnedProject(projectId: string, operatorGithubId: string) {
  const [project] = await db.select({ project: workspaceProjects })
    .from(workspaceProjects)
    .innerJoin(workspaces, eq(workspaceProjects.workspaceId, workspaces.id))
    .where(and(
      eq(workspaceProjects.id, projectId),
      eq(workspaces.operatorGithubId, operatorGithubId),
    ))
    .limit(1);
  return project?.project ?? null;
}

export async function indexProjectContext(projectId: string) {
  const [project] = await db.select().from(workspaceProjects).where(eq(workspaceProjects.id, projectId)).limit(1);
  if (!project) throw new Error('Project not found.');
  if (project.status !== 'active') throw new Error('Project must be approved before indexing.');

  const run = await db.insert(workspaceIndexRuns).values({
    projectId,
    kind: 'semantic-context',
    status: 'running',
    ref: project.defaultBranch,
  }).returning({ id: workspaceIndexRuns.id });
  const runId = run[0]?.id;
  if (!runId) throw new Error('Could not create index run.');

  try {
    const commitSha = await getInstallationRepositoryHeadSha(
      project.installationId,
      project.repositoryId,
      project.fullName,
      project.defaultBranch,
    );
    const documents: Array<{ path: string; sourceKind: string; content: string }> = [];
    for (const candidate of CONTEXT_PATHS) {
      try {
        const file = await readInstallationFile(
          project.installationId,
          project.repositoryId,
          project.fullName,
          candidate.path,
          project.defaultBranch,
        );
        documents.push({ path: candidate.path, sourceKind: candidate.sourceKind, content: file.content });
      } catch {
        // Context files are convention-based; a missing optional file is not a failed index.
      }
    }

    for (const document of documents) {
      await db.insert(workspaceContextDocuments).values({
        projectId,
        sourceKind: document.sourceKind,
        path: document.path,
        ref: project.defaultBranch,
        commitSha,
        content: document.content,
        retrievedAt: new Date(),
      }).onConflictDoUpdate({
        target: [workspaceContextDocuments.projectId, workspaceContextDocuments.path],
        set: {
          sourceKind: document.sourceKind,
          ref: project.defaultBranch,
          commitSha,
          content: document.content,
          retrievedAt: new Date(),
        },
      });
    }

    await db.update(workspaceIndexRuns).set({
      status: 'completed',
      commitSha,
      generation: `semantic:${commitSha || 'unknown'}`,
      finishedAt: new Date(),
    }).where(eq(workspaceIndexRuns.id, runId));
    return { runId, commitSha, documents: documents.map(({ path, sourceKind }) => ({ path, sourceKind })) };
  } catch (error) {
    await db.update(workspaceIndexRuns).set({
      status: 'failed',
      error: error instanceof Error ? error.message : 'Context indexing failed.',
      finishedAt: new Date(),
    }).where(eq(workspaceIndexRuns.id, runId));
    throw error;
  }
}
