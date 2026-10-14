import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Trello, Workflow, Sparkles, CheckCircle2, Zap, ArrowRight, ExternalLink, Plus } from 'lucide-react';

const AUTOMATION_RULES = [
  {
    id: 'rule-1',
    trigger: 'Kartu masuk ke kolom "Sprint Backlog" dengan label "agent:coding"',
    action: 'KAEDE MCP meresolusi .openkb/tech dan memicu Antigravity CLI untuk eksekusi kode.',
    status: 'Active',
    runs: 48,
  },
  {
    id: 'rule-2',
    trigger: 'Kartu dipindahkan ke kolom "Review Klien"',
    action: 'Hermes Agent otomatis mengirimkan pesan WhatsApp ke PIC Klien dengan link preview Vercel.',
    status: 'Active',
    runs: 19,
  },
  {
    id: 'rule-3',
    trigger: 'Unit test lokal berhasil dijalankan oleh OpenCode',
    action: 'Ringkasan test coverage otomatis dilampirkan ke komentar kartu Trello bersangkutan.',
    status: 'Active',
    runs: 114,
  },
];

export default function BoardsPage() {
  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Trello Boards & State Machine Rules
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Konfigurasikan perpindahan kolom kanban Trello sebagai pemantik otomatis (*state-machine trigger*) untuk agen.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://trello.com/b/rAKmlRj3/kaede-development"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="text-xs h-9 border-white/10 text-slate-200">
              <Trello className="mr-1.5 size-3.5 text-sky-400" /> Buka Trello Board
            </Button>
          </a>
          <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 shadow-md shadow-emerald-500/20">
            <Plus className="mr-1.5 size-3.5" /> Buat Rule Otomasi
          </Button>
        </div>
      </div>

      {/* Connected Board Card */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4">
          <div className="flex items-center gap-3">
            <div className="size-10 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400">
              <Trello className="size-5" />
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-white text-base">Kaede Development</h3>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                  ● Realtime Webhook Synced
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                Board ID: <code className="text-slate-300">6a1b170320f6b4aa6ad05551</code> · 47 Tools Registered
              </p>
            </div>
          </div>

          <div className="text-xs text-slate-400 text-right">
            <span>Kolom Terhubung:</span>
            <p className="font-mono text-emerald-400 font-semibold text-[11px]">
              Intro · Sprint Backlog · Today · Done / Deployed
            </p>
          </div>
        </div>
      </div>

      {/* State Machine Rules Section (The Zapier for Agents) */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Workflow className="size-4 text-emerald-400" />
          Daftar Aturan Otomasi Handoff (Agent State Machine)
        </h2>

        <div className="space-y-3">
          {AUTOMATION_RULES.map((rule) => (
            <div
              key={rule.id}
              className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-3 hover:border-emerald-500/30 transition-all"
            >
              <div className="flex items-center justify-between text-xs">
                <span className="font-bold text-slate-400 uppercase tracking-wider text-[10px]">
                  Rule ID: {rule.id}
                </span>
                <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-300 border border-emerald-500/20 text-[10px] font-mono">
                  {rule.runs} eksekusi sukses
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4 text-xs">
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/5 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-amber-400">Trigger (Pemicu Trello):</span>
                  <p className="text-slate-300 leading-relaxed">{rule.trigger}</p>
                </div>
                <div className="p-3 rounded-xl bg-emerald-950/20 border border-emerald-500/20 space-y-1">
                  <span className="text-[10px] font-bold uppercase text-emerald-400">Aksi Agent (Execution):</span>
                  <p className="text-slate-300 leading-relaxed">{rule.action}</p>
                </div>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
