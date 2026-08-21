'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import { CommandPalette } from '@/components/layout/command-palette';
import { MenuIcon, GithubIcon, SearchIcon, Shield, Users, BarChart3, BookOpen } from 'lucide-react';

const NAV_ITEMS = [
  { href: '/dashboard', label: 'Dashboard', icon: BarChart3 },
  { href: '/teams', label: 'Teams', icon: Users },
  { href: '/roles', label: 'Roles', icon: Shield },
  { href: '/playbook', label: 'Playbook', icon: BookOpen },
] as const;

function NavLink({ href, children, className }: { href: string; children: React.ReactNode; className?: string }) {
  const pathname = usePathname();
  const isActive = pathname === href;
  return (
    <Link
      href={href}
      className={`text-sm font-medium transition-colors px-3 py-1.5 rounded-md ${
        isActive
          ? 'text-foreground bg-accent/80 font-semibold border border-border/40'
          : 'text-muted-foreground hover:text-foreground hover:bg-accent/40'
      } ${className ?? ''}`}
    >
      {children}
    </Link>
  );
}

export function AppShell({ children }: { children: React.ReactNode }) {
  const [commandOpen, setCommandOpen] = React.useState(false);

  return (
    <div className="min-h-screen bg-background text-foreground flex flex-col">
      <header className="sticky top-0 z-40 w-full border-b border-border/60 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
        <div className="container mx-auto flex h-14 items-center justify-between px-4">
          <div className="flex items-center gap-6">
            <Link href="/" className="flex items-center gap-2.5 font-bold text-foreground hover:opacity-90 transition-opacity">
              <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold shadow-md shadow-primary/20">
                K
              </div>
              <span className="hidden sm:inline text-foreground tracking-wide font-extrabold text-base">
                KAEDE
              </span>
            </Link>
            <nav className="hidden md:flex items-center gap-1">
              {NAV_ITEMS.map((item) => (
                <NavLink key={item.href} href={item.href}>
                  {item.label}
                </NavLink>
              ))}
            </nav>
          </div>

          <div className="flex items-center gap-3">
            {/* Command Palette Trigger Button (Linear Style) */}
            <button
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-2 text-xs text-muted-foreground bg-secondary/60 hover:bg-secondary border border-border/60 px-3 py-1.5 rounded-lg transition-all shadow-inner hover:text-foreground"
            >
              <SearchIcon className="size-3.5" />
              <span className="hidden sm:inline font-medium">Search or press</span>
              <kbd className="pointer-events-none inline-flex h-5 select-none items-center gap-1 rounded border border-border bg-muted px-1.5 font-mono text-[10px] font-medium opacity-100">
                <span className="text-xs">⌘</span>K
              </kbd>
            </button>

            <div className="hidden lg:flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-medium text-emerald-400">
              <span className="size-1.5 rounded-full bg-emerald-400 animate-pulse" />
              <span>Live Sync</span>
            </div>

            <a href="https://github.com/konxc/kaede-powerup" target="_blank" rel="noopener noreferrer">
              <Button variant="ghost" size="icon" className="text-muted-foreground hover:text-foreground">
                <GithubIcon className="size-4" />
                <span className="sr-only">GitHub</span>
              </Button>
            </a>

            {/* Mobile Nav */}
            <Sheet>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden">
                  <MenuIcon className="size-5" />
                  <span className="sr-only">Toggle menu</span>
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-slate-950 text-slate-100 border-border">
                <div className="flex items-center gap-2 mb-8 mt-2">
                  <div className="size-8 rounded-lg bg-primary flex items-center justify-center text-primary-foreground text-sm font-bold">
                    K
                  </div>
                  <span className="font-bold text-lg">KAEDE Studio</span>
                </div>
                <nav className="flex flex-col gap-2">
                  {NAV_ITEMS.map((item) => (
                    <NavLink key={item.href} href={item.href} className="text-base py-2">
                      <div className="flex items-center gap-3">
                        <item.icon className="size-5 text-primary" />
                        {item.label}
                      </div>
                    </NavLink>
                  ))}
                </nav>
              </SheetContent>
            </Sheet>
          </div>
        </div>
      </header>

      <main className="flex-1">{children}</main>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
