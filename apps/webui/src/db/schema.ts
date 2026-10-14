import { sqliteTable, text, integer, primaryKey, index, uniqueIndex } from 'drizzle-orm/sqlite-core';
import type { AdapterAccountType } from 'next-auth/adapters';

// ── Auth.js / NextAuth Tables ──
export const users = sqliteTable('user', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name'),
  email: text('email').unique(),
  emailVerified: integer('emailVerified', { mode: 'timestamp_ms' }),
  image: text('image'),
  githubUsername: text('github_username'),
  role: text('role').default('developer'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const accounts = sqliteTable(
  'account',
  {
    userId: text('userId')
      .notNull()
      .references(() => users.id, { onDelete: 'cascade' }),
    type: text('type').$type<AdapterAccountType>().notNull(),
    provider: text('provider').notNull(),
    providerAccountId: text('providerAccountId').notNull(),
    refresh_token: text('refresh_token'),
    access_token: text('access_token'),
    expires_at: integer('expires_at'),
    token_type: text('token_type'),
    scope: text('scope'),
    id_token: text('id_token'),
    session_state: text('session_state'),
  },
  (account) => ({
    compoundKey: primaryKey({
      columns: [account.provider, account.providerAccountId],
    }),
  })
);

export const sessions = sqliteTable('session', {
  sessionToken: text('sessionToken').primaryKey(),
  userId: text('userId')
    .notNull()
    .references(() => users.id, { onDelete: 'cascade' }),
  expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
});

export const verificationTokens = sqliteTable(
  'verificationToken',
  {
    identifier: text('identifier').notNull(),
    token: text('token').notNull(),
    expires: integer('expires', { mode: 'timestamp_ms' }).notNull(),
  },
  (vt) => ({
    compoundKey: primaryKey({ columns: [vt.identifier, vt.token] }),
  })
);

// ── Team & Role Steering Tables ──
export const teams = sqliteTable('teams', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  slug: text('slug').notNull().unique(),
  githubOrg: text('github_org'),
  description: text('description'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const teamMembers = sqliteTable('team_members', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').notNull().references(() => teams.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  role: text('role').notNull().default('developer'),
  githubUsername: text('github_username'),
  assignedAt: integer('assigned_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const projects = sqliteTable('projects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  teamId: text('team_id').references(() => teams.id, { onDelete: 'cascade' }),
  name: text('name').notNull(),
  githubRepo: text('github_repo'),
  trelloBoardId: text('trello_board_id'),
  playbookPath: text('playbook_path').default('.opencode/docs/playbook-template.md'),
  openkbPath: text('openkb_path').default('.openkb'),
  createdAt: integer('created_at', { mode: 'timestamp' }).$defaultFn(() => new Date()),
});

export const workspaces = sqliteTable('workspaces', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  name: text('name').notNull(),
  operatorGithubId: text('operator_github_id').notNull(),
  operatorOrganizationId: text('operator_organization_id'),
  sourceType: text('source_type').notNull().default('personal'),
  sourceGithubId: text('source_github_id'),
  sourceGithubLogin: text('source_github_login'),
  sourceStatus: text('source_status').notNull().default('pending'),
  createdByGithubId: text('created_by_github_id').notNull(),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  operatorIndex: index('workspaces_operator_idx').on(table.operatorGithubId),
  sourceIndex: index('workspaces_source_idx').on(table.sourceType, table.sourceGithubId),
}));

export const workspaceMembers = sqliteTable('workspace_members', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  githubUserId: text('github_user_id').notNull(),
  role: text('role').notNull().default('member'),
  status: text('status').notNull().default('active'),
  invitedByGithubId: text('invited_by_github_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  workspaceMemberUnique: uniqueIndex('workspace_members_workspace_user_unique').on(table.workspaceId, table.githubUserId),
  workspaceIndex: index('workspace_members_workspace_idx').on(table.workspaceId),
  userIndex: index('workspace_members_user_idx').on(table.userId),
}));

export const sourceAuthorizations = sqliteTable('source_authorizations', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  sourceType: text('source_type').notNull(),
  sourceGithubId: text('source_github_id'),
  sourceGithubLogin: text('source_github_login'),
  installationId: text('installation_id'),
  status: text('status').notNull().default('pending'),
  approvedByGithubId: text('approved_by_github_id'),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  revokedAt: integer('revoked_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  workspaceIndex: index('source_authorizations_workspace_idx').on(table.workspaceId),
  installationIndex: index('source_authorizations_installation_idx').on(table.installationId),
}));

export const workspaceInstallations = sqliteTable('workspace_installations', {
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  installationId: text('installation_id').notNull(),
  accountLogin: text('account_login').notNull(),
  accountType: text('account_type').notNull(),
  connectedAt: integer('connected_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  primaryKey: primaryKey({ columns: [table.workspaceId, table.installationId] }),
  installationIndex: index('workspace_installations_id_idx').on(table.installationId),
}));

export const workspaceRepositories = sqliteTable('workspace_repositories', {
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  repositoryId: text('repository_id').notNull(),
  installationId: text('installation_id').notNull(),
  fullName: text('full_name').notNull(),
  isPrivate: integer('is_private', { mode: 'boolean' }).notNull(),
  defaultBranch: text('default_branch'),
  sourceType: text('source_type').notNull(),
  contentPath: text('content_path').notNull(),
}, (table) => ({
  primaryKey: primaryKey({ columns: [table.workspaceId, table.repositoryId] }),
}));

export const workspaceProjects = sqliteTable('workspace_projects', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  repositoryId: text('repository_id').notNull(),
  installationId: text('installation_id').notNull(),
  fullName: text('full_name').notNull(),
  status: text('status').notNull().default('candidate'),
  sourceKinds: text('source_kinds').notNull().default('project'),
  openkbPath: text('openkb_path'),
  defaultBranch: text('default_branch'),
  priorityScore: integer('priority_score').notNull().default(0),
  discoveredAt: integer('discovered_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  approvedAt: integer('approved_at', { mode: 'timestamp' }),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  workspaceRepository: index('workspace_projects_repo_idx').on(table.workspaceId, table.repositoryId),
  workspaceStatus: index('workspace_projects_status_idx').on(table.workspaceId, table.status),
  workspaceRepositoryUnique: uniqueIndex('workspace_projects_workspace_repo_unique').on(table.workspaceId, table.repositoryId),
}));

export const workspaceContextDocuments = sqliteTable('workspace_context_documents', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull().references(() => workspaceProjects.id, { onDelete: 'cascade' }),
  sourceKind: text('source_kind').notNull(),
  path: text('path').notNull(),
  ref: text('ref'),
  commitSha: text('commit_sha'),
  content: text('content').notNull(),
  retrievedAt: integer('retrieved_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  projectPath: uniqueIndex('workspace_context_documents_project_path_unique').on(table.projectId, table.path),
  projectIndex: index('workspace_context_documents_project_idx').on(table.projectId),
}));

export const workspaceIndexRuns = sqliteTable('workspace_index_runs', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  projectId: text('project_id').notNull().references(() => workspaceProjects.id, { onDelete: 'cascade' }),
  kind: text('kind').notNull(),
  status: text('status').notNull().default('queued'),
  ref: text('ref'),
  commitSha: text('commit_sha'),
  generation: text('generation'),
  error: text('error'),
  requestedAt: integer('requested_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  finishedAt: integer('finished_at', { mode: 'timestamp' }),
}, (table) => ({
  projectIndex: index('workspace_index_runs_project_idx').on(table.projectId),
}));

// ── Coupons & Promotional Discounts ──
export const coupons = sqliteTable('coupons', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  code: text('code').notNull().unique(),
  discountType: text('discount_type').notNull().default('percent'), // 'percent' | 'fixed'
  discountValue: integer('discount_value').notNull().default(20),
  maxUses: integer('max_uses').default(100),
  usedCount: integer('used_count').default(0),
  expiresAt: integer('expires_at', { mode: 'timestamp' }),
  status: text('status').notNull().default('active'), // 'active' | 'expired'
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
});

// ── Billing Transactions (Midtrans + Stripe) ──
export const billingTransactions = sqliteTable('billing_transactions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  gateway: text('gateway').notNull(), // 'midtrans' | 'stripe' | 'manual'
  gatewayTransactionId: text('gateway_transaction_id'),
  amount: integer('amount').notNull(),
  currency: text('currency').notNull().default('IDR'), // 'IDR' | 'USD'
  paymentType: text('payment_type').default('qris'), // 'qris', 'bank_transfer', 'credit_card'
  status: text('status').notNull().default('pending'), // 'pending', 'settlement', 'expire', 'failed'
  itemType: text('item_type').notNull().default('subscription'), // 'subscription', 'agent_container'
  couponCode: text('coupon_code'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  settledAt: integer('settled_at', { mode: 'timestamp' }),
}, (table) => ({
  userIndex: index('billing_transactions_user_idx').on(table.userId),
  workspaceIndex: index('billing_transactions_workspace_idx').on(table.workspaceId),
}));

// ── Affiliate & Referrals ──
export const affiliateCommissions = sqliteTable('affiliate_commissions', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  affiliateUserId: text('affiliate_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  referredUserId: text('referred_user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  transactionId: text('transaction_id').references(() => billingTransactions.id),
  commissionAmount: integer('commission_amount').notNull().default(0),
  commissionRate: integer('commission_rate').notNull().default(20), // 20%
  status: text('status').notNull().default('pending'), // 'pending', 'approved', 'paid'
  paidAt: integer('paid_at', { mode: 'timestamp' }),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  affiliateIndex: index('affiliate_commissions_affiliate_idx').on(table.affiliateUserId),
}));

// ── Agent Containers (Shared Docker Hosting Fleet for Hermes & OpenClaw) ──
export const agentContainers = sqliteTable('agent_containers', {
  id: text('id').primaryKey().$defaultFn(() => crypto.randomUUID()),
  workspaceId: text('workspace_id').notNull().references(() => workspaces.id, { onDelete: 'cascade' }),
  userId: text('user_id').notNull().references(() => users.id, { onDelete: 'cascade' }),
  agentType: text('agent_type').notNull().default('hermes-whatsapp'), // 'hermes-whatsapp' | 'openclaw'
  dockerContainerId: text('docker_container_id'),
  dockerHostServer: text('docker_host_server').default('srv1.konxc.space'),
  assignedPort: integer('assigned_port'),
  status: text('status').notNull().default('provisioning'), // 'provisioning', 'running', 'stopped', 'error'
  whatsappConnected: integer('whatsapp_connected', { mode: 'boolean' }).default(false),
  whatsappQrCode: text('whatsapp_qr_code'),
  allocatedCpu: text('allocated_cpu').default('1.0'),
  allocatedRam: text('allocated_ram').default('1GB'),
  isManualProvisioned: integer('is_manual_provisioned', { mode: 'boolean' }).default(false),
  provisionedByAdminId: text('provisioned_by_admin_id'),
  createdAt: integer('created_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
  updatedAt: integer('updated_at', { mode: 'timestamp' }).notNull().$defaultFn(() => new Date()),
}, (table) => ({
  workspaceIndex: index('agent_containers_workspace_idx').on(table.workspaceId),
  userIndex: index('agent_containers_user_idx').on(table.userId),
}));

