'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Building2,
  GraduationCap,
  GitBranch,
  Laptop,
  CheckCircle2,
  ArrowRight,
  Sparkles,
  Bot,
  Layers,
  Workflow,
  Trello,
  ShieldCheck,
  FileCode,
  MessageSquare,
} from 'lucide-react';

const SOLUTIONS = [
  {
    id: 'agencies',
    title: 'Agensi Digital & Tim Kreatif',
    badge: 'Studi Kasus: PT Koneksi Jaringan Indonesia',
    icon: Building2,
    color: 'from-pink-500/20 to-rose-500/10 border-pink-500/30 text-pink-400',
    headline: 'Jaga Brand Voice Klien & Otomasi Penerbitan Konten Tanpa Halusinasi',
    problem:
      'Tim kreatif dan SEO copywriter membutuhkan bantuan AI untuk memproduksi variasi hook dan artikel panjang, tetapi AI biasa sering menggunakan gaya bahasa generik yang melanggar panduan brand klien dan tidak bisa dipantau progresnya di kanban agensi.',
    solution:
      'KAEDE membaca direktori .openkb/brand/voice-and-tone.md dan .openkb/marketing/funnel-architecture.md. Agent Hermes menerima brief langsung dari chat WhatsApp, mencocokkan persona, membuat kartu Trello, dan menerbitkan draft artikel ke WordPress via MCP secara otomatis.',
    benefits: [
      '100% konsistensi tone of voice antar-klien tanpa tercampur aduk',
      'Integrasi langsung kartu Trello ke WordPress via MCP chain',
      'Handoff instan: Bot WhatsApp (Hermes) ➔ Copywriter ➔ Client Approval',
      'Multi-profile tenant switching memudahkan manajemen puluhan brand klien',
    ],
    architecture: `Kartu Trello ("Ide Konten SEO") ➔ KAEDE memuat .openkb/brand/ ➔ Hermes Agent generate artikel ➔ WordPress MCP simpan draft ➔ Kartu pindah ke "Review Klien"`,
  },
  {
    id: 'education',
    title: 'Institusi Pendidikan & Yayasan',
    badge: 'Studi Kasus: SMA UII Yogyakarta',
    icon: GraduationCap,
    color: 'from-emerald-500/20 to-teal-500/10 border-emerald-500/30 text-emerald-400',
    headline: 'Transparansi Penuh Koordinasi IT Sekolah Tanpa Guru Harus Masuk Terminal',
    problem:
      'Sekolah dan yayasan mengelola puluhan sistem digital—portal PPDB, modul presensi siswa, sistem nilai, dan website profil sekolah (seperti pada ekosistem SMA UII Yogyakarta). Pimpinan sekolah dan guru non-teknis kesulitan melacak progres pekerjaan developer yang hanya ada di GitHub.',
    solution:
      'KAEDE mengikat organisasi GitHub SMA-UII-Yogyakarta/.github dan repo playbook sekolah ke papan Trello terpadu. Guru dan wakil kepala sekolah cukup membuat kartu tiket kebutuhan fitur baru di Trello, dan coding agent (Antigravity CLI / OpenCode) langsung mengeksekusi dengan SOP sekolah yang terverifikasi.',
    benefits: [
      'Pimpinan sekolah memantau progres IT 100% via kanban Trello yang ramah pengguna',
      'Kepatuhan terhadap SOP dan kalender akademik tercatat di playbook',
      'Zero miskomunikasi antara developer internal/rekanan dengan pimpinan sekolah',
      'Hak akses repositori siswa dan guru terisolasi secara aman',
    ],
    architecture: `Waka Kesiswaan buat kartu Trello ➔ KAEDE load SMA-UII/.github + playbook ➔ Antigravity CLI tulis kode fitur ➔ Test lolos 100% ➔ Link preview dikirim ke komentar`,
  },
  {
    id: 'software',
    title: 'Software Engineering Teams & Software Houses',
    badge: 'Developer Experience (DX) First',
    icon: GitBranch,
    color: 'from-sky-500/20 to-indigo-500/10 border-sky-500/30 text-sky-400',
    headline: 'Hentikan Amnesia Agent: Onboarding Kode & Library Seketika',
    problem:
      'Engineer menghabiskan waktu berharga menulis prompt panjang menjelaskan versi dependensi, struktur database, dan linting rules ke AI coding agent setiap kali memulai sesi baru di terminal.',
    solution:
      'Folder .openkb/tech/conventions.md dan database schema langsung dipindai dan disuntikkan ke MCP session Antigravity CLI, OpenCode, atau Claude Code. Agent mengetahui batasan refactor dan aturan testing sejak prompt pertama.',
    benefits: [
      'Waktu onboarding agent ke repositori kompleks = 0 detik',
      'Pencatatan log eksekusi unit test (seperti PHP/Bun test) otomatis ke komentar kartu Trello',
      'Integrasi 47 Trello tools langsung di dalam terminal coding agent',
      'Mendukung workflow multi-cabang (branching, PR, review)',
    ],
    architecture: `Bug card di Trello ➔ OpenCode / Antigravity CLI load .openkb/tech ➔ Fix bug & run test suite ➔ Commit & push Git branch ➔ Laporkan hasil di komentar kartu`,
  },
  {
    id: 'founders',
    title: 'Solo Technical Founders & Indie Builders',
    badge: '1-Person Tech Companies',
    icon: Laptop,
    color: 'from-amber-500/20 to-orange-500/10 border-amber-500/30 text-amber-400',
    headline: 'Jalankan Perusahaan Satu Orang dengan Kapasitas Tim Lima Orang',
    problem:
      'Solo founder kewalahan membagi fokus antara pengembangan fitur, perbaikan bug, marketing, dan riset pasar. Mengelola segalanya di terminal sendirian menyebabkan bottleneck parah.',
    solution:
      'Jadikan Trello di smartphone Anda sebagai remote command center. Catat ide fitur saat bepergian. Di server, agent Hermes dan Antigravity yang dipandu KAEDE memproses kartu, menulis kode, dan men-deploy preview Vercel secara mandiri.',
    benefits: [
      'Eksekusi asinkronus 24/7 saat founder sedang istirahat atau mengurus bisnis',
      'Kontrol penuh: perpindahan kartu kanban menjadi rem pengaman sebelum rilis produksi',
      'Tanpa biaya gaji tim besar di fase awal validasi produk',
      'Penyimpanan rapi seluruh roadmap dan living knowledge di GitHub',
    ],
    architecture: `Ketik ide kartu di smartphone ➔ KAEDE picu agent di background server ➔ Deploy ke Vercel Preview ➔ Notifikasi preview siap diuji via chat WhatsApp`,
  },
];

export default function SolutionsPage() {
  const [activeTab, setActiveTab] = React.useState('agencies');
  const activeSolution = SOLUTIONS.find((s) => s.id === activeTab) || SOLUTIONS[0];

  return (
    <div className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-4">
            <Sparkles className="size-3.5" />
            <span>Solusi Lintas Industri & Segmen</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Dirancang Universal untuk Siapa Saja yang Bekerja dengan Git & Trello
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            KAEDE memecahkan friksi kolaborasi antara manusia non-teknis, software engineer, dan autonomous AI agents di berbagai lanskap organisasi.
          </p>

          {/* Persona Switcher Tabs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-2 p-1.5 rounded-2xl bg-white/5 border border-white/10 max-w-4xl mx-auto">
            {SOLUTIONS.map((s) => {
              const Icon = s.icon;
              const isActive = activeTab === s.id;
              return (
                <button
                  key={s.id}
                  onClick={() => setActiveTab(s.id)}
                  className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-xs sm:text-sm font-semibold transition-all ${
                    isActive
                      ? 'bg-emerald-500 text-slate-950 shadow-lg shadow-emerald-500/20 font-bold'
                      : 'text-slate-300 hover:text-white hover:bg-white/5'
                  }`}
                >
                  <Icon className="size-4" />
                  <span>{s.title}</span>
                </button>
              );
            })}
          </div>
        </div>

        {/* Active Solution Deep-Dive Card */}
        <div className="rounded-3xl border border-white/10 bg-[#0F172A]/80 p-8 sm:p-12 shadow-2xl backdrop-blur-xl">
          <div className="flex flex-wrap items-center justify-between gap-4 pb-8 border-b border-white/10">
            <div className="flex items-center gap-4">
              <div className={`p-3.5 rounded-2xl bg-gradient-to-br ${activeSolution.color} border shadow-lg`}>
                <activeSolution.icon className="size-7" />
              </div>
              <div>
                <span className="text-xs font-mono uppercase tracking-wider text-emerald-400 font-bold">
                  {activeSolution.badge}
                </span>
                <h2 className="text-2xl sm:text-3xl font-extrabold text-white mt-1">
                  {activeSolution.title}
                </h2>
              </div>
            </div>
            <Link href="/dashboard">
              <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs sm:text-sm">
                <Bot className="mr-2 size-4" /> Coba Workflow Ini
              </Button>
            </Link>
          </div>

          <div className="mt-8">
            <h3 className="text-xl sm:text-2xl font-bold text-white leading-snug">
              {activeSolution.headline}
            </h3>
          </div>

          <div className="mt-8 grid grid-cols-1 lg:grid-cols-2 gap-8">
            {/* Problem & Solution */}
            <div className="space-y-6">
              <div className="p-5 rounded-2xl bg-red-950/20 border border-red-500/20 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-red-400">
                  Tantangan Tanpa KAEDE:
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeSolution.problem}
                </p>
              </div>

              <div className="p-5 rounded-2xl bg-emerald-950/20 border border-emerald-500/20 space-y-2">
                <span className="text-[11px] font-bold uppercase tracking-wider text-emerald-400">
                  Solusi KAEDE Ecosystem:
                </span>
                <p className="text-xs sm:text-sm text-slate-300 leading-relaxed">
                  {activeSolution.solution}
                </p>
              </div>
            </div>

            {/* Key Benefits */}
            <div className="p-6 rounded-2xl bg-white/5 border border-white/10 flex flex-col justify-between">
              <div>
                <h4 className="text-sm font-bold uppercase tracking-wider text-slate-200 mb-4">
                  Dampak Langsung bagi Tim:
                </h4>
                <ul className="space-y-3 text-xs sm:text-sm text-slate-300">
                  {activeSolution.benefits.map((b, i) => (
                    <li key={i} className="flex items-start gap-2.5">
                      <CheckCircle2 className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                      <span>{b}</span>
                    </li>
                  ))}
                </ul>
              </div>

              {/* Workflow Strip */}
              <div className="mt-6 pt-4 border-t border-white/10">
                <span className="text-[10px] font-mono text-slate-400 uppercase tracking-wider block mb-1.5">
                  Alur Pipeline:
                </span>
                <div className="p-3 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono text-emerald-300 leading-relaxed">
                  {activeSolution.architecture}
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Callout to Playbook */}
        <div className="mt-16 p-8 rounded-2xl border border-white/10 bg-gradient-to-r from-emerald-950/30 via-slate-900 to-indigo-950/30 flex flex-col sm:flex-row items-center justify-between gap-6">
          <div>
            <h3 className="text-lg font-bold text-white">Ingin Menyiapkan Folder .openkb untuk Proyek Anda?</h3>
            <p className="text-xs sm:text-sm text-slate-400 mt-1">
              Pelajari standarisasi format brand, marketing, dan teknis di panduan dokumentasi resmi kami.
            </p>
          </div>
          <Link href="/playbook">
            <Button variant="outline" className="border-emerald-500/40 text-emerald-300 hover:bg-emerald-500/10 font-semibold whitespace-nowrap">
              Buka Dokumentasi Playbook →
            </Button>
          </Link>
        </div>
      </div>
    </div>
  );
}
