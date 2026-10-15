'use client';

import * as React from 'react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
import { signOut } from 'next-auth/react';
import { Button } from '@/components/ui/button';
import { Sheet, SheetContent, SheetTrigger } from '@/components/ui/sheet';
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuLabel,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from '@/components/ui/dropdown-menu';
import { CommandPalette } from '@/components/layout/command-palette';
import {
  BarChart3,
  Building2,
  FolderGit2,
  Trello,
  Bot,
  Server,
  Workflow,
  CreditCard,
  Users,
  Settings,
  User,
  ShieldCheck,
  MenuIcon,
  SearchIcon,
  ChevronDown,
  LogOut,
  Plus,
} from 'lucide-react';

interface WorkspaceItem {
  id: string;
  name: string;
  sourceType: string;
  sourceGithubLogin?: string | null;
}

interface ProtectedShellProps {
  user: {
    name?: string | null;
    email?: string | null;
    image?: string | null;
    githubUsername?: string;
    role?: string;
  };
  workspaces?: WorkspaceItem[];
  children: React.ReactNode;
}

const NAV_GROUPS = [
  {
    title: 'Workspace',
    items: [
      { href: '/app/overview', label: 'Overview', icon: BarChart3 },
      { href: '/app/projects', label: 'Projects & KB', icon: FolderGit2 },
      { href: '/app/boards', label: 'Trello Boards', icon: Trello },
      { href: '/app/workspaces', label: 'Workspaces', icon: Building2 },
    ],
  },
  {
    title: 'Agentic Ops',
    items: [
      { href: '/app/agents', label: 'Agent Fleet', icon: Bot },
      { href: '/app/hosting', label: 'Cloud Hosting', icon: Server },
      { href: '/app/integrations', label: 'Integrations', icon: Workflow },
    ],
  },
  {
    title: 'Finansial & Mitra',
    items: [
      { href: '/app/billing', label: 'Billing & Invoices', icon: CreditCard },
      { href: '/app/affiliate', label: 'Program Afiliasi', icon: Users },
    ],
  },
];

export function ProtectedShell({ user, workspaces = [], children }: ProtectedShellProps) {
  const pathname = usePathname();
  const [commandOpen, setCommandOpen] = React.useState(false);
  const [sidebarOpen, setSidebarOpen] = React.useState(false);
  const isAdmin = user.role === 'admin' || user.email === 'admin@konxc.space';

  const activeWorkspace = workspaces[0] || {
    id: 'default',
    name: 'PT Koneksi Jaringan',
    sourceType: 'organization',
  };

  return (
    <div className="h-screen h-[100dvh] w-full overflow-hidden bg-[#080C14] text-slate-100 flex flex-col md:flex-row">
      {/* ── DESKTOP SIDEBAR (FIXED SHELL, INTERNAL SCROLL) ── */}
      <aside className="hidden md:flex w-64 h-full flex-col justify-between border-r border-white/10 bg-[#0B0F17] p-4 shrink-0 overflow-hidden">
        <div className="flex-1 flex flex-col min-h-0 overflow-hidden">
          {/* Logo & Workspace Selector (Shrink-0) */}
          <div className="space-y-3 pb-3 border-b border-white/10 shrink-0">
            <Link href="/" className="flex items-center gap-2.5 px-2">
              <div className="flex size-7 items-center justify-center rounded-lg bg-emerald-500 font-black text-white text-xs shadow-md shadow-emerald-500/20">
                K
              </div>
              <span className="text-base font-extrabold tracking-tight text-white">KAEDE</span>
              <span className="text-[10px] font-mono text-emerald-400 bg-emerald-500/10 border border-emerald-500/20 px-1.5 py-0.5 rounded">
                Console
              </span>
            </Link>

            {/* Tenant Selector Dropdown */}
            <div className="px-1">
              <DropdownMenu>
                <DropdownMenuTrigger asChild>
                  <button className="w-full flex items-center justify-between gap-2 p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-left transition-colors">
                    <div className="min-w-0 flex items-center gap-2">
                      <div className="size-5 rounded bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-[10px] font-bold shrink-0">
                        {activeWorkspace.name[0] || 'W'}
                      </div>
                      <span className="text-xs font-semibold text-white truncate">
                        {activeWorkspace.name}
                      </span>
                    </div>
                    <ChevronDown className="size-3.5 text-slate-400 shrink-0" />
                  </button>
                </DropdownMenuTrigger>
                <DropdownMenuContent align="start" className="w-56 bg-[#0F172A] border-white/10 text-slate-200">
                  <DropdownMenuLabel className="text-[10px] uppercase font-bold text-slate-400">
                    Ruang Kerja Aktif
                  </DropdownMenuLabel>
                  {workspaces.map((ws) => (
                    <DropdownMenuItem key={ws.id} asChild>
                      <Link href={`/workspaces/${ws.id}`} className="cursor-pointer text-xs font-medium flex items-center gap-2 py-1.5">
                        <Building2 className="size-3.5 text-emerald-400" />
                        <span className="truncate">{ws.name}</span>
                      </Link>
                    </DropdownMenuItem>
                  ))}
                  <DropdownMenuSeparator className="bg-white/10" />
                  <DropdownMenuItem asChild>
                    <Link href="/app/settings" className="cursor-pointer text-xs flex items-center gap-2 py-1.5">
                      <Settings className="size-3.5 text-slate-400" />
                      <span>Pengaturan Workspace</span>
                    </Link>
                  </DropdownMenuItem>
                  <DropdownMenuItem asChild>
                    <Link href="/app/workspaces" className="cursor-pointer text-xs text-emerald-400 font-bold flex items-center gap-2 py-1.5">
                      <Plus className="size-3.5" />
                      <span>Kelola & Buat Workspace</span>
                    </Link>
                  </DropdownMenuItem>
                </DropdownMenuContent>
              </DropdownMenu>
            </div>
          </div>

          {/* Navigation Groups (Domain & Ops Only) */}
          <nav className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-5 pt-3 pr-1">
            {NAV_GROUPS.map((group) => (
              <div key={group.title} className="space-y-1">
                <p className="px-3 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                  {group.title}
                </p>
                {group.items.map((item) => {
                  const Icon = item.icon;
                  const isActive = pathname === item.href || pathname.startsWith(item.href + '/');
                  return (
                    <Link
                      key={item.href}
                      href={item.href}
                      className={`flex items-center justify-between px-3 py-2 rounded-lg text-xs font-medium transition-colors ${
                        isActive
                          ? 'bg-emerald-500/15 text-emerald-300 font-semibold border border-emerald-500/30'
                          : 'text-slate-300 hover:text-white hover:bg-white/10'
                      }`}
                    >
                      <div className="flex items-center gap-2.5 min-w-0">
                        <Icon className={`size-4 shrink-0 ${isActive ? 'text-emerald-400' : 'text-slate-400'}`} />
                        <span className="truncate">{item.label}</span>
                      </div>
                    </Link>
                  );
                })}
              </div>
            ))}
          </nav>
        </div>

        {/* User Card at bottom of sidebar — opens User Profile & Settings Dropdown */}
        <div className="pt-3 border-t border-white/10 shrink-0">
          <DropdownMenu>
            <DropdownMenuTrigger asChild>
              <button className="w-full flex items-center justify-between p-2 rounded-xl bg-white/5 border border-white/10 hover:bg-white/10 text-left transition-colors group">
                <div className="min-w-0 flex items-center gap-2.5">
                  {user.image ? (
                    <img src={user.image} alt="" className="size-7 rounded-full shrink-0 border border-white/10" />
                  ) : (
                    <div className="size-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold shrink-0">
                      {user.name?.[0] || 'U'}
                    </div>
                  )}
                  <div className="min-w-0">
                    <p className="text-xs font-bold text-white truncate group-hover:text-emerald-300 transition-colors">
                      {user.name || user.email}
                    </p>
                    <p className="text-[10px] text-slate-400 truncate">@{user.githubUsername || 'operator'}</p>
                  </div>
                </div>
                <ChevronDown className="size-3.5 text-slate-400 shrink-0 group-hover:text-white transition-colors" />
              </button>
            </DropdownMenuTrigger>
            <DropdownMenuContent side="top" align="center" className="w-60 bg-[#0F172A] border-white/10 text-slate-200 shadow-xl mb-1">
              <div className="p-2.5 border-b border-white/10">
                <p className="text-xs font-bold text-white truncate">{user.name || user.email}</p>
                <p className="text-[10px] text-slate-400 truncate mt-0.5">{user.email}</p>
                <span className="mt-1.5 inline-block px-1.5 py-0.5 rounded text-[9px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {user.role || 'Member'}
                </span>
              </div>
              <DropdownMenuItem asChild>
                <Link href="/app/profile" className="cursor-pointer text-xs flex items-center gap-2 py-2">
                  <User className="size-4 text-emerald-400" />
                  <span>Akun & Profil</span>
                </Link>
              </DropdownMenuItem>
              <DropdownMenuItem asChild>
                <Link href="/app/settings" className="cursor-pointer text-xs flex items-center gap-2 py-2">
                  <Settings className="size-4 text-slate-400" />
                  <span>Pengaturan Workspace</span>
                </Link>
              </DropdownMenuItem>
              {isAdmin && (
                <DropdownMenuItem asChild>
                  <Link href="/admin" className="cursor-pointer text-xs font-bold text-amber-300 flex items-center gap-2 py-2">
                    <ShieldCheck className="size-4 text-amber-400" />
                    <span>Landlord Super Admin</span>
                  </Link>
                </DropdownMenuItem>
              )}
              <DropdownMenuSeparator className="bg-white/10" />
              <DropdownMenuItem
                onClick={() => signOut({ callbackUrl: '/' })}
                className="cursor-pointer text-xs font-semibold text-rose-400 focus:text-rose-300 flex items-center gap-2 py-2"
              >
                <LogOut className="size-4 text-rose-400" />
                <span>Keluar (Sign Out)</span>
              </DropdownMenuItem>
            </DropdownMenuContent>
          </DropdownMenu>
        </div>
      </aside>

      {/* ── MAIN CONTENT AREA (FIXED HEIGHT, INNER OVERFLOW SCROLL ONLY) ── */}
      <div className="flex-1 flex flex-col h-full min-w-0 min-h-0 overflow-hidden">
        {/* Top Header (Shrink-0) */}
        <header className="shrink-0 h-14 border-b border-white/10 bg-[#0B0F17]/90 backdrop-blur-md px-4 sm:px-6 flex items-center justify-between">
          <div className="flex items-center gap-3">
            {/* Mobile Sheet Trigger */}
            <Sheet open={sidebarOpen} onOpenChange={setSidebarOpen}>
              <SheetTrigger asChild>
                <Button variant="ghost" size="icon" className="md:hidden text-slate-400 hover:text-white">
                  <MenuIcon className="size-5" />
                </Button>
              </SheetTrigger>
              <SheetContent side="left" className="w-72 bg-[#0B0F17] text-white border-white/10 p-5 flex flex-col h-full">
                <div className="flex items-center gap-2.5 mb-6 shrink-0">
                  <div className="size-7 rounded-lg bg-emerald-500 font-black text-white flex items-center justify-center text-xs">
                    K
                  </div>
                  <span className="font-extrabold text-base">KAEDE Console</span>
                </div>
                <nav className="flex-1 overflow-y-auto [scrollbar-width:none] [-ms-overflow-style:none] [&::-webkit-scrollbar]:hidden space-y-4 pr-1">
                  {NAV_GROUPS.map((group) => (
                    <div key={group.title} className="space-y-1">
                      <p className="px-2 text-[10px] font-bold uppercase tracking-wider text-slate-400">
                        {group.title}
                      </p>
                      {group.items.map((item) => (
                        <Link
                          key={item.href}
                          href={item.href}
                          onClick={() => setSidebarOpen(false)}
                          className="flex items-center gap-2.5 px-2 py-1.5 rounded-lg text-xs text-slate-200 hover:text-white hover:bg-white/10"
                        >
                          <item.icon className="size-4 text-emerald-400" />
                          <span>{item.label}</span>
                        </Link>
                      ))}
                    </div>
                  ))}
                  {isAdmin && (
                    <Link
                      href="/admin"
                      onClick={() => setSidebarOpen(false)}
                      className="flex items-center gap-2 px-2 py-2 text-xs font-bold text-amber-400 hover:bg-amber-500/10 rounded-lg"
                    >
                      <ShieldCheck className="size-4" /> Super Admin Portal
                    </Link>
                  )}
                </nav>
                <div className="pt-4 border-t border-white/10 shrink-0 space-y-1">
                  <Link
                    href="/app/profile"
                    onClick={() => setSidebarOpen(false)}
                    className="flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-slate-300 hover:text-white hover:bg-white/10"
                  >
                    <User className="size-4 text-emerald-400" />
                    <span>Akun & Profil</span>
                  </Link>
                  <button
                    onClick={() => signOut({ callbackUrl: '/' })}
                    className="w-full flex items-center gap-2 px-3 py-2 rounded-lg text-xs text-rose-400 hover:bg-rose-500/10"
                  >
                    <LogOut className="size-4" />
                    <span>Sign Out</span>
                  </button>
                </div>
              </SheetContent>
            </Sheet>

            {/* Current Route Breadcrumb */}
            <div className="flex items-center gap-2 text-xs text-slate-300">
              <span className="text-slate-400">App</span>
              <span>/</span>
              <span className="text-white font-semibold capitalize">
                {pathname.split('/')[2] || 'Console'}
              </span>
            </div>
          </div>

          {/* Right Header Tools */}
          <div className="flex items-center gap-3">
            {/* Command Palette Trigger */}
            <button
              onClick={() => setCommandOpen(true)}
              className="flex items-center gap-2 text-xs text-slate-200 bg-white/10 hover:bg-white/15 border border-white/15 px-3 py-1.5 rounded-lg transition-colors"
            >
              <SearchIcon className="size-3.5" />
              <span className="hidden sm:inline">Search...</span>
              <kbd className="hidden sm:inline-flex items-center gap-0.5 rounded border border-white/20 bg-white/10 px-1 font-mono text-[9px] text-slate-200">
                ⌘K
              </kbd>
            </button>

            {/* Top Header User Avatar Dropdown */}
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <button className="flex items-center gap-2 p-0.5 rounded-full hover:ring-2 hover:ring-emerald-500/40 transition-all focus:outline-none">
                  {user.image ? (
                    <img src={user.image} alt="" className="size-7 rounded-full border border-white/15" />
                  ) : (
                    <div className="size-7 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xs font-bold border border-emerald-500/30">
                      {user.name?.[0] || 'U'}
                    </div>
                  )}
                </button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-56 bg-[#0F172A] border-white/10 text-slate-200 shadow-xl">
                <div className="p-2 border-b border-white/10">
                  <p className="text-xs font-bold text-white truncate">{user.name || user.email}</p>
                  <p className="text-[10px] text-slate-400 truncate">{user.email}</p>
                </div>
                <DropdownMenuItem asChild>
                  <Link href="/app/profile" className="cursor-pointer text-xs flex items-center gap-2 py-2">
                    <User className="size-4 text-emerald-400" />
                    <span>Akun & Profil</span>
                  </Link>
                </DropdownMenuItem>
                <DropdownMenuItem asChild>
                  <Link href="/app/settings" className="cursor-pointer text-xs flex items-center gap-2 py-2">
                    <Settings className="size-4 text-slate-400" />
                    <span>Pengaturan Workspace</span>
                  </Link>
                </DropdownMenuItem>
                {isAdmin && (
                  <DropdownMenuItem asChild>
                    <Link href="/admin" className="cursor-pointer text-xs font-bold text-amber-300 flex items-center gap-2 py-2">
                      <ShieldCheck className="size-4 text-amber-400" />
                      <span>Landlord Super Admin</span>
                    </Link>
                  </DropdownMenuItem>
                )}
                <DropdownMenuSeparator className="bg-white/10" />
                <DropdownMenuItem
                  onClick={() => signOut({ callbackUrl: '/' })}
                  className="cursor-pointer text-xs font-semibold text-rose-400 focus:text-rose-300 flex items-center gap-2 py-2"
                >
                  <LogOut className="size-4 text-rose-400" />
                  <span>Keluar (Sign Out)</span>
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          </div>
        </header>

        {/* ── SCROLLABLE MAIN CONTENT (ONLY THIS SCROLLS) ── */}
        <main className="flex-1 min-h-0 overflow-y-auto p-4 sm:p-6 lg:p-8">
          {children}
        </main>
      </div>

      <CommandPalette open={commandOpen} onOpenChange={setCommandOpen} />
    </div>
  );
}
