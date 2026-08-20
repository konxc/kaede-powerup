export interface TeamMember {
  id: string;
  githubUsername: string;
  name: string;
  email?: string;
  avatarUrl?: string;
  roles: ProjectRole[];
  joinedAt: string;
}

export interface ProjectRole {
  projectId: string;
  projectName: string;
  role: Role;
  assignedAt: string;
}

export type Role = 'project-manager' | 'tech-lead' | 'developer' | 'product-analyst' | 'stakeholder';

export interface RoleDefinition {
  id: Role;
  name: string;
  description: string;
  trelloAccess: RoleAccess[];
  githubAccess: RoleAccess[];
  aiInstructions: string[];
}

export interface RoleAccess {
  resource: string;
  permission: string;
  details?: string;
}

export interface Project {
  id: string;
  name: string;
  description: string;
  githubRepo?: string;
  playbookPath?: string;
  openkbPath?: string;
  members: TeamMember[];
  createdAt: string;
}

export interface PlaybookConfig {
  teamRoles: RoleDefinition[];
  sprintWorkflow: string[];
  conventions: Record<string, string>;
  accessMatrix: AccessMatrixEntry[];
}

export interface AccessMatrixEntry {
  role: Role;
  resources: {
    sourceCode: string;
    playbook: string;
    trelloSprint: string;
    trelloRoadmap: string;
    staging: string;
    production: string;
    database: string;
  };
}

export interface OpenKBConfig {
  glossary: Record<string, string>;
  references: { name: string; url: string }[];
  decisionLog: { date: string; decision: string; context: string }[];
}
