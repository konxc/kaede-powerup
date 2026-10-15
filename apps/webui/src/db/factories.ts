import crypto from 'node:crypto';
import type { InferInsertModel } from 'drizzle-orm';
import {
  users,
  workspaces,
  workspaceMembers,
  workspaceProjects,
  workspaceContextDocuments,
  agentContainers,
  billingTransactions,
  coupons,
  affiliateCommissions,
} from './schema';

export type UserInsert = InferInsertModel<typeof users>;
export type WorkspaceInsert = InferInsertModel<typeof workspaces>;
export type WorkspaceMemberInsert = InferInsertModel<typeof workspaceMembers>;
export type WorkspaceProjectInsert = InferInsertModel<typeof workspaceProjects>;
export type AgentContainerInsert = InferInsertModel<typeof agentContainers>;
export type BillingTransactionInsert = InferInsertModel<typeof billingTransactions>;
export type CouponInsert = InferInsertModel<typeof coupons>;
export type AffiliateCommissionInsert = InferInsertModel<typeof affiliateCommissions>;

export function buildUser(overrides: Partial<UserInsert> = {}): UserInsert {
  const id = overrides.id || crypto.randomUUID();
  return {
    id,
    name: overrides.name ?? 'Developer User',
    email: overrides.email ?? `user-${id.slice(0, 8)}@konxc.space`,
    githubUsername: overrides.githubUsername ?? `user_${id.slice(0, 6)}`,
    role: overrides.role ?? 'developer',
    emailVerified: overrides.emailVerified ?? new Date(),
    image: overrides.image ?? null,
    createdAt: overrides.createdAt ?? new Date(),
  };
}

export function buildWorkspace(overrides: Partial<WorkspaceInsert> = {}): WorkspaceInsert {
  const id = overrides.id || crypto.randomUUID();
  return {
    id,
    name: overrides.name ?? 'Default Workspace',
    operatorGithubId: overrides.operatorGithubId ?? 'sandikodev',
    operatorOrganizationId: overrides.operatorOrganizationId ?? 'konxc',
    sourceType: overrides.sourceType ?? 'organization',
    sourceGithubId: overrides.sourceGithubId ?? '12345678',
    sourceGithubLogin: overrides.sourceGithubLogin ?? 'konxc',
    sourceStatus: overrides.sourceStatus ?? 'active',
    createdByGithubId: overrides.createdByGithubId ?? 'sandikodev',
    createdAt: overrides.createdAt ?? new Date(),
  };
}

export function buildWorkspaceMember(
  workspaceId: string,
  userId: string,
  overrides: Partial<WorkspaceMemberInsert> = {}
): WorkspaceMemberInsert {
  return {
    id: overrides.id || crypto.randomUUID(),
    workspaceId,
    userId,
    githubUserId: overrides.githubUserId ?? 'sandikodev',
    role: overrides.role ?? 'member',
    status: overrides.status ?? 'active',
    invitedByGithubId: overrides.invitedByGithubId ?? 'sandikodev',
    createdAt: overrides.createdAt ?? new Date(),
  };
}

export function buildWorkspaceProject(
  workspaceId: string,
  overrides: Partial<WorkspaceProjectInsert> = {}
): WorkspaceProjectInsert {
  return {
    id: overrides.id || crypto.randomUUID(),
    workspaceId,
    repositoryId: overrides.repositoryId ?? 'repo-1001',
    installationId: overrides.installationId ?? 'inst-2001',
    fullName: overrides.fullName ?? 'konxc/kaede-powerup',
    status: overrides.status ?? 'active',
    sourceKinds: overrides.sourceKinds ?? 'project',
    openkbPath: overrides.openkbPath ?? '.openkb',
    defaultBranch: overrides.defaultBranch ?? 'main',
    priorityScore: overrides.priorityScore ?? 10,
    discoveredAt: overrides.discoveredAt ?? new Date(),
    approvedAt: overrides.approvedAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

export function buildAgentContainer(
  workspaceId: string,
  userId: string,
  overrides: Partial<AgentContainerInsert> = {}
): AgentContainerInsert {
  return {
    id: overrides.id || crypto.randomUUID(),
    workspaceId,
    userId,
    agentType: overrides.agentType ?? 'hermes-whatsapp',
    dockerContainerId: overrides.dockerContainerId ?? `cnt-${crypto.randomBytes(4).toString('hex')}`,
    dockerHostServer: overrides.dockerHostServer ?? 'srv1.konxc.space',
    assignedPort: overrides.assignedPort ?? 3044,
    status: overrides.status ?? 'running',
    whatsappConnected: overrides.whatsappConnected ?? true,
    whatsappQrCode: overrides.whatsappQrCode ?? null,
    allocatedCpu: overrides.allocatedCpu ?? '1.0',
    allocatedRam: overrides.allocatedRam ?? '1GB',
    isManualProvisioned: overrides.isManualProvisioned ?? false,
    provisionedByAdminId: overrides.provisionedByAdminId ?? null,
    createdAt: overrides.createdAt ?? new Date(),
    updatedAt: overrides.updatedAt ?? new Date(),
  };
}

export function buildBillingTransaction(
  workspaceId: string,
  userId: string,
  overrides: Partial<BillingTransactionInsert> = {}
): BillingTransactionInsert {
  return {
    id: overrides.id || crypto.randomUUID(),
    workspaceId,
    userId,
    gateway: overrides.gateway ?? 'midtrans',
    gatewayTransactionId: overrides.gatewayTransactionId ?? `TRX-${crypto.randomBytes(6).toString('hex').toUpperCase()}`,
    amount: overrides.amount ?? 749000,
    currency: overrides.currency ?? 'IDR',
    paymentType: overrides.paymentType ?? 'qris',
    status: overrides.status ?? 'settlement',
    itemType: overrides.itemType ?? 'subscription',
    couponCode: overrides.couponCode ?? null,
    createdAt: overrides.createdAt ?? new Date(),
    settledAt: overrides.settledAt ?? new Date(),
  };
}

export function buildCoupon(overrides: Partial<CouponInsert> = {}): CouponInsert {
  return {
    id: overrides.id || crypto.randomUUID(),
    code: overrides.code ?? 'LAUNCH50',
    discountType: overrides.discountType ?? 'percent',
    discountValue: overrides.discountValue ?? 50,
    maxUses: overrides.maxUses ?? 100,
    usedCount: overrides.usedCount ?? 12,
    expiresAt: overrides.expiresAt ?? null,
    status: overrides.status ?? 'active',
    createdAt: overrides.createdAt ?? new Date(),
  };
}

export function buildAffiliateCommission(
  affiliateUserId: string,
  referredUserId: string,
  overrides: Partial<AffiliateCommissionInsert> = {}
): AffiliateCommissionInsert {
  return {
    id: overrides.id || crypto.randomUUID(),
    affiliateUserId,
    referredUserId,
    transactionId: overrides.transactionId ?? null,
    commissionAmount: overrides.commissionAmount ?? 149800,
    commissionRate: overrides.commissionRate ?? 20,
    status: overrides.status ?? 'approved',
    paidAt: overrides.paidAt ?? null,
    createdAt: overrides.createdAt ?? new Date(),
  };
}
