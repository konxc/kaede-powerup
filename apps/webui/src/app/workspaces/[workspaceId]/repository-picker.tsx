'use client';

import { useEffect, useState } from 'react';
import { Check, LoaderCircle, RotateCw } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';

type SourceType = '' | 'playbook' | 'project' | 'profile';

interface Repository {
  id: string;
  fullName: string;
  private: boolean;
  defaultBranch: string | null;
  sourceType: SourceType;
  contentPath: string;
}

interface RepositoryResponse {
  accounts: Array<{ login: string; type: string }>;
  repositories: Repository[];
}

export default function RepositoryPicker({ workspaceId }: { workspaceId: string }) {
  const [data, setData] = useState<RepositoryResponse | null>(null);
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [previewing, setPreviewing] = useState('');
  const [saved, setSaved] = useState(false);
  const [preview, setPreview] = useState<{ repository: string; path: string; ref: string | null; sha: string; content: string } | null>(null);

  async function loadRepositories() {
    setLoading(true);
    setError('');
    setSaved(false);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/repositories`, { cache: 'no-store' });
      const result = await response.json() as RepositoryResponse & { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not load repositories.');
      setData(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not load repositories.');
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    void loadRepositories();
  }, [workspaceId]);

  function setSourceType(repositoryId: string, sourceType: SourceType) {
    setData((current) => current && ({
      ...current,
      repositories: current.repositories.map((repository) => ({
        ...repository,
        sourceType: repository.id === repositoryId ? sourceType : sourceType === 'playbook' ? '' : repository.sourceType,
        contentPath: repository.id === repositoryId && sourceType && !repository.contentPath
          ? sourceType === 'profile' ? 'README.md' : sourceType === 'playbook' ? 'playbook.md' : 'README.md'
          : repository.contentPath,
      })),
    }));
    setSaved(false);
    setPreview(null);
  }

  async function previewFile(repository: Repository) {
    setPreviewing(repository.id);
    setError('');
    setPreview(null);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/repositories/${repository.id}/contents?path=${encodeURIComponent(repository.contentPath)}`, { cache: 'no-store' });
      const result = await response.json() as { repository: string; path: string; ref: string | null; sha: string; content: string; error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not read repository file.');
      setPreview(result);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not read repository file.');
    } finally {
      setPreviewing('');
    }
  }

  async function saveSelection() {
    if (!data) return;
    setSaving(true);
    setError('');
    setSaved(false);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/repositories`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          repositories: data.repositories
            .filter((repository) => repository.sourceType)
            .map(({ id, sourceType, contentPath }) => ({ repositoryId: id, sourceType, contentPath })),
        }),
      });
      const result = await response.json() as { error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not save repository selection.');
      setSaved(true);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : 'Could not save repository selection.');
    } finally {
      setSaving(false);
    }
  }

  return (
    <Card className="mt-7">
      <CardHeader className="flex flex-row items-center justify-between gap-4">
        <div>
          <CardTitle className="text-base">Repository sources</CardTitle>
          <p className="mt-1 text-sm text-muted-foreground">Only selected repositories become available to this workspace.</p>
        </div>
        <Button type="button" variant="outline" size="icon" onClick={() => void loadRepositories()} disabled={loading} aria-label="Refresh repositories">
          {loading ? <LoaderCircle className="size-4 animate-spin" /> : <RotateCw className="size-4" />}
        </Button>
      </CardHeader>
      <CardContent>
        {data ? (
          <p className="mb-4 text-sm text-muted-foreground">
            Connected: {data.accounts.map((account) => `${account.login} (${account.type})`).join(', ')}
          </p>
        ) : null}

        {loading ? <p className="py-5 text-sm text-muted-foreground">Loading repositories...</p> : null}
        {!loading && data?.repositories.length === 0 ? <p className="py-5 text-sm text-muted-foreground">This installation has no accessible repositories.</p> : null}

        {data?.repositories.length ? (
          <div className="divide-y divide-border rounded-md border border-border">
            {data.repositories.map((repository) => (
              <div key={repository.id} className="flex flex-wrap items-center justify-between gap-3 px-3 py-3">
                <div className="min-w-0">
                  <p className="truncate font-medium">{repository.fullName}</p>
                  <p className="text-xs text-muted-foreground">
                    {repository.private ? 'Private' : 'Public'}{repository.defaultBranch ? ` · ${repository.defaultBranch}` : ''}
                  </p>
                </div>
                <label className="flex items-center gap-2 text-sm">
                  <span className="sr-only">Context role for {repository.fullName}</span>
                  <div className="flex flex-wrap items-center gap-2">
                    <select
                      value={repository.sourceType}
                      onChange={(event) => setSourceType(repository.id, event.target.value as SourceType)}
                      className="h-9 rounded-md border border-input bg-background px-2 text-sm"
                    >
                      <option value="">Not selected</option>
                      <option value="playbook">Workspace playbook</option>
                      <option value="project">Project repository</option>
                      <option value="profile">Owner profile / knowledge</option>
                    </select>
                    {repository.sourceType ? (
                      <>
                        <input
                          aria-label={`Context file path for ${repository.fullName}`}
                          value={repository.contentPath}
                          onChange={(event) => {
                            const contentPath = event.target.value;
                            setData((current) => current && ({
                              ...current,
                              repositories: current.repositories.map((item) => item.id === repository.id ? { ...item, contentPath } : item),
                            }));
                            setSaved(false);
                            setPreview(null);
                          }}
                          placeholder="Path to context file"
                          className="h-9 w-48 rounded-md border border-input bg-background px-2 text-sm"
                        />
                        <Button type="button" variant="outline" size="sm" onClick={() => void previewFile(repository)} disabled={!repository.contentPath || !saved || !!previewing}>
                          {previewing === repository.id ? <LoaderCircle className="size-4 animate-spin" /> : 'Preview'}
                        </Button>
                      </>
                    ) : null}
                  </div>
                </label>
              </div>
            ))}
          </div>
        ) : null}

        {error ? <p role="alert" className="mt-4 text-sm text-red-400">{error}</p> : null}
        {preview ? (
          <section className="mt-4 rounded-md border border-border" aria-label="Repository file preview">
            <div className="border-b border-border px-3 py-2 text-xs text-muted-foreground">
              {preview.repository}/{preview.path} · {preview.ref || 'default branch'} · {preview.sha}
            </div>
            <pre className="max-h-96 overflow-auto whitespace-pre-wrap break-words p-3 text-xs">{preview.content}</pre>
          </section>
        ) : null}
        <div className="mt-4 flex items-center gap-3">
          <Button type="button" onClick={() => void saveSelection()} disabled={loading || saving || !data || data.repositories.some((repository) => repository.sourceType && !repository.contentPath.trim())}>
            {saving ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <Check className="mr-2 size-4" />}
            Save selected sources
          </Button>
          {saved ? <span role="status" className="text-sm text-emerald-400">Sources saved</span> : null}
        </div>
      </CardContent>
    </Card>
  );
}