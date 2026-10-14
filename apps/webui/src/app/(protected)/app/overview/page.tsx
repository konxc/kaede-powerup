import Link from 'next/link';
import { and, desc, eq, inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { workspaceProjects, workspaces, agentContainers, billingTransactions } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';
import { Button } from '@/components/ui/button';
import {
  BarChart3,
  Bot,
  Building2,
  FolderGit2,
  Trello,
  Server,
  Zap,
  ArrowRight,
  CheckCircle2,
  Clock,
  Sparkles,
  RefreshCw,
  Plus,
} from 'lucide-react';

export default async function OverviewPage() {
  const session = await auth();
  const userId = session?.user?.id || '';

  const accessibleWorkspaceIds = userId ? await getAccessibleWorkspaceIdsForUser(userId) : [];

  const workspaceRows = accessibleWorkspaceIds.length
    ? await db.select().from(workspaces).where(inArray(workspaces.id, accessibleWorkspaceIds))
    : [];

  const projectRows = accessibleWorkspaceIds.length
    ? await db.select().from(workspaceProjects).where(inArray(workspaceProjects.workspaceId, accessibleWorkspaceIds))
    : [];

  const containerRows = accessibleWorkspaceIds.length
    ? await db.select().from(agentContainers).where(inArray(agentContainers.workspaceId, accessibleWorkspaceIds))
    : [];

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Top Banner / Welcome */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            System Overview & Operations
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pantau seluruh alur kerja Trello kanban, repositori Git yang terindeks, dan eksekusi AI agents.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <Link href="/app/hosting">
            <Button variant="outline" className="text-xs h-9 border-white/10 text-slate-200 hover:text-white">
              <Server className="mr-1.5 size-3.5 text-purple-400" /> Deploy Container
            </Button>
          </Link>
          <Link href="/app/workspaces">
            <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 shadow-md shadow-emerald-500/20">
              <Plus className="mr-1.5 size-3.5" /> Workspace Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* 4 Stat Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-medium">Workspaces Aktif</span>
            <Building2 className="size-4 text-emerald-400" />
          </div>
          <p className="text-3xl font-black text-white">{workspaceRows.length}</p>
          <p className="text-[11px] text-slate-400">Multi-tenant scope</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-medium">Projects & Repos</span>
            <FolderGit2 className="size-4 text-sky-400" />
          </div>
          <p className="text-3xl font-black text-white">{projectRows.length}</p>
          <p className="text-[11px] text-slate-400">Living KB terindeks</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-medium">In-Flight Trello Cards</span>
            <Trello className="size-4 text-amber-400" />
          </div>
          <p className="text-3xl font-black text-white">7</p>
          <p className="text-[11px] text-slate-400">Terkoneksi via webhook</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2">
          <div className="flex items-center justify-between text-slate-300">
            <span className="text-xs font-medium">Headless Containers</span>
            <Bot className="size-4 text-purple-400" />
          </div>
          <p className="text-3xl font-black text-white">{containerRows.length}</p>
          <p className="text-[11px] text-slate-400">Hermes / OpenClaw active</p>
        </div>
      </div>

      {/* Grid: Active Projects & Agent Execution Stream */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">
        {/* Left Column: Recent Projects */}
        <div className="lg:col-span-7 rounded-2xl border border-white/10 bg-[#0F172A]/70 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <FolderGit2 className="size-4 text-emerald-400" />
              Repositori & Proyek Terhubung
            </h2>
            <Link href="/app/projects" className="text-xs text-emerald-400 hover:underline">
              Lihat Semua →
            </Link>
          </div>

          {projectRows.length ? (
            <div className="divide-y divide-white/5">
              {projectRows.slice(0, 5).map((project) => (
                <div key={project.id} className="py-3 flex items-center justify-between gap-4">
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate">{project.fullName}</p>
                    <p className="text-[11px] text-slate-500">
                      Branch: {project.defaultBranch || 'main'} · Status: {project.status}
                    </p>
                  </div>
                  <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    OpenKB Synced
                  </span>
                </div>
              ))}
            </div>
          ) : (
            <div className="rounded-xl border border-dashed border-white/10 p-8 text-center text-xs text-slate-400 space-y-3">
              <p>Belum ada repositori yang disinkronisasikan ke workspace Anda.</p>
              <Link href="/app/projects">
                <Button variant="outline" className="text-xs border-emerald-500/30 text-emerald-300">
                  Hubungkan Repositori GitHub
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Right Column: In-Flight Agent Activity Stream */}
        <div className="lg:col-span-5 rounded-2xl border border-white/10 bg-[#0F172A]/70 p-6 space-y-5">
          <div className="flex items-center justify-between">
            <h2 className="text-base font-bold text-white flex items-center gap-2">
              <Bot className="size-4 text-purple-400" />
              Live Agent Activity
            </h2>
          </div>

          <div className="space-y-3 text-xs">
            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-emerald-300">Antigravity CLI</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="size-3" /> Baru saja
                </span>
              </div>
              <p className="text-slate-200 text-[11px]">
                Selesai merefaktor komponen Public WebUI & mendeploy ke Vercel production.
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-sky-300">Hermes WhatsApp Agent</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="size-3" /> 14m lalu
                </span>
              </div>
              <p className="text-slate-200 text-[11px]">
                Menerima brief dari tim marketing SMA UII dan membuat kartu di "Sprint Backlog".
              </p>
            </div>

            <div className="p-3 rounded-xl bg-white/5 border border-white/5 space-y-1.5">
              <div className="flex items-center justify-between text-[11px]">
                <span className="font-bold text-amber-300">Trello State Machine</span>
                <span className="text-slate-400 flex items-center gap-1">
                  <Clock className="size-3" /> 28m lalu
                </span>
              </div>
              <p className="text-slate-200 text-[11px]">
                Kartu "Implementasi Auth Group" dipindahkan ke Today oleh operator Sandiko.
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
