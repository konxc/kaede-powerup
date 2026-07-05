/**
 * KAEDE MCP Client — Shared module for Power-Up ↔ MCP Server communication
 *
 * Usage:
 *   <script src="js/mcp-client.js"></script>
 *   <script>
 *     KAEDEMCP.init(t).then(function() {
 *       KAEDEMCP.health().then(console.log);
 *     });
 *   </script>
 */
var KAEDEMCP = (function () {
  var API_BASE = 'http://localhost:3456';
  var _initialized = false;

  function detectBase(host) {
    if (host === 'localhost' || host === '127.0.0.1') return 'http://localhost:3456';
    if (host.indexOf('trello') > -1) return 'https://kaede-powerup.netlify.app/.netlify/functions/trello-proxy';
    return 'http://localhost:3456';
  }

  return {
    get apiBase() { return API_BASE; },
    get initialized() { return _initialized; },

    /** Initialize: detect API base from Trello shared storage or hostname */
    init: function (t) {
      if (_initialized) return Promise.resolve();
      var self = this;
      return (t && typeof t.get === 'function'
        ? t.get('board', 'shared', 'apiBase', null)
        : Promise.resolve(null)
      ).then(function (stored) {
        if (stored) {
          API_BASE = stored;
        } else {
          API_BASE = detectBase(window.location.hostname);
        }
        _initialized = true;
      });
    },

    /** Get Trello auth from board shared storage */
    getAuth: function (t) {
      return t.get('board', 'shared', 'trelloAuth', null);
    },

    /** Health check */
    health: function () {
      var isLocal = API_BASE.indexOf('localhost') > -1 || API_BASE.indexOf('127.0.0.1') > -1;
      var url = isLocal ? API_BASE + '/api/health' : API_BASE;
      return fetch(url, { method: 'POST' }).then(function (r) { return r.json(); });
    },

    /** Call an MCP tool via HTTP bridge */
    callTool: function (name, args) {
      return fetch(API_BASE + '/api/tool', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ name: name, arguments: args || {} }),
      }).then(function (r) {
        if (!r.ok) return r.text().then(function (t) { throw new Error(t); });
        return r.json();
      });
    },

    /** Generate plan from intent */
    generatePlan: function (goal, extra) {
      return this.callTool('generate_plan', { goal: goal, ...(extra || {}) });
    },

    /** Execute plan */
    executePlan: function (plan, boards) {
      return this.callTool('execute_plan', { plan: plan, boards: boards || [] });
    },

    /** Enforce playbook compliance */
    enforcePlaybook: function (playbook, plan, boards) {
      return this.callTool('enforce_playbook', {
        playbook: playbook,
        plan: plan || [],
        boards: boards || [],
      });
    },

    /** Parse playbook markdown */
    parsePlaybook: function (content) {
      return this.callTool('parse_playbook', { content: content });
    },

    /** List boards via Trello MCP */
    listBoards: function (auth) {
      return fetch('https://api.trello.com/1/members/me/boards?key=' + encodeURIComponent(auth.key) + '&token=' + encodeURIComponent(auth.token) + '&fields=name,id,url')
        .then(function (r) { return r.json(); });
    },

    /** Execute MCP intent (legacy endpoint) */
    executeIntent: function (intent, args, boardId) {
      return fetch(API_BASE + '/api/mcp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ intent: intent, args: args || {}, boardId: boardId || '' }),
      }).then(function (r) { return r.json(); });
    },
  };
})();
