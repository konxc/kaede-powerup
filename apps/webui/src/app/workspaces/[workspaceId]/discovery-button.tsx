'use client';

import { useEffect, useState } from 'react';
import { LoaderCircle, ScanSearch } from 'lucide-react';
import { Button } from '@/components/ui/button';

type Project = {
  id: string;
  repositoryId: string;
  fullName: string;
  status: string;
  sourceKinds: string[];
};

export default function DiscoveryButton({ workspaceId }: { workspaceId: string }) {
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState('');
  const [projects, setProjects] = useState<Project[]>([]);
  const [selected, setSelected] = useState<string[]>([]);
  const [indexing, setIndexing] = useState<string>('');

  async function loadProjects() {
    const response = await fetch(`/api/workspaces/${workspaceId}/discovery`, { cache: 'no-store' });
    const result = await response.json() as { projects?: Project[] };
    if (response.ok) setProjects(result.projects || []);
  }

  useEffect(() => {
    void loadProjects();
  }, [workspaceId]);

  async function discover() {
    setLoading(true);
    setMessage('');
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/discovery`, { method: 'POST' });
      const result = await response.json() as { discovered?: unknown[]; failures?: unknown[]; error?: string };
      if (!response.ok) throw new Error(result.error || 'Discovery failed.');
      setMessage(`Discovered ${result.discovered?.length || 0} repositories${result.failures?.length ? `; ${result.failures.length} could not be inspected` : ''}.`);
      await loadProjects();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Discovery failed.');
    } finally {
      setLoading(false);
    }
  }

  async function approve() {
    setLoading(true);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/discovery`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ action: 'approve', repositoryIds: selected }),
      });
      const result = await response.json() as { approved?: number; error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not approve projects.');
      setMessage(`Activated ${result.approved || 0} projects.`);
      setSelected([]);
      await loadProjects();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not approve projects.');
    } finally {
      setLoading(false);
    }
  }

  async function indexProject(project: Project, kind: 'semantic-context' | 'codebase-graph') {
    const indexingKey = `${project.id}:${kind}`;
    setIndexing(indexingKey);
    try {
      const response = await fetch(`/api/workspaces/${workspaceId}/projects/${project.id}/index`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ kind }),
      });
      const result = await response.json() as { documents?: unknown[]; error?: string };
      if (!response.ok) throw new Error(result.error || 'Could not index project.');
      setMessage(kind === 'codebase-graph'
        ? `Indexed code graph for ${project.fullName}.`
        : `Indexed ${result.documents?.length || 0} context documents for ${project.fullName}.`);
    } catch (error) {
      setMessage(error instanceof Error ? error.message : 'Could not index project.');
    } finally {
      setIndexing('');
    }
  }

  return (
    <div className="flex flex-wrap items-center gap-3">
      <Button type="button" variant="outline" onClick={() => void discover()} disabled={loading}>
        {loading ? <LoaderCircle className="mr-2 size-4 animate-spin" /> : <ScanSearch className="mr-2 size-4" />}
        Discover repositories
      </Button>
      {message ? <span role="status" className="text-sm text-muted-foreground">{message}</span> : null}
      {projects.length ? (
        <div className="basis-full space-y-2 rounded-md border border-border p-3">
          <p className="text-sm font-medium">Discovered project candidates</p>
          {projects.map((project) => (
            <label key={project.repositoryId} className="flex items-center gap-3 text-sm">
              <input
                type="checkbox"
                checked={project.status === 'active' || selected.includes(project.repositoryId)}
                disabled={project.status === 'active'}
                onChange={(event) => setSelected((current) => event.target.checked
                  ? [...current, project.repositoryId]
                  : current.filter((id) => id !== project.repositoryId))}
              />
              <span className="min-w-0 flex-1 truncate">{project.fullName}</span>
              <span className="text-xs text-muted-foreground">{project.sourceKinds.join(', ')}</span>
              <span className="text-xs text-muted-foreground">{project.status}</span>
              {project.status === 'active' ? (
                <span className="flex items-center gap-2">
                  <Button type="button" size="sm" variant="outline" onClick={() => void indexProject(project, 'semantic-context')} disabled={loading || !!indexing}>
                    {indexing === `${project.id}:semantic-context` ? <LoaderCircle className="size-4 animate-spin" /> : 'Index'}
                  </Button>
                  <Button type="button" size="sm" variant="outline" onClick={() => void indexProject(project, 'codebase-graph')} disabled={loading || !!indexing}>
                    {indexing === `${project.id}:codebase-graph` ? <LoaderCircle className="size-4 animate-spin" /> : 'Code graph'}
                  </Button>
                </span>
              ) : null}
            </label>
          ))}
          <Button type="button" size="sm" onClick={() => void approve()} disabled={loading || !selected.length}>
            Approve selected projects
          </Button>
        </div>
      ) : null}
    </div>
  );
}
