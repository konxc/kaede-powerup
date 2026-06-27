import { TrelloMCPClient } from "../src/trello-client.js";
import { homedir } from "os";
import { resolve } from "path";
import { existsSync, readFileSync } from "fs";

function getSecrets() {
  const global = resolve(homedir(), ".config", "kaede", "secrets.env");
  const local = resolve(process.cwd(), "secrets.env");
  let merged = {};
  for (const p of [local, global]) {
    if (existsSync(p)) {
      const content = readFileSync(p, "utf-8");
      for (const line of content.split("\n")) {
        const t = line.trim();
        if (!t || t.startsWith("#")) continue;
        const eq = t.indexOf("=");
        if (eq === -1) continue;
        merged[t.slice(0, eq).trim()] = t.slice(eq + 1).trim();
      }
    }
  }
  return { ...merged, ...process.env };
}

const CARD_ID = "6a1b170320f6b4aa6ad055a9";
const BOARD_ID = "rAKmlRj3";

let client;
let pass = 0;
let fail = 0;
let skipped = 0;

async function t(name, fn, opts = {}) {
  if (opts.skip) {
    console.log(`  \u23F1  ${name} (skipped)`);
    skipped++;
    return;
  }
  try {
    const result = await fn();
    console.log(`  \u2713 ${name}`);
    pass++;
    return result;
  } catch (e) {
    console.log(`  \u2717 ${name}: ${e.message.split('\n')[0]}`);
    fail++;
    return null;
  }
}

async function main() {
  const env = getSecrets();
  if (!env.TRELLO_API_KEY || !env.TRELLO_TOKEN) {
    console.error("Credentials not configured");
    process.exit(1);
  }

  client = new TrelloMCPClient();
  await client.connect();

  console.log("\n  \u250C\u2500\u2500\u2500 Boards \u2500\u2500\u2500\u2510");
  await t("list_boards", () => client.callTool("list_boards", {}));
  await t("list_workspaces", () => client.callTool("list_workspaces", {}));
  const lists = await t("get_lists", () => client.callTool("get_lists", { boardId: BOARD_ID }));

  console.log("\n  \u250C\u2500\u2500\u2500 Cards \u2500\u2500\u2500\u2510");
  await t("get_card", () => client.callTool("get_card", { cardId: CARD_ID }));
  if (lists?.lists?.length) {
    await t("get_cards_by_list_id", () =>
      client.callTool("get_cards_by_list_id", { listId: lists.lists[0].id })
    );
  }
  await t("get_my_cards", () => client.callTool("get_my_cards", {}));
  if (lists?.lists?.length) {
    const card = await t("add_card_to_list", () =>
      client.callTool("add_card_to_list", {
        listId: lists.lists[0].id,
        name: "TEST - cleanup me",
      })
    );
    if (card?.id) {
      await t("archive_card", () => client.callTool("archive_card", { cardId: card.id }));
    }
  }

  console.log("\n  \u250C\u2500\u2500\u2500 Comments \u2500\u2500\u2500\u2510");
  await t("add_comment", () => client.callTool("add_comment", { cardId: CARD_ID, text: "Test comment" }));
  await t("get_card_comments", () => client.callTool("get_card_comments", { cardId: CARD_ID }));

  console.log("\n  \u250C\u2500\u2500\u2500 Attachments \u2500\u2500\u2500\u2510");
  await t("attach_image_to_card", () =>
    client.callTool("attach_image_to_card", { cardId: CARD_ID, imageUrl: "https://via.placeholder.com/150" })
  );
  await t("attach_file_to_card", () =>
    client.callTool("attach_file_to_card", { cardId: CARD_ID, fileUrl: "https://www.w3.org/WAI/ER/tests/xhtml/testfiles/resources/pdf/dummy.pdf", mimeType: "application/pdf" })
  );
  await t("get_card_attachments", () => client.callTool("get_card_attachments", { cardId: CARD_ID }));
  if (lists?.lists?.length) {
    const copied = await t("copy_card", () =>
      client.callTool("copy_card", { sourceCardId: CARD_ID, listId: lists.lists[0].id, name: "TEST - copied card - cleanup me", keepFromSource: "all" })
    );
    if (copied?.id) {
      await client.callTool("archive_card", { cardId: copied.id }).catch(() => {});
    }
  }

  console.log("\n  \u250C\u2500\u2500\u2500 Checklists \u2500\u2500\u2500\u2510");
  const cl = await t("create_checklist", () => client.callTool("create_checklist", { cardId: CARD_ID, name: "Test Checklist" }));
  if (cl?.id) {
    const item = await t("add_checklist_item", () => client.callTool("add_checklist_item", { checklistId: cl.id, name: "Test item" }));
    await t("add_checklist_item 2nd", () => client.callTool("add_checklist_item", { checklistId: cl.id, name: "Second item" }));
    await t("get_card_checklists", () => client.callTool("get_card_checklists", { cardId: CARD_ID }));
    if (item?.id) {
      await t("update_checklist_item", () => client.callTool("update_checklist_item", { checklistId: cl.id, checkItemId: item.id, checked: true }));
    }
    // delete last item
    const chk = await client.callTool("get_card_checklists", { cardId: CARD_ID });
    const items = chk?.checklists?.[0]?.items || [];
    if (items.length > 1) {
      await t("delete_checklist_item", () => client.callTool("delete_checklist_item", { checklistId: cl.id, checkItemId: items[items.length - 1].id }));
    }
    // copy checklist
    await t("copy_checklist", () => client.callTool("copy_checklist", { sourceChecklistId: cl.id, cardId: CARD_ID }));
    // cleanup
    await t("delete_checklist", () => client.callTool("delete_checklist", { checklistId: cl.id }));
  }

  console.log("\n  \u250C\u2500\u2500\u2500 Members \u2500\u2500\u2500\u2510");
  const members = await t("get_board_members", () => client.callTool("get_board_members", { boardId: BOARD_ID }));
  if (members?.members?.length) {
    await t("assign_member_to_card", () => client.callTool("assign_member_to_card", { cardId: CARD_ID, memberId: members.members[0].id }));
    await t("remove_member_from_card", () => client.callTool("remove_member_from_card", { cardId: CARD_ID, memberId: members.members[0].id }));
  }

  console.log("\n  \u250C\u2500\u2500\u2500 Labels \u2500\u2500\u2500\u2510");
  await t("get_board_labels", () => client.callTool("get_board_labels", { boardId: BOARD_ID }));
  const label = await t("create_label", () => client.callTool("create_label", { boardId: BOARD_ID, name: "TEST - cleanup me", color: "red" }));
  if (label?.id) {
    await t("delete_label", () => client.callTool("delete_label", { labelId: label.id }));
  }
  await t("update_label", async () => {
    const r = await client.callTool("get_board_labels", { boardId: BOARD_ID });
    if (!r?.labels?.length) throw new Error("no labels");
    return client.callTool("update_label", { labelId: r.labels[0].id, name: r.labels[0].name, color: r.labels[0]?.color || "blue" });
  });
  await t("search_labels", () => client.callTool("search_labels", { boardId: BOARD_ID, query: "bug" }));
  await t("remove_label_from_card", async () => {
    const r = await client.callTool("get_board_labels", { boardId: BOARD_ID });
    if (!r?.labels?.length) throw new Error("no labels");
    await client.callTool("remove_label_from_card", { cardId: CARD_ID, labelId: r.labels[0].id });
    await client.callTool("update_card_details", { cardId: CARD_ID, labels: [r.labels[0].id] }).catch(() => {});
    return true;
  });

  console.log("\n  \u250C\u2500\u2500\u2500 Watch & Activity \u2500\u2500\u2500\u2510");
  await t("watch_card", () => client.callTool("watch_card", { cardId: CARD_ID, add: true }));
  await t("watch_card off", () => client.callTool("watch_card", { cardId: CARD_ID, remove: true }));
  await t("get_card_activity", () => client.callTool("get_card_activity", { cardId: CARD_ID, limit: 5 }));

  console.log("\n  \u250C\u2500\u2500\u2500 Lists \u2500\u2500\u2500\u2510");
  const newList = await t("add_list_to_board", () => client.callTool("add_list_to_board", { boardId: BOARD_ID, name: "TEST - cleanup me" }));
  if (newList?.id) {
    await t("archive_list", () => client.callTool("archive_list", { listId: newList.id }));
  }
  if (lists?.lists?.length) {
    await t("update_list", () => client.callTool("update_list", { listId: lists.lists[0].id, name: lists.lists[0].name }));
    await t("sort_list_cards", () => client.callTool("sort_list_cards", { listId: lists.lists[0].id, sort: "name" }));
  }

  const total = pass + fail;
  console.log(`\n  ${"=".repeat(35)}`);
  console.log(`  Results: ${pass} passed, ${fail} failed, ${skipped} skipped`);
  console.log(`  Coverage: ${total} tools tested`);
  console.log(`  ${"=".repeat(35)}\n`);

  client.close();
  process.exit(fail > 0 ? 1 : 0);
}

main().catch((e) => {
  console.error(e);
  if (client) client.close();
  process.exit(1);
});
