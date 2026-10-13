import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";

import typescript from "typescript";

registerHooks({
  load(url, context, nextLoad) {
    if (!url.endsWith(".ts")) return nextLoad(url, context);
    const source = readFileSync(new URL(url), "utf8");
    const output = typescript.transpileModule(source, {
      compilerOptions: { module: typescript.ModuleKind.ESNext, target: typescript.ScriptTarget.ES2022 }
    });
    return { format: "module", source: output.outputText, shortCircuit: true };
  }
});

const { selectChatConversations } = await import("./chat-inbox.ts");

const conversations = [
  { customerId: "1", fullName: "Ana", email: "ana@example.com", planCode: "premium", lastMessageAt: "2026-10-01T12:00:00Z" },
  { customerId: "2", fullName: "Bruno", email: "bruno@example.com", planCode: null, lastMessageAt: "2026-10-03T12:00:00Z" },
  { customerId: "3", fullName: "Carla", email: "carla@example.com", planCode: "basic", lastMessageAt: "2026-10-02T12:00:00Z" }
];

test("chat inbox filters by student and active plan", () => {
  assert.deepEqual(selectChatConversations(conversations, "  ANA  ", "premium", "newest").map((row) => row.customerId), ["1"]);
  assert.deepEqual(selectChatConversations(conversations, "example.com", "none", "newest").map((row) => row.customerId), ["2"]);
  assert.deepEqual(selectChatConversations(conversations, "", "basic", "newest").map((row) => row.customerId), ["3"]);
});

test("chat inbox sorts messages in both directions without mutating its source", () => {
  assert.deepEqual(selectChatConversations(conversations, "", "all", "newest").map((row) => row.customerId), ["2", "3", "1"]);
  assert.deepEqual(selectChatConversations(conversations, "", "all", "oldest").map((row) => row.customerId), ["1", "3", "2"]);
  assert.deepEqual(conversations.map((row) => row.customerId), ["1", "2", "3"]);
});
