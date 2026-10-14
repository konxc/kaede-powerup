import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { CreditCard, ShieldCheck, CheckCircle2, QrCode, FileText, ArrowRight, Tag, Sparkles } from 'lucide-react';

export default function BillingPage() {
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
          <Button variant="outline" className="text-xs h-9 border-white/10 text-slate-200">
            Lihat Matriks Paket Lengkap →
          </Button>
        </Link>
      </div>

      {/* Current Active Plan Card */}
      <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-4">
        <div className="flex flex-wrap items-center justify-between gap-4 pb-4 border-b border-emerald-500/20">
          <div>
            <span className="text-[10px] font-mono uppercase font-bold text-emerald-400 tracking-wider">
              Paket Aktif Workspace
            </span>
            <h2 className="text-xl font-black text-white mt-0.5">Agency Multi-Tenant Workspace</h2>
            <p className="text-xs text-slate-300 mt-1">
              Termasuk unlimited Trello boards, multi-profile context switching, dan 1x Hermes Container.
            </p>
          </div>
          <div className="text-right">
            <span className="text-2xl font-black text-white">Rp 749.000</span>
            <span className="text-xs text-slate-400 block">/ bulan</span>
          </div>
        </div>

        <div className="flex flex-wrap items-center justify-between gap-4 text-xs text-slate-300">
          <div className="flex items-center gap-4">
            <span>Metode: <strong>Midtrans QRIS / BCA VA</strong></span>
            <span>·</span>
            <span>Tagihan Berikutnya: <strong>14 November 2026</strong></span>
          </div>
          <Button size="sm" variant="outline" className="border-white/10 text-xs h-8">
            Ubah Metode Pembayaran
          </Button>
        </div>
      </div>

      {/* Dual Payment Methods Showcase */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Midtrans Card */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Pembayaran Lokal Indonesia (IDR)</h3>
            <span className="text-[10px] font-mono text-emerald-400 font-bold px-2 py-0.5 rounded bg-emerald-500/10 border border-emerald-500/20">
              Midtrans Active
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mendukung pembayaran instan dengan <strong>QRIS</strong> (GoPay, OVO, ShopeePay, DANA) dan <strong>Virtual Account Bank</strong> (BCA, Mandiri, BRI, BNI).
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs text-emerald-400">
            <CheckCircle2 className="size-4" />
            <span>Verifikasi otomatis dalam 10 detik tanpa konfirmasi manual</span>
          </div>
        </div>

        {/* Stripe Card */}
        <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
          <div className="flex items-center justify-between">
            <h3 className="font-bold text-white text-base">Global & International Cards (USD)</h3>
            <span className="text-[10px] font-mono text-sky-400 font-bold px-2 py-0.5 rounded bg-sky-500/10 border border-sky-500/20">
              Stripe Active
            </span>
          </div>
          <p className="text-xs text-slate-400 leading-relaxed">
            Mendukung <strong>Visa, MasterCard, American Express, Apple Pay, dan Google Pay</strong> untuk klien internasional di luar Indonesia.
          </p>
          <div className="pt-2 flex items-center gap-2 text-xs text-sky-400">
            <CheckCircle2 className="size-4" />
            <span>Faktur komersial bertaraf internasional dengan pajak terhitung</span>
          </div>
        </div>
      </div>

      {/* Transaction & Invoices Table */}
      <div className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-6 space-y-4">
        <h3 className="font-bold text-white text-base flex items-center gap-2">
          <FileText className="size-4 text-emerald-400" />
          Riwayat Faktur & Pembayaran
        </h3>

        <div className="overflow-x-auto">
          <table className="w-full text-left text-xs border-collapse">
            <thead>
              <tr className="border-b border-white/10 text-slate-400 font-mono">
                <th className="py-2.5 px-3">Nomor Invoice</th>
                <th className="py-2.5 px-3">Deskripsi Layanan</th>
                <th className="py-2.5 px-3">Gateway</th>
                <th className="py-2.5 px-3">Jumlah</th>
                <th className="py-2.5 px-3">Status</th>
                <th className="py-2.5 px-3 text-right">Faktur PDF</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/5">
              <tr className="hover:bg-white/5">
                <td className="py-3 px-3 font-mono text-white">INV-2026-10-001</td>
                <td className="py-3 px-3 text-white">Langganan Agency + Hermes Container</td>
                <td className="py-3 px-3 text-slate-300">Midtrans QRIS</td>
                <td className="py-3 px-3 font-bold text-emerald-400">Rp 749.000</td>
                <td className="py-3 px-3">
                  <span className="px-2 py-0.5 rounded text-[10px] bg-emerald-500/10 text-emerald-300 border border-emerald-500/20">
                    Lunas (Settled)
                  </span>
                </td>
                <td className="py-3 px-3 text-right">
                  <button className="text-emerald-400 hover:underline">Download</button>
                </td>
              </tr>
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
