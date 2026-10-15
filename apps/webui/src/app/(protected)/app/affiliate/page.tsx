import Link from 'next/link';
import { eq, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { affiliateCommissions } from '@/db/schema';
import { Button } from '@/components/ui/button';
import { Users, Sparkles, Copy, CheckCircle2, DollarSign, ArrowRight, Share2, Wallet, Clock } from 'lucide-react';

export default async function AffiliatePage() {
  const session = await auth();
  const userId = session?.user?.id || '';
  const username = (session?.user as any)?.githubUsername || 'partner';
  const referralUrl = `https://agentdesktop.vercel.app/register?ref=${username}`;

  let commissions: any[] = [];
  try {
    if (userId) {
      commissions = await db
        .select()
        .from(affiliateCommissions)
        .where(eq(affiliateCommissions.affiliateUserId, userId))
        .orderBy(desc(affiliateCommissions.createdAt));
    }
  } catch (err) {
    console.warn('[AffiliatePage] Failed to fetch commissions:', err);
  }

  const approvedCommission = commissions
    .filter((c) => c.status === 'approved')
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

  const paidCommission = commissions
    .filter((c) => c.status === 'paid')
    .reduce((sum, c) => sum + (c.commissionAmount || 0), 0);

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
        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-1.5">
          <span className="text-xs text-emerald-300 font-medium">Komisi Siap Tarik</span>
          <p className="text-2xl font-black text-white">
            {approvedCommission > 0 ? `Rp ${approvedCommission.toLocaleString('id-ID')}` : 'Rp 0'}
          </p>
          <p className="text-[10px] text-emerald-300">Status: Disetujui</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-1.5">
          <span className="text-xs text-slate-300 font-medium">Total Telah Dicairkan</span>
          <p className="text-2xl font-black text-emerald-400">
            {paidCommission > 0 ? `Rp ${paidCommission.toLocaleString('id-ID')}` : 'Rp 0'}
          </p>
          <p className="text-[10px] text-slate-400">Masuk rekening/e-wallet</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-1.5">
          <span className="text-xs text-slate-300 font-medium">Total Referal</span>
          <p className="text-2xl font-black text-white">{commissions.length}</p>
          <p className="text-[10px] text-slate-400">Transaksi binaan</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-1.5">
          <span className="text-xs text-slate-300 font-medium">Bagi Hasil</span>
          <p className="text-2xl font-black text-sky-400">20%</p>
          <p className="text-[10px] text-slate-400">Recurring selamanya</p>
        </div>
      </div>

      {/* Commission Ledger Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-6 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <DollarSign className="size-4 text-emerald-400" />
          Riwayat Komisi Afiliasi ({commissions.length})
        </h3>

        {commissions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-mono">
                  <th className="py-2.5 px-3">Commission ID</th>
                  <th className="py-2.5 px-3">Nominal Komisi</th>
                  <th className="py-2.5 px-3">Rate</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {commissions.map((comm) => (
                  <tr key={comm.id} className="hover:bg-white/5">
                    <td className="py-3 px-3 font-mono text-white font-medium">
                      {comm.id.slice(0, 12)}
                    </td>
                    <td className="py-3 px-3 font-bold text-emerald-400">
                      Rp {comm.commissionAmount.toLocaleString('id-ID')}
                    </td>
                    <td className="py-3 px-3 font-mono text-slate-300">
                      {comm.commissionRate}%
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          comm.status === 'paid'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        ● {comm.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                      {new Date(comm.createdAt).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-xs text-slate-400">
            Belum ada komisi referal yang tercatat. Bagikan tautan unik Anda untuk mulai mendapatkan komisi 20%!
          </div>
        )}
      </div>
    </div>
  );
}
