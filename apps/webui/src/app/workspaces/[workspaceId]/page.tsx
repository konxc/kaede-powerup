import { and, desc, eq } from 'drizzle-orm';
import { ArrowLeft, Github, ShieldCheck } from 'lucide-react';
import Link from 'next/link';
import { notFound, redirect } from 'next/navigation';
import { revalidatePath } from 'next/cache';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, workspaceInstallations, workspaceMembers, workspaces } from '@/db/schema';
import { getOwnedWorkspace } from '@/lib/workspace-access';
import RepositoryPicker from './repository-picker';
import DiscoveryButton from './discovery-button';

type PageProps = {
  params: Promise<{ workspaceId: string }>;
  searchParams: Promise<{ error?: string }>;
};

const INSTALL_ERRORS: Record<string, string> = {
  'github-install-state': 'GitHub installation was not verified. Start the connection again.',
  'github-install-incomplete': 'GitHub App installation was cancelled or incomplete.',
  'github-install-failed': 'Could not verify this GitHub App installation. Check the App configuration and try again.',
  'github-install-target-mismatch': 'The GitHub App was installed on a different account or organization than this workspace target.',
};

async function fetchGitHubUserByUsername(username: string) {
  const response = await fetch(`https://api.github.com/users/${encodeURIComponent(username)}`, {
    headers: { Accept: 'application/vnd.github+json' },
    cache: 'no-store',
  });
  if (!response.ok) return null;
  const payload = await response.json() as { id?: number; login?: string; avatar_url?: string };
  if (!payload.id || !payload.login) return null;
  return { id: String(payload.id), login: payload.login, avatarUrl: payload.avatar_url || null };
}

async function inviteMember(formData: FormData) {
  'use server';
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const workspaceId = String(formData.get('workspaceId') || '').trim();
  const githubUsername = String(formData.get('githubUsername') || '').trim();
  if (!workspaceId || !githubUsername) redirect(`/workspaces/${workspaceId || ''}?error=invalid-member`);

  const workspace = await getOwnedWorkspace(workspaceId, session.user.id);
  if (!workspace) redirect('/');

  const githubProfile = await fetchGitHubUserByUsername(githubUsername);
  if (!githubProfile) redirect(`/workspaces/${workspaceId}?error=member-not-found`);

  const invitedByGithubId = (session.user as typeof session.user & { githubId?: string }).githubId || session.user.id;
  await db.insert(users).values({
    id: githubProfile.id,
    name: githubProfile.login,
    githubUsername: githubProfile.login,
    image: githubProfile.avatarUrl,
  }).onConflictDoUpdate({
    target: users.id,
    set: {
      name: githubProfile.login,
      githubUsername: githubProfile.login,
      image: githubProfile.avatarUrl,
    },
  });

  await db.insert(workspaceMembers).values({
    workspaceId,
    userId: githubProfile.id,
    githubUserId: githubProfile.id,
    role: 'member',
    status: 'active',
    invitedByGithubId: invitedByGithubId,
  }).onConflictDoUpdate({
    target: [workspaceMembers.workspaceId, workspaceMembers.githubUserId],
    set: {
      role: 'member',
      status: 'active',
      invitedByGithubId: invitedByGithubId,
    },
  });

  revalidatePath(`/workspaces/${workspaceId}`);
  redirect(`/workspaces/${workspaceId}`);
}

async function updateMemberAccess(formData: FormData) {
  'use server';
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const workspaceId = String(formData.get('workspaceId') || '').trim();
  const memberId = String(formData.get('memberId') || '').trim();
  const role = String(formData.get('role') || 'member');
  const status = String(formData.get('status') || 'active');

  if (!workspaceId || !memberId) redirect('/');
  if (!['member', 'reviewer', 'operator-admin'].includes(role)) redirect(`/workspaces/${workspaceId}?error=invalid-role`);
  if (!['active', 'inactive'].includes(status)) redirect(`/workspaces/${workspaceId}?error=invalid-status`);

  const workspace = await getOwnedWorkspace(workspaceId, session.user.id);
  if (!workspace) redirect('/');

  await db.update(workspaceMembers)
    .set({
      role,
      status,
    })
    .where(and(
      eq(workspaceMembers.id, memberId),
      eq(workspaceMembers.workspaceId, workspaceId),
    ));

  revalidatePath(`/workspaces/${workspaceId}`);
  redirect(`/workspaces/${workspaceId}`);
}

export default async function WorkspacePage({ params, searchParams }: PageProps) {
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const { workspaceId } = await params;
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  const githubUserId = (session.user as typeof session.user & { githubId?: string }).githubId || session.user.id;
  const hasAccess = workspace && (
    workspace.operatorGithubId === githubUserId ||
    workspace.createdByGithubId === session.user.id ||
    await db.select({ id: workspaceMembers.id })
      .from(workspaceMembers)
      .where(and(
        eq(workspaceMembers.workspaceId, workspaceId),
        eq(workspaceMembers.githubUserId, githubUserId),
        eq(workspaceMembers.status, 'active'),
      ))
      .then((rows) => rows.length > 0)
  );
  if (!workspace || !hasAccess) notFound();

  const installations = await db.select().from(workspaceInstallations)
    .where(eq(workspaceInstallations.workspaceId, workspace.id));
  const members = await db.select({
    member: workspaceMembers,
    user: users,
  }).from(workspaceMembers)
    .leftJoin(users, eq(users.id, workspaceMembers.userId))
    .where(eq(workspaceMembers.workspaceId, workspace.id))
    .orderBy(desc(workspaceMembers.createdAt));
  const query = await searchParams;
  const error = query.error ? INSTALL_ERRORS[query.error] : null;
  const appConfigured = Boolean(
    process.env.GITHUB_APP_SLUG && process.env.GITHUB_APP_ID && process.env.GITHUB_APP_PRIVATE_KEY,
  );

  return (
    <div className="container mx-auto max-w-4xl px-4 py-10">
      <Link href="/" className="inline-flex items-center gap-2 text-sm text-muted-foreground hover:text-foreground">
        <ArrowLeft className="size-4" /> Workspaces
      </Link>
      <div className="mt-6 flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-sm font-medium text-primary">WORKSPACE</p>
          <h1 className="mt-2 text-3xl font-bold">{workspace.name}</h1>
          <p className="mt-2 text-muted-foreground">Workspace operasional Koneksi untuk mengelola source partner secara terotorisasi.</p>
        </div>
        <span className="inline-flex items-center gap-2 rounded-md border border-emerald-700/30 bg-emerald-950/30 px-3 py-2 text-sm text-emerald-300">
          <ShieldCheck className="size-4" /> Koneksi-managed · {workspace.sourceStatus}
        </span>
      </div>

      {error ? <p role="alert" className="mt-5 rounded-md border border-red-800 bg-red-950/40 px-4 py-3 text-sm text-red-200">{error}</p> : null}

      <Card className="mt-7">
        <CardHeader>
          <CardTitle className="text-base">Workspace members</CardTitle>
          <p className="text-sm text-muted-foreground">Operator, reviewer, dan anggota yang memiliki akses ke konteks workspace ini.</p>
        </CardHeader>
        <CardContent className="space-y-4">
          <div className="space-y-2">
            {members.length ? members.map(({ member, user }) => (
              <div key={member.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-3">
                <div>
                  <p className="font-medium">{user?.githubUsername || member.githubUserId}</p>
                  <p className="text-xs text-muted-foreground">GitHub ID {member.githubUserId}</p>
                </div>
                <div className="flex items-center gap-2">
                  <form action={updateMemberAccess} className="flex items-center gap-2">
                    <input type="hidden" name="workspaceId" value={workspace.id} />
                    <input type="hidden" name="memberId" value={member.id} />
                    <select
                      name="role"
                      defaultValue={member.role}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="member">member</option>
                      <option value="reviewer">reviewer</option>
                      <option value="operator-admin">operator-admin</option>
                    </select>
                    <select
                      name="status"
                      defaultValue={member.status}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="active">active</option>
                      <option value="inactive">inactive</option>
                    </select>
                    <Button type="submit" variant="outline" size="sm">Save</Button>
                  </form>
                </div>
              </div>
            )) : <p className="text-sm text-muted-foreground">Belum ada anggota workspace.</p>}
          </div>

          <form action={inviteMember} className="flex flex-col gap-3 rounded-md border border-dashed border-border p-3 sm:flex-row">
            <input type="hidden" name="workspaceId" value={workspace.id} />
            <input
              name="githubUsername"
              placeholder="Invite by GitHub username"
              className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
              required
            />
            <Button type="submit">Invite member</Button>
          </form>
        </CardContent>
      </Card>

      <Card className="mt-7">
        <CardHeader>
          <CardTitle className="text-base">GitHub App installations</CardTitle>
          <p className="text-sm text-muted-foreground">Target: {workspace.sourceType} · {workspace.sourceGithubLogin || 'belum ditentukan'}</p>
        </CardHeader>
        <CardContent className="space-y-4">
          {installations.length ? (
            <ul className="space-y-2">
              {installations.map((installation) => (
                <li key={installation.installationId} className="flex flex-wrap items-center justify-between gap-2 rounded-md border border-border px-3 py-2">
                  <span className="font-medium">{installation.accountLogin}</span>
                  <span className="text-sm text-muted-foreground">{installation.accountType} · installation {installation.installationId}</span>
                </li>
              ))}
            </ul>
          ) : (
            <p className="text-sm text-muted-foreground">No GitHub account or organization is connected yet.</p>
          )}

          {appConfigured ? (
            <a
              href={`/api/github/install?workspaceId=${encodeURIComponent(workspace.id)}`}
              className="inline-flex h-10 items-center justify-center gap-2 rounded-md bg-primary px-4 text-sm font-medium text-primary-foreground hover:bg-primary/90"
            >
              <Github className="size-4" /> {installations.length ? 'Connect another account or org' : 'Connect GitHub App'}
            </a>
          ) : (
            <p className="rounded-md border border-amber-800/60 bg-amber-950/30 px-3 py-2 text-sm text-amber-200">
              Configure GITHUB_APP_SLUG, GITHUB_APP_ID, and GITHUB_APP_PRIVATE_KEY on the server to enable repository access.
            </p>
          )}
          {appConfigured && installations.length ? <DiscoveryButton workspaceId={workspace.id} /> : null}
        </CardContent>
      </Card>

      {installations.length ? <RepositoryPicker workspaceId={workspace.id} /> : null}
    </div>
  );
}