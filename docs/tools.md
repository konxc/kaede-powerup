# Trello MCP Tools Reference (KAEDE)

Complete list of tools provided by **`packages/kaede-trello`**. These tools can be called by AI Agents via OpenCode or any MCP client.

<div class="not-prose p-4 rounded-xl bg-kaede-primary/10 border border-kaede-primary/20 mb-6">

**Call Format**

Just ask your AI Agent in natural language. Example: *"Please find card 'Fix login bug' and move it to the Done list"*.

</div>

## Board Management

<div class="tool-group">

### `list_boards`

List all Trello boards accessible to the user.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"list_boards"</span>, <span class="str">"arguments"</span>: {} }
</div>

### `create_board`

Create a new Trello board.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"create_board"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"Sprint 24"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"desc"</span>: <span class="str">"Board description"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"idOrganization"</span>: <span class="str">"workspace123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"defaultLabels"</span>: <span class="kw">true</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"defaultLists"</span>: <span class="kw">true</span><br/>
&nbsp;&nbsp;} }
</div>

### `list_workspaces`

List all Trello workspaces/organizations.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"list_workspaces"</span>, <span class="str">"arguments"</span>: {} }
</div>

</div>

## List Management

<div class="tool-group">

### `get_lists`

Get all lists on a board.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_lists"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"boardId"</span>: <span class="str">"board123"</span> } }
</div>

### `add_list_to_board`

Add a new list to a board.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"add_list_to_board"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"boardId"</span>: <span class="str">"board123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"Sprint 25"</span><br/>
&nbsp;&nbsp;} }
</div>

### `update_list`

Update list details (name, position, closed state).

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"update_list"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"listId"</span>: <span class="str">"list123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"New list name"</span><br/>
&nbsp;&nbsp;} }
</div>

### `archive_list`

Archive a list.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"archive_list"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"listId"</span>: <span class="str">"list123"</span> } }
</div>

### `sort_list_cards`

Sort cards in a list by criteria (due, name, position, startDate).

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"sort_list_cards"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"listId"</span>: <span class="str">"list123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"sort"</span>: <span class="str">"dueDate"</span><br/>
&nbsp;&nbsp;} }
</div>

### `watch_list`

Subscribe/unsubscribe from watching a list.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"watch_list"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"listId"</span>: <span class="str">"list123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"add"</span>: <span class="kw">true</span><br/>
&nbsp;&nbsp;} }
</div>

</div>

## Card Management

<div class="tool-group">

### `get_my_cards`

Get all cards assigned to the current user.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_my_cards"</span>, <span class="str">"arguments"</span>: {} }
</div>

### `get_cards_by_list_id`

Get all cards from a specific list.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_cards_by_list_id"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"listId"</span>: <span class="str">"list123"</span>, <span class="str">"boardId"</span>: <span class="str">"board123"</span> } }
</div>

### `get_card`

Get detailed card information — labels, members, due date, description.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"FdhbArbK"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"includeMarkdown"</span>: <span class="kw">false</span><br/>
&nbsp;&nbsp;} }
</div>

### `add_card_to_list`

Create a new card in a specific list.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"add_card_to_list"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"listId"</span>: <span class="str">"list123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"Setup CI/CD"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"description"</span>: <span class="str">"Implement pipeline"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"dueDate"</span>: <span class="str">"2026-07-01T12:00:00Z"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"labels"</span>: [<span class="str">"label-id-1"</span>]<br/>
&nbsp;&nbsp;} }
</div>

### `update_card_details`

Update card details — name, description, due date, labels.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"update_card_details"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"New name"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"dueComplete"</span>: <span class="kw">true</span><br/>
&nbsp;&nbsp;} }
</div>

### `move_card`

Move a card to another list (cross-board if boardId provided).

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"move_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"listId"</span>: <span class="str">"list456"</span><br/>
&nbsp;&nbsp;} }
</div>

### `copy_card`

Copy/duplicate a card to another list (even cross-board). Supports `keepFromSource` to selectively copy attachments, checklists, comments, labels, members, etc.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"copy_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"sourceCardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"listId"</span>: <span class="str">"list456"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"keepFromSource"</span>: <span class="str">"all"</span><br/>
&nbsp;&nbsp;} }
</div>

### `archive_card`

Archive a card.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"archive_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"cardId"</span>: <span class="str">"card123"</span> } }
</div>

### `watch_card`

Subscribe/unsubscribe from watching a card.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"watch_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"add"</span>: <span class="kw">true</span><br/>
&nbsp;&nbsp;} }
</div>

### `get_card_activity`

Get activity/actions on a card (comments, moves, updates).

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_card_activity"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"filter"</span>: <span class="str">"commentCard"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"limit"</span>: <span class="num">50</span><br/>
&nbsp;&nbsp;} }
</div>

### `get_card_attachments`

Get all attachments from a card. **NEW contribution** (missing in upstream).

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_card_attachments"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"cardId"</span>: <span class="str">"card123"</span> } }
</div>

### `get_card_checklists`

Get all checklists on a card with their items. **NEW contribution** (missing in upstream).

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_card_checklists"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"cardId"</span>: <span class="str">"card123"</span> } }
</div>

</div>

## Member Management

<div class="tool-group">

### `get_board_members`

Get all members on a board.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_board_members"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"boardId"</span>: <span class="str">"board123"</span> } }
</div>

### `assign_member_to_card`

Assign a member to a card.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"assign_member_to_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"memberId"</span>: <span class="str">"member456"</span><br/>
&nbsp;&nbsp;} }
</div>

### `remove_member_from_card`

Remove a member from a card.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"remove_member_from_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"memberId"</span>: <span class="str">"member456"</span><br/>
&nbsp;&nbsp;} }
</div>

</div>

## Label Management

<div class="tool-group">

### `get_board_labels`

Get all labels on a board.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_board_labels"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"boardId"</span>: <span class="str">"board123"</span> } }
</div>

### `search_labels`

Search labels on a board by name or color.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"search_labels"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"boardId"</span>: <span class="str">"board123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"query"</span>: <span class="str">"bug"</span><br/>
&nbsp;&nbsp;} }
</div>

### `create_label`

Create a new label.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"create_label"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"boardId"</span>: <span class="str">"board123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"Bug"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"color"</span>: <span class="str">"red"</span><br/>
&nbsp;&nbsp;} }
</div>

### `update_label`

Update label name and/or color.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"update_label"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"labelId"</span>: <span class="str">"label123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"Critical"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"color"</span>: <span class="str">"red"</span><br/>
&nbsp;&nbsp;} }
</div>

### `delete_label`

Delete a label.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"delete_label"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"labelId"</span>: <span class="str">"label123"</span> } }
</div>

### `remove_label_from_card`

Remove a single label from a card.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"remove_label_from_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"labelId"</span>: <span class="str">"label456"</span><br/>
&nbsp;&nbsp;} }
</div>

</div>

## Checklist

<div class="tool-group">

### `create_checklist`

Create a new checklist on a card.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"create_checklist"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"QA Checklist"</span><br/>
&nbsp;&nbsp;} }
</div>

### `add_checklist_item`

Add an item to a checklist.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"add_checklist_item"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"checklistId"</span>: <span class="str">"checklist123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"Test login flow"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"checked"</span>: <span class="kw">false</span><br/>
&nbsp;&nbsp;} }
</div>

### `update_checklist_item`

Update checklist item (name, checked state, position).

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"update_checklist_item"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"checklistId"</span>: <span class="str">"checklist123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"checkItemId"</span>: <span class="str">"item456"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"checked"</span>: <span class="kw">true</span><br/>
&nbsp;&nbsp;} }
</div>

### `delete_checklist`

Delete a checklist from a card.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"delete_checklist"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"checklistId"</span>: <span class="str">"checklist123"</span> } }
</div>

### `delete_checklist_item`

Delete an item from a checklist.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"delete_checklist_item"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"checklistId"</span>: <span class="str">"checklist123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"checkItemId"</span>: <span class="str">"item456"</span><br/>
&nbsp;&nbsp;} }
</div>

### `copy_checklist`

Copy a checklist to another card.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"copy_checklist"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"sourceChecklistId"</span>: <span class="str">"checklist123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card789"</span><br/>
&nbsp;&nbsp;} }
</div>

</div>

## Comments

<div class="tool-group">

### `add_comment`

Add a comment to a card.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"add_comment"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"text"</span>: <span class="str">"Reviewed and ready to merge."</span><br/>
&nbsp;&nbsp;} }
</div>

### `get_card_comments`

Get all comments from a card.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_card_comments"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"limit"</span>: <span class="num">100</span><br/>
&nbsp;&nbsp;} }
</div>

</div>

## Attachments

<div class="tool-group">

### `attach_file_to_card`

Attach a file to a card from a URL.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"attach_file_to_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"fileUrl"</span>: <span class="str">"https://example.com/file.pdf"</span><br/>
&nbsp;&nbsp;} }
</div>

### `attach_image_to_card`

Attach an image to a card from a URL.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"attach_image_to_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"imageUrl"</span>: <span class="str">"https://example.com/screenshot.png"</span><br/>
&nbsp;&nbsp;} }
</div>

### `attach_data_to_card`

Attach data (base64 or data URL) to a card.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"attach_data_to_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"data"</span>: <span class="str">"data:text/plain;base64,SGVsbG8="</span><br/>
&nbsp;&nbsp;} }
</div>

### `attach_image_data_to_card`

Attach image data to a card (screenshot convenience — accepts base64 or data URL).

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"attach_image_data_to_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"imageData"</span>: <span class="str">"data:image/png;base64,iVBORw0KGgo="</span><br/>
&nbsp;&nbsp;} }
</div>

</div>

## Usage Tips

- **boardId optional:** If not provided, some tools use the default board from API key
- **Date format:** Due date uses ISO 8601 (`2026-07-01T12:00:00Z`), start date uses `YYYY-MM-DD`
- **Label IDs:** Get from Trello UI or via `get_board_labels`
- **Member IDs:** Get via `get_board_members`
- **Source code:** These tools are from `packages/kaede-trello/src/mcp-server.js` — custom KAEDE, not `@delorenj/mcp-server-trello`

---

## 🚧 Upcoming Tools (In Development)

The following tools are in development (Phase 1-4):

### Phase 1: Attachments & Copy Card (Week 1-2)
- `attach_file_to_card` — Attach from URL or local file
- `attach_image_to_card` — Attach image from URL
- `attach_data_to_card` — Attach from base64/data URL
- `attach_image_data_to_card` — Attach image from base64 (screenshot)
- `get_card_attachments` — **NEW CONTRIBUTION** (missing in upstream!)
- `copy_card` — Copy card with keepFromSource options

### Phase 2: Checklist Enhancements (Week 3)
- `delete_checklist` — Remove checklist from card
- `delete_checklist_item` — Remove item from checklist
- `update_checklist_item` — Update state, name, position, due date, reminder, member
- `get_card_checklists` — **NEW CONTRIBUTION** (missing in upstream!)

### Phase 3: Advanced Features (Week 4-5)
- `watch_card` — Subscribe to card activity
- `watch_list` — Subscribe to list activity
- `get_card_activity` — Get card history with filters
- `search_labels` — Filter labels by name (case-insensitive)
- `remove_label_from_card` — Remove single label from card

### Phase 4: Additional Enhancements (Week 6-7, Optional)
- `copy_checklist` — Copy checklist with items to another card
- `copy_list` — Copy entire list with cards to another board
- `move_list` — Move entire list to different board
- `sort_list` — Sort cards in list by dueDate, name, createdAt
- `share_card` — Generate shareable link (evaluate feasibility)
- `make_template` — Convert card to template (evaluate feasibility)

### Features to Skip (Power-Up / Complex)
- `create_jira_work_item` — Jira Power-Up required
- `mirror_card` — Mirror Power-Up required
- `butler_automation` — Separate Butler API
- `custom_fields` — Standard plan required
- `recurring_cards` — Power-Up feature

**Timeline:** Week 1-10 (June-July 2026)  
**Total Tools:** 42 tools

**Related documentation:**
- [`DEVELOPMENT-ROADMAP.md`](DEVELOPMENT-ROADMAP.html) — Master development plan
- [`FEATURE-SPECIFICATION.md`](FEATURE-SPECIFICATION.html) — Detailed specs
- [`CONTRIBUTION-GUIDE.md`](CONTRIBUTION-GUIDE.html) — Upstream contribution guide
