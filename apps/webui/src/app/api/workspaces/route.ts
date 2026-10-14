import { NextRequest, NextResponse } from 'next/server';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { workspaces } from '@/db/schema';

export async function POST(request: NextRequest) {
  const session = await auth();
  if (!session?.user?.id) return NextResponse.redirect(new URL('/', request.url), 303);

  const origin = request.headers.get('origin');
  if (origin && new URL(origin).host !== request.headers.get('host')) {
    return NextResponse.json({ error: 'Cross-origin workspace creation is not allowed.' }, { status: 403 });
  }

  const formData = await request.formData();
  const name = String(formData.get('name') || '').trim();
  if (name.length < 2 || name.length > 100) {
    return NextResponse.redirect(new URL('/?error=invalid-name', request.url), 303);
  }

  const operatorGithubId = (session.user as typeof session.user & { githubId?: string }).githubId || session.user.id;
  const [workspace] = await db.insert(workspaces).values({
    name,
    operatorGithubId,
    createdByGithubId: session.user.id,
    sourceType: 'external_project',
    sourceStatus: 'pending',
  }).returning({ id: workspaces.id });

  return NextResponse.redirect(new URL(`/workspaces/${workspace.id}`, request.url), 303);
}