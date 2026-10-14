import Link from 'next/link';
import { inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { workspaceProjects, workspaces } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';
import { Button } from '@/components/ui/button';
import { FolderGit2, ShieldCheck, RefreshCw, Layers, ExternalLink, GitBranch, Plus } from 'lucide-react';

export default async function ProjectsPage() {
  const session = await auth();
  const userId = session?.user?.id || '';
  const accessibleWorkspaceIds = userId ? await getAccessibleWorkspaceIdsForUser(userId) : [];

  const projects = accessibleWorkspaceIds.length
    ? await db
        .select({
          project: workspaceProjects,
          workspaceName: workspaces.name,
        })
        .from(workspaceProjects)
        .innerJoin(workspaces, eq => inArray(workspaceProjects.workspaceId, accessibleWorkspaceIds))
    : [];

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Projects & Knowledge Base Index
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Repositori Git yang telah terindeks oleh KAEDE Context Engine dan siap dikonsumsi oleh agen.
          </p>
        </div>

        <Link href="/app/workspaces">
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 shadow-md shadow-emerald-500/20">
            <Plus className="mr-1.5 size-3.5" /> Sambungkan Repositori Baru
          </Button>
        </Link>
      </div>

      <div className="space-y-4">
        {projects.length ? (
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {projects.map(({ project, workspaceName }) => (
              <div key={project.id} className="p-5 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-4 hover:border-emerald-500/30 transition-all">
                <div className="flex items-start justify-between gap-3">
                  <div className="flex items-center gap-2.5">
                    <FolderGit2 className="size-5 text-emerald-400 shrink-0" />
                    <div>
                      <h3 className="text-sm font-bold text-white">{project.fullName}</h3>
                      <p className="text-[11px] text-slate-300">Workspace: {workspaceName}</p>
                    </div>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    {project.status}
                  </span>
                </div>

                <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs text-slate-300 space-y-1 font-mono">
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">Default Branch:</span>
                    <span className="text-white">{project.defaultBranch || 'main'}</span>
                  </div>
                  <div className="flex items-center justify-between text-[11px]">
                    <span className="text-slate-300">OpenKB Path:</span>
                    <span className="text-emerald-400">{project.openkbPath || '.openkb'}</span>
                  </div>
                </div>

                <div className="pt-2 flex items-center justify-between text-xs">
                  <span className="text-[11px] text-slate-400">AST Graph Verified</span>
                  <Link href={`/workspaces/${project.workspaceId}`} className="text-emerald-400 hover:underline flex items-center gap-1 font-semibold">
                    Manage Index <ExternalLink className="size-3" />
                  </Link>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="p-12 rounded-2xl border border-dashed border-white/10 text-center text-slate-300 text-xs space-y-3">
            <Layers className="size-10 text-slate-400 mx-auto" />
            <p>Belum ada proyek yang terhubung. Buka workspace Anda dan izinkan GitHub App untuk memindai repositori.</p>
            <Link href="/app/workspaces">
              <Button variant="outline" className="border-white/10 text-xs">
                Ke Halaman Workspaces
              </Button>
            </Link>
          </div>
        )}
      </div>
    </div>
  );
}
