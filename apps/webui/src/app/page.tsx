import { desc, eq, inArray } from 'drizzle-orm';
import { Github, Plus, ShieldAlert } from 'lucide-react';
import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { auth, signIn, signOut } from '@/lib/auth';
import { db } from '@/db';
import { workspaceMembers, workspaces } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

async function signOutFromGitHub() {
  'use server';
  await signOut({ redirectTo: '/' });
}

async function signInWithGitHub() {
  'use server';
  await signIn('github', { redirectTo: '/' });
}

async function createWorkspace(formData: FormData) {
  'use server';
  const session = await auth();
  if (!session?.user?.id) redirect('/');

  const name = String(formData.get('name') || '').trim();
  if (name.length < 2 || name.length > 100) redirect('/?error=invalid-name');
  const sourceType = String(formData.get('targetType') || 'external_project');
  const sourceGithubLogin = String(formData.get('targetGithubLogin') || '').trim() || null;
  if (!['personal', 'organization', 'external_project'].includes(sourceType)) redirect('/?error=invalid-target');

  const operatorGithubId = (session.user as typeof session.user & { githubId?: string }).githubId || session.user.id;
  const [workspace] = await db.insert(workspaces).values({
    name,
    operatorGithubId,
    createdByGithubId: session.user.id,
    operatorOrganizationId: process.env.KAEDE_OPERATOR_ORGANIZATION_ID || null,
    sourceType,
    sourceGithubLogin,
    sourceStatus: 'pending',
  }).returning({ id: workspaces.id });
  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: session.user.id,
    githubUserId: operatorGithubId,
    role: 'operator-admin',
    status: 'active',
  });
  revalidatePath('/');
  redirect('/');
}

export default async function HomePage() {
  const session = await auth();
  const githubUsername = session?.user
    ? (session.user as typeof session.user & { githubUsername?: string }).githubUsername
    : undefined;
  const githubUserId = session?.user ? ((session.user as typeof session.user & { githubId?: string }).githubId || session.user.id) : undefined;
  const accessibleWorkspaceIds = githubUserId ? await getAccessibleWorkspaceIdsForUser(githubUserId) : [];
  const ownedWorkspaces = accessibleWorkspaceIds.length
    ? await db.select().from(workspaces)
        .where(inArray(workspaces.id, accessibleWorkspaceIds))
        .orderBy(desc(workspaces.createdAt))
    : [];

  return (
    <div className="container mx-auto max-w-4xl px-4 py-12">
      <div className="flex flex-wrap items-start justify-between gap-4 border-b border-border pb-6">
        <div>
          <p className="text-sm font-medium text-primary">KAEDE WORKSPACE</p>
          <h1 className="mt-2 text-3xl font-bold">Shared context starts here</h1>
          <p className="mt-2 max-w-2xl text-muted-foreground">
            Hubungkan identitas GitHub Anda, lalu siapkan ruang kerja. Akses repository belum diberikan sampai Anda menghubungkan GitHub App.
          </p>
        </div>
        {session?.user ? (
          <form action={signOutFromGitHub}>
            <Button type="submit" variant="outline">Sign out @{session.user.name || 'GitHub user'}</Button>
          </form>
        ) : null}
      </div>

      {!session?.user ? (
        <Card className="mt-8 max-w-xl">
          <CardHeader>
            <CardTitle>Sign in to KAEDE</CardTitle>
          </CardHeader>
          <CardContent>
            <p className="mb-5 text-sm text-muted-foreground">
              GitHub digunakan untuk mengenali akun Anda. Login ini belum memberi KAEDE akses ke repository privat.
            </p>
            <form action={signInWithGitHub}>
              <Button type="submit">
                <Github className="mr-2 size-4" /> Continue with GitHub
              </Button>
            </form>
          </CardContent>
        </Card>
      ) : (
        <>
          <div className="mt-8 flex items-center gap-3">
            {session.user.image ? <img src={session.user.image} alt="" className="size-10 rounded-full" /> : null}
            <div>
              <p className="font-medium">{session.user.name || session.user.email}</p>
              {githubUsername ? <p className="text-sm text-muted-foreground">@{githubUsername}</p> : null}
              <p className="text-sm text-muted-foreground">GitHub identity verified for this session</p>
            </div>
          </div>

          <section className="mt-10">
            <div className="mb-4 flex items-center justify-between gap-4">
              <div>
                <h2 className="text-xl font-semibold">Your workspaces</h2>
                <p className="text-sm text-muted-foreground">Workspace dikelola tim Koneksi; authorization source partner diproses terpisah.</p>
              </div>
            </div>

            {ownedWorkspaces.length ? (
              <div className="space-y-3">
                {ownedWorkspaces.map((workspace) => (
                  <Card key={workspace.id}>
                    <CardContent className="flex flex-wrap items-center justify-between gap-4 p-5">
                      <div>
                        <Link className="font-semibold hover:underline" href={`/workspaces/${workspace.id}`}>
                          {workspace.name}
                        </Link>
                        <p className="mt-1 text-sm text-muted-foreground">{workspace.sourceType} · {workspace.sourceGithubLogin || 'target source belum ditentukan'} · {workspace.sourceStatus}</p>
                      </div>
                      <span className="inline-flex items-center gap-2 text-sm text-amber-700 dark:text-amber-300">
                        <ShieldAlert className="size-4" /> Repository access not connected
                      </span>
                    </CardContent>
                  </Card>
                ))}
              </div>
            ) : (
              <p className="rounded-md border border-dashed border-border px-4 py-6 text-sm text-muted-foreground">
                No workspaces yet. Create one to begin the SMA UII PoC.
              </p>
            )}

            <Card className="mt-6 max-w-xl">
              <CardHeader><CardTitle>Create a workspace</CardTitle></CardHeader>
              <CardContent>
                <form action={createWorkspace} className="flex flex-col gap-3 sm:flex-row">
                  <label className="sr-only" htmlFor="workspace-name">Workspace name</label>
                  <input
                    id="workspace-name"
                    name="name"
                    required
                    minLength={2}
                    maxLength={100}
                    placeholder="SMA UII Yogyakarta"
                    className="h-10 min-w-0 flex-1 rounded-md border border-input bg-background px-3 text-sm"
                  />
                  <Button type="submit"><Plus className="mr-2 size-4" /> Create</Button>
                </form>
                <div className="mt-3 grid gap-3 sm:grid-cols-2">
                  <label className="grid gap-1 text-xs text-muted-foreground" htmlFor="workspace-target-type">
                    Target source type
                    <select id="workspace-target-type" name="targetType" defaultValue="organization" className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground">
                      <option value="organization">GitHub organization</option>
                      <option value="personal">GitHub personal account</option>
                      <option value="external_project">External project</option>
                    </select>
                  </label>
                  <label className="grid gap-1 text-xs text-muted-foreground" htmlFor="workspace-target-login">
                    Target GitHub login/org
                    <input id="workspace-target-login" name="targetGithubLogin" placeholder="SMA-UII-Yogyakarta" className="h-9 rounded-md border border-input bg-background px-2 text-sm text-foreground" />
                  </label>
                </div>
                <p className="mt-3 text-xs text-muted-foreground">Workspace creator menjadi operator Koneksi. Private repository baru dapat dibaca setelah target source menyetujui GitHub App.</p>
              </CardContent>
            </Card>
          </section>
        </>
      )}
    </div>
  );
}
