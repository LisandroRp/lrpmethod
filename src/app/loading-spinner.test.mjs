import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { test } from "node:test";

const styles = readFileSync(new URL("./globals.css", import.meta.url), "utf8");

test("animated subtle-border spinners retain the accent-colored segment", () => {
  const baseRuleIndex = styles.indexOf(".border-subtle {");
  const accentRule = /\.border-subtle\.animate-spin\s*\{([^}]+)\}/.exec(styles);

  assert.ok(baseRuleIndex >= 0);
  assert.ok(accentRule);
  assert.ok(accentRule.index > baseRuleIndex);
  assert.match(accentRule[1], /border-top-color:\s*var\(--color-accent\)/);
});
