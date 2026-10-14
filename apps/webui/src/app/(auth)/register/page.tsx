import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Github, ArrowRight, ShieldCheck, Tag, Users, Sparkles } from 'lucide-react';

async function signUpWithGitHub() {
  'use server';
  await signIn('github', { redirectTo: '/app/overview' });
}

export default async function RegisterPage(props: {
  searchParams: Promise<{ ref?: string; coupon?: string }>;
}) {
  const session = await auth();
  if (session?.user) {
    redirect('/app/overview');
  }

  const searchParams = await props.searchParams;
  const affiliateRef = searchParams.ref || '';
  const couponCode = searchParams.coupon || '';

  return (
    <div className="space-y-3.5 sm:space-y-4">
      <div className="space-y-1">
        <div className="inline-flex items-center gap-1.5 px-2 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[10px] font-semibold text-emerald-400 mb-0.5">
          <Sparkles className="size-3" />
          <span>Mulai Uji Coba Gratis</span>
        </div>
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Daftarkan Workspace KAEDE
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Buat ruang kerja tim Anda, sambungkan Trello kanban, dan aktifkan autonomous AI agents.
        </p>
      </div>

      {/* Referral & Coupon Banners */}
      {(affiliateRef || couponCode) && (
        <div className="space-y-1.5">
          {affiliateRef && (
            <div className="p-2 sm:p-2.5 rounded-lg bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2 text-xs text-indigo-300">
              <Users className="size-3.5 text-indigo-400 shrink-0" />
              <span>
                Undangan Afiliasi Mitra: <strong className="text-white">@{affiliateRef}</strong> aktif.
              </span>
            </div>
          )}
          {couponCode && (
            <div className="p-2 sm:p-2.5 rounded-lg bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2 text-xs text-emerald-300">
              <Tag className="size-3.5 text-emerald-400 shrink-0" />
              <span>
                Kupon Promosi <strong className="text-white">{couponCode.toUpperCase()}</strong> berhasil diterapkan!
              </span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-3 pt-0.5">
        <form action={signUpWithGitHub}>
          <Button
            type="submit"
            className="w-full h-10 sm:h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all"
          >
            <Github className="mr-2 size-4 sm:size-5" /> Daftar Cepat dengan GitHub
          </Button>
        </form>

        <div className="relative my-2 sm:my-2.5">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/15" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
            <span className="bg-[#0B0F17] px-2.5 text-slate-300 font-medium">Kupon & Referal Opsional</span>
          </div>
        </div>

        {/* Affiliate & Coupon Inputs */}
        <div className="grid grid-cols-2 gap-2.5 text-xs">
          <div className="space-y-1">
            <label className="text-[11px] text-slate-200 font-semibold" htmlFor="ref-input">
              Kode Referal
            </label>
            <input
              id="ref-input"
              defaultValue={affiliateRef}
              placeholder="e.g. SANDIKO"
              className="h-8.5 sm:h-9 w-full rounded-lg border border-white/20 bg-white/10 px-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 uppercase font-mono"
            />
          </div>
          <div className="space-y-1">
            <label className="text-[11px] text-slate-200 font-semibold" htmlFor="coupon-input">
              Kupon Diskon
            </label>
            <input
              id="coupon-input"
              defaultValue={couponCode}
              placeholder="e.g. LAUNCH50"
              className="h-8.5 sm:h-9 w-full rounded-lg border border-white/20 bg-white/10 px-2.5 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 uppercase font-mono"
            />
          </div>
        </div>
      </div>

      <div className="p-2.5 sm:p-3 rounded-xl border border-white/15 bg-white/5 flex items-start gap-2.5 text-[11px] sm:text-xs text-slate-200 leading-relaxed">
        <ShieldCheck className="size-4 text-emerald-400 mt-0.5 shrink-0" />
        <span>
          Dengan mendaftar, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi PT Koneksi Jaringan Indonesia. Zero code training guarantee.
        </span>
      </div>

      <div className="text-center text-xs text-slate-300 pt-3 sm:pt-4 border-t border-white/15">
        Sudah memiliki akun?{' '}
        <Link href="/login" className="text-emerald-400 hover:text-emerald-300 hover:underline font-bold">
          Masuk ke Workspace →
        </Link>
      </div>
    </div>
  );
}
