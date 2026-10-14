import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Bot, Terminal, MessageSquare, ShieldCheck, CheckCircle2, RotateCw, ExternalLink, Plus } from 'lucide-react';

const FLEET_AGENTS = [
  {
    name: 'Antigravity CLI',
    type: 'Interactive Coding Agent',
    runtime: 'Local Terminal / Cloud SSH',
    status: 'Active (Pair Programming)',
    currentTask: 'Mengembangkan route group (protected) dan Landlord Admin di apps/webui',
    mcpTools: '47 Trello + 45 Kaede Context + Codebase Memory',
    badge: 'Primary Coding',
  },
  {
    name: 'Hermes Agent',
    type: 'Headless 24/7 Bot',
    runtime: 'Docker Container (srv1.konxc.space:3044)',
    status: 'Listening on WhatsApp & Webhook',
    currentTask: 'Memantau brief klien masuk & auto-generate kartu Trello',
    mcpTools: 'Trello MCP + WordPress MCP + WhatsApp Gateway',
    badge: 'Headless 24/7',
  },
  {
    name: 'OpenCode',
    type: 'Autonomous Terminal Harness',
    runtime: 'Local Host CLI (v22.21)',
    status: 'Idle (Standby)',
    currentTask: 'Menunggu trigger commit / branch validation',
    mcpTools: 'Trello MCP + Kaede MCP',
    badge: 'Terminal Harness',
  },
  {
    name: 'OpenClaw Drone',
    type: 'Server Operations Agent',
    runtime: 'Docker Container (srv1.konxc.space:3048)',
    status: 'Monitoring Linux Server Logs',
    currentTask: 'Pemeriksaan integritas disk & memory cache berkala',
    mcpTools: 'Codebase Memory MCP + System Health',
    badge: 'Server Ops',
  },
];

export default function AgentsPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Agent Fleet Manager</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Pantau dan orkestrasi seluruh armada agen AI yang terhubung ke workspace Anda.
          </p>
        </div>

        <Link href="/app/hosting">
          <Button className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9">
            <Plus className="mr-1.5 size-3.5" /> Tambah Headless Container
          </Button>
        </Link>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {FLEET_AGENTS.map((agent) => (
          <div
            key={agent.name}
            className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-4 hover:border-emerald-500/30 transition-all flex flex-col justify-between"
          >
            <div className="space-y-3">
              <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                  <div className="size-10 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
                    <Bot className="size-5" />
                  </div>
                  <div>
                    <h3 className="font-bold text-white text-base">{agent.name}</h3>
                    <p className="text-xs text-slate-400">{agent.type}</p>
                  </div>
                </div>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  {agent.badge}
                </span>
              </div>

              <div className="p-3 rounded-xl bg-white/5 border border-white/5 text-xs space-y-1.5 text-slate-300">
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Status:</span>
                  <span className="text-emerald-400 font-semibold">{agent.status}</span>
                </div>
                <div className="flex items-center justify-between text-[11px]">
                  <span className="text-slate-400">Runtime:</span>
                  <span className="text-white font-mono text-[10px]">{agent.runtime}</span>
                </div>
                <div className="pt-1 border-t border-white/5">
                  <span className="text-[10px] text-slate-400 block mb-0.5">Tugas Aktif:</span>
                  <p className="text-xs text-white leading-relaxed">{agent.currentTask}</p>
                </div>
              </div>
            </div>

            <div className="pt-3 border-t border-white/10 flex items-center justify-between text-xs text-slate-500">
              <span className="truncate max-w-[200px] text-[10px]">{agent.mcpTools}</span>
              <span className="text-emerald-400 font-medium">Ready</span>
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
