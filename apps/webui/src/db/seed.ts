import { db } from './index';
import {
  users,
  workspaces,
  workspaceMembers,
  workspaceProjects,
  agentContainers,
  billingTransactions,
  coupons,
  affiliateCommissions,
} from './schema';
import { eq } from 'drizzle-orm';
import {
  buildUser,
  buildWorkspace,
  buildWorkspaceMember,
  buildWorkspaceProject,
  buildAgentContainer,
  buildBillingTransaction,
  buildCoupon,
  buildAffiliateCommission,
} from './factories';

export async function seedDatabase() {
  console.log('🌱 Starting KAEDE production seed...');

  // 1. Seed Core Identities
  let [adminUser] = await db.select().from(users).where(eq(users.email, 'admin@konxc.space')).limit(1);
  if (!adminUser) {
    const data = buildUser({
      name: 'Sandiko',
      email: 'admin@konxc.space',
      githubUsername: 'sandikodev',
      role: 'admin',
    });
    [adminUser] = await db.insert(users).values(data).returning();
    console.log('  ✔ Created Landlord Admin:', adminUser.email);
  }

  let [guruUser] = await db.select().from(users).where(eq(users.email, 'guru@smauii.sch.id')).limit(1);
  if (!guruUser) {
    const data = buildUser({
      name: 'Drs. H. Mulyono',
      email: 'guru@smauii.sch.id',
      githubUsername: 'smauii-admin',
      role: 'developer',
    });
    [guruUser] = await db.insert(users).values(data).returning();
    console.log('  ✔ Created Client User:', guruUser.email);
  }

  // 2. Seed Workspaces
  let [koneksiWs] = await db.select().from(workspaces).where(eq(workspaces.name, 'PT Koneksi Jaringan Indonesia')).limit(1);
  if (!koneksiWs) {
    const data = buildWorkspace({
      name: 'PT Koneksi Jaringan Indonesia',
      operatorGithubId: adminUser.id,
      operatorOrganizationId: 'konxc',
      sourceType: 'organization',
      sourceGithubLogin: 'konxc',
      sourceStatus: 'active',
      createdByGithubId: adminUser.id,
    });
    [koneksiWs] = await db.insert(workspaces).values(data).returning();
    console.log('  ✔ Created Workspace:', koneksiWs.name);
  }

  let [smauiiWs] = await db.select().from(workspaces).where(eq(workspaces.name, 'SMA UII Yogyakarta')).limit(1);
  if (!smauiiWs) {
    const data = buildWorkspace({
      name: 'SMA UII Yogyakarta',
      operatorGithubId: guruUser.id,
      operatorOrganizationId: 'smauii',
      sourceType: 'organization',
      sourceGithubLogin: 'sma-uii',
      sourceStatus: 'active',
      createdByGithubId: guruUser.id,
    });
    [smauiiWs] = await db.insert(workspaces).values(data).returning();
    console.log('  ✔ Created Workspace:', smauiiWs.name);
  }

  // 3. Seed Workspace Memberships (RBAC Pivot)
  const existingMembers = await db.select().from(workspaceMembers);
  if (!existingMembers.some((m) => m.workspaceId === koneksiWs.id && m.userId === adminUser.id)) {
    await db.insert(workspaceMembers).values(
      buildWorkspaceMember(koneksiWs.id, adminUser.id, {
        role: 'operator-admin',
        githubUserId: adminUser.githubUsername || adminUser.id,
      })
    );
  }
  if (!existingMembers.some((m) => m.workspaceId === smauiiWs.id && m.userId === guruUser.id)) {
    await db.insert(workspaceMembers).values(
      buildWorkspaceMember(smauiiWs.id, guruUser.id, {
        role: 'operator-admin',
        githubUserId: guruUser.githubUsername || guruUser.id,
      })
    );
  }
  if (!existingMembers.some((m) => m.workspaceId === smauiiWs.id && m.userId === adminUser.id)) {
    await db.insert(workspaceMembers).values(
      buildWorkspaceMember(smauiiWs.id, adminUser.id, {
        role: 'landlord',
        githubUserId: adminUser.githubUsername || adminUser.id,
      })
    );
  }
  console.log('  ✔ Seeded RBAC memberships for both workspaces');

  // 4. Seed Workspace Projects
  const existingProjects = await db.select().from(workspaceProjects);
  if (!existingProjects.some((p) => p.workspaceId === koneksiWs.id && p.repositoryId === 'repo-kaede-powerup')) {
    await db.insert(workspaceProjects).values(
      buildWorkspaceProject(koneksiWs.id, {
        repositoryId: 'repo-kaede-powerup',
        fullName: 'konxc/kaede-powerup',
        status: 'active',
        priorityScore: 100,
        openkbPath: '.openkb',
      })
    );
  }
  if (!existingProjects.some((p) => p.workspaceId === koneksiWs.id && p.repositoryId === 'repo-vision-ecosystem')) {
    await db.insert(workspaceProjects).values(
      buildWorkspaceProject(koneksiWs.id, {
        repositoryId: 'repo-vision-ecosystem',
        fullName: 'konxc/vision-ecosystem',
        status: 'active',
        priorityScore: 80,
        openkbPath: '.openkb',
      })
    );
  }
  if (!existingProjects.some((p) => p.workspaceId === smauiiWs.id && p.repositoryId === 'repo-smauii-academic')) {
    await db.insert(workspaceProjects).values(
      buildWorkspaceProject(smauiiWs.id, {
        repositoryId: 'repo-smauii-academic',
        fullName: 'smauii/academic-portal',
        status: 'active',
        priorityScore: 90,
        openkbPath: '.openkb',
      })
    );
  }
  console.log('  ✔ Seeded living workspace projects');

  // 5. Seed Agent Container Fleet
  const existingContainers = await db.select().from(agentContainers);
  if (!existingContainers.some((c) => c.dockerContainerId === 'cnt-openclaw-konxc')) {
    await db.insert(agentContainers).values(
      buildAgentContainer(koneksiWs.id, adminUser.id, {
        agentType: 'openclaw',
        dockerContainerId: 'cnt-openclaw-konxc',
        dockerHostServer: 'srv1.konxc.space',
        assignedPort: 3048,
        status: 'running',
        allocatedCpu: '1.0',
        allocatedRam: '1GB',
      })
    );
  }
  if (!existingContainers.some((c) => c.dockerContainerId === 'cnt-hermes-smauii')) {
    await db.insert(agentContainers).values(
      buildAgentContainer(smauiiWs.id, guruUser.id, {
        agentType: 'hermes-whatsapp',
        dockerContainerId: 'cnt-hermes-smauii',
        dockerHostServer: 'srv1.konxc.space',
        assignedPort: 3044,
        status: 'running',
        whatsappConnected: true,
        allocatedCpu: '1.0',
        allocatedRam: '1GB',
      })
    );
  }
  console.log('  ✔ Seeded Docker container fleet for Hermes & OpenClaw');

  // 6. Seed Billing Transactions
  const existingBilling = await db.select().from(billingTransactions);
  if (existingBilling.length === 0) {
    await db.insert(billingTransactions).values([
      buildBillingTransaction(koneksiWs.id, adminUser.id, {
        gateway: 'midtrans',
        amount: 749000,
        currency: 'IDR',
        paymentType: 'qris',
        status: 'settlement',
        itemType: 'subscription',
      }),
      buildBillingTransaction(smauiiWs.id, guruUser.id, {
        gateway: 'midtrans',
        amount: 250000,
        currency: 'IDR',
        paymentType: 'bank_transfer',
        status: 'settlement',
        itemType: 'agent_container',
      }),
      buildBillingTransaction(koneksiWs.id, adminUser.id, {
        gateway: 'stripe',
        amount: 4900,
        currency: 'USD',
        paymentType: 'credit_card',
        status: 'settlement',
        itemType: 'subscription',
      }),
    ]);
    console.log('  ✔ Seeded live billing transactions (Midtrans QRIS & Stripe USD)');
  }

  // 7. Seed Coupons
  const existingCoupons = await db.select().from(coupons);
  if (existingCoupons.length === 0) {
    await db.insert(coupons).values([
      buildCoupon({ code: 'LAUNCH50', discountValue: 50, maxUses: 100, usedCount: 24 }),
      buildCoupon({ code: 'SMAUII2026', discountValue: 100, maxUses: 10, usedCount: 1 }),
    ]);
    console.log('  ✔ Seeded commercial coupons (LAUNCH50 & SMAUII2026)');
  }

  // 8. Seed Affiliate Commissions
  const existingAffiliates = await db.select().from(affiliateCommissions);
  if (existingAffiliates.length === 0) {
    await db.insert(affiliateCommissions).values([
      buildAffiliateCommission(adminUser.id, guruUser.id, {
        commissionAmount: 149800,
        commissionRate: 20,
        status: 'approved',
      }),
      buildAffiliateCommission(adminUser.id, guruUser.id, {
        commissionAmount: 50000,
        commissionRate: 20,
        status: 'paid',
        paidAt: new Date(),
      }),
    ]);
    console.log('  ✔ Seeded affiliate commissions ledger');
  }

  console.log('✨ Seed completed successfully! Database is production-grade populated.');
}

// Allow direct execution: `bun src/db/seed.ts`
if (import.meta.main) {
  seedDatabase()
    .then(() => process.exit(0))
    .catch((err) => {
      console.error('❌ Seeding failed:', err);
      process.exit(1);
    });
}
