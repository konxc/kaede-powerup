'use client';

import * as React from 'react';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import {
  Check,
  HelpCircle,
  Sparkles,
  Zap,
  Building2,
  Users,
  Terminal,
  ShieldCheck,
  ArrowRight,
  Bot,
} from 'lucide-react';

const TIERS = [
  {
    name: 'Community',
    id: 'community',
    tagline: 'Untuk solo developer & kontributor open-source',
    priceMonthly: 0,
    priceAnnual: 0,
    highlight: false,
    badge: 'Open Source',
    cta: 'Install via CLI (Free)',
    href: '/#features',
    features: [
      'CLI binary kaede open-source',
      '47 Trello MCP tools suite',
      '45 KAEDE context resolution tools',
      'Unlimited repository & board lokal',
      'Dukungan Antigravity, OpenCode, Claude Code',
      'Komunitas Discord & GitHub Discussions',
    ],
  },
  {
    name: 'Pro Team',
    id: 'pro',
    tagline: 'Untuk tim software development & startup kecil',
    priceMonthly: 19,
    priceAnnual: 15,
    highlight: true,
    badge: 'Paling Populer',
    cta: 'Mulai Uji Coba Pro',
    href: '/dashboard',
    features: [
      'Seluruh fitur Community',
      'Akses Cloud Agent Desktop WebUI',
      'GitHub App automated repository sync',
      'Persistent edge context cache (Turso LibSQL)',
      'Realtime webhook update Trello ke Agent',
      'Hingga 10 shared workspace boards',
      'Audit log aktivitas agen & kartu',
      'Prioritas pembaruan konteks',
    ],
  },
  {
    name: 'Agency',
    id: 'agency',
    tagline: 'Untuk agensi digital, kreatif, & software house multi-klien',
    priceMonthly: 49,
    priceAnnual: 39,
    highlight: false,
    badge: 'Multi-Tenant',
    cta: 'Daftar Workspace Agensi',
    href: '/dashboard',
    features: [
      'Seluruh fitur Pro Team',
      'Multi-profile context switching (klien A vs klien B)',
      'Unlimited client boards & repositori',
      'Brand Voice validator tool (.openkb/brand/)',
      'Integrasi CMS WordPress via MCP chain',
      'Headless Hermes WhatsApp agent configuration',
      'Template Playbook khusus SEO & Marketing',
      'Dedicated Slack / WhatsApp priority support',
    ],
  },
  {
    name: 'Enterprise',
    id: 'enterprise',
    tagline: 'Untuk yayasan, sekolah besar, & korporasi dengan kepatuhan ketat',
    priceMonthly: null,
    priceAnnual: null,
    highlight: false,
    badge: 'Kustom & Edukasi',
    cta: 'Konsultasi Tim Solusi',
    href: 'mailto:konxcid@gmail.com?subject=Inquiry%20KAEDE%20Enterprise%20/%20Education',
    features: [
      'Seluruh fitur Agency',
      'On-premise atau Private Cloud VPC deployment',
      'Custom LLM gateway & bring-your-own-keys (BYOK)',
      'SSO & SAML integration (Google Workspace, Okta)',
      'SLA 99.9% uptime garansi kontrak',
      'Diskon khusus sekolah & yayasan pendidikan',
      'Dedicated onboarding & training tim internal',
      'Perjanjian DPA & audit keamanan kustom',
    ],
  },
];

const COMPARISON_ROWS = [
  {
    category: 'Context Resolution & Knowledge Base',
    features: [
      { name: 'Resolusi Identitas GitHub (.github & username)', community: true, pro: true, agency: true, enterprise: true },
      { name: 'Resolusi Business SOP Playbook', community: true, pro: true, agency: true, enterprise: true },
      { name: 'Dukungan Living KB (.openkb/brand, tech)', community: true, pro: true, agency: true, enterprise: true },
      { name: 'Persistent Edge Context Cache', community: false, pro: true, agency: true, enterprise: true },
      { name: 'Multi-Profile Context Isolation', community: false, pro: false, agency: true, enterprise: true },
    ],
  },
  {
    category: 'Trello & Workflow State Machine',
    features: [
      { name: '47 Trello MCP Tools Suite', community: true, pro: true, agency: true, enterprise: true },
      { name: 'Automated Comment Test Logs', community: true, pro: true, agency: true, enterprise: true },
      { name: 'Realtime Trello Webhooks', community: false, pro: true, agency: true, enterprise: true },
      { name: 'Unlimited Trello Boards', community: 'Lokal', pro: '10 Boards', agency: 'Unlimited', enterprise: 'Unlimited' },
      { name: 'Multi-Agent Handoff Dispatcher', community: 'Manual', pro: true, agency: true, enterprise: true },
    ],
  },
  {
    category: 'Agent & Runtime Compatibility',
    features: [
      { name: 'Antigravity CLI & OpenCode', community: true, pro: true, agency: true, enterprise: true },
      { name: 'Claude Code & Cursor MCP', community: true, pro: true, agency: true, enterprise: true },
      { name: 'Headless Hermes WhatsApp 24/7 Agent', community: 'Self-hosted', pro: true, agency: true, enterprise: true },
      { name: 'Custom LLM Gateway Routing', community: false, pro: false, agency: false, enterprise: true },
    ],
  },
  {
    category: 'Keamanan, Trust & Kepatuhan',
    features: [
      { name: 'Zero Model Training Guarantee', community: true, pro: true, agency: true, enterprise: true },
      { name: 'Headless Local Secrets (chmod 600)', community: true, pro: true, agency: true, enterprise: true },
      { name: 'Kepatuhan UU PDP No. 27/2022 & GDPR', community: true, pro: true, agency: true, enterprise: true },
      { name: 'Dedicated Private VPC Deployment', community: false, pro: false, agency: false, enterprise: true },
      { name: 'SLA Garansi Uptime', community: 'Community', pro: 'Standard', agency: 'Priority', enterprise: '99.9% SLA' },
    ],
  },
];

const BILLING_FAQS = [
  {
    q: 'Apakah saya bisa menggunakan KAEDE sepenuhnya gratis?',
    a: 'Ya. Edisi Community bersifat open-source 100% dan bebas royalti untuk digunakan di laptop atau server Anda sendiri tanpa batasan durasi.',
  },
  {
    q: 'Bagaimana biaya token AI dihitung? Apakah BYOK?',
    a: 'KAEDE menggunakan model BYOK (Bring Your Own Key). Anda dapat menggunakan API key LLM Anda sendiri (Google Gemini, Anthropic Claude, atau OpenAI) atau memanfaatkan langganan CLI yang sudah Anda miliki seperti Antigravity CLI, sehingga tidak ada mark-up biaya token dari kami.',
  },
  {
    q: 'Apakah ada paket khusus untuk sekolah dan yayasan?',
    a: 'Tentu. Yayasan pendidikan dan sekolah (seperti SMA UII Yogyakarta) berhak mendapatkan program subsidi edukasi hingga potongan 50% atau paket enterprise custom yang disesuaikan dengan anggaran institusi.',
  },
  {
    q: 'Apakah saya bisa membatalkan langganan kapan saja?',
    a: 'Bisa kapan saja langsung melalui dashboard akun Anda. Akses Anda akan tetap aktif hingga akhir periode penagihan yang sedang berjalan.',
  },
];

export default function PricingPage() {
  const [isAnnual, setIsAnnual] = React.useState(true);

  return (
    <div className="py-16 sm:py-24 px-4 sm:px-6">
      <div className="container mx-auto max-w-6xl">
        {/* Header */}
        <div className="text-center max-w-3xl mx-auto mb-16">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400 mb-4">
            <Sparkles className="size-3.5" />
            <span>Skema Harga Fleksibel & Transparan</span>
          </div>
          <h1 className="text-4xl sm:text-5xl font-extrabold text-white tracking-tight">
            Investasi Cerdas untuk Menggandakan Kapasitas Tim
          </h1>
          <p className="mt-4 text-base sm:text-lg text-slate-300 leading-relaxed">
            Mulai dari paket open-source gratis hingga infrastruktur cloud terkelola untuk agensi, yayasan sekolah, dan korporasi.
          </p>

          {/* Billing Switch */}
          <div className="mt-8 inline-flex items-center gap-3 p-1 rounded-xl bg-white/5 border border-white/10">
            <button
              onClick={() => setIsAnnual(false)}
              className={`text-xs sm:text-sm px-4 py-2 rounded-lg font-medium transition-all ${
                !isAnnual ? 'bg-white text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              Bulanan
            </button>
            <button
              onClick={() => setIsAnnual(true)}
              className={`text-xs sm:text-sm px-4 py-2 rounded-lg font-medium transition-all flex items-center gap-1.5 ${
                isAnnual ? 'bg-emerald-500 text-slate-950 font-bold shadow' : 'text-slate-400 hover:text-white'
              }`}
            >
              <span>Tahunan</span>
              <span className="text-[10px] font-bold uppercase px-1.5 py-0.5 rounded bg-emerald-950 text-emerald-300">
                Hemat 20%
              </span>
            </button>
          </div>
        </div>

        {/* Pricing Cards Grid */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
          {TIERS.map((tier) => {
            const price = isAnnual ? tier.priceAnnual : tier.priceMonthly;
            return (
              <div
                key={tier.id}
                className={`rounded-2xl border p-6 flex flex-col justify-between transition-all relative ${
                  tier.highlight
                    ? 'border-emerald-500/50 bg-[#0F172A] shadow-2xl shadow-emerald-500/10 ring-1 ring-emerald-500/30'
                    : 'border-white/10 bg-white/5 hover:border-white/20'
                }`}
              >
                {tier.badge && (
                  <div className="absolute -top-3 left-6 px-2.5 py-0.5 rounded-full text-[10px] font-bold tracking-wide uppercase bg-emerald-500 text-slate-950 shadow">
                    {tier.badge}
                  </div>
                )}

                <div>
                  <h3 className="text-xl font-bold text-white">{tier.name}</h3>
                  <p className="mt-2 text-xs text-slate-400 min-h-[36px]">{tier.tagline}</p>

                  <div className="mt-6 pb-6 border-b border-white/10">
                    {price === null ? (
                      <div className="text-3xl font-extrabold text-white">Custom</div>
                    ) : (
                      <div className="flex items-baseline gap-1">
                        <span className="text-4xl font-extrabold text-white">${price}</span>
                        <span className="text-xs text-slate-400">/ bulan</span>
                      </div>
                    )}
                    <span className="text-[11px] text-slate-500 block mt-1">
                      {price === 0
                        ? 'Gratis selamanya'
                        : price === null
                        ? 'Hubungi tim sales'
                        : isAnnual
                        ? 'Ditagih tahunan'
                        : 'Ditagih bulanan'}
                    </span>
                  </div>

                  <ul className="mt-6 space-y-2.5 text-xs text-slate-300">
                    {tier.features.map((feat, i) => (
                      <li key={i} className="flex items-start gap-2">
                        <Check className="size-4 text-emerald-400 shrink-0 mt-0.5" />
                        <span>{feat}</span>
                      </li>
                    ))}
                  </ul>
                </div>

                <div className="mt-8 pt-4">
                  <Link href={tier.href}>
                    <Button
                      className={`w-full text-xs font-bold h-10 ${
                        tier.highlight
                          ? 'bg-emerald-500 hover:bg-emerald-400 text-slate-950 shadow-lg shadow-emerald-500/25'
                          : 'bg-white/10 hover:bg-white/20 text-white'
                      }`}
                    >
                      {tier.cta}
                    </Button>
                  </Link>
                </div>
              </div>
            );
          })}
        </div>

        {/* Feature Comparison Table */}
        <div className="mt-24">
          <div className="text-center mb-12">
            <h2 className="text-2xl sm:text-3xl font-bold text-white">Komparasi Fitur Lengkap</h2>
            <p className="mt-2 text-xs sm:text-sm text-slate-400">
              Rincian komparasi seluruh fitur lintas paket edisi KAEDE.
            </p>
          </div>

          <div className="rounded-2xl border border-white/10 bg-[#0F172A]/40 overflow-x-auto shadow-xl">
            <table className="w-full text-left text-xs border-collapse">
              <thead>
                <tr className="border-b border-white/10 bg-white/5 text-slate-300">
                  <th className="p-4 font-semibold w-2/5">Fitur & Kapabilitas</th>
                  <th className="p-4 font-semibold text-center w-1/6">Community</th>
                  <th className="p-4 font-semibold text-center w-1/6 text-emerald-400">Pro Team</th>
                  <th className="p-4 font-semibold text-center w-1/6">Agency</th>
                  <th className="p-4 font-semibold text-center w-1/6">Enterprise</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-white/5">
                {COMPARISON_ROWS.map((section, sIdx) => (
                  <React.Fragment key={sIdx}>
                    <tr className="bg-white/5">
                      <td colSpan={5} className="p-3 font-bold text-slate-200 uppercase tracking-wider text-[11px]">
                        {section.category}
                      </td>
                    </tr>
                    {section.features.map((row, rIdx) => (
                      <tr key={rIdx} className="hover:bg-white/5 transition-colors">
                        <td className="p-4 text-slate-300 font-medium">{row.name}</td>
                        <td className="p-4 text-center">
                          {typeof row.community === 'boolean' ? (
                            row.community ? (
                              <Check className="size-4 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )
                          ) : (
                            <span className="text-slate-400">{row.community}</span>
                          )}
                        </td>
                        <td className="p-4 text-center bg-emerald-950/20">
                          {typeof row.pro === 'boolean' ? (
                            row.pro ? (
                              <Check className="size-4 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )
                          ) : (
                            <span className="text-emerald-300 font-medium">{row.pro}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.agency === 'boolean' ? (
                            row.agency ? (
                              <Check className="size-4 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )
                          ) : (
                            <span className="text-slate-400">{row.agency}</span>
                          )}
                        </td>
                        <td className="p-4 text-center">
                          {typeof row.enterprise === 'boolean' ? (
                            row.enterprise ? (
                              <Check className="size-4 text-emerald-400 mx-auto" />
                            ) : (
                              <span className="text-slate-600">—</span>
                            )
                          ) : (
                            <span className="text-slate-400">{row.enterprise}</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </React.Fragment>
                ))}
              </tbody>
            </table>
          </div>
        </div>

        {/* FAQ Section */}
        <div className="mt-24 max-w-3xl mx-auto">
          <div className="text-center mb-10">
            <h3 className="text-2xl font-bold text-white">Pertanyaan Seputar Harga & Pembayaran</h3>
          </div>
          <div className="space-y-4">
            {BILLING_FAQS.map((faq, i) => (
              <div key={i} className="p-5 rounded-xl border border-white/10 bg-white/5 space-y-2">
                <h4 className="text-sm font-bold text-white flex items-center gap-2">
                  <HelpCircle className="size-4 text-emerald-400" />
                  {faq.q}
                </h4>
                <p className="text-xs sm:text-sm text-slate-400 leading-relaxed pl-6">{faq.a}</p>
              </div>
            ))}
          </div>
        </div>
      </div>
    </div>
  );
}
