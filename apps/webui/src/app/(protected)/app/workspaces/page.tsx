import Link from 'next/link';
import { revalidatePath } from 'next/cache';
import { redirect } from 'next/navigation';
import { desc, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { workspaceMembers, workspaces } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Building2, Plus, ShieldCheck, ShieldAlert, FolderGit2, ArrowRight } from 'lucide-react';

async function createWorkspace(formData: FormData) {
  'use server';
  const session = await auth();
  if (!session?.user?.id) redirect('/login');

  const name = String(formData.get('name') || '').trim();
  if (name.length < 2 || name.length > 100) redirect('/app/workspaces?error=invalid-name');
  const sourceType = String(formData.get('targetType') || 'organization');
  const sourceGithubLogin = String(formData.get('targetGithubLogin') || '').trim() || null;

  const operatorGithubId = (session.user as any).githubId || session.user.id;
  const [workspace] = await db
    .insert(workspaces)
    .values({
      name,
      operatorGithubId,
      createdByGithubId: session.user.id,
      operatorOrganizationId: process.env.KAEDE_OPERATOR_ORGANIZATION_ID || null,
      sourceType,
      sourceGithubLogin,
      sourceStatus: 'pending',
    })
    .returning({ id: workspaces.id });

  await db.insert(workspaceMembers).values({
    workspaceId: workspace.id,
    userId: session.user.id,
    githubUserId: operatorGithubId,
    role: 'operator-admin',
    status: 'active',
  });

  revalidatePath('/app/workspaces');
  redirect('/app/workspaces');
}

export default async function WorkspacesPage() {
  const session = await auth();
  const githubUserId = session?.user ? ((session.user as any).githubId || session.user.id) : undefined;
  const accessibleWorkspaceIds = githubUserId ? await getAccessibleWorkspaceIdsForUser(githubUserId) : [];
  const ownedWorkspaces = accessibleWorkspaceIds.length
    ? await db
        .select()
        .from(workspaces)
        .where(inArray(workspaces.id, accessibleWorkspaceIds))
        .orderBy(desc(workspaces.createdAt))
    : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Workspaces Management</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Kelola ruang kerja organisasi, sekolah, atau agensi klien secara terisolasi.
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">
        {/* Workspace List */}
        <div className="lg:col-span-7 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="size-4 text-emerald-400" />
            Ruang Kerja Aktif ({ownedWorkspaces.length})
          </h2>

          {ownedWorkspaces.length ? (
            <div className="space-y-3">
              {ownedWorkspaces.map((workspace) => (
                <Card key={workspace.id} className="border-white/10 bg-[#0F172A]/70 hover:border-emerald-500/30 transition-all">
                  <CardContent className="p-5 flex flex-wrap items-center justify-between gap-4">
                    <div>
                      <Link href={`/workspaces/${workspace.id}`} className="font-bold text-white hover:text-emerald-400 text-sm flex items-center gap-2">
                        {workspace.name} <ArrowRight className="size-3 text-slate-500" />
                      </Link>
                      <p className="text-xs text-slate-400 mt-1">
                        Type: <code className="text-emerald-300">{workspace.sourceType}</code> · Login: <code className="text-slate-300">{workspace.sourceGithubLogin || 'belum diisi'}</code>
                      </p>
                    </div>
                    <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-[11px] font-medium bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                      <ShieldCheck className="size-3.5 text-emerald-400" />
                      Active Tenant
                    </span>
                  </CardContent>
                </Card>
              ))}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-xs text-slate-400">
              Belum ada workspace. Buat ruang kerja pertama Anda melalui formulir di samping.
            </div>
          )}
        </div>

        {/* Create Workspace Form */}
        <div className="lg:col-span-5">
          <Card className="border-white/10 bg-[#0F172A]/70 text-slate-200">
            <CardHeader className="pb-3 border-b border-white/5">
              <CardTitle className="text-white text-base">Buat Workspace Baru</CardTitle>
              <p className="text-xs text-slate-400">Tambahkan organisasi atau institusi baru untuk dihubungkan ke agen.</p>
            </CardHeader>
            <CardContent className="pt-4 space-y-4">
              <form action={createWorkspace} className="space-y-4">
                <div className="space-y-1.5 text-xs">
                  <label className="text-slate-300 font-medium">Nama Workspace</label>
                  <input
                    name="name"
                    required
                    minLength={2}
                    placeholder="e.g. SMA UII Yogyakarta / Brand Klien"
                    className="w-full h-9 rounded-lg border border-white/15 bg-white/5 px-3 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                  />
                </div>

                <div className="grid grid-cols-2 gap-3 text-xs">
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium">Tipe Sumber</label>
                    <select
                      name="targetType"
                      defaultValue="organization"
                      className="w-full h-9 rounded-lg border border-white/15 bg-slate-900 px-2 text-xs text-white focus:outline-none"
                    >
                      <option value="organization">GitHub Organization</option>
                      <option value="personal">Personal Account</option>
                      <option value="external_project">External Client</option>
                    </select>
                  </div>
                  <div className="space-y-1.5">
                    <label className="text-slate-300 font-medium">Target GitHub Org</label>
                    <input
                      name="targetGithubLogin"
                      placeholder="e.g. SMA-UII-Yogyakarta"
                      className="w-full h-9 rounded-lg border border-white/15 bg-white/5 px-3 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
                    />
                  </div>
                </div>

                <Button type="submit" className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 shadow-md shadow-emerald-500/20">
                  <Plus className="mr-1.5 size-4" /> Simpan & Inisialisasi
                </Button>
              </form>
            </CardContent>
          </Card>
        </div>
      </div>
    </div>
  );
}
