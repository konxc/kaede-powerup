import Link from 'next/link';
import { inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { agentContainers, workspaces } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';
import { Button } from '@/components/ui/button';
import { Bot, Terminal, Server, ShieldCheck, CheckCircle2, RotateCw, ExternalLink, Plus, Zap } from 'lucide-react';

export default async function AgentsPage() {
  const session = await auth();
  const githubUserId = (session?.user as any)?.githubId || session?.user?.id || '';
  const accessibleWorkspaceIds = githubUserId ? await getAccessibleWorkspaceIdsForUser(githubUserId) : [];

  let liveContainers: any[] = [];
  try {
    if (accessibleWorkspaceIds.length) {
      liveContainers = await db
        .select()
        .from(agentContainers)
        .where(inArray(agentContainers.workspaceId, accessibleWorkspaceIds));
    }
  } catch (err) {
    console.warn('[AgentsPage] Failed to fetch containers:', err);
  }

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Agent Fleet Manager</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pantau dan orkestrasi seluruh armada agen AI yang aktif di ruang kerja Anda.
          </p>
        </div>

        <Link href="/app/hosting">
          <Button className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9 shadow-md shadow-purple-600/20">
            <Plus className="mr-1.5 size-3.5" /> Deploy Headless Container
          </Button>
        </Link>
      </div>

      {/* Fleet Grid */}
      <div className="space-y-6">
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Bot className="size-4 text-emerald-400" />
            Headless Docker Fleet ({liveContainers.length} Kontainer Aktif)
          </h2>

          {liveContainers.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              {liveContainers.map((container) => {
                const isHermes = container.agentType === 'hermes-whatsapp';
                return (
                  <div
                    key={container.id}
                    className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-4 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
                  >
                    <div className="space-y-3">
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-3">
                          <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                            {isHermes ? <Bot className="size-5" /> : <Server className="size-5 text-sky-400" />}
                          </div>
                          <div>
                            <h3 className="font-bold text-white text-base">
                              {isHermes ? 'Hermes WhatsApp Bot' : 'OpenClaw Drone'}
                            </h3>
                            <p className="text-xs font-mono text-slate-400">{container.dockerContainerId}</p>
                          </div>
                        </div>
                        <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 font-bold">
                          ● {container.status}
                        </span>
                      </div>

                      <div className="p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs space-y-2 text-slate-300">
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Host Server:</span>
                          <span className="text-white font-mono text-[11px]">
                            {container.dockerHostServer}:{container.assignedPort}
                          </span>
                        </div>
                        <div className="flex items-center justify-between text-[11px]">
                          <span className="text-slate-400">Resource:</span>
                          <span className="text-white">
                            {container.allocatedCpu} vCPU · {container.allocatedRam}
                          </span>
                        </div>
                        {isHermes && (
                          <div className="flex items-center justify-between text-[11px]">
                            <span className="text-slate-400">WhatsApp Gateway:</span>
                            <span className={container.whatsappConnected ? 'text-emerald-400 font-semibold' : 'text-amber-400'}>
                              {container.whatsappConnected ? '✓ Terhubung' : 'Perlu Scan QR'}
                            </span>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs">
                      <Link href="/app/hosting" className="text-emerald-400 hover:underline text-xs flex items-center gap-1 font-medium">
                        Buka Kontrol Container <ExternalLink className="size-3" />
                      </Link>
                      <span className="text-[10px] text-slate-500 font-mono">
                        Dibuat: {new Date(container.createdAt).toLocaleDateString('id-ID')}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          ) : (
            <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center space-y-3">
              <Bot className="size-8 text-slate-500 mx-auto" />
              <p className="text-xs text-slate-400">
                Belum ada kontainer agen headless di workspace ini.
              </p>
              <Link href="/app/hosting">
                <Button size="sm" className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs">
                  Deploy Kontainer Pertama
                </Button>
              </Link>
            </div>
          )}
        </div>

        {/* Local & Developer Harnesses */}
        <div>
          <h2 className="text-sm font-bold text-slate-400 uppercase tracking-wider mb-4 flex items-center gap-2">
            <Terminal className="size-4 text-sky-400" />
            Developer CLI & Terminal Harness
          </h2>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
                  <Terminal className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Antigravity CLI</h3>
                  <p className="text-xs text-slate-400">Interactive Coding Assistant</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Terhubung ke codebase repository untuk pair programming, refactoring, dan audit kode otomatis melalui terminal.
              </p>
              <div className="pt-2 text-[11px] text-sky-300 font-mono">
                Status: Standby on Local Session
              </div>
            </div>

            <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-3">
              <div className="flex items-center gap-3">
                <div className="size-10 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
                  <Zap className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">OpenCode Harness</h3>
                  <p className="text-xs text-slate-400">Autonomous Task Execution</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Menjalankan Playbooks dan Trello webhooks tanpa intervensi manual dengan konteks Living KB.
              </p>
              <div className="pt-2 text-[11px] text-purple-300 font-mono">
                Status: Listening on Webhook Trigger
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
