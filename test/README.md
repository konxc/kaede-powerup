# Test Scripts — KAEDE MCP

Kumpulan script untuk testing semua tools KAEDE MCP, termasuk **automated tests** (via `bun test`) dan **manual test scripts** (via Trello API langsung).

---

## 📋 Quick Start — Automated Tests

Cara tercepat: jalankan automated test suite tanpa perlu credentials Trello asli.

```bash
# Seluruh suite (121+ tests, mock Trello API)
bun run test

# Atau langsung:
bun test test/*.test.js

# Per kategori:
bun run test:mcp          # 44 Trello tools
bun run test:orchestrator  # Playbook parser
bun run test:trello        # Trello MCP client wrapper
bun run test:e2e           # End-to-end orchestration
```

> Automated tests menggunakan `global.fetch` mock (`test/mock-fetch.js`),
> tidak memerlukan koneksi Trello asli.

---

## 📋 Manual Testing

Untuk testing dengan Trello API asli (memerlukan credentials):

### 1. Setup Credentials (GLOBAL)

```bash
bun scripts/kaede.mjs setup
```

Credentials akan disimpan di `~/.config/kaede/secrets.env` (global, bukan di project!)

### 2. Build MCP Server

```bash
bun run build:mcp
```

### 3. Get Card IDs

```bash
bun test/get-test-card.js
```

Output akan menampilkan semua kartu di test board dengan ID-nya.

### 4. Run Tests

```bash
# Windows PowerShell
$env:TEST_CARD_ID="67xxx..."; bun test/manual-test-attachments.js

# Linux/Mac  
TEST_CARD_ID="67xxx..." bun test/manual-test-attachments.js
```

---

## 🧪 Available Test Scripts

### `test/get-test-card.js`

**Purpose:** Mendapatkan daftar kartu dan ID dari test board

**Usage:**
```bash
bun test/get-test-card.js
```

**Output:**
```
  List: To Do
  ──────────────────────────────────────
    [1] Test Card 1
        ID: 678f9a0b1c2d3e4f5a6b7c8d
        URL: https://trello.com/c/xxx/test-card-1

  Usage:
  Windows PowerShell:
    $env:TEST_CARD_ID="678f9a0b1c2d3e4f5a6b7c8d"; bun test/manual-test-attachments.js
```

---

### `test/manual-test-attachments.js`

**Purpose:** Test semua attachment tools

**Usage:**
```bash
# Set card ID first
$env:TEST_CARD_ID="678f9a0b1c2d3e4f5a6b7c8d"

# Run tests
bun test/manual-test-attachments.js
```

**Tests:**
1. Attach image from URL
2. Attach PDF from URL
3. Get all attachments
4. Verify metadata

**Expected Output:**
```
  Test 1: Attach Image from URL
  ──────────────────────────────────────
  ✓ Image attached successfully
    ID: 678f9a0b1c2d3e4f5a6b7c8e
    Name: Test Image Attachment
    URL: https://trello.com/attachments/...
    MIME: image/png
```

---

### `test/attachments.test.ps1`

**Purpose:** PowerShell script untuk testing attachments (alternative)

**Usage:**
```powershell
.\test\attachments.test.ps1 -CardId "678f9a0b1c2d3e4f5a6b7c8d"
```

---

## 📚 Testing Documentation

### `test/TESTING-GUIDE.md`

**Purpose:** Panduan lengkap testing untuk SEMUA tools (Phase 1-4)

**Contents:**
- Setup instructions
- Test board info
- Test cases untuk setiap phase
- Expected results
- Troubleshooting
- Test results template

**Usage:**
Baca dan ikuti langkah-langkah testing manual di dalamnya.

---

### `test/MANUAL-TESTING.md`

**Purpose:** Testing guide khusus untuk attachments (Phase 1)

**Contents:**
- Credential setup
- Cara mendapatkan card ID
- Test cases attachments
- Expected output
- Troubleshooting

---

### `test/CHECKLIST-TESTING.md`

**Purpose:** Testing guide khusus untuk checklist tools (Phase 2)

**Contents:**
- Quick test examples
- Test checklist untuk setiap tool
- Edge cases
- Test results template

---

## 🎯 Test Board

**URL:** https://trello.com/b/rAKmlRj3/lab-testing-kaede

**Setup:**
1. Buka board di Trello
2. Buat minimal 3 lists: "To Do", "In Progress", "Done"
3. Buat minimal 2 cards di setiap list
4. Tambahkan checklists dan attachments untuk testing

---

## 🐛 Troubleshooting

### Error: "secrets.env not found"

**Solution:**
```bash
bun scripts/kaede.mjs setup
```

### Error: "Connection failed"

**Solution:**
```bash
bun run build:mcp
```

### Error: "Invalid card ID"

**Solution:**
```bash
bun test/get-test-card.js
# Copy valid card ID dari output
```

### Error: "Unauthorized"

**Solution:**
1. Buka https://trello.com/app-key
2. Regenerate token
3. Update credentials: `bun scripts/kaede.mjs setup`

---

## 📝 Test Results Template

Gunakan template dari `test/TESTING-GUIDE.md`:

```markdown
## Test Session: YYYY-MM-DD

**Tester:** [Nama]
**Test Board:** https://trello.com/b/rAKmlRj3/lab-testing-kaede

### Phase 1: Attachments

| Tool | Status | Notes |
|------|--------|-------|
| attach_file_to_card | ✅ Pass | [Notes] |

### Issues Found

1. [Issue description]

### Summary

- **Total Tests:** 20
- **Passed:** 18
- **Failed:** 2
```

---

## 🚀 Status & Next Steps

### ✅ Automated Testing: SELESAI

Seluruh **44 Trello tools** sudah memiliki automated test (`test/mcp-server.test.js`)
dengan mock `global.fetch`. Jumlah total: **121+ tests** (5 test files).

### ✅ Upstream Contribution: SUDAH DIKIRIM

Tiga PR sudah dikirim ke [`delorenj/mcp-server-trello`](https://github.com/delorenj/mcp-server-trello):
- **PR #98** — `get_card_attachments`, `get_card_checklists`
- **PR #99** — `watch_card`, `watch_list`
- **PR #100** — `search_labels`, `remove_label_from_card`

PR di-port/dikembangkan di `packages/kaede-trello/` lalu di-PR ke upstream.

### 📋 Manual Testing (Jika Diperlukan)

Untuk pengujian end-to-end dengan Trello asli:
1. Setup credentials
2. Build MCP server
3. Get card IDs
4. Jalankan manual test scripts

### 📝 Dokumentasi Hasil

Gunakan template di `test/TESTING-GUIDE.md` jika perlu mencatat hasil manual testing.

---

## 📚 References

- **Main Testing Guide:** `test/TESTING-GUIDE.md`
- **Implementation Summary:** `IMPLEMENTATION-SUMMARY.md`
- **Contributing Guide:** `CONTRIBUTING.md`
- **Changelog:** `CHANGELOG.md`
- **Trello API:** https://developer.trello.com/docs