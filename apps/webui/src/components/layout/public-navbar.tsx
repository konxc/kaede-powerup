'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  MenuIcon,
  GithubIcon,
  ExternalLink,
  Bot,
  Workflow,
  Sparkles,
  BookOpen,
  Layers,
  ShieldCheck,
  ChevronRight,
  Terminal,
} from 'lucide-react';

const NAV_LINKS = [
  { href: '/#features', label: 'Features' },
  { href: '/solutions', label: 'Solutions' },
  { href: '/playbook', label: 'Playbook' },
  { href: '/pricing', label: 'Pricing' },
  { href: '/about', label: 'About' },
];

export function PublicNavbar() {
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = React.useState(false);

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#0B0F17]/85 backdrop-blur-xl">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 sm:px-6">
        {/* Brand */}
        <div className="flex items-center gap-8">
          <Link href="/" className="group flex items-center gap-3">
            <div className="relative flex size-9 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 font-black text-white shadow-lg shadow-emerald-500/20 transition-all duration-300 group-hover:scale-105 group-hover:shadow-emerald-500/40">
              <span className="text-base tracking-tighter">K</span>
              <span className="absolute -bottom-0.5 -right-0.5 size-2.5 rounded-full border-2 border-[#0B0F17] bg-emerald-400" />
            </div>
            <div className="flex flex-col">
              <div className="flex items-center gap-1.5 font-bold tracking-tight text-white">
                <span className="text-lg">KAEDE</span>
                <span className="text-xs font-semibold px-1.5 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  Power-Up
                </span>
              </div>
              <span className="text-[10px] text-slate-400 -mt-0.5 tracking-wider uppercase font-medium">
                Context OS
              </span>
            </div>
          </Link>

          {/* Desktop Nav */}
          <nav className="hidden lg:flex items-center gap-1">
            {NAV_LINKS.map((link) => {
              const isActive = pathname === link.href;
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`text-sm font-medium px-3.5 py-2 rounded-lg transition-all ${
                    isActive
                      ? 'text-white bg-white/10'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  {link.label}
                </Link>
              );
            })}
          </nav>
        </div>

        {/* Right CTA */}
        <div className="flex items-center gap-3">
          {/* Status Badge */}
          <div className="hidden sm:inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-950/60 border border-emerald-800/40 text-[11px] font-medium text-emerald-300">
            <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
            <span>Trello & GitHub Native</span>
          </div>

          {/* GitHub Repo */}
          <a
            href="https://github.com/konxc/kaede-powerup"
            target="_blank"
            rel="noopener noreferrer"
            className="hidden md:flex items-center gap-1.5 text-xs text-slate-300 hover:text-white px-3 py-2 rounded-lg border border-white/10 bg-white/5 hover:bg-white/10 transition-colors"
          >
            <GithubIcon className="size-3.5" />
            <span>GitHub</span>
          </a>

          {/* Launch Dashboard CTA */}
          <Link href="/dashboard">
            <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold text-xs sm:text-sm px-4 py-2 rounded-lg shadow-lg shadow-emerald-500/20 transition-all hover:shadow-emerald-500/30">
              <Bot className="mr-1.5 size-4" />
              <span>Launch Desktop</span>
            </Button>
          </Link>

          {/* Mobile Hamburger */}
          <Sheet open={mobileOpen} onOpenChange={setMobileOpen}>
            <SheetTrigger asChild>
              <Button
                variant="ghost"
                size="icon"
                className="lg:hidden text-slate-300 hover:text-white hover:bg-white/10"
              >
                <MenuIcon className="size-5" />
                <span className="sr-only">Toggle navigation</span>
              </Button>
            </SheetTrigger>
            <SheetContent side="right" className="w-80 bg-[#0B0F17] text-white border-white/10 p-6">
              <div className="flex items-center gap-3 pb-6 border-b border-white/10">
                <div className="size-9 rounded-xl bg-gradient-to-br from-emerald-500 to-teal-700 flex items-center justify-center font-bold text-white shadow">
                  K
                </div>
                <div>
                  <h3 className="font-bold text-base">KAEDE Ecosystem</h3>
                  <p className="text-xs text-slate-400">Context OS & Trello Power-Up</p>
                </div>
              </div>

              <div className="py-6 flex flex-col gap-2">
                {NAV_LINKS.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    onClick={() => setMobileOpen(false)}
                    className="flex items-center justify-between px-3 py-2.5 rounded-lg text-sm font-medium text-slate-200 hover:text-white hover:bg-white/5 transition-colors"
                  >
                    <span>{link.label}</span>
                    <ChevronRight className="size-4 text-slate-500" />
                  </Link>
                ))}
              </div>

              <div className="pt-6 border-t border-white/10 flex flex-col gap-3">
                <Link href="/dashboard" onClick={() => setMobileOpen(false)}>
                  <Button className="w-full bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-semibold">
                    <Bot className="mr-2 size-4" /> Launch Agent Desktop
                  </Button>
                </Link>
                <a
                  href="https://github.com/konxc/kaede-powerup"
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center justify-center gap-2 text-xs text-slate-400 hover:text-white py-2"
                >
                  <GithubIcon className="size-4" /> View open-source on GitHub
                </a>
              </div>
            </SheetContent>
          </Sheet>
        </div>
      </div>
    </header>
  );
}
