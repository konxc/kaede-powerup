import Link from 'next/link';

export default function TermsPage() {
  return (
    <div className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="container mx-auto max-w-3xl">
        <h1 className="text-3xl sm:text-4xl font-extrabold text-white tracking-tight">Terms of Service</h1>
        <p className="mt-2 text-xs text-slate-400">Terakhir diperbarui: 14 Oktober 2026</p>

        <div className="mt-10 space-y-8 text-xs sm:text-sm text-slate-300 leading-relaxed">
          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">1. Pendahuluan</h2>
            <p>
              Selamat datang di KAEDE (<strong className="text-white">"Layanan"</strong>), sebuah perangkat lunak dan ekosistem konteks cerdas yang dikembangkan dan dioperasikan oleh <strong className="text-white">PT Koneksi Jaringan Indonesia</strong> (<strong className="text-white">"Kami"</strong>).
            </p>
            <p>
              Dengan mengakses atau menggunakan platform WebUI (<code className="text-emerald-400">agentdesktop.vercel.app</code>), repositori kode sumber KAEDE, atau suite MCP Server kami, Anda menyetujui untuk terikat oleh Ketentuan Layanan ini.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">2. Lisensi & Model Open-Core</h2>
            <p>
              Komponen inti CLI KAEDE dan suite MCP Server (Trello dan Context Engine) dirilis di bawah lisensi open-source terdaftar di repositori resmi GitHub kami. Anda berhak menggunakan, memodifikasi, dan menjalankan komponen tersebut secara lokal sesuai ketentuan lisensi.
            </p>
            <p>
              Layanan cloud terkelola (Agent Desktop WebUI, sinkronisasi webhook terpadu, dan infrastruktur edge cache) dilisensikan sebagai langganan software-as-a-service (SaaS).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">3. Kedaulatan Hak Cipta & Data Pengguna</h2>
            <p>
              Kami tidak mengklaim kepemilikan apa pun atas konten repositori kode sumber, file pedoman <code className="text-emerald-400">.openkb</code>, atau data pada kartu Trello Anda. Seluruh hak cipta, merek dagang, dan rahasia dagang tetap sepenuhnya menjadi milik Anda.
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">4. Penggunaan yang Bertanggung Jawab (Acceptable Use)</h2>
            <p>Anda setuju untuk tidak menggunakan Layanan untuk:</p>
            <ul className="list-disc pl-5 space-y-1.5 text-slate-400">
              <li>Menghasilkan malware, kode berbahaya, atau aktivitas eksploitasi keamanan siber.</li>
              <li>Melakukan pelanggaran privasi data atau melanggar hak kekayaan intelektual pihak ketiga.</li>
              <li>Mencoba merekayasa balik (*reverse-engineer*) atau membobol sistem enkripsi layanan cloud kami.</li>
            </ul>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">5. Batasan Tanggung Jawab</h2>
            <p>
              Layanan disediakan sebagaimana adanya ("AS IS"). Kami berupaya maksimal menjaga keandalan dan ketersediaan sistem, namun Kami tidak bertanggung jawab atas kerugian tidak langsung atau kehilangan data akibat gangguan jaringan pihak ketiga (seperti API GitHub atau Atlassian Trello).
            </p>
          </section>

          <section className="space-y-3">
            <h2 className="text-base font-bold text-white">6. Hukum yang Mengatur</h2>
            <p>
              Ketentuan ini diatur dan ditafsirkan sesuai dengan hukum Republik Indonesia. Setiap perselisihan yang timbul akan diselesaikan secara musyawarah atau melalui yurisdiksi pengadilan di Yogyakarta/Indonesia.
            </p>
          </section>

          <div className="pt-6 border-t border-white/10 text-xs text-slate-400">
            Pertanyaan seputar ketentuan ini dapat dialamatkan ke <a href="mailto:konxcid@gmail.com" className="text-emerald-400 underline">konxcid@gmail.com</a>.
          </div>
        </div>
      </div>
    </div>
  );
}
