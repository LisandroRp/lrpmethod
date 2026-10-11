import assert from "node:assert/strict";
import { test } from "node:test";

import { canCustomerSendChat, getChatMenuDestination, isUuid, parseBeforeId, parseChatMessageInput } from "./chat-policy.ts";

test("only intermediate and premium customers can send messages", () => {
  assert.equal(canCustomerSendChat(null), false);
  assert.equal(canCustomerSendChat("basic"), false);
  assert.equal(canCustomerSendChat("intermediate"), true);
  assert.equal(canCustomerSendChat("premium"), true);
});

test("the profile menu routes administrators to the shared inbox", () => {
  assert.equal(getChatMenuDestination(false), "/chat");
  assert.equal(getChatMenuDestination(true), "/admin/chat");
});

test("chat input accepts a trimmed message and an optional routine context", () => {
  assert.deepEqual(parseChatMessageInput({ body: "  How do I progress?  ", routineId: 42 }), {
    body: "How do I progress?",
    routineId: 42
  });
  assert.deepEqual(parseChatMessageInput({ body: "Hello" }), { body: "Hello", routineId: null });
});

test("chat input rejects empty, oversized, and invalid routine values", () => {
  assert.equal(parseChatMessageInput({ body: "  " }), null);
  assert.equal(parseChatMessageInput({ body: "x".repeat(2001) }), null);
  assert.equal(parseChatMessageInput({ body: "Hello", routineId: -1 }), null);
  assert.equal(parseChatMessageInput({ body: "Hello", routineId: "1" }), null);
});

test("pagination and customer IDs reject invalid values", () => {
  assert.equal(parseBeforeId("17"), 17);
  assert.equal(parseBeforeId("0"), null);
  assert.equal(parseBeforeId("1.5"), null);
  assert.equal(isUuid("b4e3f992-857d-4dc7-92ce-41c8b5ee4040"), true);
  assert.equal(isUuid("other-customer"), false);
});
