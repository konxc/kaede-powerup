import { and, desc, eq } from 'drizzle-orm';
import { NextRequest, NextResponse } from 'next/server';
import { db } from '@/db';
import { workspaceContextDocuments, workspaceIndexRuns } from '@/db/schema';
import { auth } from '@/lib/auth';
import { indexProjectCodebase } from '@/lib/codebase-memory';
import { getOwnedProject, indexProjectContext } from '@/lib/project-context';

type RouteContext = { params: Promise<{ workspaceId: string; projectId: string }> };

export async function GET(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const { workspaceId, projectId } = await context.params;
  const project = await getOwnedProject(projectId, session.user.id);
  if (!project || project.workspaceId !== workspaceId) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

  const [runs, documents] = await Promise.all([
    db.select().from(workspaceIndexRuns).where(eq(workspaceIndexRuns.projectId, projectId)).orderBy(desc(workspaceIndexRuns.requestedAt)).limit(10),
    db.select({ path: workspaceContextDocuments.path, sourceKind: workspaceContextDocuments.sourceKind, ref: workspaceContextDocuments.ref, commitSha: workspaceContextDocuments.commitSha, retrievedAt: workspaceContextDocuments.retrievedAt })
      .from(workspaceContextDocuments).where(eq(workspaceContextDocuments.projectId, projectId)),
  ]);
  return NextResponse.json({ project, runs, documents });
}

export async function POST(_request: NextRequest, context: RouteContext) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.json({ error: 'Sign in required.' }, { status: 401 });
  const { workspaceId, projectId } = await context.params;
  const project = await getOwnedProject(projectId, session.user.id);
  if (!project || project.workspaceId !== workspaceId) return NextResponse.json({ error: 'Project not found.' }, { status: 404 });

  try {
    let kind = 'semantic-context';
    try {
      const body = await _request.json() as { kind?: string };
      if (body.kind) kind = body.kind;
    } catch {
      // Empty body selects the semantic context index.
    }
    const result = kind === 'codebase-graph'
      ? await indexProjectCodebase(projectId)
      : await indexProjectContext(projectId);
    return NextResponse.json(result);
  } catch (error) {
    return NextResponse.json({ error: error instanceof Error ? error.message : 'Project indexing failed.' }, { status: 502 });
  }
}
