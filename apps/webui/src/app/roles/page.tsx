import { and, eq, inArray } from 'drizzle-orm';
import { FileKey2, Shield } from 'lucide-react';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { workspaceContextDocuments, workspaceProjects, workspaces } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';

export default async function RolesPage() {
  const session = await auth();
  if (!session?.user?.id) return <div className="container mx-auto px-4"><PageHeader title="Roles" description="Sign in untuk melihat policy role dari workspace Anda." /></div>;
  const workspaceIds = await getAccessibleWorkspaceIdsForUser(session.user.id);
  const projects = workspaceIds.length
    ? await db.select({ project: workspaceProjects, workspaceName: workspaces.name })
        .from(workspaceProjects)
        .innerJoin(workspaces, eq(workspaceProjects.workspaceId, workspaces.id))
        .where(and(inArray(workspaceProjects.workspaceId, workspaceIds), eq(workspaceProjects.status, 'active')))
    : [];
  const ids = projects.map(({ project }) => project.id);
  const documents = ids.length ? await db.select().from(workspaceContextDocuments).where(and(eq(workspaceContextDocuments.sourceKind, 'playbook'), inArray(workspaceContextDocuments.projectId, ids))) : [];

  return (
    <div className="container mx-auto px-4">
      <PageHeader title="Roles" description="Policy role yang bersumber dari playbook project aktif." />
      {!projects.length ? <p className="rounded-md border border-dashed border-border px-4 py-8 text-sm text-muted-foreground">Belum ada project aktif yang memiliki playbook ter-index.</p> : null}
      {projects.map(({ project, workspaceName }) => {
        const projectDocuments = documents.filter((document) => document.projectId === project.id);
        return (
          <Card key={project.id} className="mb-6">
            <CardHeader><CardTitle className="flex items-center gap-2"><Shield className="size-4" /> {project.fullName}</CardTitle><p className="text-sm text-muted-foreground">{workspaceName} · role policy source</p></CardHeader>
            <CardContent className="space-y-3">
              {projectDocuments.length ? projectDocuments.map((document) => <details key={document.id} className="rounded-md border border-border"><summary className="flex cursor-pointer items-center gap-2 px-4 py-3 text-sm font-medium"><FileKey2 className="size-4" />{document.path}</summary><pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap border-t border-border p-4 text-xs">{document.content}</pre></details>) : <p className="text-sm text-muted-foreground">Playbook project ini belum ter-index.</p>}
            </CardContent>
          </Card>
        );
      })}
    </div>
  );
}
/* Legacy mockup retained temporarily for migration reference.
'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Separator } from '@/components/ui/separator';
import { getRoleDefinitions } from '@/lib/playbook';
import type { RoleDefinition } from '@/lib/types';
import { cn } from '@/lib/utils';
import { Lock, Github, Bot } from 'lucide-react';

function PermissionBadge({ permission }: { permission: string }) {
  const variant = (() => {
    switch (permission) {
      case 'admin': return 'admin' as const;
      case 'write':
      case 'edit': return 'write' as const;
      case 'read': return 'read' as const;
      default: return 'secondary' as const;
    }
  })();
  return <Badge variant={variant}>{permission}</Badge>;
}

export default function RolesPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [selectedRole, setSelectedRole] = useState<RoleDefinition | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const data = getRoleDefinitions();
    setRoles(data);
    setSelectedRole(data[0] ?? null);
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <PageHeader title="Roles" description="Loading..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <PageHeader
        title="Roles"
        description="Definisi role dan akses berdasarkan Playbook"
      />

      <div className="grid gap-6 lg:grid-cols-3">
        <div className="lg:col-span-1">
          <Card>
            <CardHeader>
              <CardTitle className="text-base">Role List</CardTitle>
            </CardHeader>
            <CardContent className="p-0">
              <div className="divide-y">
                {roles.map((role) => (
                  <button
                    key={role.id}
                    onClick={() => setSelectedRole(role)}
                    className={cn(
                      'w-full px-6 py-4 text-left transition-colors hover:bg-accent/50',
                      selectedRole?.id === role.id && 'bg-accent/50 border-l-2 border-primary'
                    )}
                  >
                    <div className="font-medium">{role.name}</div>
                    <div className="text-sm text-muted-foreground mt-1 line-clamp-1">
                      {role.description}
                    </div>
                  </button>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        <div className="lg:col-span-2">
          {selectedRole ? (
            <Card>
              <CardHeader>
                <CardTitle>{selectedRole.name}</CardTitle>
                <p className="text-sm text-muted-foreground">
                  {selectedRole.description}
                </p>
              </CardHeader>
              <CardContent className="space-y-6">
                <div className="grid gap-6 sm:grid-cols-2">
                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Lock className="size-4 text-primary" />
                      Trello Access
                    </div>
                    <div className="space-y-2">
                      {selectedRole.trelloAccess.map((access, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <span className="text-sm">{access.resource}</span>
                          <PermissionBadge permission={access.permission} />
                        </div>
                      ))}
                    </div>
                  </div>

                  <div className="space-y-3">
                    <div className="flex items-center gap-2 text-sm font-medium">
                      <Github className="size-4 text-primary" />
                      GitHub Access
                    </div>
                    <div className="space-y-2">
                      {selectedRole.githubAccess.map((access, i) => (
                        <div
                          key={i}
                          className="flex items-center justify-between rounded-lg border p-3"
                        >
                          <span className="text-sm">{access.resource}</span>
                          <PermissionBadge permission={access.permission} />
                        </div>
                      ))}
                    </div>
                  </div>
                </div>

                <Separator />

                <div className="space-y-3">
                  <div className="flex items-center gap-2 text-sm font-medium">
                    <Bot className="size-4 text-primary" />
                    AI Instructions
                  </div>
                  <ul className="space-y-2">
                    {selectedRole.aiInstructions.map((instruction, i) => (
                      <li key={i} className="flex items-start gap-2 text-sm text-muted-foreground">
                        <span className="text-primary mt-0.5">•</span>
                        {instruction}
                      </li>
                    ))}
                  </ul>
                </div>
              </CardContent>
            </Card>
          ) : (
            <Card className="flex items-center justify-center min-h-[400px]">
              <CardContent className="text-center">
                <Lock className="size-12 text-muted-foreground/50 mx-auto mb-4" />
                <p className="text-muted-foreground">Pilih role dari daftar untuk melihat detail</p>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </div>
  );
}
*/
