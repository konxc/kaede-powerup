import { NextRequest, NextResponse } from 'next/server';
import { eq } from 'drizzle-orm';
import { db } from '@/db';
import { sourceAuthorizations, workspaceInstallations, workspaces } from '@/db/schema';
import { auth } from '@/lib/auth';
import { getGitHubInstallation, verifyGitHubInstallState } from '@/lib/github-app';
import { getOwnedWorkspace } from '@/lib/workspace-access';

const STATE_COOKIE = 'kaede-github-install-state';

export async function GET(request: NextRequest) {
  const session = await auth();
  const stateValue = request.nextUrl.searchParams.get('state');
  const cookieState = request.cookies.get(STATE_COOKIE)?.value;
  const state = stateValue && cookieState === stateValue ? verifyGitHubInstallState(stateValue) : null;
  const workspaceUrl = state ? `/workspaces/${encodeURIComponent(state.workspaceId)}` : '/';
  const response = NextResponse.redirect(new URL(workspaceUrl, request.url));
  response.cookies.delete(STATE_COOKIE);

  const sessionGithubId = session?.user ? ((session.user as typeof session.user & { githubId?: string }).githubId || session.user.id) : undefined;
  if (!session?.user?.id || !state || state.ownerGithubId !== sessionGithubId) {
    response.headers.set('Location', new URL('/?error=github-install-state', request.url).toString());
    return response;
  }

  const installationId = request.nextUrl.searchParams.get('installation_id');
  const setupAction = request.nextUrl.searchParams.get('setup_action');
  if (!installationId || !/^\d+$/.test(installationId) || !['install', 'update'].includes(setupAction || '')) {
    response.headers.set('Location', new URL(`${workspaceUrl}?error=github-install-incomplete`, request.url).toString());
    return response;
  }

  const workspace = await getOwnedWorkspace(state.workspaceId, session.user.id);
  if (!workspace) {
    response.headers.set('Location', new URL('/', request.url).toString());
    return response;
  }

  try {
    const installation = await getGitHubInstallation(installationId);
    if (workspace.sourceGithubLogin && workspace.sourceGithubLogin.toLowerCase() !== installation.account.login.toLowerCase()) {
      response.headers.set('Location', new URL(`${workspaceUrl}?error=github-install-target-mismatch`, request.url).toString());
      return response;
    }
    await db.insert(workspaceInstallations).values({
      workspaceId: state.workspaceId,
      installationId,
      accountLogin: installation.account.login,
      accountType: installation.account.type,
    }).onConflictDoUpdate({
      target: [workspaceInstallations.workspaceId, workspaceInstallations.installationId],
      set: {
        installationId,
        accountLogin: installation.account.login,
        accountType: installation.account.type,
        connectedAt: new Date(),
      },
    });
    await db.insert(sourceAuthorizations).values({
      workspaceId: workspace.id,
      sourceType: workspace.sourceType,
      sourceGithubId: String(installation.account.id),
      sourceGithubLogin: installation.account.login,
      installationId,
      status: 'active',
      approvedByGithubId: sessionGithubId,
      approvedAt: new Date(),
    });
    await db.update(workspaces).set({
      sourceGithubId: String(installation.account.id),
      sourceGithubLogin: installation.account.login,
      sourceStatus: 'active',
    }).where(eq(workspaces.id, workspace.id));
    return response;
  } catch {
    response.headers.set('Location', new URL(`${workspaceUrl}?error=github-install-failed`, request.url).toString());
    return response;
  }
}