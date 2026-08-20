/**
 * KAEDE — Connect (SolidJS)
 *
 * Migrasi dari public/connect.html. Perilaku identik:
 *   - Konfigurasi URL API server (board shared storage).
 *   - Test koneksi /api/health, Save / Update Connection, Disconnect.
 */
import { createSignal, Show } from 'solid-js';

export default function Connect() {
  const t = window.TrelloPowerUp.iframe();

  const [apiBase, setApiBase] = createSignal('');
  const [showConn, setShowConn] = createSignal(false);
  const [connOk, setConnOk] = createSignal(false);
  const [connText, setConnText] = createSignal('');
  const [testing, setTesting] = createSignal(false);
  const [saving, setSaving] = createSignal(false);
  const [saveLabel, setSaveLabel] = createSignal('Save Connection');

  function showConnStatus(ok: boolean, msg: string) {
    setShowConn(true);
    setConnOk(ok);
    setConnText(msg);
  }

  function loadConfig() {
    return Promise.all([
      t.get('board', 'shared', 'apiBase', null),
      t.get('board', 'shared', 'auth', null),
    ]).then(function (results) {
      const base = results[0];
      const auth = results[1];
      if (base) setApiBase(base);
      if (auth && base) {
        showConnStatus(true, 'Connected to ' + base);
        setSaveLabel('Update Connection');
      }
    });
  }

  function testConnection(url: string) {
    setTesting(true);
    const testUrl = url + '/api/health';
    fetch(testUrl, { method: 'POST' })
      .then(function (r) {
        return r.json();
      })
      .then(function (data) {
        if (data.status === 'ok') {
          showConnStatus(true, 'Connected — KAEDE v' + (data.version || '?'));
        } else {
          showConnStatus(false, 'Unexpected response');
        }
      })
      .catch(function () {
        showConnStatus(false, 'Cannot reach server at ' + url);
      })
      .finally(function () {
        setTesting(false);
      });
  }

  function saveConnection(url: string) {
    setSaving(true);
    t.set('board', 'shared', 'apiBase', url)
      .then(function () {
        showConnStatus(true, 'Saved. Connecting to ' + url + '...');
        testConnection(url);
      })
      .catch(function (err: Error) {
        showConnStatus(false, 'Failed to save: ' + err.message);
      })
      .finally(function () {
        setSaving(false);
        setSaveLabel('Save Connection');
      });
  }

  function onTest() {
    const url = apiBase().trim();
    if (!url) {
      showConnStatus(false, 'Enter a server URL');
      return;
    }
    testConnection(url.replace(/\/+$/, ''));
  }

  function onSave() {
    const url = apiBase().trim();
    if (!url) {
      showConnStatus(false, 'Enter a server URL');
      return;
    }
    saveConnection(url.replace(/\/+$/, ''));
  }

  function onDisconnect() {
    Promise.all([
      t.set('board', 'shared', 'apiBase', null),
      t.set('board', 'shared', 'auth', null),
    ])
      .then(function () {
        setApiBase('');
        setShowConn(false);
        setSaveLabel('Save Connection');
      })
      .catch(function (err: Error) {
        showConnStatus(false, 'Disconnect failed: ' + err.message);
      });
  }

  loadConfig();

  return (
    <>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-kaede-text">KAEDE Connect</h2>
        <span class="flex items-center justify-center size-6 rounded bg-kaede-primary text-white text-[9px] font-bold">K</span>
      </div>

      <div class="flex-1">
        <Show when={showConn()}>
          <div class="flex items-center gap-2 px-3 py-2 bg-kaede-bg rounded-md mb-3">
            <span class={'size-2 rounded-full ' + (connOk() ? 'bg-kaede-success' : 'bg-kaede-warning')}></span>
            <span class="text-sm text-kaede-text">{connText()}</span>
          </div>
        </Show>

        <div class="mb-3">
          <label class="text-[11px] font-semibold text-kaede-muted uppercase tracking-wide">API Server URL</label>
          <div class="flex gap-2 mt-1">
            <input
              type="text"
              value={apiBase()}
              onInput={(e) => setApiBase(e.currentTarget.value)}
              placeholder="http://localhost:3456"
              class="flex-1 px-3 py-2 rounded-md border border-kaede-border bg-kaede-bg text-sm text-kaede-text outline-none transition-colors focus:border-kaede-primary"
            />
            <button
              type="button"
              onClick={onTest}
              disabled={testing()}
              class="px-3 py-2 rounded-lg border border-kaede-border bg-kaede-bg text-kaede-text text-sm cursor-pointer transition-colors hover:border-kaede-primary whitespace-nowrap disabled:opacity-40 disabled:cursor-not-allowed"
            >
              {testing() ? 'Testing...' : 'Test'}
            </button>
          </div>
        </div>

        <div class="flex gap-2">
          <button
            type="button"
            onClick={onSave}
            disabled={saving()}
            class="flex-1 px-4 py-2 rounded-lg bg-kaede-primary text-white text-sm font-medium cursor-pointer border-none transition-colors hover:bg-kaede-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {saving() ? 'Saving...' : saveLabel()}
          </button>
          <button
            type="button"
            onClick={onDisconnect}
            class="px-3 py-2 rounded-lg border border-kaede-danger/50 text-kaede-danger text-sm cursor-pointer bg-transparent transition-colors hover:bg-kaede-danger/10"
          >
            Disconnect
          </button>
        </div>

        <div class="mt-4 p-3 bg-kaede-bg rounded-md border border-kaede-border/50">
          <p class="text-[11px] text-kaede-muted leading-relaxed">
            Enter the URL of your KAEDE API server. For local development, run{' '}
            <code class="text-[10px]">bun scripts/kaede.mjs start</code> and use{' '}
            <code class="text-[10px]">http://localhost:3456</code>.
          </p>
        </div>
      </div>

      <div class="pt-3 border-t border-kaede-border/50 text-center">
        <a
          href="/"
          target="_blank"
          rel="noopener"
          class="text-[10px] text-kaede-muted hover:text-kaede-primary no-underline transition-colors"
        >
          About KAEDE Ecosystem
        </a>
      </div>
    </>
  );
}
