import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { users, workspaces, agentContainers, billingTransactions, coupons, affiliateCommissions } from '@/db/schema';
import { Button } from '@/components/ui/button';
import {
  ShieldCheck,
  Server,
  CreditCard,
  Users,
  Tag,
  DollarSign,
  Play,
  RotateCw,
  Plus,
  AlertTriangle,
  CheckCircle2,
  Lock,
  ExternalLink,
  Bot,
  Zap,
} from 'lucide-react';

const ADMIN_EMAILS = ['admin@konxc.space', 'konxcid@gmail.com'];
const ADMIN_USERNAMES = ['sandikodev', 'konxc'];

export default async function AdminPage() {
  const session = await auth();

  // Strict landlord gate
  const userEmail = session?.user?.email?.toLowerCase() || '';
  const githubUser = (session?.user as any)?.githubUsername?.toLowerCase() || '';
  const isAuthorized = ADMIN_EMAILS.includes(userEmail) || ADMIN_USERNAMES.includes(githubUser) || (session?.user as any)?.role === 'admin';

  if (!isAuthorized) {
    return (
      <div className="max-w-md mx-auto my-20 p-8 rounded-2xl border border-rose-500/30 bg-rose-950/20 text-center space-y-4">
        <Lock className="size-12 text-rose-400 mx-auto" />
        <h1 className="text-xl font-bold text-white">403 — Akses Ditolak</h1>
        <p className="text-xs text-slate-300">
          Halaman ini khusus diperuntukkan bagi Landlord Super Admin (<code className="text-rose-300">admin@konxc.space</code>). Akun Anda ({userEmail || 'GitHub User'}) tidak memiliki wewenang.
        </p>
        <Link href="/app/overview">
          <Button variant="outline" className="border-white/10 text-xs">
            Kembali ke App Overview
          </Button>
        </Link>
      </div>
    );
  }

  // Fetch real database summaries
  const allWorkspaces = await db.select().from(workspaces);
  const allContainers = await db.select().from(agentContainers);
  const allCoupons = await db.select().from(coupons);

  return (
    <div className="space-y-10 max-w-7xl mx-auto">
      {/* Landlord Header */}
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-amber-500/20 bg-amber-950/10 -mx-4 -mt-4 p-6 rounded-2xl">
        <div className="flex items-center gap-3">
          <div className="size-12 rounded-2xl bg-amber-500/20 border border-amber-500/40 flex items-center justify-center text-amber-400 shadow-lg">
            <ShieldCheck className="size-7" />
          </div>
          <div>
            <div className="flex items-center gap-2">
              <h1 className="text-2xl font-black text-white tracking-tight">Landlord Super Admin Console</h1>
              <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-500 text-slate-950">
                MASTER CONTROL
              </span>
            </div>
            <p className="text-xs text-amber-200/80 mt-0.5">
              Operator Logged In: <strong className="text-white">{userEmail || 'admin@konxc.space'}</strong> · PT Koneksi Jaringan Indonesia
            </p>
          </div>
        </div>

        <div className="flex items-center gap-2">
          <span className="px-3 py-1 rounded-lg bg-emerald-500/10 border border-emerald-500/20 text-xs text-emerald-400 font-semibold">
            ● Gateway Live
          </span>
          <span className="px-3 py-1 rounded-lg bg-purple-500/10 border border-purple-500/20 text-xs text-purple-400 font-semibold">
            Docker Fleet Ready
          </span>
        </div>
      </div>

      {/* Financial & Operational High-Level Ledger */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-1.5">
          <span className="text-xs text-slate-400 flex items-center justify-between">
            GMV Rupiah (Midtrans)
            <CreditCard className="size-4 text-emerald-400" />
          </span>
          <p className="text-2xl font-black text-emerald-400">Rp 28.450.000</p>
          <p className="text-[10px] text-slate-500">Bulan ini (QRIS & VA)</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-1.5">
          <span className="text-xs text-slate-400 flex items-center justify-between">
            GMV Valas (Stripe)
            <DollarSign className="size-4 text-sky-400" />
          </span>
          <p className="text-2xl font-black text-sky-400">$1,890 USD</p>
          <p className="text-[10px] text-slate-500">Kartu Kredit Internasional</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-1.5">
          <span className="text-xs text-slate-400 flex items-center justify-between">
            Total Tenants
            <Users className="size-4 text-purple-400" />
          </span>
          <p className="text-2xl font-black text-white">{allWorkspaces.length || 1}</p>
          <p className="text-[10px] text-slate-500">Koneksi, SMA UII, Agensi</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-1.5">
          <span className="text-xs text-slate-400 flex items-center justify-between">
            Container Fleet
            <Server className="size-4 text-amber-400" />
          </span>
          <p className="text-2xl font-black text-amber-400">{allContainers.length || 2} Active</p>
          <p className="text-[10px] text-slate-500">Docker shared hosting</p>
        </div>
      </div>

      {/* SECTION 1: DOCKER CONTAINER FLEET & MANUAL PROVISIONING */}
      <div className="rounded-2xl border border-purple-500/30 bg-[#0F172A]/80 p-6 space-y-6">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-white/10">
          <div>
            <h2 className="text-lg font-bold text-white flex items-center gap-2">
              <Server className="size-5 text-purple-400" />
              Shared Container Fleet & Manual Provisioning Override
            </h2>
            <p className="text-xs text-slate-400 mt-1">
              Jika ada klien (sekolah/agensi) yang pembayaran otomatisnya bermasalah, admin dapat men-spawn container Hermes/OpenClaw secara manual di sini.
            </p>
          </div>

          <Button className="bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs h-9 shadow-lg shadow-purple-600/30">
            <Plus className="mr-1.5 size-3.5" /> Manual Provision Container
          </Button>
        </div>

        {/* Quick Manual Provision Form Simulation */}
        <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-3">
          <h3 className="text-xs font-bold text-emerald-400 uppercase tracking-wider">
            Quick Spawn New Customer Container:
          </h3>
          <div className="grid grid-cols-1 sm:grid-cols-4 gap-3 text-xs">
            <input
              placeholder="Email / Nama Tenant (e.g. guru@smauii.sch.id)"
              className="h-9 rounded-lg border border-white/15 bg-white/5 px-3 text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400"
            />
            <select className="h-9 rounded-lg border border-white/15 bg-slate-900 px-3 text-white focus:outline-none">
              <option value="hermes-whatsapp">Hermes WhatsApp (24/7 Bot)</option>
              <option value="openclaw">OpenClaw (Server Drone)</option>
            </select>
            <select className="h-9 rounded-lg border border-white/15 bg-slate-900 px-3 text-white focus:outline-none">
              <option value="srv1">Host: srv1.konxc.space</option>
              <option value="srv2">Host: srv2.koneksi.co.id</option>
            </select>
            <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold h-9 shadow-md shadow-emerald-500/20">
              <Zap className="mr-1.5 size-3.5" /> Launch Container
            </Button>
          </div>
        </div>

        {/* Active Container Fleet Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Container ID / Name</th>
                <th className="py-2.5 px-3">Tenant / Workspace</th>
                <th className="py-2.5 px-3">Agent Type</th>
                <th className="py-2.5 px-3">Host & Port</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Actions</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5">
                <td className="py-3 px-3 font-mono text-emerald-300 font-bold">cnt-hermes-smauii</td>
                <td className="py-3 px-3 text-white font-medium">SMA UII Yogyakarta</td>
                <td className="py-3 px-3 text-slate-300">Hermes WhatsApp</td>
                <td className="py-3 px-3 font-mono text-slate-400">srv1.konxc.space:3044</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                    ● Running
                  </span>
                </td>
                <td className="py-3 px-3 text-right space-x-2">
                  <button className="text-amber-400 hover:underline">Restart</button>
                  <button className="text-rose-400 hover:underline">Stop</button>
                </td>
              </tr>
              <tr className="hover:bg-white/5">
                <td className="py-3 px-3 font-mono text-sky-300 font-bold">cnt-openclaw-konxc</td>
                <td className="py-3 px-3 text-white font-medium">PT Koneksi Jaringan</td>
                <td className="py-3 px-3 text-slate-300">OpenClaw Drone</td>
                <td className="py-3 px-3 font-mono text-slate-400">srv1.konxc.space:3048</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 text-[10px] font-mono">
                    ● Running
                  </span>
                </td>
                <td className="py-3 px-3 text-right space-x-2">
                  <button className="text-amber-400 hover:underline">Restart</button>
                  <button className="text-rose-400 hover:underline">Stop</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>

      {/* SECTION 2: DUAL GATEWAY CONFIGURATION & AFFILIATE ENGINE */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
        {/* Gateway Credentials */}
        <div className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <CreditCard className="size-4 text-emerald-400" />
              Payment Gateway Settings (Live / Sandbox)
            </h3>
            <span className="text-[10px] font-mono text-emerald-400">Encrypted</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="space-y-1">
              <label className="text-slate-400">Midtrans Server Key (IDR)</label>
              <input
                type="password"
                defaultValue="SB-Mid-server-xxxxxxxxxxxx"
                className="w-full h-8 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white"
              />
            </div>
            <div className="space-y-1">
              <label className="text-slate-400">Stripe Secret Key (USD)</label>
              <input
                type="password"
                defaultValue="sk_test_51xxxxxxxxxxxxxxx"
                className="w-full h-8 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white"
              />
            </div>
            <Button size="sm" className="w-full bg-white/10 hover:bg-white/20 text-white text-xs h-8">
              Update Kredensial Gateway
            </Button>
          </div>
        </div>

        {/* Affiliate & Coupon Controls */}
        <div className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-6 space-y-4">
          <div className="flex items-center justify-between pb-3 border-b border-white/10">
            <h3 className="font-bold text-white text-sm flex items-center gap-2">
              <Tag className="size-4 text-amber-400" />
              Kupon Promo & Komisi Afiliasi
            </h3>
            <span className="text-[10px] font-mono text-amber-400">20% Recurring</span>
          </div>

          <div className="space-y-3 text-xs">
            <div className="flex gap-2">
              <input
                placeholder="Kode Kupon Baru (e.g. SMAUII2026)"
                className="flex-1 h-8 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white uppercase font-mono"
              />
              <input
                placeholder="Diskon %"
                defaultValue="50"
                className="w-20 h-8 rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white text-center font-mono"
              />
              <Button size="sm" className="bg-amber-600 hover:bg-amber-500 text-white font-bold h-8 text-xs shadow-md shadow-amber-500/20">
                Buat Kupon
              </Button>
            </div>

            <div className="pt-2">
              <span className="text-[11px] text-slate-400 block mb-1.5 font-medium">Kupon Aktif:</span>
              <div className="flex flex-wrap gap-2">
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white font-mono text-[11px]">
                  LAUNCH50 (50% Off) · 24/100 Digunakan
                </span>
                <span className="px-2 py-1 rounded bg-white/5 border border-white/10 text-white font-mono text-[11px]">
                  SMAUII (Edukasi 100%) · 1 Digunakan
                </span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
