# KAEDE MCP - Attachments Test Script
# Test script untuk attachment tools menggunakan test board

# Configuration
$TEST_BOARD_URL = "https://trello.com/b/rAKmlRj3/lab-testing-kaede"
$MCP_SERVER = "dist/mcp-server.js"

Write-Host ""
Write-Host "  ╔══════════════════════════════════════╗" -ForegroundColor Magenta
Write-Host "  ║    KAEDE — Attachments Test          ║" -ForegroundColor Magenta
Write-Host "  ╚══════════════════════════════════════╝" -ForegroundColor Magenta
Write-Host ""
Write-Host "  Test Board: $TEST_BOARD_URL" -ForegroundColor Cyan
Write-Host ""

# Check if credentials are configured
if (-not (Test-Path "secrets.env")) {
    Write-Host "  ✗ Trello credentials not found." -ForegroundColor Red
    Write-Host "    Run 'node scripts/kaede.mjs setup' first." -ForegroundColor Yellow
    exit 1
}

Write-Host "  ✓ Credentials found" -ForegroundColor Green
Write-Host ""

# Test 1: Attach image from URL
Write-Host "  Test 1: Attach image from URL" -ForegroundColor Cyan
$testCardId = "YOUR_TEST_CARD_ID"  # Replace with actual card ID from test board
$testImageUrl = "https://via.placeholder.com/400x300.png?text=Test+Attachment"

Write-Host "  Card ID: $testCardId" -ForegroundColor Gray
Write-Host "  Image URL: $testImageUrl" -ForegroundColor Gray
Write-Host ""

# Create JSON-RPC request for attach_image_to_card
$rpcRequest = @{
    jsonrpc = "2.0"
    id = 1
    method = "tools/call"
    params = @{
        name = "attach_image_to_card"
        arguments = @{
            cardId = $testCardId
            imageUrl = $testImageUrl
            name = "Test Attachment from URL"
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "  Request:" -ForegroundColor Gray
Write-Host $rpcRequest -ForegroundColor Gray
Write-Host ""

Write-Host "  Note: Manual testing required." -ForegroundColor Yellow
Write-Host "  To test, run the MCP server and send this request:" -ForegroundColor Yellow
Write-Host ""
Write-Host "  bun dist/mcp-server.js" -ForegroundColor White
Write-Host ""
Write-Host "  Then send the JSON-RPC request above via stdin." -ForegroundColor Yellow
Write-Host ""

# Test 2: Get card attachments
Write-Host "  Test 2: Get card attachments" -ForegroundColor Cyan
$rpcRequest2 = @{
    jsonrpc = "2.0"
    id = 2
    method = "tools/call"
    params = @{
        name = "get_card_attachments"
        arguments = @{
            cardId = $testCardId
        }
    }
} | ConvertTo-Json -Depth 10

Write-Host "  Request:" -ForegroundColor Gray
Write-Host $rpcRequest2 -ForegroundColor Gray
Write-Host ""

Write-Host "  ✓ Test script completed." -ForegroundColor Green
Write-Host ""
Write-Host "  Next Steps:" -ForegroundColor Cyan
Write-Host "  1. Get a card ID from test board: $TEST_BOARD_URL" -ForegroundColor White
Write-Host "  2. Replace YOUR_TEST_CARD_ID in this script" -ForegroundColor White
Write-Host "  3. Run: bun dist/mcp-server.js" -ForegroundColor White
Write-Host "  4. Send the JSON-RPC requests above" -ForegroundColor White
Write-Host ""