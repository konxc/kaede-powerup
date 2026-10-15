import { redirect } from 'next/navigation';
import { inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { workspaces } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';
import { ProtectedShell } from '@/components/layout/protected-shell';

export default async function ProtectedLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const session = await auth();

  if (!session?.user) {
    redirect('/login');
  }

  const githubUserId = (session.user as any).githubId || session.user.id;
  let userWorkspaces: Array<{
    id: string;
    name: string;
    sourceType: string;
    sourceGithubLogin: string | null;
  }> = [];

  try {
    const accessibleWorkspaceIds = githubUserId ? await getAccessibleWorkspaceIdsForUser(githubUserId) : [];
    if (accessibleWorkspaceIds.length) {
      userWorkspaces = await db
        .select({
          id: workspaces.id,
          name: workspaces.name,
          sourceType: workspaces.sourceType,
          sourceGithubLogin: workspaces.sourceGithubLogin,
        })
        .from(workspaces)
        .where(inArray(workspaces.id, accessibleWorkspaceIds));
    }
  } catch (err) {
    console.warn('[ProtectedLayout] Failed to load workspaces:', err);
  }

  return (
    <ProtectedShell
      user={{
        name: session.user.name,
        email: session.user.email,
        image: session.user.image,
        githubUsername: (session.user as any).githubUsername,
        role: (session.user as any).role,
      }}
      workspaces={userWorkspaces}
    >
      {children}
    </ProtectedShell>
  );
}
