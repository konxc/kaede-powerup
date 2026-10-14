import { eq, inArray } from 'drizzle-orm';
import { Users, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { workspaceProjects, workspaces } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';

export default async function TeamsPage() {
  const session = await auth();
  if (!session?.user?.id) return <div className="container mx-auto px-4"><PageHeader title="Teams" description="Sign in untuk melihat workspace ownership." /></div>;
  const ownerId = session.user.id;
  const workspaceIds = await getAccessibleWorkspaceIdsForUser(session.user.id);
  const rows = workspaceIds.length
    ? await db.select({ workspace: workspaces, project: workspaceProjects }).from(workspaces).leftJoin(workspaceProjects, eq(workspaceProjects.workspaceId, workspaces.id)).where(inArray(workspaces.id, workspaceIds))
    : [];
  const grouped = new Map<string, { name: string; projects: NonNullable<typeof rows[number]['project']>[] }>();
  for (const row of rows) {
    const current = grouped.get(row.workspace.id) || { name: row.workspace.name, projects: [] };
    if (row.project) current.projects.push(row.project);
    grouped.set(row.workspace.id, current);
  }

  return (
    <div className="container mx-auto px-4">
      <PageHeader title="Teams" description="Workspace ownership dan project yang terhubung." />
      <Card className="mb-6"><CardHeader><CardTitle className="flex items-center gap-2"><ShieldCheck className="size-4" /> Owner-only access</CardTitle></CardHeader><CardContent className="text-sm text-muted-foreground">Versi saat ini belum mengaktifkan invitations atau membership sharing. Data di bawah hanya menampilkan workspace yang dimiliki akun GitHub Anda.</CardContent></Card>
      {grouped.size ? [...grouped.entries()].map(([workspaceId, workspace]) => (
        <Card key={workspaceId} className="mb-6"><CardHeader><CardTitle className="flex items-center gap-2"><Users className="size-4" />{workspace.name}</CardTitle></CardHeader><CardContent><div className="mb-4 flex items-center gap-3 text-sm"><span className="font-medium">Owner</span><span className="text-muted-foreground">GitHub user {ownerId}</span></div>{workspace.projects.length ? <div className="space-y-2">{workspace.projects.map((project) => <div key={project.id} className="flex flex-wrap items-center justify-between gap-3 rounded-md border border-border px-3 py-3"><span className="text-sm">{project.fullName}</span><Badge variant={project.status === 'active' ? 'read' : 'secondary'}>{project.status}</Badge></div>)}</div> : <p className="text-sm text-muted-foreground">Belum ada repository candidate atau project.</p>}</CardContent></Card>
      )) : <p className="rounded-md border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">Belum ada workspace.</p>}
    </div>
  );
}
