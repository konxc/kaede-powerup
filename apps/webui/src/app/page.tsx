import Link from 'next/link';

export default function Home() {
  return (
    <main className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900 to-slate-900">
      <div className="container mx-auto px-4 py-16">
        <div className="text-center mb-16">
          <h1 className="text-5xl font-bold text-white mb-6">
            KAEDE Dashboard
          </h1>
          <p className="text-xl text-purple-200 max-w-2xl mx-auto">
            Team & Role Management berdasarkan OpenKB/Playbook steering.
            Kelola akses GitHub, Trello, dan AI Agent untuk tim Anda.
          </p>
        </div>

        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-6xl mx-auto">
          <Link href="/dashboard" className="block p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all">
            <div className="text-3xl mb-3">📊</div>
            <h3 className="text-lg font-semibold text-white mb-2">Dashboard</h3>
            <p className="text-purple-200 text-sm">Overview tim, project, dan akses</p>
          </Link>

          <Link href="/teams" className="block p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all">
            <div className="text-3xl mb-3">👥</div>
            <h3 className="text-lg font-semibold text-white mb-2">Teams</h3>
            <p className="text-purple-200 text-sm">Kelola anggota tim dan role</p>
          </Link>

          <Link href="/roles" className="block p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all">
            <div className="text-3xl mb-3">🔐</div>
            <h3 className="text-lg font-semibold text-white mb-2">Roles</h3>
            <p className="text-purple-200 text-sm">Definisi role dan access matrix</p>
          </Link>

          <Link href="/playbook" className="block p-6 bg-white/10 backdrop-blur-sm rounded-xl border border-white/20 hover:bg-white/20 transition-all">
            <div className="text-3xl mb-3">📖</div>
            <h3 className="text-lg font-semibold text-white mb-2">Playbook</h3>
            <p className="text-purple-200 text-sm">Konvensi dan workflow tim</p>
          </Link>
        </div>

        <div className="mt-16 text-center">
          <p className="text-purple-300 text-sm">
            Powered by{' '}
            <a href="https://kaede-powerup.netlify.app" className="text-purple-100 underline">
              KAEDE
            </a>{' '}
            — Koneksi Automated Environment DE
          </p>
        </div>
      </div>
    </main>
  );
}
