import Link from 'next/link';
import { ShieldCheck, Lock, EyeOff, Server, Key, FileCheck, CheckCircle2 } from 'lucide-react';
import { Button } from '@/components/ui/button';

export default function SecurityPage() {
  return (
    <div className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center max-w-2xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-4">
            <ShieldCheck className="size-3.5" />
            <span>AI Security & Data Safety Pledge</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Komitmen Keamanan Data & Kedaulatan Kode Anda
          </h1>
          <p className="mt-4 text-sm sm:text-base text-slate-300 leading-relaxed">
            Di KAEDE, kami memperlakukan repositori privat, dokumen internal, dan kartu Trello Anda sebagai kekayaan intelektual murni milik Anda.
          </p>
        </div>

        {/* The 4 Core Pledges */}
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-16">
          <div className="p-6 rounded-2xl border border-emerald-500/30 bg-emerald-950/20 space-y-3">
            <div className="size-10 rounded-xl bg-emerald-500/20 text-emerald-400 flex items-center justify-center">
              <EyeOff className="size-5" />
            </div>
            <h2 className="text-lg font-bold text-white">1. Zero Code Training Guarantee</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Kode sumber, struktur database, file <code className="text-emerald-400">.openkb</code>, dan kartu Trello Anda dijamin <strong>TIDAK PERNAH</strong> digunakan untuk melatih (*training*), menyempurnakan (*fine-tuning*), atau mengoptimalkan model AI publik dari penyedia mana pun.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-sky-500/30 bg-sky-950/20 space-y-3">
            <div className="size-10 rounded-xl bg-sky-500/20 text-sky-400 flex items-center justify-center">
              <Key className="size-5" />
            </div>
            <h2 className="text-lg font-bold text-white">2. Headless Local Secret Storage</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Kredensial sensitif (Trello API Key & Token) disimpan secara lokal di mesin operator (<code className="text-sky-300">~/.config/kaede/secrets.env</code>) dengan izin akses ketat <code className="text-sky-300">chmod 600</code>. Kredensial tidak pernah diunggah ke server pihak ketiga tanpa otorisasi.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-purple-500/30 bg-purple-950/20 space-y-3">
            <div className="size-10 rounded-xl bg-purple-500/20 text-purple-400 flex items-center justify-center">
              <Server className="size-5" />
            </div>
            <h2 className="text-lg font-bold text-white">3. Stateless Context Streaming</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Resolusi konteks dari GitHub diproses secara <em>in-memory streaming</em>. Seluruh komunikasi data dalam transit dilindungi enkripsi standar industri terkini (TLS 1.3 / HTTPS).
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-amber-500/30 bg-amber-950/20 space-y-3">
            <div className="size-10 rounded-xl bg-amber-500/20 text-amber-400 flex items-center justify-center">
              <FileCheck className="size-5" />
            </div>
            <h2 className="text-lg font-bold text-white">4. Kepatuhan Regulasi & UU PDP</h2>
            <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
              Arsitektur KAEDE patuh terhadap <strong>Undang-Undang Pelindungan Data Pribadi (UU PDP No. 27/2022)</strong> di Indonesia serta prinsip hak privasi internasional (GDPR). Pengguna memiliki hak penuh atas penghapusan data kapan saja.
            </p>
          </div>
        </div>

        {/* Detailed Security Architecture */}
        <div className="rounded-2xl border border-white/10 bg-[#0F172A]/70 p-8 space-y-6">
          <h3 className="text-xl font-bold text-white">Arsitektur Izin Akses GitHub App</h3>
          <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
            KAEDE menggunakan GitHub App dengan izin akses minimal (*least-privilege model*):
          </p>
          <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Hanya Membaca Metadata Konteks:</strong> KAEDE hanya memindai file spesifik seperti <code className="text-emerald-300">.github/</code>, <code className="text-emerald-300">playbook/</code>, dan <code className="text-emerald-300">.openkb/</code> untuk membentuk ringkasan pemahaman agent.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Revoke Izin Kapan Saja:</strong> Pemilik organisasi GitHub dapat mencabut akses KAEDE kapan pun langsung melalui halaman GitHub Application Settings dalam satu kali klik.</span>
            </li>
            <li className="flex items-start gap-2.5">
              <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
              <span><strong>Audit Trail Terbuka:</strong> Seluruh panggilan tool dan perubahan kartu Trello dapat diaudit langsung melalui riwayat komentar kartu.</span>
            </li>
          </ul>

          <div className="pt-6 border-t border-white/10 flex flex-wrap items-center justify-between gap-4">
            <span className="text-xs text-slate-400">
              Ada pertanyaan spesifik mengenai kepatuhan atau ingin menandatangani perjanjian DPA?
            </span>
            <a href="mailto:konxcid@gmail.com?subject=Inquiry%20Security%20%26%20Compliance%20KAEDE">
              <Button variant="outline" className="text-xs border-emerald-500/40 text-emerald-300">
                Hubungi Tim Security KAEDE
              </Button>
            </a>
          </div>
        </div>
      </div>
    </div>
  );
}
