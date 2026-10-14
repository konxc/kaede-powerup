import { eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workspaceInstallations, workspaceProjects } from '@/db/schema';
import { auth } from '@/lib/auth';
import {
  classifyRepository,
  listInstallationRepositories,
  listInstallationRepositoryPaths,
} from '@/lib/github-app';
import { getOwnedWorkspace } from '@/lib/workspace-access';

type RouteContext = { params: Promise<{ workspaceId: string }> };

export async function POST(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });

  const { workspaceId } = await context.params;
  const workspace = await getOwnedWorkspace(workspaceId, session.user.id);
  if (!workspace) return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });

  const installations = await db.select().from(workspaceInstallations)
    .where(eq(workspaceInstallations.workspaceId, workspaceId));
  if (!installations.length) return NextResponse.json({ error: 'Connect the GitHub App first.' }, { status: 409 });

  let body: { action?: string; repositoryIds?: string[] } = {};
  try {
    body = await _request.json() as typeof body;
  } catch {
    // An empty body means discover; malformed optional input is rejected below.
  }
  if (body.action === 'approve') {
    if (!Array.isArray(body.repositoryIds) || body.repositoryIds.length > 500 || body.repositoryIds.some((id) => typeof id !== 'string' || !/^\d+$/.test(id))) {
      return NextResponse.json({ error: 'repositoryIds must contain valid GitHub repository IDs.' }, { status: 400 });
    }
    const approvedAt = new Date();
    const candidates = await db.select({ id: workspaceProjects.id, repositoryId: workspaceProjects.repositoryId })
      .from(workspaceProjects)
      .where(eq(workspaceProjects.workspaceId, workspaceId));
    const approvedIds = new Set(body.repositoryIds);
    for (const candidate of candidates) {
      if (approvedIds.has(candidate.repositoryId)) {
        await db.update(workspaceProjects).set({ status: 'active', approvedAt, updatedAt: approvedAt })
          .where(eq(workspaceProjects.id, candidate.id));
      }
    }
    return NextResponse.json({ approved: approvedIds.size });
  }
  if (body.action) return NextResponse.json({ error: 'Unsupported discovery action.' }, { status: 400 });

  try {
    const discovered = [];
    const failures = [];
    for (const installation of installations) {
      const repositories = await listInstallationRepositories(installation.installationId);
      for (const repository of repositories.slice(0, 200)) {
        try {
          const paths = await listInstallationRepositoryPaths(
            installation.installationId,
            String(repository.id),
            repository.full_name,
            repository.default_branch,
          );
          const classification = classifyRepository(repository.full_name, installation.accountLogin, paths);
          const values = {
            workspaceId,
            repositoryId: String(repository.id),
            installationId: installation.installationId,
            fullName: repository.full_name,
            sourceKinds: classification.sourceKinds.join(','),
            openkbPath: classification.openkbPath,
            defaultBranch: repository.default_branch,
            updatedAt: new Date(),
          };
          await db.insert(workspaceProjects).values(values).onConflictDoUpdate({
            target: [workspaceProjects.workspaceId, workspaceProjects.repositoryId],
            set: values,
          });
          discovered.push({
            id: String(repository.id),
            fullName: repository.full_name,
            private: repository.private,
            defaultBranch: repository.default_branch,
            sourceKinds: classification.sourceKinds,
            markers: classification.markers,
            openkbPath: classification.openkbPath,
            playbookPaths: classification.playbookPaths,
          });
        } catch (error) {
          failures.push({
            repository: repository.full_name,
            error: error instanceof Error ? error.message : 'Could not inspect repository.',
          });
        }
      }
    }

    return NextResponse.json({
      workspaceId,
      discovered,
      failures,
      limited: discovered.length + failures.length >= 200,
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'GitHub discovery failed.' }, { status: 502 });
  }
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const { workspaceId } = await context.params;
  const workspace = await getOwnedWorkspace(workspaceId, session.user.id);
  if (!workspace) return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });

  const projects = await db.select().from(workspaceProjects)
    .where(eq(workspaceProjects.workspaceId, workspaceId));
  return NextResponse.json({ projects: projects.map((project) => ({
    ...project,
    sourceKinds: project.sourceKinds.split(',').filter(Boolean),
  })) });
}
