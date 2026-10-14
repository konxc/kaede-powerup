import Link from 'next/link';
import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Users, Sparkles, Copy, CheckCircle2, DollarSign, ArrowRight, Share2, Wallet } from 'lucide-react';

export default async function AffiliatePage() {
  const session = await auth();
  const username = (session?.user as any)?.githubUsername || 'partner';
  const referralUrl = `https://agentdesktop.vercel.app/register?ref=${username}`;

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400 mb-2">
            <Sparkles className="size-3" />
            <span>20% Recurring Commission</span>
          </div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
            Program Afiliasi & Kemitraan KAEDE
          </h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Bagikan tautan referal Anda kepada sekolah, yayasan, atau agensi rekanan dan dapatkan komisi berulang setiap bulan.
          </p>
        </div>

        <Button className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs h-9 shadow-md shadow-emerald-500/20">
          <Wallet className="mr-1.5 size-3.5" /> Ajukan Penarikan Komisi
        </Button>
      </div>

      {/* Referral Link Copy Box */}
      <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-4">
        <h3 className="font-bold text-white text-sm flex items-center gap-2">
          <Share2 className="size-4 text-emerald-400" />
          Tautan Referal Unik Anda
        </h3>
        <div className="flex gap-2">
          <input
            readOnly
            value={referralUrl}
            className="flex-1 h-10 rounded-xl border border-white/15 bg-white/5 px-4 text-xs sm:text-sm font-mono text-emerald-300 focus:outline-none"
          />
          <Button variant="outline" className="border-emerald-500/30 text-emerald-300 hover:bg-emerald-500/10 text-xs px-4">
            <Copy className="mr-1.5 size-3.5" /> Salin Tautan
          </Button>
        </div>
        <p className="text-[11px] text-slate-300">
          Cookie referal disimpan selama 30 hari. Siapa pun yang mendaftar via tautan ini akan otomatis terikat ke akun Anda.
        </p>
      </div>

      {/* Performance Metrics Cards */}
      <div className="grid grid-cols-2 lg:grid-cols-4 gap-4">
        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-1.5">
          <span className="text-xs text-slate-300">Total Klik Tautan</span>
          <p className="text-2xl font-black text-white">184</p>
          <p className="text-[10px] text-slate-400">Unik pengunjung</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-1.5">
          <span className="text-xs text-slate-300">Pendaftar Akun</span>
          <p className="text-2xl font-black text-sky-400">28</p>
          <p className="text-[10px] text-slate-400">Konversi 15.2%</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-1.5">
          <span className="text-xs text-slate-300">Pelanggan Aktif</span>
          <p className="text-2xl font-black text-purple-400">6</p>
          <p className="text-[10px] text-slate-400">Langganan Pro & Agency</p>
        </div>

        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-1.5">
          <span className="text-xs text-emerald-300">Komisi Siap Tarik</span>
          <p className="text-2xl font-black text-emerald-400">Rp 1.498.000</p>
          <p className="text-[10px] text-emerald-300">Minimal penarikan Rp 200rb</p>
        </div>
      </div>
    </div>
  );
}
