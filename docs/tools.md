# Referensi Tools MCP Trello (KAEDE)

Daftar semua tools yang disediakan oleh **KAEDE MCP Server** (`dist/mcp-server.js`). Tools ini bisa dipanggil oleh AI Agent melalui OpenCode atau `TrelloMCPClient`.

<div class="not-prose p-4 rounded-xl bg-kaede-primary/10 border border-kaede-primary/20 mb-6">

**Format Panggilan**

Cukup minta ke AI Agent dalam bahasa natural. Contoh: *"Tolong cari kartu 'Fix login bug' dan pindahkan ke list Done"*.

</div>

## Manajemen Board

<div class="tool-group">

### `list_boards`

Menampilkan semua board Trello yang bisa diakses.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"list_boards"</span>, <span class="str">"arguments"</span>: {} }
</div>

### `create_board`

Membuat board Trello baru.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"create_board"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"Sprint 24"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"desc"</span>: <span class="str">"Deskripsi board"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"idOrganization"</span>: <span class="str">"workspace123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"defaultLabels"</span>: <span class="kw">true</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"defaultLists"</span>: <span class="kw">true</span><br/>
&nbsp;&nbsp;} }
</div>

### `list_workspaces`

Menampilkan semua workspace/organisasi Trello.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"list_workspaces"</span>, <span class="str">"arguments"</span>: {} }
</div>

</div>

## Manajemen List

<div class="tool-group">

### `get_lists`

Mendapatkan semua list di sebuah board.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_lists"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"boardId"</span>: <span class="str">"board123"</span> } }
</div>

### `add_list_to_board`

Menambahkan list baru ke board.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"add_list_to_board"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"boardId"</span>: <span class="str">"board123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"Sprint 25"</span><br/>
&nbsp;&nbsp;} }
</div>

### `archive_list`

Mengarsipkan list.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"archive_list"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"listId"</span>: <span class="str">"list123"</span> } }
</div>

</div>

## Manajemen Kartu

<div class="tool-group">

### `get_my_cards`

Mendapatkan semua kartu yang assigned ke user saat ini.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_my_cards"</span>, <span class="str">"arguments"</span>: {} }
</div>

### `get_cards_by_list_id`

Mendapatkan semua kartu dari list tertentu.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_cards_by_list_id"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"listId"</span>: <span class="str">"list123"</span>, <span class="str">"boardId"</span>: <span class="str">"board123"</span> } }
</div>

### `get_card`

Mendapatkan detail lengkap kartu — label, member, due date, deskripsi.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"FdhbArbK"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"includeMarkdown"</span>: <span class="kw">false</span><br/>
&nbsp;&nbsp;} }
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

Mengupdate detail kartu — nama, deskripsi, due date, label.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"update_card_details"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"New name"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"dueComplete"</span>: <span class="kw">true</span><br/>
&nbsp;&nbsp;} }
</div>

### `move_card`

Memindahkan kartu ke list lain (antar board jika idBoard diberikan).

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

</div>

## Manajemen Anggota

<div class="tool-group">

### `get_board_members`

Mendapatkan semua anggota di board.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_board_members"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"boardId"</span>: <span class="str">"board123"</span> } }
</div>

### `assign_member_to_card`

Menambahkan anggota ke kartu.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"assign_member_to_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"memberId"</span>: <span class="str">"member456"</span><br/>
&nbsp;&nbsp;} }
</div>

### `remove_member_from_card`

Menghapus anggota dari kartu.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"remove_member_from_card"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"memberId"</span>: <span class="str">"member456"</span><br/>
&nbsp;&nbsp;} }
</div>

</div>

## Manajemen Label

<div class="tool-group">

### `get_board_labels`

Mendapatkan semua label di board.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_board_labels"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"boardId"</span>: <span class="str">"board123"</span> } }
</div>

### `create_label`

Membuat label baru.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"create_label"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"boardId"</span>: <span class="str">"board123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"Bug"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"color"</span>: <span class="str">"red"</span><br/>
&nbsp;&nbsp;} }
</div>

### `update_label`

Mengupdate nama dan/atau warna label.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"update_label"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"labelId"</span>: <span class="str">"label123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"Critical"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"color"</span>: <span class="str">"red"</span><br/>
&nbsp;&nbsp;} }
</div>

### `delete_label`

Menghapus label.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"delete_label"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: { <span class="str">"labelId"</span>: <span class="str">"label123"</span> } }
</div>

</div>

## Checklist

<div class="tool-group">

### `create_checklist`

Membuat checklist baru di kartu.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"create_checklist"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"QA Checklist"</span><br/>
&nbsp;&nbsp;} }
</div>

### `add_checklist_item`

Menambahkan item ke checklist.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"add_checklist_item"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"checklistId"</span>: <span class="str">"checklist123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"name"</span>: <span class="str">"Test login flow"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"checked"</span>: <span class="kw">false</span><br/>
&nbsp;&nbsp;} }
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

### `get_card_comments`

Mendapatkan semua komentar dari kartu.

<div class="code-block">
{ <span class="str">"name"</span>: <span class="str">"get_card_comments"</span>,<br/>
&nbsp;&nbsp;<span class="str">"arguments"</span>: {<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"cardId"</span>: <span class="str">"card123"</span>,<br/>
&nbsp;&nbsp;&nbsp;&nbsp;<span class="str">"limit"</span>: <span class="num">100</span><br/>
&nbsp;&nbsp;} }
</div>

</div>

## Tips Penggunaan

- **boardId opsional:** Jika tidak diberikan, beberapa tools menggunakan board default dari API key
- **Date format:** Due date pakai ISO 8601 (`2026-07-01T12:00:00Z`), start date pakai `YYYY-MM-DD`
- **Label IDs:** Dapatkan dari Trello UI atau via `get_board_labels`
- **Member IDs:** Dapatkan via `get_board_members`
- **Sumber kode:** Tools ini dari `src/mcp-server.js` — custom KAEDE, bukan `@delorenj/mcp-server-trello`
- **Client wrapper:** Gunakan `TrelloMCPClient` di `src/trello-client.js` untuk akses terstruktur
