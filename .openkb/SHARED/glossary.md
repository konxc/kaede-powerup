# Glossary — KAEDE Power-Up

| Istilah | Deskripsi |
|---|---|
| **KAEDE** | Koneksi Automated Environment DE — Trello Power-Up & MCP bridge |
| **Power-Up** | Ekstensi Trello yang menambah fungsionalitas board |
| **MCP** | Model Context Protocol — standar komunikasi AI dengan tools |
| **Trello MCP Server** | Server open source (delorenj/mcp-server-trello) untuk koneksi Trello ↔ AI |
| **Environment** | Label di kartu Trello: Production, Staging, Development |
| **Badge** | Indikator visual pada kartu Trello (warna sesuai environment) |
| **TACO** | Trello → AI → Commit → Output — alur kerja AI Agent |
| **OpenKB** | Knowledge base AI ↔ Human via markdown |
| **OpenCode** | AI Agent CLI/TUI untuk coding |
| **Netlify** | Platform deploy untuk KAEDE Power-Up |
| **Playbook** | Dokumen human→human berisi SOP, workflow, standar tim — acuan kerja |
| **Orchestrator** | Layer kecerdasan KAEDE yang membaca playbook & openkb, lalu mengeksekusi intent ke Trello via MCP |
| **Intent** | Perintah level tinggi dalam bahasa natural ("Mulai Sprint", "Buat Card") — diterjemahkan oleh orchestrator ke serangkaian tools MCP |
| **Sprint** | Periode kerja 2 minggu sesuai Scrum — terdiri dari list-list di Trello board |
| **Role Mapping** | Pemetaan peran tim (PM, Developer) ke akses Trello, GitHub, dan instruksi AI Agent |
| **MCP Client** | `TrelloMCPClient` — wrapper di `src/trello-client.js` yang spawn MCP server dan komunikasi JSON-RPC |
| **JSON-RPC** | Protokol komunikasi antara client dan MCP server — request/response via STDIO |
| **Trigger** | Webhook atau command yang memicu eksekusi intent otomatis |
