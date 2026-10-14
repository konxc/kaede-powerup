import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workspaceInstallations, workspaceRepositories } from '@/db/schema';
import { auth } from '@/lib/auth';
import { readInstallationFile } from '@/lib/github-app';
import { getOwnedWorkspace } from '@/lib/workspace-access';

type RouteContext = { params: Promise<{ workspaceId: string; repositoryId: string }> };

export async function GET(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const { workspaceId, repositoryId } = await context.params;
  if (!/^\d+$/.test(repositoryId)) return NextResponse.json({ error: 'Invalid repository ID.' }, { status: 400 });
  if (!await getOwnedWorkspace(workspaceId, session.user.id)) {
    return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
  }

  const [source] = await db.select().from(workspaceRepositories).where(and(
    eq(workspaceRepositories.workspaceId, workspaceId),
    eq(workspaceRepositories.repositoryId, repositoryId),
  )).limit(1);
  if (!source) return NextResponse.json({ error: 'Repository is not selected for this workspace.' }, { status: 404 });

  const [installation] = await db.select().from(workspaceInstallations).where(and(
    eq(workspaceInstallations.workspaceId, workspaceId),
    eq(workspaceInstallations.installationId, source.installationId),
  )).limit(1);
  if (!installation) return NextResponse.json({ error: 'GitHub App installation is no longer connected.' }, { status: 409 });

  const path = request.nextUrl.searchParams.get('path') || source.contentPath;
  const ref = source.defaultBranch;
  try {
    const file = await readInstallationFile(source.installationId, repositoryId, source.fullName, path, ref);
    return NextResponse.json({
      repository: source.fullName,
      path,
      ref,
      sha: file.sha,
      content: file.content,
    });
  } catch (error) {
    const message = error instanceof Error ? error.message : 'Could not read repository file.';
    const status = /not found/i.test(message) ? 404 : /256 KB/.test(message) ? 413 : 502;
    return NextResponse.json({ error: message }, { status });
  }
}