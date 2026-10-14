import Link from 'next/link';
import { auth } from '@/lib/auth';
import { AgentSimulator } from '@/components/home/agent-simulator';
import { Button } from '@/components/ui/button';
import {
  Bot,
  Layers,
  ShieldCheck,
  Trello,
  Github,
  Zap,
  ArrowRight,
  Workflow,
  Sparkles,
  GitBranch,
  Terminal,
  MessageSquare,
  Building2,
  GraduationCap,
  Laptop,
  CheckCircle2,
  HelpCircle,
  ExternalLink,
} from 'lucide-react';

const AGENTS = [
  {
    name: 'Antigravity CLI',
    role: 'DeepMind Interactive Coding Agent',
    badge: 'Coding',
    desc: 'Pair programming agent untuk implementasi kode berat di terminal.',
  },
  {
    name: 'Hermes Agent 24/7',
    role: 'Headless WhatsApp & Telegram Bot',
    badge: 'Headless 24/7',
    desc: 'Selalu aktif menerima chat/brief dari klien, membuat kartu Trello, dan memantau status.',
  },
  {
    name: 'OpenCode',
    role: 'Autonomous Terminal Harness',
    badge: 'Coding',
    desc: 'Mengeksekusi refactor kode dan menjalankan test suite multi-bahasa otomatis.',
  },
  {
    name: 'Claude Code',
    role: 'Anthropic Agentic CLI',
    badge: 'Coding',
    desc: 'Analisa arsitektur kode dan eksekusi pull request berbasis Git.',
  },
  {
    name: 'OpenClaw',
    role: 'Server Operations Agent',
    badge: 'Monitoring',
    desc: 'Memantau server Linux dan log backend secara mandiri.',
  },
  {
    name: 'Cursor & MCP IDEs',
    role: 'Desktop Code Editor',
    badge: 'IDE',
    desc: 'Akses 47 Trello tools dan 45 Kaede tools langsung dari editor favorit Anda.',
  },
];

const FAQS = [
  {
    q: 'Apakah kode privat dan data organisasi kami aman?',
    a: '100% aman. KAEDE memegang teguh AI Security Pledge: kode sumber, kartu Trello, dan knowledge base privat Anda TIDAK PERNAH digunakan untuk melatih model AI publik. Seluruh kredensial tersimpan secara headless di host operator (~/.config/kaede/secrets.env dengan izin chmod 600).',
  },
  {
    q: 'Siapa saja yang cocok menggunakan KAEDE?',
    a: 'KAEDE dirancang universal untuk siapa saja yang memiliki Knowledge Base di GitHub dan menggunakan Trello/Notion sebagai kanban operasional—mulai dari agensi digital kreatif (seperti PT Koneksi), institusi pendidikan dan yayasan (seperti SMA UII Yogyakarta), software house, hingga solo technical founder.',
  },
  {
    q: 'Bagaimana KAEDE mencegah agent mengalami halusinasi konteks?',
    a: 'KAEDE menggunakan 3-Layer Resolution Engine yang membaca identitas organisasi (.github), buku panduan SOP bisnis (playbook), dan folder dotfiles proyek (.openkb). Agent langsung memahami SOP, tone of voice, dan arsitektur kode sebelum mengetik baris pertama.',
  },
  {
    q: 'Apakah tim non-teknis harus mengerti terminal atau Git?',
    a: 'Tidak sama sekali. Tim kreatif, manajer proyek, atau pimpinan sekolah cukup memindahkan kartu di Trello seperti biasa. KAEDE dan AI agent di background yang secara otomatis membaca kartu, mengeksekusi instruksi, dan menempelkan hasil kerja ke komentar kartu.',
  },
  {
    q: 'Bagaimana cara menghubungkan Trello dengan KAEDE?',
    a: 'Sangat mudah. Anda cukup memasukkan Trello API Key & Token via CLI (kaede auth login --manual) atau mengaktifkan Trello Power-Up resmi di board kerja Anda. KAEDE menyediakan 47 tools pengelolaan Trello siap pakai.',
  },
  {
    q: 'Apakah KAEDE bersifat open-source?',
    a: 'Ya, KAEDE menganut prinsip open-core. CLI dan suite MCP Server (Trello 47 tools + Kaede 45 tools) bersifat open source dan dapat dijalankan secara gratis di mesin Anda sendiri. Kami juga menyediakan managed Agent Desktop WebUI untuk kemudahan kolaborasi tim.',
  },
];

export default async function HomePage() {
  const session = await auth();

  return (
    <div className="relative overflow-hidden">
      {/* Subtle Glow Background */}
      <div className="hero-glow absolute inset-0 pointer-events-none" />

      {/* Logged In Quick Switcher */}
      {session?.user ? (
        <div className="border-b border-emerald-500/20 bg-emerald-950/40 px-4 py-2.5 text-center text-xs text-emerald-300">
          <div className="container mx-auto flex items-center justify-center gap-3">
            <span>
              Selamat datang kembali, <strong>{session.user.name || session.user.email}</strong>!
            </span>
            <Link
              href="/dashboard"
              className="inline-flex items-center gap-1 font-semibold text-white underline hover:text-emerald-200"
            >
              Buka Workspace Dashboard <ArrowRight className="size-3" />
            </Link>
          </div>
        </div>
      ) : null}

      {/* ── SECTION 1: HERO ── */}
      <section className="relative px-4 sm:px-6 pt-16 pb-20 md:pt-24 md:pb-28">
        <div className="container mx-auto max-w-6xl text-center">
          {/* Badge */}
          <div className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-full border border-emerald-500/30 bg-emerald-950/40 text-xs font-semibold text-emerald-300 mb-8 shadow-inner">
            <Sparkles className="size-3.5 text-emerald-400" />
            <span>Universal Context Resolution Engine & Agentic OS</span>
          </div>

          {/* Headline */}
          <h1 className="text-4xl sm:text-6xl md:text-7xl font-extrabold tracking-tight text-white leading-[1.08] max-w-5xl mx-auto">
            Turn GitHub Knowledge & Trello Boards into an{' '}
            <span className="text-gradient-primary">Autonomous Workforce</span>.
          </h1>

          {/* Subtitle */}
          <p className="mt-6 text-base sm:text-lg md:text-xl text-slate-300 leading-relaxed max-w-3xl mx-auto font-normal">
            KAEDE menghubungkan dokumentasi <strong className="text-white font-semibold">.github</strong>, playbook SOP bisnis, dan folder <strong className="text-white font-semibold">.openkb</strong> dengan papan kanban <strong className="text-white font-semibold">Trello</strong>—memungkinkan AI coding agent dan headless bot bekerja dengan zero prompt hallucination.
          </p>

          {/* CTAs */}
          <div className="mt-10 flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-7 h-12 shadow-xl shadow-emerald-500/25 transition-all hover:scale-[1.02]">
                <Bot className="mr-2 size-5" /> Launch Agent Desktop (Free)
              </Button>
            </Link>
            <Link href="/playbook">
              <Button size="lg" variant="outline" className="border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold px-6 h-12">
                <Layers className="mr-2 size-5 text-emerald-400" /> Explore OpenKB Protocol
              </Button>
            </Link>
          </div>

          {/* One-Liner CLI Badge */}
          <div className="mt-8 flex items-center justify-center">
            <div className="inline-flex items-center gap-2.5 px-4 py-2 rounded-xl bg-slate-950/80 border border-white/10 text-xs font-mono text-slate-300 shadow-md">
              <Terminal className="size-4 text-emerald-400" />
              <span>curl -fsSL https://raw.githubusercontent.com/konxc/kaede-powerup/main/apps/static/public/install.sh | bash</span>
            </div>
          </div>

          {/* ── INTERACTIVE AGENT SIMULATOR ── */}
          <div className="mt-16 sm:mt-20">
            <AgentSimulator />
          </div>
        </div>
      </section>

      {/* ── SECTION 2: SUPPORTED AGENTS ECOSYSTEM ── */}
      <section className="border-y border-white/10 bg-[#080C14]/80 py-16 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-12">
            <p className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Multi-Agent Interoperability
            </p>
            <h2 className="mt-2 text-2xl sm:text-3xl font-bold text-white">
              Satu Jembatan Konteks untuk Seluruh Ekosistem Agent
            </h2>
            <p className="mt-2 text-sm text-slate-400 max-w-xl mx-auto">
              KAEDE bukan agent tersendiri—KAEDE adalah sistem operasi konteks yang memberi makan agen favorit Anda dengan memori organisasi yang akurat.
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-5">
            {AGENTS.map((agent) => (
              <div
                key={agent.name}
                className="rounded-xl border border-white/10 bg-white/5 p-5 glass-panel-hover flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <h3 className="font-bold text-white text-base">{agent.name}</h3>
                    <span className="text-[10px] font-semibold uppercase px-2 py-0.5 rounded bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                      {agent.badge}
                    </span>
                  </div>
                  <p className="text-xs text-emerald-300/90 font-medium mb-2">{agent.role}</p>
                  <p className="text-xs text-slate-400 leading-relaxed">{agent.desc}</p>
                </div>
                <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-[11px] text-slate-500">
                  <span>Native MCP Support</span>
                  <span className="text-emerald-400">✓ Ready</span>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 3: THE 3 CORE VALUE PILLARS ── */}
      <section id="features" className="py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="text-center mb-16">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              The Architecture of Truth
            </span>
            <h2 className="mt-2 text-3xl sm:text-4xl font-extrabold text-white">
              Tiga Pilar Keunggulan KAEDE
            </h2>
            <p className="mt-3 text-slate-400 text-sm sm:text-base max-w-2xl mx-auto">
              Menghentikan friksi antara engineer, tim non-developer, dan autonomous AI agent.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {/* Pillar 1 */}
            <div className="rounded-2xl border border-white/10 bg-[#0F172A]/50 p-8 flex flex-col justify-between glass-panel-hover">
              <div>
                <div className="size-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400 mb-6">
                  <Layers className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Zero-Prompt Context Resolution</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Agent langsung memindai hierarki identitas (<code className="text-emerald-400">.github</code>), pedoman operasional (<code className="text-emerald-400">playbook</code>), dan standar subjektif kode (<code className="text-emerald-400">.openkb</code>) tanpa Anda harus mendiktekan ulang setiap sesi.
                </p>
              </div>
              <ul className="mt-6 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Resolusi otomatis akun personal & organisasi
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-emerald-400" />
                  Struktur terpadu .openkb/brand & tech
                </li>
              </ul>
            </div>

            {/* Pillar 2 */}
            <div className="rounded-2xl border border-white/10 bg-[#0F172A]/50 p-8 flex flex-col justify-between glass-panel-hover">
              <div>
                <div className="size-12 rounded-xl bg-sky-500/10 border border-sky-500/20 flex items-center justify-center text-sky-400 mb-6">
                  <Trello className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Trello as Visual State Machine</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Tidak perlu dashboard baru yang rumit. Tim non-developer cukup membuat kartu di Trello. Perpindahan kolom berfungsi sebagai state-machine pemicu eksekusi agent, dan log audit otomatis tercatat di komentar.
                </p>
              </div>
              <ul className="mt-6 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-sky-400" />
                  47 Trello MCP Tools terintegrasi
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-sky-400" />
                  Automatic preview link di komentar kartu
                </li>
              </ul>
            </div>

            {/* Pillar 3 */}
            <div className="rounded-2xl border border-white/10 bg-[#0F172A]/50 p-8 flex flex-col justify-between glass-panel-hover">
              <div>
                <div className="size-12 rounded-xl bg-purple-500/10 border border-purple-500/20 flex items-center justify-center text-purple-400 mb-6">
                  <ShieldCheck className="size-6" />
                </div>
                <h3 className="text-xl font-bold text-white">Code Sovereign & Privacy First</h3>
                <p className="mt-3 text-sm text-slate-400 leading-relaxed">
                  Jaminan penuh zero code training: repositori privat dan SOP Anda tidak pernah dipakai untuk melatih LLM publik. Token disimpan secara lokal di mesin operator dengan izin file ketat.
                </p>
              </div>
              <ul className="mt-6 space-y-2 text-xs text-slate-300">
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-purple-400" />
                  Headless local secret storage (chmod 600)
                </li>
                <li className="flex items-center gap-2">
                  <CheckCircle2 className="size-4 text-purple-400" />
                  Kepatuhan penuh UU PDP & GDPR
                </li>
              </ul>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 4: SOLUTIONS PREVIEW (THE 4 PERSONAS) ── */}
      <section className="border-t border-white/10 bg-[#080C14] py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-6xl">
          <div className="flex flex-wrap items-end justify-between gap-6 mb-12">
            <div>
              <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
                Tailored for Every Entity
              </span>
              <h2 className="mt-2 text-3xl font-extrabold text-white">
                Siapa Saja yang Menggunakan KAEDE?
              </h2>
            </div>
            <Link href="/solutions">
              <Button variant="outline" className="border-white/10 text-slate-200 hover:text-white">
                Lihat Seluruh Solusi Matrix →
              </Button>
            </Link>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Persona 1: Agencies */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-pink-500/10 text-pink-400 border border-pink-500/20">
                  <Building2 className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Agensi Digital & Tim Kreatif</h3>
                  <p className="text-xs text-slate-400">Studi Kasus: PT Koneksi Jaringan Indonesia</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Membantu copywriter dan SEO specialist menghasilkan artikel yang 100% mematuhi Brand Voice klien melalui <code className="text-pink-300">.openkb/brand/</code> dan otomatis menerbitkan draft WordPress via MCP.
              </p>
              <div className="text-[11px] text-pink-400 font-medium">
                Dampak: Output konten meningkat 3x tanpa deviasi gaya bahasa.
              </div>
            </div>

            {/* Persona 2: Education */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                  <GraduationCap className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Institusi Pendidikan & Sekolah</h3>
                  <p className="text-xs text-slate-400">Studi Kasus: SMA UII Yogyakarta</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Mengintegrasikan koordinasi puluhan portal sekolah (Aksesekolah, Sistem Nilai, PPDB). Guru dan waka memantau kemajuan fitur lewat Trello tanpa perlu membuka repositori Git.
              </p>
              <div className="text-[11px] text-emerald-400 font-medium">
                Dampak: 100% transparansi roadmap IT bagi pimpinan sekolah & yayasan.
              </div>
            </div>

            {/* Persona 3: Software Teams */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-sky-500/10 text-sky-400 border border-sky-500/20">
                  <GitBranch className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Software Engineering Teams</h3>
                  <p className="text-xs text-slate-400">Untuk Developer & Tech Lead</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Standarisasi clean architecture, zero-hallucination bug fixing, dan pelaporan eksekusi test suite otomatis langsung di komentar kartu Trello sebelum pull request diajukan.
              </p>
              <div className="text-[11px] text-sky-400 font-medium">
                Dampak: Waktu onboarding engineer baru & AI agent terpangkas ke 0 detik.
              </div>
            </div>

            {/* Persona 4: Solo Founders */}
            <div className="p-6 rounded-2xl border border-white/10 bg-white/5 space-y-4">
              <div className="flex items-center gap-3">
                <div className="p-2.5 rounded-lg bg-amber-500/10 text-amber-400 border border-amber-500/20">
                  <Laptop className="size-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Solo Technical Builders</h3>
                  <p className="text-xs text-slate-400">1-Person Tech Companies</p>
                </div>
              </div>
              <p className="text-xs text-slate-300 leading-relaxed">
                Tuliskan ide di kartu Trello lewat smartphone Anda saat di jalan. Agen Hermes dan Antigravity mengeksekusi di server dan mengirimkan URL staging siap uji coba.
              </p>
              <div className="text-[11px] text-amber-400 font-medium">
                Dampak: Kapasitas eksekusi 1 founder setara dengan tim berisi 5 orang.
              </div>
            </div>
          </div>
        </div>
      </section>

      {/* ── SECTION 5: FAQ ── */}
      <section className="py-20 px-4 sm:px-6">
        <div className="container mx-auto max-w-4xl">
          <div className="text-center mb-12">
            <span className="text-xs font-semibold uppercase tracking-widest text-emerald-400">
              Pertanyaan Umum
            </span>
            <h2 className="mt-2 text-3xl font-extrabold text-white">Frequently Asked Questions</h2>
          </div>

          <div className="space-y-4">
            {FAQS.map((item, i) => (
              <div key={i} className="rounded-xl border border-white/10 bg-[#0F172A]/60 p-5">
                <div className="flex items-start gap-3">
                  <HelpCircle className="size-5 text-emerald-400 mt-0.5 shrink-0" />
                  <div>
                    <h3 className="text-sm font-bold text-white">{item.q}</h3>
                    <p className="mt-2 text-xs sm:text-sm text-slate-400 leading-relaxed">{item.a}</p>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* ── SECTION 6: BOTTOM CONVERSION CTA ── */}
      <section className="border-t border-white/10 bg-gradient-to-b from-[#0B0F17] to-[#04070D] py-20 px-4 sm:px-6 text-center">
        <div className="container mx-auto max-w-4xl">
          <div className="inline-flex size-14 rounded-2xl bg-emerald-500/10 border border-emerald-500/20 items-center justify-center text-emerald-400 mb-6 shadow-lg shadow-emerald-500/10">
            <Zap className="size-7" />
          </div>
          <h2 className="text-3xl sm:text-5xl font-black text-white tracking-tight">
            Siap Menghubungkan Tim Anda dengan AI Workforce?
          </h2>
          <p className="mt-4 text-base sm:text-lg text-slate-300 max-w-2xl mx-auto leading-relaxed">
            Mulai sekarang secara gratis. Sambungkan akun GitHub Anda dan rasakan kemudahan kolaborasi agentic tanpa halusinasi.
          </p>
          <div className="mt-8 flex flex-wrap items-center justify-center gap-4">
            <Link href="/dashboard">
              <Button size="lg" className="bg-emerald-600 hover:bg-emerald-500 text-white font-bold px-8 h-12 shadow-xl shadow-emerald-500/30">
                <Bot className="mr-2 size-5" /> Buka KAEDE Agent Desktop
              </Button>
            </Link>
            <Link href="/pricing">
              <Button size="lg" variant="outline" className="border-white/15 bg-white/5 hover:bg-white/10 text-white font-semibold px-6 h-12">
                Lihat Skema Harga & Fitur
              </Button>
            </Link>
          </div>
        </div>
      </section>
    </div>
  );
}
