import { and, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workspaceInstallations, workspaceRepositories } from '@/db/schema';
import { auth } from '@/lib/auth';
import { listInstallationRepositories } from '@/lib/github-app';
import { getOwnedWorkspace } from '@/lib/workspace-access';

type RouteContext = { params: Promise<{ workspaceId: string }> };

async function getConnection(workspaceId: string, ownerGithubId: string) {
  const workspace = await getOwnedWorkspace(workspaceId, ownerGithubId);
  if (!workspace) return { response: NextResponse.json({ error: 'Workspace not found.' }, { status: 404 }) };
  const installations = await db.select().from(workspaceInstallations)
    .where(eq(workspaceInstallations.workspaceId, workspaceId));
  if (!installations.length) return { response: NextResponse.json({ error: 'Connect the GitHub App first.' }, { status: 409 }) };
  return { installations };
}

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const { workspaceId } = await context.params;
  const connection = await getConnection(workspaceId, session.user.id);
  if ('response' in connection) return connection.response;

  try {
    const [repositoryPages, selected] = await Promise.all([
      Promise.all(connection.installations.map(async (installation) => ({
        installation,
        repositories: await listInstallationRepositories(installation.installationId),
      }))),
      db.select({ repositoryId: workspaceRepositories.repositoryId, sourceType: workspaceRepositories.sourceType, contentPath: workspaceRepositories.contentPath }).from(workspaceRepositories)
        .where(eq(workspaceRepositories.workspaceId, workspaceId)),
    ]);
    const selectedById = new Map(selected.map((repository) => [repository.repositoryId, repository]));
    return NextResponse.json({
      accounts: connection.installations.map(({ accountLogin, accountType }) => ({ login: accountLogin, type: accountType })),
      repositories: repositoryPages.flatMap(({ installation, repositories }) =>
        repositories.map((repository) => ({
          id: String(repository.id),
          fullName: repository.full_name,
          private: repository.private,
          defaultBranch: repository.default_branch,
          installationId: installation.installationId,
          sourceType: selectedById.get(String(repository.id))?.sourceType || '',
          contentPath: selectedById.get(String(repository.id))?.contentPath || '',
        }))),
    });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'GitHub repository access failed.' }, { status: 502 });
  }
}

export async function POST(request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const { workspaceId } = await context.params;
  const connection = await getConnection(workspaceId, session.user.id);
  if ('response' in connection) return connection.response;

  let repositories: unknown;
  try {
    ({ repositories } = await request.json());
  } catch {
    return NextResponse.json({ error: 'Invalid JSON body.' }, { status: 400 });
  }
  if (!Array.isArray(repositories) || repositories.length > 500 || repositories.some((source) =>
    !source || typeof source !== 'object' || typeof source.repositoryId !== 'string' ||
    !/^\d+$/.test(source.repositoryId) || !['playbook', 'project', 'profile'].includes(source.sourceType) ||
    typeof source.contentPath !== 'string' || !source.contentPath.trim() || source.contentPath.length > 300 ||
    (source.contentPath !== '' && (source.contentPath.startsWith('/') || source.contentPath.includes('\\') || source.contentPath.split('/').some((part: string) => !part || part === '.' || part === '..'))),
  )) {
    return NextResponse.json({ error: 'repositories must contain at most 500 repositoryId/sourceType selections.' }, { status: 400 });
  }

  const selections = repositories as Array<{ repositoryId: string; sourceType: 'playbook' | 'project' | 'profile'; contentPath: string }>;
  const uniqueSelections = [...new Map(selections.map((selection) => [selection.repositoryId, selection])).values()];
  if (uniqueSelections.filter((selection) => selection.sourceType === 'playbook').length > 1) {
    return NextResponse.json({ error: 'A workspace can have only one playbook source.' }, { status: 400 });
  }
  try {
    const installedPages = await Promise.all(connection.installations.map(async (installation) => ({
      installation,
      repositories: await listInstallationRepositories(installation.installationId),
    })));
    const byId = new Map(installedPages.flatMap(({ installation, repositories: installed }) =>
      installed.map((repository) => [String(repository.id), { installation, repository }] as const),
    ));
    if (uniqueSelections.some((selection) => !byId.has(selection.repositoryId))) {
      return NextResponse.json({ error: 'A selected repository is not available to this GitHub App installation.' }, { status: 403 });
    }

    await db.delete(workspaceRepositories).where(eq(workspaceRepositories.workspaceId, workspaceId));
    if (uniqueSelections.length) {
      await db.insert(workspaceRepositories).values(uniqueSelections.map((selection) => {
        const { installation, repository } = byId.get(selection.repositoryId)!;
        return {
          workspaceId,
          repositoryId: selection.repositoryId,
          installationId: installation.installationId,
          fullName: repository.full_name,
          isPrivate: repository.private,
          defaultBranch: repository.default_branch,
          sourceType: selection.sourceType,
          contentPath: selection.contentPath,
        };
      }));
    }
    return NextResponse.json({ selected: uniqueSelections.length });
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Could not save repository selection.' }, { status: 502 });
  }
}