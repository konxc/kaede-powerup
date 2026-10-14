import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Sparkles,
  Bot,
  Heart,
  Github,
  Trello,
  Layers,
  ShieldCheck,
  CheckCircle2,
  Workflow,
  ArrowRight,
} from 'lucide-react';

export default function AboutPage() {
  return (
    <div className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="container mx-auto max-w-4xl">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-4">
            <Sparkles className="size-3.5" />
            <span>The Human-Agent Manifesto</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Menghubungkan Manusia, Memori Organisasi, dan AI Agent
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Kisah di balik lahirnya KAEDE—sebuah inisiatif rekayasa untuk menyatukan pengembang, tim kreatif, dan autonomous agents dalam satu bahasa kerja yang selaras.
          </p>
        </div>

        {/* Narrative Flow */}
        <div className="space-y-12 text-sm sm:text-base text-slate-300 leading-relaxed">
          {/* Act 1 */}
          <section className="p-8 rounded-3xl border border-white/10 bg-[#0F172A]/70 backdrop-blur-xl space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-400">
              Babak I — Kesenjangan Terminal
            </span>
            <h2 className="text-2xl font-bold text-white">
              Ketika Developer Melompat Maju, Namun Rekan Satu Tim Tertinggal
            </h2>
            <p>
              Di <strong>PT Koneksi Jaringan Indonesia</strong>, revolusi <em>agentic coding</em> terjadi sangat cepat. Tim software developer mulai menggunakan harness canggih seperti Antigravity CLI, OpenCode, dan Claude Code untuk menulis dan merefaktor kode dalam hitungan menit.
            </p>
            <p>
              Namun, dalam kenyataan bisnis, developer tidak bekerja sendirian. Mereka berkolaborasi erat dengan tim kreatif, digital marketing, project manager, dan pengambil keputusan. Tim-tim non-developer ini mengelola alur kerja harian mereka secara alami menggunakan <strong>Trello</strong> dan <strong>Notion</strong>. Kesenjangan muncul seketika: tim non-teknis tidak bisa masuk ke terminal Linux, sementara developer kesulitan menjelaskan status kode tanpa pertemuan panjang yang melelahkan.
            </p>
          </section>

          {/* Act 2 */}
          <section className="p-8 rounded-3xl border border-white/10 bg-[#0F172A]/70 backdrop-blur-xl space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-sky-400">
              Babak II — Masalah "Agen Amnesia"
            </span>
            <h2 className="text-2xl font-bold text-white">
              Mengapa Agent Kehilangan Konteks Siapa Tuannya?
            </h2>
            <p>
              Bahkan ketika tim developer berhasil memasang Trello MCP untuk agen mereka, muncul persoalan baru yang sangat menguras energi: <strong>Context Blindness</strong>.
            </p>
            <p>
              Setiap kali memulai sesi baru, agen AI bertindak seperti mengalami amnesia. Agen tidak mengetahui siapa tuannya, apa kultur organisasi perusahaan, apa gaya komunikasi brand yang harus dijaga, dan apa arsitektur repo jika sang operator tidak mendiktekannya kembali melalui prompt manual yang panjang.
            </p>
          </section>

          {/* Act 3 */}
          <section className="p-8 rounded-3xl border border-emerald-500/30 bg-gradient-to-br from-emerald-950/30 via-slate-900 to-indigo-950/30 backdrop-blur-xl space-y-4">
            <span className="text-xs font-mono font-bold uppercase tracking-wider text-emerald-300">
              Babak III — Kelahiran KAEDE
            </span>
            <h2 className="text-2xl font-bold text-white">
              GitHub sebagai Otak, Trello sebagai Papan Kendali
            </h2>
            <p>
              Dari kegelisahan inilah, <strong>Sandiko (<code className="text-emerald-300">@sandikodev</code>)</strong>, founder Koneksi, mencetuskan ide dasar <strong>KAEDE</strong>:
            </p>
            <div className="p-4 rounded-xl bg-slate-950/80 border border-white/10 space-y-2 text-xs sm:text-sm text-emerald-200 font-mono">
              <p>• GitHub = The Living Brain (.github, playbook, .openkb)</p>
              <p>• Trello = The Visual State Machine (Cards as tickets, columns as handoff gates)</p>
              <p>• AI Agents = The Autonomous Workforce (Antigravity CLI, Hermes 24/7)</p>
            </div>
            <p>
              Dengan menghubungkan standar repositori GitHub yang sudah terstruktur—seperti <code className="text-emerald-400">.github</code> organisasi, repo <code className="text-emerald-400">playbook</code> bisnis, hingga dotfiles folder <code className="text-emerald-400">.openkb</code> di proyek aplikasi—KAEDE memungkinkan agent membaca seluruh konteks institusi dalam satu ketukan.
            </p>
            <p>
              Hasilnya? Kasus nyata di <strong>SMA UII Yogyakarta</strong> membuktikan bahwa guru dan pimpinan sekolah dapat menggerakkan kartu di Trello, sementara agent di background secara otomatis mengeksekusi kebutuhan fitur di puluhan portal sekolah tanpa salah paham.
            </p>
          </section>

          {/* Founder Quote */}
          <div className="p-8 rounded-3xl border border-white/10 bg-white/5 space-y-4">
            <p className="italic text-base sm:text-lg text-slate-200 leading-relaxed font-serif">
              "Masa depan software engineering bukan tentang manusia yang digantikan oleh AI, melainkan tentang manusia dan agen otonom yang bekerja bersama dalam satu bahasa konteks yang transparan. KAEDE adalah jembatan tersebut."
            </p>
            <div className="pt-4 border-t border-white/10 flex items-center justify-between">
              <div>
                <p className="font-bold text-white text-sm">Sandiko (@sandikodev)</p>
                <p className="text-xs text-slate-400">Founder, PT Koneksi Jaringan Indonesia · Inisiator KAEDE</p>
              </div>
              <a
                href="https://github.com/sandikodev"
                target="_blank"
                rel="noopener noreferrer"
                className="text-xs text-emerald-400 hover:underline flex items-center gap-1"
              >
                <Github className="size-3.5" /> @sandikodev
              </a>
            </div>
          </div>
        </div>

        {/* Bottom CTA */}
        <div className="mt-16 text-center">
          <Link href="/dashboard">
            <Button size="lg" className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold px-8">
              <Bot className="mr-2 size-5" /> Mulai Gunakan KAEDE Agent Desktop
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
