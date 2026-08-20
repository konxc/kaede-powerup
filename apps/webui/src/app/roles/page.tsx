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
