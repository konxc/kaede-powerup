import Link from 'next/link';
import { Github, ShieldCheck, Heart, Terminal, Sparkles } from 'lucide-react';

export function PublicFooter() {
  return (
    <footer className="border-t border-white/10 bg-[#080C14] text-slate-400">
      <div className="container mx-auto px-4 sm:px-6 py-16">
        <div className="grid grid-cols-2 md:grid-cols-5 gap-8 lg:gap-12">
          {/* Brand Col */}
          <div className="col-span-2">
            <Link href="/" className="flex items-center gap-3">
              <div className="flex size-8 items-center justify-center rounded-lg bg-emerald-500 font-bold text-slate-950 shadow-md shadow-emerald-500/20">
                K
              </div>
              <span className="text-lg font-bold text-white tracking-tight">KAEDE</span>
            </Link>
            <p className="mt-4 text-sm text-slate-400 leading-relaxed max-w-sm">
              Universal Context Resolution Engine & Agentic Operating System. Bridging GitHub living knowledge bases with Trello state machines for autonomous AI workforce execution.
            </p>
            <div className="mt-6 flex flex-wrap items-center gap-2">
              <span className="inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-white/5 border border-white/10 text-[11px] font-medium text-slate-300">
                <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
                All Systems Operational
              </span>
              <span className="inline-flex items-center gap-1 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
                Open-Core Initiative
              </span>
            </div>
            <p className="mt-4 text-xs text-slate-500">
              An engineering initiative by <strong className="text-slate-400 font-semibold">PT Koneksi Jaringan Indonesia</strong>.
            </p>
          </div>

          {/* Solutions Col */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Solutions</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/solutions#software" className="hover:text-emerald-400 transition-colors">
                  Software Teams
                </Link>
              </li>
              <li>
                <Link href="/solutions#agencies" className="hover:text-emerald-400 transition-colors">
                  Digital & Creative Agencies
                </Link>
              </li>
              <li>
                <Link href="/solutions#education" className="hover:text-emerald-400 transition-colors">
                  Education & Schools (SMA UII)
                </Link>
              </li>
              <li>
                <Link href="/solutions#founders" className="hover:text-emerald-400 transition-colors">
                  Solo Technical Founders
                </Link>
              </li>
              <li>
                <Link href="/solutions" className="text-emerald-400 text-xs font-medium hover:underline inline-flex items-center gap-1 mt-1">
                  View Solutions Matrix →
                </Link>
              </li>
            </ul>
          </div>

          {/* Resources & Docs Col */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Resources</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/playbook" className="hover:text-emerald-400 transition-colors">
                  OpenKB Specification
                </Link>
              </li>
              <li>
                <Link href="/pricing" className="hover:text-emerald-400 transition-colors">
                  Pricing & Plans
                </Link>
              </li>
              <li>
                <a
                  href="https://github.com/konxc/kaede-powerup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors flex items-center gap-1.5"
                >
                  <Github className="size-3.5" />
                  GitHub Repository
                </a>
              </li>
              <li>
                <a
                  href="https://trello.com/power-ups/admin"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="hover:text-emerald-400 transition-colors"
                >
                  Trello Power-Up Directory
                </a>
              </li>
              <li>
                <Link href="/about" className="hover:text-emerald-400 transition-colors">
                  About & Manifesto
                </Link>
              </li>
            </ul>
          </div>

          {/* Legal & Trust Col */}
          <div>
            <h4 className="text-xs font-semibold uppercase tracking-wider text-white">Trust & Legal</h4>
            <ul className="mt-4 space-y-2.5 text-sm">
              <li>
                <Link href="/legal/security" className="hover:text-emerald-400 transition-colors flex items-center gap-1.5 text-emerald-400 font-medium">
                  <ShieldCheck className="size-3.5" />
                  AI Security Pledge
                </Link>
              </li>
              <li>
                <Link href="/legal/terms" className="hover:text-emerald-400 transition-colors">
                  Terms of Service
                </Link>
              </li>
              <li>
                <Link href="/legal/privacy" className="hover:text-emerald-400 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <span className="text-xs text-slate-500 block pt-1">
                  Zero Code Training Guarantee. Kepatuhan UU PDP No. 27/2022 & GDPR.
                </span>
              </li>
            </ul>
          </div>
        </div>

        {/* Bottom Bar */}
        <div className="mt-14 pt-8 border-t border-white/5 flex flex-col sm:flex-row items-center justify-between gap-4 text-xs text-slate-500">
          <p>© {new Date().getFullYear()} PT Koneksi Jaringan Indonesia. All rights reserved.</p>
          <div className="flex items-center gap-6">
            <Link href="/legal/privacy" className="hover:text-slate-400 transition-colors">Privacy</Link>
            <Link href="/legal/terms" className="hover:text-slate-400 transition-colors">Terms</Link>
            <Link href="/legal/security" className="hover:text-slate-400 transition-colors">Security</Link>
            <a href="https://github.com/konxc/kaede-powerup" target="_blank" rel="noopener noreferrer" className="hover:text-slate-400 transition-colors">GitHub</a>
          </div>
        </div>
      </div>
    </footer>
  );
}
