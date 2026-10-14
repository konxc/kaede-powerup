import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Settings, ShieldCheck, Key, Users, Trash2, CheckCircle2 } from 'lucide-react';

export default function SettingsPage() {
  return (
    <div className="space-y-8 max-w-4xl mx-auto">
      <div>
        <h1 className="text-2xl sm:text-3xl font-extrabold text-white tracking-tight">Workspace Settings</h1>
        <p className="text-xs sm:text-sm text-slate-400 mt-1">
          Pengaturan ruang kerja, anggota tim, peran hak akses (RBAC), dan token keamanan.
        </p>
      </div>

      <div className="space-y-6">
        {/* General Details */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Settings className="size-4 text-emerald-400" />
            Informasi Umum Workspace
          </h2>

          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-xs">
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Nama Workspace</label>
              <input
                defaultValue="SMA UII Yogyakarta / PT Koneksi"
                className="w-full h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-white"
              />
            </div>
            <div className="space-y-1.5">
              <label className="text-slate-300 font-medium">Organization Slug</label>
              <input
                defaultValue="smauii-koneksi"
                disabled
                className="w-full h-9 rounded-lg border border-white/10 bg-slate-900 px-3 text-slate-400 font-mono"
              />
            </div>
          </div>
          <Button size="sm" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold text-xs shadow-md shadow-emerald-500/20">
            Simpan Perubahan
          </Button>
        </div>

        {/* API Tokens */}
        <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-4">
          <h2 className="text-base font-bold text-white flex items-center gap-2">
            <Key className="size-4 text-sky-400" />
            API Keys & Webhook Secret
          </h2>
          <p className="text-xs text-slate-400">
            Digunakan untuk menghubungkan Antigravity CLI dan Trello Webhook ke konsol KAEDE.
          </p>

          <div className="space-y-2 text-xs font-mono">
            <div className="flex gap-2">
              <input
                type="password"
                defaultValue="kaede_live_sec_9eebecff9cfd264b18fa5814"
                readOnly
                className="flex-1 h-9 rounded-lg border border-white/10 bg-white/5 px-3 text-slate-300"
              />
              <Button variant="outline" className="border-white/10 text-xs px-3">
                Salin Token
              </Button>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="p-6 rounded-2xl border border-rose-500/30 bg-rose-950/10 space-y-3">
          <h2 className="text-base font-bold text-rose-400 flex items-center gap-2">
            <Trash2 className="size-4" />
            Zona Berbahaya
          </h2>
          <p className="text-xs text-slate-400">
            Menghapus workspace akan mencabut seluruh token repositori dan memutuskan kontainer agen yang sedang berjalan.
          </p>
          <Button variant="outline" className="border-rose-500/40 text-rose-400 hover:bg-rose-500/10 text-xs font-bold">
            Hapus Workspace Ini
          </Button>
        </div>
      </div>
    </div>
  );
}
