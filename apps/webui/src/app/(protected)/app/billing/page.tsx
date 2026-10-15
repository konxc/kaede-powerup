import Link from 'next/link';
import { inArray, desc } from 'drizzle-orm';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { billingTransactions } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';
import { Button } from '@/components/ui/button';
import { CreditCard, ShieldCheck, CheckCircle2, QrCode, FileText, ArrowRight, Tag, Sparkles } from 'lucide-react';

export default async function BillingPage() {
  const session = await auth();
  const githubUserId = (session?.user as any)?.githubId || session?.user?.id || '';
  const accessibleWorkspaceIds = githubUserId ? await getAccessibleWorkspaceIdsForUser(githubUserId) : [];

  let transactions: any[] = [];
  try {
    if (accessibleWorkspaceIds.length) {
      transactions = await db
        .select()
        .from(billingTransactions)
        .where(inArray(billingTransactions.workspaceId, accessibleWorkspaceIds))
        .orderBy(desc(billingTransactions.createdAt));
    }
  } catch (err) {
    console.warn('[BillingPage] Failed to fetch transactions:', err);
  }

  const totalIdr = transactions
    .filter((t) => t.currency === 'IDR' && t.status === 'settlement')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  const totalUsd = transactions
    .filter((t) => t.currency === 'USD' && t.status === 'settlement')
    .reduce((sum, t) => sum + (t.amount || 0), 0);

  return (
    <div className="space-y-8 max-w-6xl mx-auto">
      <div className="flex flex-wrap items-center justify-between gap-4 pb-6 border-b border-white/10">
        <div>
          <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Billing & Invoices</h1>
          <p className="text-xs sm:text-sm text-slate-400 mt-1">
            Kelola langganan workspace, sewa kontainer Docker, serta riwayat transaksi Midtrans (IDR) & Stripe (USD).
          </p>
        </div>

        <Link href="/pricing">
          <Button variant="outline" className="text-xs h-9 border-white/10 text-slate-200 hover:text-white">
            Lihat Matriks Paket Lengkap →
          </Button>
        </Link>
      </div>

      {/* Summary Cards */}
      <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
        <div className="p-5 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-2">
          <span className="text-xs text-emerald-300 font-medium flex items-center justify-between">
            Total Pengeluaran IDR (Midtrans)
            <CreditCard className="size-4 text-emerald-400" />
          </span>
          <p className="text-2xl font-black text-white">
            {totalIdr > 0 ? `Rp ${totalIdr.toLocaleString('id-ID')}` : 'Rp 0'}
          </p>
          <p className="text-[10px] text-emerald-300">QRIS & Virtual Account</p>
        </div>

        <div className="p-5 rounded-2xl border border-sky-500/30 bg-sky-950/20 space-y-2">
          <span className="text-xs text-sky-300 font-medium flex items-center justify-between">
            Total Pengeluaran Valas (Stripe)
            <CreditCard className="size-4 text-sky-400" />
          </span>
          <p className="text-2xl font-black text-white">
            {totalUsd > 0 ? `$${(totalUsd / 100).toFixed(2)} USD` : '$0.00 USD'}
          </p>
          <p className="text-[10px] text-sky-300">Kartu Kredit Global</p>
        </div>

        <div className="p-5 rounded-2xl border border-white/10 bg-white/5 space-y-2">
          <span className="text-xs text-slate-300 font-medium flex items-center justify-between">
            Total Transaksi
            <FileText className="size-4 text-purple-400" />
          </span>
          <p className="text-2xl font-black text-white">{transactions.length}</p>
          <p className="text-[10px] text-slate-400">Faktur tercatat di ledger</p>
        </div>
      </div>

      {/* Dual Payment Methods Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Midtrans Card */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Pembayaran Lokal Indonesia (IDR)</h3>
            <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              Midtrans Active
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Mendukung pembayaran instan dengan <strong>QRIS</strong> (GoPay, OVO, ShopeePay, DANA) dan <strong>Virtual Account Bank</strong> (BCA, Mandiri, BRI, BNI).
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Verifikasi otomatis dalam 10 detik tanpa konfirmasi manual</span>
          </div>
        </div>

        {/* Stripe Card */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Global & International Cards (USD)</h3>
            <span className="text-[10px] font-mono text-sky-400 font-bold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
              Stripe Active
            </span>
          </div>
          <p className="text-xs text-slate-300 leading-relaxed">
            Mendukung <strong>Visa, MasterCard, American Express, Apple Pay, dan Google Pay</strong> untuk klien internasional di luar Indonesia.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs text-sky-400">
            <CheckCircle2 className="size-4 shrink-0" />
            <span>Faktur komersial bertaraf internasional dengan pajak terhitung</span>
          </div>
        </div>
      </div>

      {/* Transaction & Invoices Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-6 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <FileText className="size-4 text-emerald-400" />
          Riwayat Faktur & Pembayaran ({transactions.length})
        </h3>

        {transactions.length > 0 ? (
          <div className="overflow-x-auto">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 text-slate-400 font-mono">
                  <th className="py-2.5 px-3">Transaction ID</th>
                  <th className="py-2.5 px-3">Gateway & Item</th>
                  <th className="py-2.5 px-3">Nominal</th>
                  <th className="py-2.5 px-3">Metode</th>
                  <th className="py-2.5 px-3">Status</th>
                  <th className="py-2.5 px-3 text-right">Tanggal</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {transactions.map((trx) => (
                  <tr key={trx.id} className="hover:bg-white/5">
                    <td className="py-3 px-3 font-mono text-white font-medium">
                      {trx.gatewayTransactionId || trx.id.slice(0, 8)}
                    </td>
                    <td className="py-3 px-3 text-slate-300">
                      <span className="capitalize">{trx.gateway}</span> · <span className="capitalize">{trx.itemType}</span>
                    </td>
                    <td className="py-3 px-3 font-bold text-white">
                      {trx.currency === 'IDR'
                        ? `Rp ${trx.amount.toLocaleString('id-ID')}`
                        : `$${(trx.amount / 100).toFixed(2)} USD`}
                    </td>
                    <td className="py-3 px-3 uppercase font-mono text-slate-400 text-[11px]">
                      {trx.paymentType || 'QRIS'}
                    </td>
                    <td className="py-3 px-3">
                      <span
                        className={`px-2 py-0.5 rounded text-[10px] font-mono font-bold ${
                          trx.status === 'settlement'
                            ? 'bg-emerald-500/10 text-emerald-400 border border-emerald-500/20'
                            : 'bg-amber-500/10 text-amber-400 border border-amber-500/20'
                        }`}
                      >
                        ● {trx.status}
                      </span>
                    </td>
                    <td className="py-3 px-3 text-right text-slate-400 text-[11px]">
                      {new Date(trx.createdAt).toLocaleDateString('id-ID')}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        ) : (
          <div className="p-8 rounded-2xl border border-dashed border-white/10 text-center text-xs text-slate-400">
            Belum ada transaksi pembayaran di workspace ini.
          </div>
        )}
      </div>
    </div>
  );
}
