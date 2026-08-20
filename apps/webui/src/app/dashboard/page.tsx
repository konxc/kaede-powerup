'use client';

import { useState, useEffect } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { StatCard } from '@/components/layout/stat-card';
import { Badge } from '@/components/ui/badge';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { getRoleDefinitions, getAccessMatrix } from '@/lib/playbook';
import type { RoleDefinition, AccessMatrixEntry } from '@/lib/types';
import { Shield, Key, Layers } from 'lucide-react';

function getPermissionBadge(permission: string) {
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

export default function DashboardPage() {
  const [roles, setRoles] = useState<RoleDefinition[]>([]);
  const [accessMatrix, setAccessMatrix] = useState<AccessMatrixEntry[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    setRoles(getRoleDefinitions());
    setAccessMatrix(getAccessMatrix());
    setLoading(false);
  }, []);

  if (loading) {
    return (
      <div className="container mx-auto px-4">
        <PageHeader title="Dashboard" description="Loading..." />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4">
      <PageHeader
        title="Dashboard"
        description="Overview team roles dan access matrix"
      />

      <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3 mb-8">
        <StatCard
          title="Role Definitions"
          value={roles.length}
          icon={<Shield className="size-4" />}
        />
        <StatCard
          title="Access Matrix Entries"
          value={accessMatrix.length}
          icon={<Key className="size-4" />}
        />
        <StatCard
          title="Resource Categories"
          value={7}
          icon={<Layers className="size-4" />}
        />
      </div>

      <Card>
        <CardHeader>
          <CardTitle>Access Matrix</CardTitle>
          <p className="text-sm text-muted-foreground">
            Role → Resource permission mapping
          </p>
        </CardHeader>
        <CardContent>
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Role</TableHead>
                <TableHead>Source Code</TableHead>
                <TableHead>Playbook</TableHead>
                <TableHead>Trello Sprint</TableHead>
                <TableHead>Trello Roadmap</TableHead>
                <TableHead>Staging</TableHead>
                <TableHead>Production</TableHead>
                <TableHead>Database</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {accessMatrix.map((entry) => {
                const role = roles.find((r) => r.id === entry.role);
                return (
                  <TableRow key={entry.role}>
                    <TableCell className="font-medium">
                      {role?.name || entry.role}
                    </TableCell>
                    <TableCell>{getPermissionBadge(entry.resources.sourceCode)}</TableCell>
                    <TableCell>{getPermissionBadge(entry.resources.playbook)}</TableCell>
                    <TableCell>{getPermissionBadge(entry.resources.trelloSprint)}</TableCell>
                    <TableCell>{getPermissionBadge(entry.resources.trelloRoadmap)}</TableCell>
                    <TableCell>{getPermissionBadge(entry.resources.staging)}</TableCell>
                    <TableCell>{getPermissionBadge(entry.resources.production)}</TableCell>
                    <TableCell>{getPermissionBadge(entry.resources.database)}</TableCell>
                  </TableRow>
                );
              })}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
