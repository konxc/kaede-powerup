import { and, eq, inArray } from 'drizzle-orm';
import Link from 'next/link';
import { PageHeader } from '@/components/layout/page-header';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { auth } from '@/lib/auth';
import { db } from '@/db';
import { workspaceContextDocuments, workspaceProjects, workspaces } from '@/db/schema';
import { getAccessibleWorkspaceIdsForUser } from '@/lib/workspace-access';
import { BookOpen, Layers, FileCode, CheckCircle2, Copy, Sparkles, Bot, Github } from 'lucide-react';

export default async function PlaybookPage() {
  const session = await auth();
  const userId = session?.user?.id;
  const projects = userId
    ? await (async () => {
        const workspaceIds = await getAccessibleWorkspaceIdsForUser(userId);
        return workspaceIds.length
          ? await db
              .select({ project: workspaceProjects, workspaceName: workspaces.name })
              .from(workspaceProjects)
              .innerJoin(workspaces, eq(workspaceProjects.workspaceId, workspaces.id))
              .where(and(inArray(workspaceProjects.workspaceId, workspaceIds), eq(workspaceProjects.status, 'active')))
          : [];
      })()
    : [];
  const projectIds = projects.map(({ project }) => project.id);
  const documents = projectIds.length
    ? await db
        .select()
        .from(workspaceContextDocuments)
        .where(and(eq(workspaceContextDocuments.sourceKind, 'playbook'), inArray(workspaceContextDocuments.projectId, projectIds)))
    : [];

  return (
    <div className="py-12 sm:py-20 px-4 sm:px-6">
      <div className="container mx-auto max-w-5xl space-y-16">
        {/* Public Specification Header */}
        <div className="text-center max-w-3xl mx-auto space-y-4">
          <div className="inline-flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-xs font-semibold text-emerald-400">
            <Layers className="size-3.5" />
            <span>OpenKB Standard Specification</span>
          </div>
          <h1 className="text-3xl sm:text-5xl font-extrabold text-white tracking-tight">
            Standarisasi Living Knowledge Base
          </h1>
          <p className="text-sm sm:text-base text-slate-300 leading-relaxed">
            Panduan menstrukturkan dokumentasi institusi di GitHub (<code className="text-emerald-400">.github</code>, <code className="text-emerald-400">playbook</code>, dan <code className="text-emerald-400">.openkb</code>) agar dipahami oleh coding agent dan headless bot dengan zero hallucination.
          </p>
        </div>

        {/* 3-Layer Architecture Cards */}
        <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
          <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-emerald-400">
              Layer 1 · Identitas
            </span>
            <h3 className="text-lg font-bold text-white">Akun / Organisasi Root</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Disimpan di <code className="text-emerald-300">github.com/{'{org}'}/.github</code> atau <code className="text-emerald-300">github.com/{'{username}'}/{'{username}'}</code>. Berisi profil dasar, visi institusi, dan aturan umum.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-sky-400">
              Layer 2 · Operasional
            </span>
            <h3 className="text-lg font-bold text-white">Business Playbook</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Disimpan di repo <code className="text-sky-300">github.com/{'{org}'}/playbook</code>. Berisi SOP operasional bisnis, hierarki persetujuan manajerial, kultur kerja agensi, dan kalender kerja.
            </p>
          </div>

          <div className="p-6 rounded-2xl border border-white/10 bg-[#0F172A]/70 space-y-3">
            <span className="text-[10px] font-mono font-bold uppercase tracking-wider text-purple-400">
              Layer 3 · Proyek
            </span>
            <h3 className="text-lg font-bold text-white">Folder .openkb / .opencode</h3>
            <p className="text-xs text-slate-400 leading-relaxed">
              Disimpan di dalam repository aplikasi spesifik. Menjelaskan batasan teknologi, conventions, skema database, atau panduan persona brand klien.
            </p>
          </div>
        </div>

        {/* Recommended Folder Tree */}
        <div className="rounded-2xl border border-white/10 bg-slate-950/80 p-6 sm:p-8 space-y-4">
          <h2 className="text-lg font-bold text-white flex items-center gap-2">
            <FileCode className="size-5 text-emerald-400" />
            Standar Struktur Folder .openkb di Repositori
          </h2>
          <pre className="p-4 rounded-xl bg-[#0B0F17] border border-white/10 text-xs sm:text-sm font-mono text-emerald-300 overflow-x-auto leading-relaxed">
{`.openkb/
├── brand/
│   ├── voice-and-tone.md         # Aturan gaya bahasa & kepatuhan komunikasi brand
│   ├── personas.md               # Karakteristik audiens & buyer persona
│   └── visual-guidelines.md      # Palet warna, aturan logo, & layout panduan
├── marketing/
│   ├── keywords-matrix.md        # Daftar cluster keyword primer & sekunder SEO
│   ├── funnel-architecture.md    # Alur perjalanan user dari landing page ke closing
│   └── offer-and-pricing.md      # Detail promo, USP produk, objections handling
└── tech/
    ├── architecture.md           # Diagram sistem, stack runtime, & batasan arsitektur
    ├── conventions.md            # Aturan clean code, linting, & standar penamaan
    └── database-schema.md        # Definisi tabel, relasi, & query patterns`}
          </pre>
        </div>

        {/* Authenticated Workspace Playbook Section */}
        <div className="pt-8 border-t border-white/10 space-y-6">
          <div className="flex flex-wrap items-center justify-between gap-4">
            <div>
              <h2 className="text-2xl font-bold text-white flex items-center gap-2">
                <BookOpen className="size-6 text-emerald-400" />
                Playbook Terdeteksi di Workspace Anda
              </h2>
              <p className="text-xs sm:text-sm text-slate-400 mt-1">
                Dokumen hasil pemindaian otomatis dari repository yang telah terhubung ke KAEDE Agent Desktop.
              </p>
            </div>
            {!session?.user ? (
              <Link href="/dashboard">
                <Button className="bg-emerald-500 hover:bg-emerald-400 text-slate-950 font-bold text-xs">
                  <Bot className="mr-1.5 size-4" /> Sign In untuk Melihat Workspace Playbook
                </Button>
              </Link>
            ) : null}
          </div>

          {!session?.user ? (
            <div className="rounded-2xl border border-white/10 bg-white/5 p-8 text-center text-slate-400 text-sm">
              Silakan login dengan GitHub untuk melihat dokumen playbook riil dari repositori yang Anda kelola.
            </div>
          ) : !projects.length ? (
            <div className="rounded-2xl border border-dashed border-white/20 p-8 text-center text-slate-400 text-sm">
              Belum ada project aktif di workspace Anda. Hubungkan GitHub App dari{' '}
              <Link href="/dashboard" className="text-emerald-400 underline font-semibold">
                halaman Dashboard
              </Link>{' '}
              untuk memulai pemindaian otomatis.
            </div>
          ) : (
            <div className="space-y-6">
              {projects.map(({ project, workspaceName }) => {
                const projectDocuments = documents.filter((document) => document.projectId === project.id);
                return (
                  <Card key={project.id} className="border-white/10 bg-[#0F172A]/70 text-slate-200">
                    <CardHeader>
                      <CardTitle className="text-white text-lg">{project.fullName}</CardTitle>
                      <p className="text-xs text-slate-400">
                        {workspaceName} · {project.defaultBranch || 'default branch'} · {projectDocuments.length} playbook documents
                      </p>
                    </CardHeader>
                    <CardContent className="space-y-3">
                      {projectDocuments.length ? (
                        projectDocuments.map((document) => (
                          <details key={document.id} className="rounded-xl border border-white/10 bg-white/5">
                            <summary className="cursor-pointer px-4 py-3 text-xs sm:text-sm font-medium text-white hover:text-emerald-300 transition-colors">
                              {document.path}{' '}
                              <span className="ml-2 text-[10px] font-mono text-slate-500">
                                {document.commitSha || 'commit unknown'}
                              </span>
                            </summary>
                            <pre className="max-h-[32rem] overflow-auto whitespace-pre-wrap border-t border-white/10 p-4 text-xs font-mono text-emerald-300 bg-slate-950">
                              {document.content}
                            </pre>
                          </details>
                        ))
                      ) : (
                        <p className="text-xs text-slate-400">Belum ada dokumen playbook terdeteksi untuk project ini.</p>
                      )}
                    </CardContent>
                  </Card>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
