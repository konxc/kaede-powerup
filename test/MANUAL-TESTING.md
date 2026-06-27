# Manual Testing Guide â€” KAEDE MCP Attachments

Panduan lengkap untuk manual testing attachment tools dengan test board Trello.

---

## ðŸ” Setup Credentials

**PENTING:** Gunakan credentials Trello yang asli (production), bukan placeholder!

### Langkah 1: Dapatkan API Key & Token

1. Buka https://trello.com/app-key
2. Login dengan akun Trello Anda
3. Copy **API Key** (di bagian "Your API Key")
4. Generate **Token** (klik "Create a token")
   - Scope: Read & Write
   - Expiration: Never (untuk development) atau 1 day/7 day/30 day

### Langkah 2: Buat File secrets.env

Copy `.env.example` ke `secrets.env`:

```powershell
# Windows PowerShell
Copy-Item .env.example secrets.env

# Linux/Mac
cp .env.example secrets.env
```

### Langkah 3: Edit secrets.env

Edit `secrets.env` dan masukkan credentials asli:

```env
# KAEDE MCP - Trello Credentials
TRELLO_API_KEY=d8946d64... (API Key asli dari trello.com/app-key)
TRELLO_TOKEN=a1b2c3d4e5f6... (Token asli dari trello.com/app-key)

# Test Board (optional)
TEST_BOARD_ID=rAKmlRj3
TEST_BOARD_URL=https://trello.com/b/rAKmlRj3/lab-testing-kaede
```

### âš ï¸ Security Warning

- **JANGAN PERNAH** commit `secrets.env` ke Git
- File ini sudah ada di `.gitignore`
- Gunakan credentials pribadi Anda untuk development/testing
- Rotate token secara berkala untuk keamanan

---

## ðŸš€ Quick Start

### Option 1: Node.js Test Script (Recommended)

```powershell
# Dapatkan Card ID dari test board
# Card ID format: 67xxxxxxxxxxxxxxxxxxxxx (24 karakter)

# Windows PowerShell
$env:TEST_CARD_ID="678f9a0b1c2d3e4f5a6b7c8d"; node test/manual-test-attachments.js

# Linux/Mac
TEST_CARD_ID="678f9a0b1c2d3e4f5a6b7c8d" node test/manual-test-attachments.js
```

### Option 2: PowerShell Test Script

```powershell
.\test\attachments.test.ps1 -CardId "678f9a0b1c2d3e4f5a6b7c8d"
```

### Option 3: Direct MCP Server Testing

Buat file `test-direct.js`:

```javascript
import { TrelloMCPClient } from '../src/trello-client.js';

const client = new TrelloMCPClient();

async function test() {
  await client.connect();
  
  // Test 1: Attach image
  const result = await client.attachImageToCard(
    'CARD_ID',
    'https://via.placeholder.com/400x300.png',
    'Test Image'
  );
  console.log('Attached:', result);
  
  // Test 2: Get attachments
  const attachments = await client.getCardAttachments('CARD_ID');
  console.log('Attachments:', attachments);
  
  client.close();
}

test();
```

Jalankan:
```powershell
node test/test-direct.js
```

---

## ðŸ“ Cara Mendapatkan Card ID

### Method 1: Dari URL Kartu
1. Buka kartu di Trello
2. URL format: `https://trello.com/c/ABCdefGHI/123-judul-kartu`
3. Card ID ada di dalam kartu (lihat Method 2)

### Method 2: Dari Trello API
```powershell
# Ganti YOUR_CARD_NAME dengan nama kartu
curl "https://api.trello.com/1/search/query?key=YOUR_API_KEY&token=YOUR_TOKEN&idModel=BOARD_ID&query=YOUR_CARD_NAME"
```

### Method 3: Gunakan MCP Tool
```javascript
import { TrelloMCPClient } from '../src/trello-client.js';

const client = new TrelloMCPClient();
await client.connect();

const cards = await client.getCardsByListId('LIST_ID');
cards.forEach(card => {
  console.log(`${card.id} - ${card.name}`);
});

client.close();
```

### Method 4: Browser Console
1. Buka kartu di Trello
2. Buka Developer Console (F12)
3. Jalankan:
   ```javascript
   console.log(window.location.href);
   // atau
   document.querySelector('[data-test-id="card-id"]')?.textContent
   ```

---

## âœ… Test Checklist

### Attachments

- [ ] **attach_file_to_card**
  - Input: Card ID, URL file PDF
  - Expected: File terattach dengan MIME type `application/pdf`
  - Test URL: `https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf`

- [ ] **attach_image_to_card**
  - Input: Card ID, URL image
  - Expected: Image terattach dengan MIME type `image/png` atau `image/jpeg`
  - Test URL: `https://via.placeholder.com/400x300.png`

- [ ] **get_card_attachments**
  - Input: Card ID
  - Expected: Array of attachments dengan metadata lengkap
  - Fields: id, name, url, mimeType, bytes, date

- [ ] **attach_data_to_card** âš ï¸
  - Status: Stub (belum implement full file upload)
  - Expected: Error message yang jelas

- [ ] **attach_image_data_to_card** âš ï¸
  - Status: Stub (belum implement full file upload)
  - Expected: Error message yang jelas

### Card Operations

- [ ] **copy_card**
  - Input: Source Card ID, Target List ID
  - Expected: Kartu baru dengan properties yang sama
  - Test dengan `keepFromSource: "all"`
  - Test dengan `keepFromSource: "attachments,checklists"`

### Enhancements

- [ ] **dueReminder parameter**
  - Test di `add_card_to_list`
  - Test di `update_card_details`
  - Input: minutes (e.g., 1440 = 1 day before)
  - Expected: Reminder ter-set di Trello

---

## ðŸ› Troubleshooting

### Error: "Connection failed"
```
  âœ— Connection failed: MCP server not found
```

**Solusi:**
```powershell
# Rebuild MCP server
bun run build:mcp

# Verify file exists
Test-Path dist/mcp-server.js
```

### Error: "Credentials not configured"
```
  âœ— TRELLO_API_KEY or TRELLO_TOKEN not configured
```

**Solusi:**
```powershell
node scripts/kaede.mjs setup
```

### Error: "Invalid card ID"
```
  âœ— Failed: invalid value for id
```

**Solusi:**
- Pastikan Card ID format: 24 karakter alphanumeric
- Contoh: `678f9a0b1c2d3e4f5a6b7c8d`

### Error: "Unauthorized"
```
  âœ— Failed: unauthorized
```

**Solusi:**
- Regenerate token di https://trello.com/app-key
- Update `secrets.env`
- Restart MCP server

---

## ðŸ“Š Expected Output

### Successful Test Run

```
  â•”â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•—
  â•‘    KAEDE â€” Manual Test Attachments   â•‘
  â•šâ•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•â•

  âœ“ Credentials loaded
  âœ“ Test Card ID: 678f9a0b1c2d3e4f5a6b7c8d

  Test Board: https://trello.com/b/rAKmlRj3/lab-testing-kaede

  Connecting to MCP Server...
  âœ“ Connected to MCP Server


  Test 1: Attach Image from URL
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  âœ“ Image attached successfully
    ID: 678f9a0b1c2d3e4f5a6b7c8e
    Name: Test Image Attachment
    URL: https://trello.com/attachments/...
    MIME: image/png

  Test 2: Attach PDF from URL
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  âœ“ PDF attached successfully
    ID: 678f9a0b1c2d3e4f5a6b7c8f
    Name: Test PDF Attachment
    URL: https://trello.com/attachments/...
    MIME: application/pdf

  Test 3: Get Card Attachments
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  âœ“ Found 2 attachment(s)
    [1] Test Image Attachment
        Type: image/png
        Size: 12345 bytes
        URL: https://trello.com/attachments/...
    [2] Test PDF Attachment
        Type: application/pdf
        Size: 67890 bytes
        URL: https://trello.com/attachments/...

  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
  Tests completed: 3/3 passed
  â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€â”€
```

---

## ðŸ“‹ Test Results Template

Copy template ini untuk dokumentasi hasil testing:

```markdown
## Test Session: YYYY-MM-DD

**Tester:** [Nama]
**Test Board:** https://trello.com/b/rAKmlRj3/lab-testing-kaede
**Card ID:** [Card ID]

### Results

| Tool | Status | Notes |
|------|--------|-------|
| attach_file_to_card | âœ… Pass / âŒ Fail | [Catatan] |
| attach_image_to_card | âœ… Pass / âŒ Fail | [Catatan] |
| get_card_attachments | âœ… Pass / âŒ Fail | [Catatan] |
| attach_data_to_card | âš ï¸ Stub | Expected behavior |
| attach_image_data_to_card | âš ï¸ Stub | Expected behavior |
| copy_card | âœ… Pass / âŒ Fail | [Catatan] |
| dueReminder (add) | âœ… Pass / âŒ Fail | [Catatan] |
| dueReminder (update) | âœ… Pass / âŒ Fail | [Catatan] |

### Issues Found

1. [Issue description]
2. [Issue description]

### Screenshots

[Screenshot attachments di Trello]
```

---

## ðŸŽ¯ Next Steps After Testing

1. **Jika semua test pass:**
   - Lanjut ke Phase 2 (Checklist Enhancements)
   - Dokumentasikan hasil testing

2. **Jika ada failure:**
   - Catat error message
   - Screenshot issue
   - Buat bug report di `test/ISSUES.md`

3. **Ready for upstream contribution:**
   - Setelah Phase 3 complete
   - Prepare PR ke delorenj/mcp-server-trello
   - Focus: `get_card_attachments`, `get_card_checklists`, `watch_card`

---

## ðŸ“š References

- [Trello API Docs](https://developer.trello.com/docs)
- [Attachments API](https://developer.trello.com/docs/card-attachments)
- [Copy Card API](https://developer.trello.com/docs/card-copy)
- [Test Board](https://trello.com/b/rAKmlRj3/lab-testing-kaede)
- [DEVELOPMENT-ROADMAP.md](../docs/DEVELOPMENT-ROADMAP.md)
