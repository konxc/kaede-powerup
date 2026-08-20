/**
 * KAEDE — MCP Control (SolidJS)
 *
 * Migrasi dari public/mcp.html. Perilaku identik:
 *   - Status koneksi API server (health check via KAEDEMCP).
 *   - Konteks card saat dibuka dari kartu (card id + name).
 *   - Input intent + args (JSON), tombol Execute, quick actions.
 *   - Menampilkan hasil / error dari /api/mcp.
 */
import { createSignal, Show } from 'solid-js';
import { KAEDEMCP } from '../lib/mcp-client';

export default function McpControl() {
  const t = window.TrelloPowerUp.iframe();

  const [connected, setConnected] = createSignal(false);
  const [statusText, setStatusText] = createSignal('');
  const [hasContext, setHasContext] = createSignal(false);
  const [contextName, setContextName] = createSignal('');
  const [contextId, setContextId] = createSignal('');
  const [intent, setIntent] = createSignal('');
  const [argsText, setArgsText] = createSignal('');
  const [executing, setExecuting] = createSignal(false);
  const [result, setResult] = createSignal('');
  const [showResult, setShowResult] = createSignal(false);
  const [errorText, setErrorText] = createSignal('');
  const [showError, setShowError] = createSignal(false);

  let cardId = '';
  let API_BASE = 'http://localhost:3456';

  function displayResult(data: unknown) {
    setShowError(false);
    setShowResult(true);
    setResult(typeof data === 'string' ? data : JSON.stringify(data, null, 2));
  }

  function displayError(msg: string) {
    setShowResult(false);
    setShowError(true);
    setErrorText(msg);
  }

  function checkConnection() {
    const isLocal = API_BASE.indexOf('localhost') > -1 || API_BASE.indexOf('127.0.0.1') > -1;
    KAEDEMCP.health()
      .then(function (data) {
        setConnected(true);
        setStatusText('API Server connected (v' + (data.version || '?') + ')');
      })
      .catch(function () {
        setConnected(false);
        const hint = isLocal
          ? 'Run: bun scripts/kaede.mjs start'
          : 'Set TRELLO_API_KEY + TRELLO_TOKEN in Netlify env';
        setStatusText('API Server not found. ' + hint);
      });
  }

  function executeMCP(intentName: string, args: Record<string, unknown>) {
    setExecuting(true);
    KAEDEMCP.callIntent(intentName, args)
      .then(function (data) {
        if (data.success) displayResult(data.results);
        else displayError(data.error || 'Unknown error');
      })
      .catch(function (err) {
        const hint =
          window.location.hostname === 'localhost'
            ? 'bun scripts/kaede.mjs start'
            : 'deploy the trello-proxy Netlify function';
        displayError('Connection failed: ' + err.message + '\n\nMake sure API is running:\n' + hint);
      })
      .finally(function () {
        setExecuting(false);
      });
  }

  function onExecute() {
    const value = intent().trim();
    if (!value) {
      displayError('Please enter an intent');
      return;
    }
    let args: Record<string, unknown> = {};
    try {
      if (argsText().trim()) args = JSON.parse(argsText().trim());
    } catch (e) {
      displayError('Invalid JSON in args: ' + (e as Error).message);
      return;
    }
    executeMCP(value, args);
  }

  // Init: resolve API_BASE + token (member-private) then setup UI
  KAEDEMCP.init(t).then(function () {
    API_BASE = KAEDEMCP.apiBase;
    checkConnection();
  });

  // Card context (jika popup dibuka dari sebuah kartu)
  t.card('id', 'name')
    .then(function (card: any) {
      if (card && card.id) {
        cardId = card.id;
        setHasContext(true);
        setContextName(card.name || 'Untitled');
        setContextId(card.id);
      }
    })
    .catch(function () {
      /* ignore */
    });

  function quickCard() {
    setIntent('buat card');
    setArgsText(JSON.stringify({ task: 'New Task', desc: 'Created from KAEDE Power-Up', list: 'To Do' }, null, 2));
  }

  function quickMove() {
    setIntent('pindah');
    setArgsText(JSON.stringify({ cardId: cardId || 'enter-card-id', listName: 'Done' }, null, 2));
  }

  function quickComment() {
    if (!cardId) {
      displayError('No card context. Open this from a card.');
      return;
    }
    setIntent('komentar');
    setArgsText(JSON.stringify({ cardId, text: 'Update from KAEDE Power-Up' }, null, 2));
  }

  function quickArchive() {
    if (!cardId) {
      displayError('No card context. Open this from a card.');
      return;
    }
    setIntent('arsipkan');
    setArgsText(JSON.stringify({ cardId }, null, 2));
  }

  return (
    <>
      <div class="flex items-center justify-between mb-4">
        <h2 class="text-base font-semibold text-kaede-text">KAEDE MCP</h2>
        <span class="flex items-center justify-center size-6 rounded bg-kaede-primary text-white text-[9px] font-bold">K</span>
      </div>

      <Show when={statusText()}>
        <div class="flex items-center gap-2 px-3 py-2 bg-kaede-bg rounded-md mb-3">
          <span class={'size-2 rounded-full ' + (connected() ? 'bg-kaede-success' : 'bg-kaede-warning')}></span>
          <span class="text-sm text-kaede-text">{statusText()}</span>
        </div>
      </Show>

      <Show when={hasContext()}>
        <div class="flex items-center gap-2 px-3 py-2 bg-kaede-bg rounded-md border border-kaede-border/50 mb-3">
          <span class="size-2 rounded-full bg-kaede-primary shrink-0"></span>
          <div class="min-w-0">
            <div class="text-sm font-medium text-kaede-text truncate">{contextName()}</div>
            <div class="text-[10px] text-kaede-muted font-mono truncate">{contextId()}</div>
          </div>
        </div>
      </Show>

      <div class="flex-1">
        <div class="mb-3">
          <label class="text-[11px] font-semibold text-kaede-muted uppercase tracking-wide">Intent</label>
          <input
            type="text"
            value={intent()}
            onInput={(e) => setIntent(e.currentTarget.value)}
            placeholder="e.g. buat card (create card)"
            class="w-full mt-1 px-3 py-2 rounded-md border border-kaede-border bg-kaede-bg text-sm text-kaede-text outline-none transition-colors focus:border-kaede-primary"
          />
        </div>
        <div class="mb-3">
          <label class="text-[11px] font-semibold text-kaede-muted uppercase tracking-wide">Args (JSON)</label>
          <textarea
            value={argsText()}
            onInput={(e) => setArgsText(e.currentTarget.value)}
            rows="3"
            placeholder='{"task":"New feature","list":"To Do"}'
            class="w-full mt-1 px-3 py-2 rounded-md border border-kaede-border bg-kaede-bg text-sm text-kaede-text outline-none transition-colors focus:border-kaede-primary resize-none font-mono"
          ></textarea>
        </div>
        <div class="flex gap-2">
          <button
            type="button"
            onClick={onExecute}
            disabled={executing()}
            class="flex-1 px-4 py-2 rounded-lg bg-kaede-primary text-white text-sm font-medium cursor-pointer border-none transition-colors duration-200 hover:bg-kaede-primary-hover disabled:opacity-40 disabled:cursor-not-allowed"
          >
            {executing() ? 'Executing...' : 'Execute'}
          </button>
          <button
            type="button"
            onClick={quickCard}
            class="px-3 py-2 rounded-lg border border-kaede-border bg-kaede-bg text-kaede-text text-sm cursor-pointer transition-colors hover:border-kaede-primary"
          >
            Quick Card
          </button>
          <button
            type="button"
            onClick={quickMove}
            class="px-3 py-2 rounded-lg border border-kaede-border bg-kaede-bg text-kaede-text text-sm cursor-pointer transition-colors hover:border-kaede-primary"
          >
            Quick Move
          </button>
        </div>
        <div class="flex gap-2 mt-2">
          <button
            type="button"
            onClick={quickComment}
            class="flex-1 px-3 py-2 rounded-lg border border-kaede-border bg-kaede-bg text-kaede-text text-sm cursor-pointer transition-colors hover:border-kaede-primary"
          >
            Quick Comment
          </button>
          <button
            type="button"
            onClick={quickArchive}
            class="flex-1 px-3 py-2 rounded-lg border border-kaede-border bg-kaede-bg text-kaede-text text-sm cursor-pointer transition-colors hover:border-kaede-primary"
          >
            Quick Archive
          </button>
        </div>
        <Show when={showResult()}>
          <div class="mt-3">
            <div class="text-[11px] font-semibold text-kaede-muted uppercase tracking-wide mb-1">Result</div>
            <pre class="text-xs text-kaede-text bg-kaede-bg rounded-md p-3 overflow-x-auto max-h-40 leading-relaxed">{result()}</pre>
          </div>
        </Show>
        <Show when={showError()}>
          <div class="mt-3">
            <div class="text-[11px] font-semibold text-kaede-danger uppercase tracking-wide mb-1">Error</div>
            <pre class="text-xs text-kaede-danger bg-kaede-bg rounded-md p-3 overflow-x-auto leading-relaxed">{errorText()}</pre>
          </div>
        </Show>
      </div>

      <div class="pt-3 border-t border-kaede-border/50 flex justify-between items-center">
        <span class="text-[10px] text-kaede-muted">
          Try: buat card (create), pindah (move), komentar (comment), report
        </span>
        <a
          href="/"
          target="_blank"
          rel="noopener"
          class="text-[10px] text-kaede-muted hover:text-kaede-primary no-underline transition-colors"
        >
          Info
        </a>
      </div>
    </>
  );
}
