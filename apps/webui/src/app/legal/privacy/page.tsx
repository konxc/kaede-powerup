import Link from 'next/link';

export default function PrivacyPage() {
  return (
    <div className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Privacy Policy</h1>
        <p className="mt-2 text-xs text-slate-400">Terakhir diperbarui: 14 Oktober 2026</p>

        <div className="mt-10 space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">1. Prinsip Privasi Kami</h2>
            <p>
              Privasi Anda adalah hak fundamental. Kebijakan ini menjelaskan bagaimana <strong className="text-white">PT Koneksi Jaringan Indonesia</strong> mengumpulkan, mengelola, dan melindungi data pribadi Anda saat menggunakan platform KAEDE, sesuai dengan <strong className="text-white">UU Pelindungan Data Pribadi (UU PDP No. 27/2022)</strong> dan prinsip GDPR.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">2. Informasi yang Kami Kumpulkan</h2>
            <ul className="list-disc pl-5 space-y-2 text-slate-400">
              <li>
                <strong className="text-white">Identitas GitHub:</strong> Nama publik, username GitHub, ID pengguna, dan alamat email publik saat Anda melakukan otentikasi via GitHub OAuth.
              </li>
              <li>
                <strong className="text-white">Metadata Workspace:</strong> Nama ruang kerja dan pemetaan repositori yang Anda pilih untuk disambungkan ke KAEDE.
              </li>
              <li>
                <strong className="text-white">Data Log Teknis:</strong> Alamat IP, jenis browser, dan catatan timestamp untuk keperluan audit keamanan dan pencegahan serangan siber.
              </li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">3. Yang TIDAK PERNAH Kami Lakukan</h2>
            <div className="p-4 rounded-xl bg-emerald-950/20 border border-emerald-500/20 text-emerald-300 space-y-1">
              <p className="font-semibold">✓ Zero Public AI Model Training</p>
              <p className="text-xs text-slate-300">
                Kami tidak pernah menjual data Anda kepada broker data mana pun dan tidak pernah menggunakan kode sumber, file .openkb, atau kartu Trello Anda untuk melatih model AI publik.
              </p>
            </div>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">4. Penyimpanan & Keamanan Data</h2>
            <p>
              Data sesi dan workspace dienkripsi saat transit menggunakan TLS 1.3 dan disimpan di edge database terenkripsi (Turso LibSQL). Kredensial Trello Anda pada mode CLI disimpan mandiri di host lokal Anda (<code className="text-emerald-400">~/.config/kaede/secrets.env</code>) dan tidak disalin ke server pusat kami.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">5. Hak Pemilik Data Pribadi</h2>
            <p>
              Sesuai UU PDP dan GDPR, Anda memiliki hak untuk meminta salinan data pribadi yang kami simpan, mengoreksi data yang tidak akurat, atau meminta penghapusan akun beserta seluruh metadata workspace Anda secara permanen.
            </p>
          </section>

          <div className="pt-6 border-t border-white/10 text-xs text-slate-400">
            Untuk permohonan hak data pribadi atau pertanyaan keamanan, silakan hubungi Tim Privasi Data kami di <a href="mailto:konxcid@gmail.com" className="text-emerald-400 underline">konxcid@gmail.com</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
