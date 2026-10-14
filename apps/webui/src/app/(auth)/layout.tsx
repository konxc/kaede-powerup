import * as React from 'react';
import Link from 'next/link';
import { Bot, CheckCircle2, ShieldCheck, Sparkles, Terminal, Trello } from 'lucide-react';

export default function AuthLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="h-screen h-[100dvh] w-full overflow-hidden bg-[#0B0F17] text-white flex flex-col lg:flex-row">
      {/* Left Column: Focused Authentication Container (Clean, zero scrollbar, perfectly centered) */}
      <div className="flex-1 flex flex-col justify-between px-6 py-5 sm:px-10 sm:py-6 lg:px-12 lg:py-8 max-w-xl mx-auto w-full h-full min-h-0 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden">
        <div className="shrink-0">
          <Link href="/" className="group inline-flex items-center gap-2.5">
            <div className="flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 font-black text-white shadow-lg shadow-emerald-500/20 group-hover:scale-105 transition-all">
              <span>K</span>
            </div>
            <span className="text-xl font-extrabold tracking-tight text-white">KAEDE</span>
          </Link>
        </div>

        <div className="my-auto py-2 sm:py-4">{children}</div>

        <div className="shrink-0 text-xs text-slate-500 flex flex-wrap items-center justify-between gap-3 border-t border-white/10 pt-3">
          <span>© {new Date().getFullYear()} PT Koneksi Jaringan Indonesia</span>
          <div className="flex items-center gap-4">
            <Link href="/legal/privacy" className="hover:text-slate-400">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-slate-400">Terms</Link>
            <Link href="/legal/security" className="hover:text-slate-400">Security</Link>
          </div>
        </div>
      </div>

      {/* Right Column: High-Impact Ecosystem Branding Showcase (Fixed h-full, Overflow Hidden) */}
      <div className="hidden lg:flex flex-1 h-full overflow-hidden relative bg-gradient-to-br from-[#0F172A] via-[#080C14] to-[#04070D] border-l border-white/10 p-8 lg:p-12 xl:p-16 flex-col justify-between">
        <div className="hero-glow absolute inset-0 pointer-events-none opacity-40" />

        <div className="relative z-10 flex items-center justify-between shrink-0">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
            <Sparkles className="size-3.5" />
            <span>Agentic Operating System</span>
          </div>
          <span className="text-xs font-mono text-slate-400">v1.4 Production</span>
        </div>

        <div className="relative z-10 space-y-5 max-w-lg my-auto py-4">
          <h2 className="text-2xl xl:text-3xl font-extrabold text-white leading-tight">
            Hubungkan Memori Git & Kanban Trello dengan AI Workforce.
          </h2>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            Dari repositori organisasi <code className="text-emerald-400">.github</code>, pedoman <code className="text-emerald-400">playbook</code>, hingga <code className="text-emerald-400">.openkb</code>, KAEDE memastikan coding agent dan headless bot bekerja tanpa halusinasi.
          </p>

          <div className="space-y-2.5 pt-1">
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0" />
              <span>Zero-Prompt Context Resolution dari GitHub</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="size-4 text-sky-400 shrink-0" />
              <span>47 Trello MCP Tools & State Machine Otomatis</span>
            </div>
            <div className="flex items-center gap-3 text-xs text-slate-300">
              <CheckCircle2 className="size-4 text-purple-400 shrink-0" />
              <span>Shared Docker Container Hosting untuk Hermes WhatsApp 24/7</span>
            </div>
          </div>
        </div>

        <div className="relative z-10 p-4 lg:p-5 rounded-2xl border border-white/10 bg-white/5 backdrop-blur-md shrink-0">
          <p className="text-xs italic text-slate-300 leading-relaxed">
            "KAEDE adalah titik temu yang kami cari—menyatukan tim kreatif yang menggunakan Trello dengan developer yang menggunakan agentic coding."
          </p>
          <div className="mt-2.5 flex items-center justify-between text-[11px] text-slate-400">
            <span className="font-semibold text-white">Sandiko (@sandikodev)</span>
            <span>Founder, PT Koneksi Jaringan Indonesia</span>
          </div>
        </div>
      </div>
    </div>
  );
}
