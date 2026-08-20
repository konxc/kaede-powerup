'use client';

import { useState } from 'react';
import { PageHeader } from '@/components/layout/page-header';
import { Badge } from '@/components/ui/badge';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import {
  Dialog,
  DialogContent,
  DialogDescription,
  DialogFooter,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
} from '@/components/ui/dialog';
import { Input } from '@/components/ui/input';
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from '@/components/ui/select';
import {
  Table,
  TableBody,
  TableCell,
  TableHead,
  TableHeader,
  TableRow,
} from '@/components/ui/table';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { getRoleDefinitions } from '@/lib/playbook';
import type { RoleDefinition } from '@/lib/types';
import { Plus, Pencil, Trash2 } from 'lucide-react';

const MOCK_MEMBERS = [
  {
    id: '1',
    githubUsername: 'sandikodev',
    name: 'Sandikodev',
    roles: [{ role: 'tech-lead', projectName: 'KAEDE Power-Up' }],
    avatarUrl: 'https://avatars.githubusercontent.com/u/1?v=4',
  },
  {
    id: '2',
    githubUsername: 'user1',
    name: 'User 1',
    roles: [{ role: 'developer', projectName: 'KAEDE Power-Up' }],
    avatarUrl: 'https://avatars.githubusercontent.com/u/2?v=4',
  },
  {
    id: '3',
    githubUsername: 'user2',
    name: 'User 2',
    roles: [{ role: 'product-analyst', projectName: 'Digital Workspace' }],
    avatarUrl: 'https://avatars.githubusercontent.com/u/3?v=4',
  },
];

export default function TeamsPage() {
  const [members] = useState(MOCK_MEMBERS);
  const [roles] = useState<RoleDefinition[]>(getRoleDefinitions());
  const [showAddDialog, setShowAddDialog] = useState(false);

  return (
    <div className="container mx-auto px-4">
      <PageHeader
        title="Teams"
        description="Kelola anggota tim dan role assignments"
        actions={
          <Dialog open={showAddDialog} onOpenChange={setShowAddDialog}>
            <DialogTrigger asChild>
              <Button>
                <Plus className="size-4 mr-2" />
                Add Member
              </Button>
            </DialogTrigger>
            <DialogContent>
              <DialogHeader>
                <DialogTitle>Add Team Member</DialogTitle>
                <DialogDescription>
                  Tambahkan anggota tim baru ke dalam project.
                </DialogDescription>
              </DialogHeader>
              <div className="grid gap-4 py-4">
                <div className="grid gap-2">
                  <label htmlFor="username" className="text-sm font-medium">
                    GitHub Username
                  </label>
                  <Input id="username" placeholder="username" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="name" className="text-sm font-medium">
                    Name
                  </label>
                  <Input id="name" placeholder="Full name" />
                </div>
                <div className="grid gap-2">
                  <label htmlFor="role" className="text-sm font-medium">
                    Role
                  </label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select role" />
                    </SelectTrigger>
                    <SelectContent>
                      {roles.map((role) => (
                        <SelectItem key={role.id} value={role.id}>
                          {role.name}
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>
              </div>
              <DialogFooter>
                <Button variant="outline" onClick={() => setShowAddDialog(false)}>
                  Cancel
                </Button>
                <Button onClick={() => setShowAddDialog(false)}>
                  Add Member
                </Button>
              </DialogFooter>
            </DialogContent>
          </Dialog>
        }
      />

      <Card>
        <CardContent className="p-0">
          <Table>
            <TableHeader>
              <TableRow>
                <TableHead>Member</TableHead>
                <TableHead>GitHub</TableHead>
                <TableHead>Role</TableHead>
                <TableHead>Project</TableHead>
                <TableHead className="text-right">Actions</TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {members.map((member) => (
                <TableRow key={member.id}>
                  <TableCell>
                    <div className="flex items-center gap-3">
                      <Avatar className="size-8">
                        <AvatarImage src={member.avatarUrl} alt={member.name} />
                        <AvatarFallback>{member.name.slice(0, 2).toUpperCase()}</AvatarFallback>
                      </Avatar>
                      <span className="font-medium">{member.name}</span>
                    </div>
                  </TableCell>
                  <TableCell>
                    <a
                      href={`https://github.com/${member.githubUsername}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-primary underline-offset-4 hover:underline"
                    >
                      @{member.githubUsername}
                    </a>
                  </TableCell>
                  <TableCell>
                    <div className="flex gap-1">
                      {member.roles.map((r) => {
                        const role = roles.find((role) => role.id === r.role);
                        return (
                          <Badge key={r.role} variant="secondary">
                            {role?.name || r.role}
                          </Badge>
                        );
                      })}
                    </div>
                  </TableCell>
                  <TableCell className="text-muted-foreground">
                    {member.roles.map((r) => r.projectName).join(', ')}
                  </TableCell>
                  <TableCell className="text-right">
                    <Button variant="ghost" size="icon" className="size-8">
                      <Pencil className="size-4" />
                    </Button>
                    <Button variant="ghost" size="icon" className="size-8 text-destructive">
                      <Trash2 className="size-4" />
                    </Button>
                  </TableCell>
                </TableRow>
              ))}
            </TableBody>
          </Table>
        </CardContent>
      </Card>
    </div>
  );
}
