import { z } from 'zod';

export const teamMemberSchema = z.object({
  name: z.string().min(2, 'Nama minimal 2 karakter'),
  githubUsername: z.string().min(1, 'Username GitHub wajib diisi'),
  email: z.string().email('Email tidak valid').optional(),
  role: z.enum(['project-manager', 'tech-lead', 'developer', 'product-analyst', 'stakeholder'], {
    errorMap: () => ({ message: 'Role tidak valid' }),
  }),
  projectId: z.string().optional(),
});

export const projectSchema = z.object({
  name: z.string().min(2, 'Nama project minimal 2 karakter'),
  githubRepo: z.string().optional(),
  trelloBoardId: z.string().optional(),
  playbookPath: z.string().default('.opencode/docs/playbook-template.md'),
  openkbPath: z.string().default('.openkb'),
});

export const roleAccessSchema = z.object({
  role: z.enum(['project-manager', 'tech-lead', 'developer', 'product-analyst', 'stakeholder']),
  resource: z.string(),
  permission: z.enum(['admin', 'write', 'read', 'comment', 'none', 'edit', 'view', 'triage']),
});

export type TeamMemberInput = z.infer<typeof teamMemberSchema>;
export type ProjectInput = z.infer<typeof projectSchema>;
export type RoleAccessInput = z.infer<typeof roleAccessSchema>;
