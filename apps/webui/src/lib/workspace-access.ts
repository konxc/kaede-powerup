import { and, eq, or } from 'drizzle-orm';
import { db } from '@/db';
import { workspaceMembers, workspaces } from '@/db/schema';

export async function getAccessibleWorkspaceIdsForUser(githubUserId: string) {
  const rows = await db.select({ workspaceId: workspaces.id }).from(workspaces)
    .leftJoin(workspaceMembers, eq(workspaceMembers.workspaceId, workspaces.id))
    .where(or(
      eq(workspaces.operatorGithubId, githubUserId),
      eq(workspaces.createdByGithubId, githubUserId),
      and(eq(workspaceMembers.githubUserId, githubUserId), eq(workspaceMembers.status, 'active')),
    ));
  return [...new Set(rows.map((row) => row.workspaceId))];
}

export async function ensurePersonalWorkspaceForUser(userId: string, githubUserId: string, userName?: string | null) {
  const existingIds = await getAccessibleWorkspaceIdsForUser(githubUserId);
  if (existingIds.length > 0) return existingIds;

  const defaultName = `${userName || githubUserId || 'Developer'}'s Personal`;
  const [personalWs] = await db.insert(workspaces).values({
    name: defaultName,
    operatorGithubId: githubUserId,
    createdByGithubId: userId,
    sourceType: 'personal',
    sourceGithubLogin: githubUserId,
    sourceStatus: 'active',
  }).returning();

  await db.insert(workspaceMembers).values({
    workspaceId: personalWs.id,
    userId,
    githubUserId,
    role: 'owner',
    status: 'active',
  });

  return [personalWs.id];
}

export async function getOwnedWorkspace(workspaceId: string, githubUserId: string) {
  const [workspace] = await db.select().from(workspaces).where(eq(workspaces.id, workspaceId)).limit(1);
  if (!workspace) return null;
  if (workspace.operatorGithubId === githubUserId || workspace.createdByGithubId === githubUserId) return workspace;
  const [membership] = await db.select({ id: workspaceMembers.id }).from(workspaceMembers).where(and(
    eq(workspaceMembers.workspaceId, workspaceId),
    eq(workspaceMembers.githubUserId, githubUserId),
    eq(workspaceMembers.status, 'active'),
  )).limit(1);
  return membership ? workspace : null;
}