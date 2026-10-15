import Link from 'next/link';
import { inArray, eq } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { workspaces, workspaceMembers, users } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';
import { Button } from '@/components/ui/button';
import { Settings, ShieldCheck, Key, Users, Trash2, CheckCircle2, Building2 } from 'lucide-react';

export default async function SettingsPage() {
  const session = await auth();
  const githubUserId = (session?.user as any)?.githubId || session?.user?.id || '';
  const accessibleWorkspaceIds = githubUserId ? await getAccessibleWorkspaceIdsForUser(githubUserId) : [];

  let currentWorkspace: any = null;
  let members: any[] = [];

  try {
    if (accessibleWorkspaceIds.length) {
      const rows = await db
        .select()
        .from(workspaces)
        .where(inArray(workspaces.id, accessibleWorkspaceIds))
        .limit(1);
      currentWorkspace = rows[0] || null;

      if (currentWorkspace) {
        members = await db
          .select({
            id: workspaceMembers.id,
            role: workspaceMembers.role,
            status: workspaceMembers.status,
            githubUserId: workspaceMembers.githubUserId,
            userName: users.name,
            userEmail: users.email,
          })
          .from(workspaceMembers)
          .leftJoin(users, eq(workspaceMembers.userId, users.id))
          .where(eq(workspaceMembers.workspaceId, currentWorkspace.id));
      }
    }
  } catch (err) {
    console.warn('[SettingsPage] Failed to fetch workspace settings:', err);
  }

  const workspaceName = currentWorkspace?.name || 'Workspace Default';
  const workspaceSlug = currentWorkspace?.sourceGithubLogin || 'koneksi';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Workspace Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Pengaturan ruang kerja, anggota tim, peran hak akses (RBAC), dan token keamanan.
        </p>
      </div>

      <div className="space-y-6">
        {/* General Details */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Building2 className="size-4 text-emerald-400" />
            Informasi Umum Workspace
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Nama Workspace</label>
              <input
                defaultValue={workspaceName}
                className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-white focus:outline-none focus:border-emerald-400"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Organization / GitHub Slug</label>
              <input
                defaultValue={workspaceSlug}
                disabled
                className="w-full h-9 rounded-lg border border-white/10 bg-slate-900 px-3 text-slate-400 font-mono"
              />
            </div>
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20">
            Simpan Perubahan
          </Button>
        </div>

        {/* Team Members List (RBAC) */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-4">
          <div className="flex items-center justify-between pb-2 border-b border-white/10">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Users className="size-4 text-purple-400" />
              Anggota Tim & Hak Akses ({members.length})
            </h2>
            <Link href="/app/workspaces">
              <Button size="sm" variant="outline" className="border-white/10 text-xs h-7">
                Kelola Anggota
              </Button>
            </Link>
          </div>

          {members.length > 0 ? (
            <div className="divide-y divide-white/5 text-xs">
              {members.map((member) => (
                <div key={member.id} className="py-2.5 flex items-center justify-between">
                  <div>
                    <p className="font-bold text-white">{member.userName || member.userEmail || member.githubUserId}</p>
                    <p className="text-[11px] text-slate-400">@{member.githubUserId}</p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                    {member.role}
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <p className="text-xs text-slate-400">Belum ada anggota lain di ruang kerja ini.</p>
          )}
        </div>

        {/* API Tokens */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="size-4 text-sky-400" />
            Workspace Token & Webhook Secret
          </h2>
          <p className="text-xs text-slate-300">
            Digunakan untuk menghubungkan Antigravity CLI dan Trello Webhook ke konsol KAEDE.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex gap-2">
              <input
                type="password"
                defaultValue={currentWorkspace ? `kaede_sec_${currentWorkspace.id.replace(/-/g, '').slice(0, 24)}` : 'kaede_live_token'}
                readOnly
                className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-slate-300 focus:outline-none"
              />
              <Button variant="outline" className="border-white/10 text-xs px-3">
                Salin Token
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-3">
          <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
            <Trash2 className="size-4" />
            Zona Berbahaya
          </h2>
          <p className="text-xs text-slate-300">
            Menghapus workspace akan mencabut seluruh token repositori dan memutuskan kontainer agen yang sedang berjalan.
          </p>
          <Button variant="outline" className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-bold">
            Hapus Workspace Ini
          </Button>
        </div>
      </div>
    </div>
  );
}
