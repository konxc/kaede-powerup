# Referensi Tools MCP Trello

Berikut daftar lengkap semua tools yang disediakan oleh `@delorenj/mcp-server-trello`. Tools ini bisa dipanggil oleh AI Agent melalui OpenCode atau MCP client lainnya.

<div class="not-prose p-4 rounded-xl bg-kaede-primary/10 border border-kaede-primary/20 mb-6">

**Format Panggilan**

Cukup minta ke AI Agent dalam bahasa natural. Contoh: *"Tolong cari kartu 'Fix login bug' dan pindahkan ke list Done"*.

</div>

## Manajemen Board & Workspace

<div class="tool-group">

### `list_boards`

Menampilkan semua board yang bisa diakses.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"list_boards"</span>, <span class="str">"arguments"</span>: {} }
</div>

### `set_active_board`

Mengubah board aktif untuk operasi selanjutnya.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"set_active_board"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"boardId"</span>: <span class="str">"abc123"</span> } }
</div>

### `get_active_board_info`

Menampilkan informasi board yang sedang aktif.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_active_board_info"</span>, <span class="str">"arguments"</span>: {} }
</div>

### `list_workspaces`

Menampilkan semua workspace.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"list_workspaces"</span>, <span class="str">"arguments"</span>: {} }
</div>

### `set_active_workspace`

Mengubah workspace aktif.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"set_active_workspace"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"workspaceId"</span>: <span class="str">"xyz789"</span> } }
</div>

### `list_boards_in_workspace`

Menampilkan semua board di workspace tertentu.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"list_boards_in_workspace"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"workspaceId"</span>: <span class="str">"xyz789"</span> } }
</div>

</div>

## Manajemen Kartu

<div class="tool-group">

### `get_card`

Mendapatkan detail lengkap kartu — termasuk checklist, attachment, label, member, komentar, cover, badges. Bisa output JSON atau Markdown.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"FdhbArbK"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"includeMarkdown"</span>: <span class="kw">false</span><br/>
&nbsp;&nbsp;} }
</div>

### `get_cards_by_list_id`

Mendapatkan semua kartu dari list tertentu.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_cards_by_list_id"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"listId"</span>: <span class="str">"list123"</span> } }
</div>

### `add_card_to_list`

Membuat kartu baru di list tertentu.

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

Mengupdate detail kartu — nama, deskripsi, due date, label, dll.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"update_card_details"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"New name"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"dueComplete"</span>: <span class="kw">true</span><br/>
&nbsp;&nbsp;} }
</div>

### `move_card`

Memindahkan kartu ke list lain.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"move_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"listId"</span>: <span class="str">"list456"</span><br/>
&nbsp;&nbsp;} }
</div>

### `archive_card`

Mengarsipkan kartu.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"archive_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"cardId"</span>: <span class="str">"card123"</span> } }
</div>

### `get_my_cards`

Mendapatkan semua kartu yang assigned ke user saat ini.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_my_cards"</span>, <span class="str">"arguments"</span>: {} }
</div>

</div>

## Manajemen List

<div class="tool-group">

### `get_lists`

Mendapatkan semua list di board.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_lists"</span>, <span class="str">"arguments"</span>: {} }
</div>

### `add_list_to_board`

Menambahkan list baru ke board.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"add_list_to_board"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"name"</span>: <span class="str">"Sprint 25"</span> } }
</div>

### `update_list`

Mengupdate nama, status archive, atau subscribe list.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"update_list"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"listId"</span>: <span class="str">"list123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"In Review"</span><br/>
&nbsp;&nbsp;} }
</div>

### `update_list_position`

Mengubah posisi list di board. Gunakan `"top"`, `"bottom"`, atau nilai numerik.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"update_list_position"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"listId"</span>: <span class="str">"list123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"position"</span>: <span class="str">"top"</span><br/>
&nbsp;&nbsp;} }
</div>

### `archive_list`

Mengarsipkan list.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"archive_list"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"listId"</span>: <span class="str">"list123"</span> } }
</div>

</div>

## Checklist

<div class="tool-group">

### `get_checklist_items`

Mendapatkan semua item dari checklist berdasarkan nama.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_checklist_items"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"name"</span>: <span class="str">"Acceptance Criteria"</span> } }
</div>

### `add_checklist_item`

Menambahkan item ke checklist.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"add_checklist_item"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"text"</span>: <span class="str">"Unit test passed"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"checkListName"</span>: <span class="str">"QA Checklist"</span><br/>
&nbsp;&nbsp;} }
</div>

### `get_checklist_by_name`

Mendapatkan checklist lengkap dengan persentase completion.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_checklist_by_name"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"name"</span>: <span class="str">"Acceptance Criteria"</span> } }
</div>

### `update_checklist_item`

Mengupdate item checklist — nama, status (complete/incomplete), assignee, due date.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"update_checklist_item"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"checkItemId"</span>: <span class="str">"item456"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"state"</span>: <span class="str">"complete"</span><br/>
&nbsp;&nbsp;} }
</div>

### `delete_checklist_item`

Menghapus item dari checklist.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"delete_checklist_item"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"checkItemId"</span>: <span class="str">"item456"</span><br/>
&nbsp;&nbsp;} }
</div>

### `find_checklist_items_by_description`

Mencari item checklist berdasarkan teks tertentu.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"find_checklist_items_by_description"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"description"</span>: <span class="str">"login"</span> } }
</div>

### `get_acceptance_criteria`

Shortcut untuk mendapatkan semua item dari checklist "Acceptance Criteria".

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_acceptance_criteria"</span>, <span class="str">"arguments"</span>: {} }
</div>

</div>

## Komentar

<div class="tool-group">

### `add_comment`

Menambahkan komentar ke kartu.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"add_comment"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"text"</span>: <span class="str">"Sudah di-review, siap merge."</span><br/>
&nbsp;&nbsp;} }
</div>

### `update_comment`

Mengupdate komentar yang sudah ada.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"update_comment"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"commentId"</span>: <span class="str">"comment123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"text"</span>: <span class="str">"Sudah di-review dan di-merge."</span><br/>
&nbsp;&nbsp;} }
</div>

### `delete_comment`

Menghapus komentar dari kartu.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"delete_comment"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"commentId"</span>: <span class="str">"comment123"</span> } }
</div>

### `get_card_comments`

Mendapatkan semua komentar dari kartu (tanpa fetch semua data kartu).

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_card_comments"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"cardId"</span>: <span class="str">"card123"</span> } }
</div>

</div>

## Attachment

<div class="tool-group">

### `attach_image_to_card`

Melampirkan gambar ke kartu dari URL.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"attach_image_to_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"imageUrl"</span>: <span class="str">"https://example.com/mockup.png"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"Mockup v2"</span><br/>
&nbsp;&nbsp;} }
</div>

### `attach_file_to_card`

Melampirkan file (PDF, dokumen, video, dll) ke kartu dari URL atau local path (`file://`).

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"attach_file_to_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"fileUrl"</span>: <span class="str">"https://example.com/report.pdf"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"Report Q2"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"mimeType"</span>: <span class="str">"application/pdf"</span><br/>
&nbsp;&nbsp;} }
</div>

</div>

## Aktivitas

<div class="tool-group">

### `get_recent_activity`

Mendapatkan aktivitas terbaru di board.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_recent_activity"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"limit"</span>: <span class="str">"10"</span> } }
</div>

</div>

## Custom Fields *(Trello Standard+ plan)*

<div class="tool-group">

### `get_board_custom_fields`

Mendapatkan definisi semua custom field di board (termasuk opsi dropdown).

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_board_custom_fields"</span>, <span class="str">"arguments"</span>: {} }
</div>

### `update_card_custom_field`

Mengupdate nilai custom field pada kartu. Mendukung tipe: `text`, `number`, `checkbox`, `date`, `list`, `clear`.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"update_card_custom_field"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"customFieldId"</span>: <span class="str">"field456"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"type"</span>: <span class="str">"text"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"value"</span>: <span class="str">"Sprint 24"</span><br/>
&nbsp;&nbsp;} }
</div>

</div>

## Tips Penggunaan

- **Parameter boardId opsional:** Jika tidak diberikan, server menggunakan board yang aktif
- **Date format:** Due date pakai ISO 8601 (`2026-07-01T12:00:00Z`), start date pakai `YYYY-MM-DD`
- **Label IDs:** Dapatkan dari Trello UI atau via `get_board_custom_fields`
- **File attachment:** Bisa dari URL atau local path pakai `file://` protocol
