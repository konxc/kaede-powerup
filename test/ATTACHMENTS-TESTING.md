# KAEDE MCP — Attachments Testing Guide

## Prerequisites

1. **Trello Credentials** — Ensure `secrets.env` is configured:
   ```bash
   bun scripts/kaede.mjs setup
   ```

2. **Build MCP Server**:
   ```bash
   bun run build:mcp
   ```

3. **Test Board** — Use the lab testing board:
   - URL: https://trello.com/b/rAKmlRj3/lab-testing-kaede
   - Create a test card for attachment testing

---

## Testing Methods

### Method 1: PowerShell Test Script

Run the provided PowerShell test script:

```powershell
.\test\attachments.test.ps1
```

This script will:
- Check credentials
- Generate JSON-RPC requests
- Provide instructions for manual testing

### Method 2: Direct MCP Server Testing

1. **Start MCP Server**:
   ```bash
   bun dist/mcp-server.js
   ```

2. **Send JSON-RPC Request** (via stdin):

**Attach Image from URL:**
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "method": "tools/call",
  "params": {
    "name": "attach_image_to_card",
    "arguments": {
      "cardId": "YOUR_CARD_ID",
      "imageUrl": "https://via.placeholder.com/400x300.png?text=Test",
      "name": "Test Attachment"
    }
  }
}
```

**Get Card Attachments:**
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "method": "tools/call",
  "params": {
    "name": "get_card_attachments",
    "arguments": {
      "cardId": "YOUR_CARD_ID"
    }
  }
}
```

**Attach File from URL:**
```json
{
  "jsonrpc": "2.0",
  "id": 3,
  "method": "tools/call",
  "params": {
    "name": "attach_file_to_card",
    "arguments": {
      "cardId": "YOUR_CARD_ID",
      "fileUrl": "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf",
      "name": "Test PDF"
    }
  }
}
```

### Method 3: Using TrelloMCPClient (Node.js)

Create a test script `test-attachments.js`:

```javascript
import { TrelloMCPClient } from './src/trello-client.js';

const client = new TrelloMCPClient();

try {
  await client.connect();
  console.log('✓ Connected to MCP Server');

  // Test 1: Attach image
  const result1 = await client.attachImageToCard(
    'YOUR_CARD_ID',
    'https://via.placeholder.com/400x300.png?text=Test',
    'Test Attachment'
  );
  console.log('✓ Image attached:', result1);

  // Test 2: Get attachments
  const result2 = await client.getCardAttachments('YOUR_CARD_ID');
  console.log('✓ Attachments:', result2);

  client.close();
} catch (error) {
  console.error('✗ Error:', error.message);
  client.close();
  process.exit(1);
}
```

Run with:
```bash
bun test-attachments.js
```

---

## Expected Results

### Success Response (Attach Image)
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"id\": \"5f8a3b2c1d4e5f6a7b8c9d0e\",\n  \"name\": \"Test Attachment\",\n  \"url\": \"https://trello.com/...\",\n  \"mimeType\": \"image/png\",\n  \"previews\": [...]\n}"
      }
    ]
  }
}
```

### Success Response (Get Attachments)
```json
{
  "jsonrpc": "2.0",
  "id": 2,
  "result": {
    "content": [
      {
        "type": "text",
        "text": "{\n  \"attachments\": [\n    {\n      \"id\": \"...\",\n      \"name\": \"Test Attachment\",\n      \"url\": \"...\",\n      \"mimeType\": \"image/png\"\n    }\n  ]\n}"
      }
    ]
  }
}
```

### Error Response
```json
{
  "jsonrpc": "2.0",
  "id": 1,
  "error": {
    "code": -32603,
    "message": "TRELLO_API_KEY or TRELLO_TOKEN not configured"
  }
}
```

---

## Test Cases

### Test Case 1: Attach Image from URL
- **Input**: Valid image URL
- **Expected**: Attachment created with preview
- **Verify**: Check card in Trello UI

### Test Case 2: Attach PDF from URL
- **Input**: Valid PDF URL
- **Expected**: Attachment created
- **Verify**: PDF downloadable from card

### Test Case 3: Get Attachments
- **Input**: Card ID with attachments
- **Expected**: Array of attachments
- **Verify**: Count matches UI

### Test Case 4: Invalid Card ID
- **Input**: Invalid card ID
- **Expected**: Error message
- **Verify**: Clear error message

### Test Case 5: Missing Credentials
- **Input**: No secrets.env
- **Expected**: Configuration error
- **Verify**: Helpful error message

---

## Troubleshooting

### Error: "TRELLO_API_KEY or TRELLO_TOKEN not configured"
**Solution**: Run `bun scripts/kaede.mjs setup`

### Error: "Card not found"
**Solution**: Verify card ID is correct (short ID like `FdhbArbK`)

### Error: "Invalid URL"
**Solution**: Ensure URL is publicly accessible (not localhost)

### Error: "File not found" (for local files)
**Solution**: Local file upload not yet implemented. Use URL-based attachment.

---

## Next Steps

After successful attachment testing:

1. **Test copy_card tool** (Phase 1.6)
2. **Test dueReminder parameter** (Phase 1.7)
3. **Create comprehensive test suite** (Phase 1.8)
4. **Manual testing with real use cases** (Phase 1.9)

---

**Last Updated:** Juni 2026  
**Status:** Phase 1.8 In Progress  
**Test Board:** https://trello.com/b/rAKmlRj3/lab-testing-kaede