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
    <div className="space-y-6">
      <div className="space-y-2">
        <div className="inline-flex items-center gap-1.5 px-2.5 py-0.5 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-[11px] font-semibold text-emerald-400 mb-1">
          <Sparkles className="size-3" />
          <span>Mulai Uji Coba Gratis</span>
        </div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">
          Daftarkan Workspace KAEDE
        </h1>
        <p className="text-xs sm:text-sm text-slate-400">
          Buat ruang kerja tim Anda, sambungkan Trello kanban, dan aktifkan autonomous AI agents.
        </p>
      </div>

      {/* Referral & Coupon Banners */}
      {(affiliateRef || couponCode) && (
        <div className="space-y-2">
          {affiliateRef && (
            <div className="p-3 rounded-xl bg-indigo-950/40 border border-indigo-500/30 flex items-center gap-2.5 text-xs text-indigo-300">
              <Users className="size-4 text-indigo-400 shrink-0" />
              <span>
                Undangan Afiliasi Mitra: <strong className="text-white">@{affiliateRef}</strong> aktif.
              </span>
            </div>
          )}
          {couponCode && (
            <div className="p-3 rounded-xl bg-emerald-950/40 border border-emerald-500/30 flex items-center gap-2.5 text-xs text-emerald-300">
              <Tag className="size-4 text-emerald-400 shrink-0" />
              <span>
                Kupon Promosi <strong className="text-white">{couponCode.toUpperCase()}</strong> berhasil diterapkan!
              </span>
            </div>
          )}
        </div>
      )}

      <div className="space-y-4 pt-2">
        <form action={signUpWithGitHub}>
          <Button
            type="submit"
            className="w-full h-11 bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-sm shadow-lg shadow-emerald-500/20 transition-all"
          >
            <Github className="mr-2 size-5" /> Daftar Cepat dengan GitHub
          </Button>
        </form>

        <div className="relative my-4">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/10" />
          </div>
          <div className="relative flex justify-center text-[11px] uppercase tracking-wider">
            <span className="bg-[#0B0F17] px-3 text-slate-500">Kupon & Referal Opsional</span>
          </div>
        </div>

        {/* Affiliate & Coupon Inputs */}
        <div className="grid grid-cols-2 gap-3 text-xs">
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium" htmlFor="ref-input">
              Kode Referal
            </label>
            <input
              id="ref-input"
              defaultValue={affiliateRef}
              placeholder="e.g. SANDIKO"
              className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 uppercase font-mono"
            />
          </div>
          <div className="space-y-1.5">
            <label className="text-slate-400 font-medium" htmlFor="coupon-input">
              Kupon Diskon
            </label>
            <input
              id="coupon-input"
              defaultValue={couponCode}
              placeholder="e.g. LAUNCH50"
              className="h-9 w-full rounded-lg border border-white/10 bg-white/5 px-3 text-xs text-white placeholder:text-slate-600 focus:outline-none focus:border-emerald-500 uppercase font-mono"
            />
          </div>
        </div>
      </div>

      <div className="p-3.5 rounded-xl border border-white/10 bg-white/5 flex items-start gap-2.5 text-xs text-slate-400">
        <ShieldCheck className="size-4 text-emerald-400 mt-0.5 shrink-0" />
        <span>
          Dengan mendaftar, Anda menyetujui Ketentuan Layanan dan Kebijakan Privasi PT Koneksi Jaringan Indonesia. Zero code training guarantee.
        </span>
      </div>

      <div className="text-center text-xs text-slate-400 pt-4 border-t border-white/10">
        Sudah memiliki akun?{' '}
        <Link href="/login" className="text-emerald-400 hover:underline font-semibold">
          Masuk ke Workspace →
        </Link>
      </div>
    </div>
  );
}
