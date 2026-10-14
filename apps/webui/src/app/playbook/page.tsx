import { and, eq, inArray } from 'drizzle-orm';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { workspaceContextDocuments, workspaceProjects, workspaces } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';

export default async function PlaybookPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const projects = userId
    ? await (async () => {
        const workspaceIds = await getAccessibleWorkspaceIdsForUser(userId);
        return workspaceIds.length
          ? await db.select({ project: workspaceProjects, workspaceName: workspaces.name })
              .from(workspaceProjects)
              .innerJoin(workspaces, eq(workspaceProjects.workspaceId, workspaces.id))
              .where(and(inArray(workspaceProjects.workspaceId, workspaceIds), eq(workspaceProjects.status, 'active')))
          : [];
      })()
    : [];
  const projectIds = projects.map(({ project }) => project.id);
  const documents = projectIds.length
    ? await db.select().from(workspaceContextDocuments).where(and(eq(workspaceContextDocuments.sourceKind, 'playbook'), inArray(workspaceContextDocuments.projectId, projectIds)))
    : [];

  return (
    <div className="container mx-auto px-4">
      <PageHeader title="Playbook" description="Dokumen playbook nyata dari project yang sudah di-index." />
      {!session?.user ? <p className="text-sm text-muted-foreground">Sign in untuk melihat playbook workspace Anda.</p> : null}
      {session?.user && !projects.length ? <p className="rounded-md border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">Belum ada project aktif. Approve project dan jalankan semantic index dari workspace.</p> : null}
      {projects.map(({ project, workspaceName }) => {
        const projectDocuments = documents.filter((document) => document.projectId === project.id);
        return (
          <Card key={project.id} className="mb-6">
            <CardHeader><CardTitle>{project.fullName}</CardTitle><p className="text-sm text-muted-foreground">{workspaceName} · {project.defaultBranch || 'default branch'} · {projectDocuments.length} playbook documents</p></CardHeader>
            <CardContent className="space-y-3">
              {projectDocuments.length ? projectDocuments.map((document) => (
                <details key={document.id} className="rounded-md border border-border">
                  <summary className="cursor-pointer px-4 py-3 text-sm font-medium">{document.path} <span className="ml-2 text-xs text-muted-foreground">{document.commitSha || 'commit unknown'}</span></summary>
                  <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap border-t border-border p-4 text-xs">{document.content}</pre>
                </details>
              )) : <p className="text-sm text-muted-foreground">Belum ada dokumen playbook terdeteksi untuk project ini.</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
