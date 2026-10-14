import { auth } from '@/lib/auth';
import { Button } from '@/components/ui/button';
import { User, Github, ShieldCheck, Mail, LogOut } from 'lucide-react';

export default async function ProfilePage() {
  const session = await auth();
  const user = session?.user;
  const githubUser = (user as any)?.githubUsername;
  const role = (user as any)?.role || 'developer';

  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Akun & Profil Pengguna</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Identitas akun Anda yang digunakan untuk otentikasi sesi konsol KAEDE.
        </p>
      </div>

      <div className="space-y-6">
        <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 flex flex-wrap items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            {user?.image ? (
              <img src={user.image} alt="" className="size-16 rounded-full border-2 border-emerald-500/40 shadow-lg" />
            ) : (
              <div className="size-16 rounded-full bg-emerald-500/20 text-emerald-400 flex items-center justify-center text-xl font-bold">
                {user?.name?.[0] || 'U'}
              </div>
            )}
            <div>
              <div className="flex items-center gap-2">
                <h2 className="text-lg font-bold text-white">{user?.name || user?.email}</h2>
                <span className="px-2 py-0.5 rounded text-[10px] font-mono uppercase bg-emerald-500/10 text-emerald-400 border border-emerald-500/20 font-bold">
                  {role}
                </span>
              </div>
              <p className="text-xs text-slate-400 mt-0.5">
                GitHub: <code className="text-emerald-300">@{githubUser || 'connected'}</code>
              </p>
              <p className="text-xs text-slate-300 mt-0.5">{user?.email}</p>
            </div>
          </div>
        </div>

        {/* Linked Identity Card */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-4">
          <h3 className="text-sm font-bold text-white flex items-center gap-2">
            <Github className="size-4 text-emerald-400" />
            Identitas Terhubung
          </h3>
          <div className="flex items-center justify-between p-3.5 rounded-xl bg-white/5 border border-white/5 text-xs">
            <div className="flex items-center gap-3">
              <Github className="size-5 text-white" />
              <div>
                <p className="font-bold text-white">GitHub OAuth Identity</p>
                <p className="text-slate-400 text-[11px]">Terhubung sebagai @{githubUser || 'user'}</p>
              </div>
            </div>
            <span className="text-emerald-400 font-semibold text-xs">Terhubung</span>
          </div>
        </div>
      </div>
    </div>
  );
}
