'use client';

import * as React from 'react';
import { Bot, CheckCircle2, ChevronRight, GitBranch, Layers, Sparkles, Terminal, Trello, Zap } from 'lucide-react';

const SIMULATION_PRESETS = [
  {
    id: 'school',
    title: 'Institusi Sekolah (SMA UII)',
    org: 'SMA-UII-Yogyakarta',
    cardTitle: 'Implementasi Modul Presensi Siswa',
    labels: ['SMA UII', 'agent:coding', 'P0'],
    contextPaths: [
      'SMA-UII-Yogyakarta/.github/standards.md',
      'SMA-UII-Yogyakarta/playbook/sop-kurikulum.md',
      'aksesekolah/.openkb/tech/database-schema.md',
    ],
    agentOutput: [
      '[KAEDE] Resolving context for @SMA-UII-Yogyakarta...',
      '✓ Identity confirmed via org .github (Sekolah Mandiri Berbasis IT)',
      '✓ Loaded Playbook: Modul presensi membutuhkan approval Waka Kesiswaan',
      '✓ Injected .openkb: Drizzle LibSQL schema (students, attendance_logs)',
      '⚡ Antigravity CLI executing implementation in Next.js...',
      '✓ Generated apps/web/src/app/presensi/page.tsx (184 lines)',
      '✓ Verified 12 unit tests passing (100% coverage)',
      '✓ Trello card moved to "Review Klien" + preview URL attached',
    ],
  },
  {
    id: 'agency',
    title: 'Agensi Digital (PT Koneksi)',
    org: 'PT-Koneksi-Jaringan-Indonesia',
    cardTitle: 'Penerbitan Artikel SEO Cloud Hosting',
    labels: ['SEO Content', 'agent:hermes', 'WordPress'],
    contextPaths: [
      'konxc/.github/workflows/agency.md',
      'konxc/playbook/digital-marketing/tone-of-voice.md',
      'konxc.space/.openkb/marketing/keywords-matrix.md',
    ],
    agentOutput: [
      '[KAEDE] Resolving context for @konxc agency...',
      '✓ Identity confirmed: PT Koneksi Jaringan Indonesia (Digital Agency)',
      '✓ Loaded Brand Voice: Otoritatif, ramah developer, tanpa jargon klise',
      '✓ Injected .openkb: Keyword primer "Cloud Server VPS Murah Jogja"',
      '⚡ Hermes Agent dispatching draft to WordPress via MCP...',
      '✓ Post draft created on https://konxc.space (Post ID: #1042)',
      '✓ WhatsApp notification dispatched to Account Manager',
      '✓ Trello card status updated to "Menunggu Approval Klien"',
    ],
  },
  {
    id: 'dev',
    title: 'Software House / Dev Team',
    org: 'acme-software-dev',
    cardTitle: 'Refactor Auth Provider ke NextAuth v5',
    labels: ['Refactor', 'agent:opencode', 'High-Priority'],
    contextPaths: [
      'acme-dev/.github/copilot-instructions.md',
      'acme-dev/playbook/engineering-conventions.md',
      'core-api/.openkb/tech/auth-architecture.md',
    ],
    agentOutput: [
      '[KAEDE] Resolving context for @acme-software-dev...',
      '✓ Identity confirmed: Acme Software Lab',
      '✓ Loaded Playbook: Zero breaking changes pada JWT refresh token',
      '✓ Injected .openkb: Auth v5 trustHost dynamic resolver pattern',
      '⚡ OpenCode executing refactoring in src/lib/auth.ts...',
      '✓ Replaced deprecated getToken with server session getter',
      '✓ Ran bun test: 48 tests passed in 230ms',
      '✓ Git commit 9eebecf pushed to origin/feature-auth-v5',
    ],
  },
];

export function AgentSimulator() {
  const [activePresetIndex, setActivePresetIndex] = React.useState(0);
  const current = SIMULATION_PRESETS[activePresetIndex];

  return (
    <div className="w-full rounded-2xl border border-white/10 bg-[#0F172A]/70 backdrop-blur-xl shadow-2xl overflow-hidden">
      {/* Preset Selector */}
      <div className="flex flex-wrap items-center justify-between gap-3 border-b border-white/10 px-4 py-3 bg-white/5">
        <div className="flex items-center gap-2">
          <span className="flex size-2 rounded-full bg-emerald-400 animate-pulse" />
          <span className="text-xs font-semibold uppercase tracking-wider text-slate-300">
            Interactive Agent Workflow Simulator
          </span>
        </div>
        <div className="flex items-center gap-1.5 overflow-x-auto">
          {SIMULATION_PRESETS.map((preset, idx) => (
            <button
              key={preset.id}
              onClick={() => setActivePresetIndex(idx)}
              className={`text-xs px-3 py-1.5 rounded-lg font-medium transition-all ${
                activePresetIndex === idx
                  ? 'bg-emerald-500 text-slate-950 font-bold shadow-md shadow-emerald-500/20'
                  : 'bg-white/5 text-slate-300 hover:bg-white/10 hover:text-white'
              }`}
            >
              {preset.title}
            </button>
          ))}
        </div>
      </div>

      {/* 3-Column Visual Pipeline */}
      <div className="grid grid-cols-1 lg:grid-cols-12 divide-y lg:divide-y-0 lg:divide-x divide-white/10 text-xs">
        {/* Stage 1: Trello State Machine */}
        <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-slate-950/40">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-sky-400 font-semibold">
                <Trello className="size-4" />
                <span className="text-xs">Trello Kanban Card</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-sky-500/10 text-sky-400 border border-sky-500/20 text-[10px] font-mono">
                Trigger
              </span>
            </div>

            {/* Simulated Trello Card */}
            <div className="rounded-xl border border-white/10 bg-[#1E293B]/80 p-4 shadow-lg space-y-3">
              <div className="flex flex-wrap gap-1">
                {current.labels.map((lbl) => (
                  <span
                    key={lbl}
                    className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-medium"
                  >
                    {lbl}
                  </span>
                ))}
              </div>
              <p className="font-semibold text-white text-sm leading-snug">{current.cardTitle}</p>
              <div className="flex items-center justify-between text-[11px] text-slate-400 pt-2 border-t border-white/5">
                <span>Column: In Progress</span>
                <span className="text-emerald-400 font-medium">● Agent Assigned</span>
              </div>
            </div>

            <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
              Manusia cukup membuat atau memindahkan kartu di Trello. Perpindahan kartu secara otomatis mentrigger handoff ke AI agent.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Power-Up: KAEDE v1.4</span>
            <span className="text-slate-400">47 Trello Tools</span>
          </div>
        </div>

        {/* Stage 2: KAEDE Context Engine */}
        <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-[#0B0F17]/60">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-emerald-400 font-semibold">
                <Layers className="size-4" />
                <span>KAEDE Context Engine</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                Resolver
              </span>
            </div>

            <div className="space-y-2.5">
              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Layer 1 · Organization Identity
                </span>
                <p className="text-white font-mono text-[11px] truncate">{current.contextPaths[0]}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-white/5 border border-white/5">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1">
                  Layer 2 · Business SOP Playbook
                </span>
                <p className="text-white font-mono text-[11px] truncate">{current.contextPaths[1]}</p>
              </div>

              <div className="p-2.5 rounded-lg bg-emerald-950/30 border border-emerald-500/20">
                <span className="text-[10px] font-mono text-emerald-400 uppercase tracking-wider block mb-1">
                  Layer 3 · Project OpenKB
                </span>
                <p className="text-white font-mono text-[11px] truncate">{current.contextPaths[2]}</p>
              </div>
            </div>

            <p className="mt-4 text-[11px] text-slate-400 leading-relaxed">
              KAEDE meresolusi identitas pemilik, SOP bisnis, dan schema kode langsung dari Git tanpa prompting manual berulang.
            </p>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
            <span>Cache: Turso Edge LibSQL</span>
            <span className="text-emerald-400">Zero Hallucination</span>
          </div>
        </div>

        {/* Stage 3: Autonomous Agent Terminal */}
        <div className="lg:col-span-4 p-5 flex flex-col justify-between bg-black/70 font-mono">
          <div>
            <div className="flex items-center justify-between mb-4">
              <div className="flex items-center gap-2 text-violet-400 font-semibold font-sans">
                <Terminal className="size-4" />
                <span>Agent Execution Terminal</span>
              </div>
              <span className="px-2 py-0.5 rounded bg-violet-500/10 text-violet-400 border border-violet-500/20 text-[10px]">
                Autonomous
              </span>
            </div>

            <div className="rounded-lg bg-slate-950/90 border border-white/10 p-3 space-y-1.5 text-[11px] text-slate-300 leading-relaxed overflow-hidden">
              {current.agentOutput.map((line, i) => (
                <div
                  key={i}
                  className={
                    line.startsWith('✓')
                      ? 'text-emerald-400 font-semibold'
                      : line.startsWith('⚡')
                      ? 'text-amber-300'
                      : line.startsWith('[KAEDE]')
                      ? 'text-sky-400'
                      : 'text-slate-400'
                  }
                >
                  {line}
                </div>
              ))}
            </div>
          </div>

          <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500 font-sans">
            <span>Runtime: Antigravity / Hermes</span>
            <span className="text-emerald-400 font-medium">Status: Success</span>
          </div>
        </div>
      </div>
    </div>
  );
}
