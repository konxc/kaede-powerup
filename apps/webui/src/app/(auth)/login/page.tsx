import Link from 'next/link';
import { redirect } from 'next/navigation';
import { auth, signIn } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { Github, ArrowRight, ShieldCheck, Mail, Sparkles } from 'lucide-react';

async function signInWithGitHub() {
  'use server';
  await signIn('github', { redirectTo: '/app/overview' });
}

export default async function LoginPage(props: { searchParams: Promise<{ callbackUrl?: string }> }) {
  const session = await auth();
  if (session?.user) {
    redirect('/app/overview');
  }

  const searchParams = await props.searchParams;
  const callbackUrl = searchParams.callbackUrl || '/app/overview';

  return (
    <div className="space-y-4 sm:space-y-5">
      <div className="space-y-1.5">
        <h1 className="text-xl sm:text-2xl font-extrabold text-white tracking-tight">
          Masuk ke KAEDE Agent Desktop
        </h1>
        <p className="text-xs text-slate-400 leading-relaxed">
          Hubungkan identitas GitHub Anda untuk mengakses workspace, Trello state machine, dan agent fleet.
        </p>
      </div>

      <div className="space-y-3 pt-1">
        <form action={signInWithGitHub}>
          <Button
            type="submit"
            className="w-full h-10 sm:h-11 bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs sm:text-sm shadow-lg shadow-emerald-500/25 transition-all"
          >
            <Github className="mr-2 size-4 sm:size-5" /> Lanjutkan dengan GitHub
          </Button>
        </form>

        <div className="relative my-2.5 sm:my-3">
          <div className="absolute inset-0 flex items-center">
            <span className="w-full border-t border-white/15" />
          </div>
          <div className="relative flex justify-center text-[10px] uppercase tracking-wider">
            <span className="bg-[#0B0F17] px-2.5 text-slate-300 font-medium">atau akun developer</span>
          </div>
        </div>

        {/* Email Magic Link Placeholder */}
        <div className="space-y-2">
          <label className="text-[11px] sm:text-xs text-slate-200 font-semibold" htmlFor="email-input">
            Email Bisnis / Institusi
          </label>
          <div className="flex gap-2">
            <input
              id="email-input"
              type="email"
              placeholder="nama@perusahaan.com / nama@smauii.sch.id"
              className="h-9 sm:h-10 flex-1 rounded-lg border border-white/20 bg-white/10 px-3 text-xs text-white placeholder:text-slate-400 focus:outline-none focus:border-emerald-400 focus:ring-1 focus:ring-emerald-400"
            />
            <Button variant="outline" className="border-white/20 bg-white/5 text-white hover:bg-white/15 text-xs h-9 sm:h-10 px-3.5 sm:px-4 font-semibold">
              <Mail className="mr-1.5 size-3.5" /> Kirim Link
            </Button>
          </div>
        </div>
      </div>

      <div className="p-2.5 sm:p-3 rounded-xl border border-white/15 bg-white/5 flex items-start gap-2.5 text-[11px] sm:text-xs text-slate-200 leading-relaxed">
        <ShieldCheck className="size-4 text-emerald-400 mt-0.5 shrink-0" />
        <span>
          Login ini hanya membaca identitas publik GitHub Anda. Akses repositori privat baru diberikan setelah Anda menyetujui GitHub App secara eksplisit.
        </span>
      </div>

      <div className="text-center text-xs text-slate-300 pt-3 sm:pt-4 border-t border-white/15">
        Belum memiliki akun?{' '}
        <Link href="/register" className="text-emerald-400 hover:text-emerald-300 hover:underline font-bold">
          Daftar Workspace Baru →
        </Link>
      </div>
    </div>
  );
}
