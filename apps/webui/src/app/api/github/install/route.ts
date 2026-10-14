import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { createGitHubInstallState } from '@/lib/github-app';
import { getOwnedWorkspace } from '@/lib/workspace-access';

const STATE_COOKIE = 'kaede-github-install-state';

export async function GET(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL('/', request.url));

  const workspaceId = request.nextUrl.searchParams.get('workspaceId');
  if (!workspaceId || !await getOwnedWorkspace(workspaceId, session.user.id)) {
    return NextResponse.json({ error: 'Workspace not found.' }, { status: 404 });
  }

  const appSlug = process.env.GITHUB_APP_SLUG;
  if (!appSlug || !/^[a-zA-Z0-9-]+$/.test(appSlug)) {
    return NextResponse.json({ error: 'GITHUB_APP_SLUG is not configured.' }, { status: 503 });
  }

  let state: string;
  try {
    state = createGitHubInstallState(workspaceId, session.user.id);
  } catch {
    return NextResponse.json({ error: 'AUTH_SECRET is not configured.' }, { status: 503 });
  }

  const installUrl = new URL(`https://github.com/apps/${appSlug}/installations/new`);
  installUrl.searchParams.set('state', state);
  const response = NextResponse.redirect(installUrl);
  response.cookies.set(STATE_COOKIE, state, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'lax',
    maxAge: 600,
    path: '/api/github/callback',
  });
  return response;
}