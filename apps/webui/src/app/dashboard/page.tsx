import { and, desc, eq, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { Database, FolderGit2, RefreshCw, ShieldCheck } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { workspaceIndexRuns, workspaceProjects, workspaces } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';

export default async function DashboardPage() {
  const session = await auth();
  if (!session?.user?.id) {
    return <div className="container mx-auto px-4"><PageHeader title="Dashboard" description="Sign in untuk melihat data workspace Anda." /></div>;
  }
  const accessibleWorkspaceIds = await getAccessibleWorkspaceIdsForUser(session.user.id);
  const workspaceRows = accessibleWorkspaceIds.length
    ? await db.select({ id: workspaces.id, name: workspaces.name }).from(workspaces).where(inArray(workspaces.id, accessibleWorkspaceIds))
    : [];
  const projectRows = accessibleWorkspaceIds.length
    ? await db.select({ project: workspaceProjects, workspaceName: workspaces.name }).from(workspaceProjects).innerJoin(workspaces, eq(workspaceProjects.workspaceId, workspaces.id)).where(and(inArray(workspaceProjects.workspaceId, accessibleWorkspaceIds), inArray(workspaceProjects.workspaceId, accessibleWorkspaceIds))).orderBy(desc(workspaceProjects.priorityScore), desc(workspaceProjects.updatedAt))
    : [];
  const projectIds = projectRows.map(({ project }) => project.id);
  const runs = projectIds.length ? await db.select().from(workspaceIndexRuns).where(inArray(workspaceIndexRuns.projectId, projectIds)).orderBy(desc(workspaceIndexRuns.requestedAt)) : [];
  const activeProjects = projectRows.filter(({ project }) => project.status === 'active').length;
  const candidates = projectRows.filter(({ project }) => project.status === 'candidate').length;
  const completedRuns = runs.filter((run) => run.status === 'completed').length;

  return (
    <div className="container mx-auto px-4">
      <PageHeader title="Dashboard" description="Status nyata workspace, project, dan indexing KAEDE." />
      <div className="mb-8 grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
        <StatCard title="Workspaces" value={workspaceRows.length} icon={<Database className="size-4" />} />
        <StatCard title="Active projects" value={activeProjects} icon={<FolderGit2 className="size-4" />} />
        <StatCard title="Candidates" value={candidates} icon={<ShieldCheck className="size-4" />} />
        <StatCard title="Completed indexes" value={completedRuns} icon={<RefreshCw className="size-4" />} />
      </div>
      <Card>
        <CardHeader><CardTitle>Projects</CardTitle><p className="text-sm text-muted-foreground">Project berasal dari repository yang ditemukan dan disetujui di workspace Anda.</p></CardHeader>
        <CardContent>
          {projectRows.length ? <div className="divide-y divide-border rounded-md border border-border">{projectRows.map(({ project, workspaceName }) => {
            const latestRun = runs.find((run) => run.projectId === project.id);
            return <div key={project.id} className="flex flex-wrap items-center gap-4 px-4 py-4"><div className="min-w-0 flex-1"><p className="truncate font-medium">{project.fullName}</p><p className="text-xs text-muted-foreground">{workspaceName} · {project.sourceKinds.replaceAll(',', ', ')}</p></div><Badge variant={project.status === 'active' ? 'read' : 'secondary'}>{project.status}</Badge><span className="text-xs text-muted-foreground">{latestRun ? `${latestRun.kind}: ${latestRun.status}` : 'Not indexed'}</span><Link className="text-sm text-primary hover:underline" href={`/workspaces/${project.workspaceId}`}>Open workspace</Link></div>;
          })}</div> : <p className="rounded-md border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">Belum ada project. Hubungkan GitHub App dari workspace untuk memulai discovery.</p>}
        </CardContent>
      </Card>
    </div>
  );
}
