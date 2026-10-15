import Link from 'next/link';
import { inArray } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { agentContainers } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';
import { Button } from '@/components/ui/button';
import { ContainerCard } from './container-card';
import { Server, Bot, Plus, MessageSquare } from 'lucide-react';

export default async function HostingPage() {
  const session = await auth();
  const githubUserId = (session?.user as any)?.githubId || session?.user?.id || '';
  const accessibleWorkspaceIds = githubUserId ? await getAccessibleWorkspaceIdsForUser(githubUserId) : [];

  let containers: any[] = [];
  try {
    if (accessibleWorkspaceIds.length) {
      containers = await db
        .select()
        .from(agentContainers)
        .where(inArray(agentContainers.workspaceId, accessibleWorkspaceIds));
    }
  } catch (err) {
    console.warn('[HostingPage] Failed to fetch containers:', err);
  }

  return (
    <div className="space-y-8 max-w-7xl mx-auto">
      {/* Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-purple-500/10 border border-purple-500/20 text-[11px] font-semibold text-purple-400 mb-2">
            <Server className="size-3" />
            <span>Shared Docker Container Fleet</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Cloud Hosting untuk Headless Agents
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Jalankan agen 24/7 (Hermes WhatsApp & OpenClaw) di kontainer Docker terisolasi tanpa Anda harus mengelola VPS sendiri.
          </p>
        </div>

        <div className="flex items-center gap-3">
          <a
            href="https://wa.me/6281234567890?text=Halo%20Admin%20KAEDE,%20saya%20butuh%20bantuan%20aktivasi%20container%20Hermes"
            target="_blank"
            rel="noopener noreferrer"
          >
            <Button variant="outline" className="text-xs h-9 border-white/10 text-slate-200 hover:text-white">
              <MessageSquare className="mr-1.5 size-3.5 text-emerald-400" /> Bantuan CS Manual
            </Button>
          </a>
          <Link href="/app/billing">
            <Button className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9 shadow-md shadow-purple-600/20">
              <Plus className="mr-1.5 size-3.5" /> Order Container Baru
            </Button>
          </Link>
        </div>
      </div>

      {/* Active Containers Section */}
      <div className="space-y-4">
        <h2 className="text-base font-bold text-white flex items-center gap-2">
          <Bot className="size-4 text-emerald-400" />
          Kontainer Aktif Anda ({containers.length})
        </h2>

        {containers.length > 0 ? (
          <div className="space-y-6">
            {containers.map((c) => (
              <ContainerCard key={c.id} container={c} />
            ))}
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-xs text-slate-400 space-y-3">
            <Bot className="size-8 text-slate-500 mx-auto" />
            <p>Belum ada kontainer Docker aktif di workspace ini.</p>
          </div>
        )}
      </div>

      {/* Pricing / Packages to Add More Containers */}
      <div className="space-y-4 pt-4 border-t border-white/10">
        <h2 className="text-base font-bold text-white">Pilih Paket Docker Hosting Tambahan</h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Hermes Package */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">Hermes Micro (WhatsApp 24/7)</h3>
                <span className="text-xs font-bold text-emerald-400">Rp 149.000 / bln</span>
              </div>
              <p className="text-xs text-slate-300">
                Cocok untuk bot customer service, penerima brief klien WhatsApp, dan pembuat kartu Trello otomatis.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-2">
                <li>• 1 vCPU Dedicated Docker Container</li>
                <li>• 1 GB RAM & Enkripsi Volume Sesi WhatsApp</li>
                <li>• Webhook Trello & Notion Realtime</li>
              </ul>
            </div>
            <Link href="/app/billing">
              <Button className="w-full bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 shadow-md shadow-emerald-500/20">
                Sewa Kontainer Hermes
              </Button>
            </Link>
          </div>

          {/* OpenClaw Package */}
          <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4 flex flex-col justify-between">
            <div className="space-y-2">
              <div className="flex items-center justify-between">
                <h3 className="font-bold text-white text-base">OpenClaw Drone (Server Ops)</h3>
                <span className="text-xs font-bold text-purple-400">Rp 249.000 / bln</span>
              </div>
              <p className="text-xs text-slate-300">
                Cocok untuk pemantauan server otomatis, rotasi backup database, dan eksekusi cron job berulang.
              </p>
              <ul className="space-y-1.5 text-xs text-slate-300 pt-2">
                <li>• 2 vCPU Dedicated Container</li>
                <li>• 2 GB RAM & SSH Tunneling Access</li>
                <li>• Codebase Memory MCP Integration</li>
              </ul>
            </div>
            <Link href="/app/billing">
              <Button variant="outline" className="w-full border-purple-500/40 text-purple-300 hover:bg-purple-500/10 text-xs h-9 font-bold">
                Sewa Kontainer OpenClaw
              </Button>
            </Link>
          </div>
        </div>
      </div>
    </div>
  );
}
