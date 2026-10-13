import assert from "node:assert/strict";
import { existsSync, readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { join } from "node:path";
import { test } from "node:test";
import { fileURLToPath, pathToFileURL } from "node:url";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import typescript from "typescript";

const projectRoot = fileURLToPath(new URL("../../../../", import.meta.url));

registerHooks({
  resolve(specifier, context, nextResolve) {
    if (specifier === "next/link") return nextResolve("next/link.js", context);
    if (!specifier.startsWith("@/")) return nextResolve(specifier, context);
    const basePath = join(projectRoot, "src", specifier.slice(2));
    const filePath = [basePath, `${basePath}.tsx`, `${basePath}.ts`].find(existsSync);
    assert.ok(filePath, `Cannot resolve ${specifier}`);
    return nextResolve(pathToFileURL(filePath).href, context);
  },
  load(url, context, nextLoad) {
    if (!url.endsWith(".tsx") && !url.endsWith(".ts")) return nextLoad(url, context);
    const source = readFileSync(new URL(url), "utf8");
    const output = typescript.transpileModule(source, {
      compilerOptions: {
        jsx: typescript.JsxEmit.ReactJSX,
        module: typescript.ModuleKind.ESNext,
        target: typescript.ScriptTarget.ES2022
      }
    });
    return { format: "module", source: output.outputText, shortCircuit: true };
  }
});

const { ChatMessageCard } = await import("./ChatMessageCard.tsx");

const message = {
  id: 1,
  senderKind: "customer",
  body: "Hello",
  createdAt: "2026-10-11T12:00:00Z",
  routineId: 3
};

test("chat message uses gold and dark text for the current viewer", () => {
  for (const [isAdmin, senderKind] of [[false, "customer"], [true, "admin"]]) {
    const html = renderToStaticMarkup(createElement(ChatMessageCard, {
      message: { ...message, senderKind }, locale: "es", isAdmin
    }));
    assert.match(html, /bg-\[color:var\(--color-accent\)\]/);
    assert.match(html, /text-\[color:var\(--color-ink-strong\)\]/);
    assert.match(html, /href="\/my-plan\/3"/);
  }
});

test("chat message keeps the neutral style for the other participant", () => {
  for (const [isAdmin, senderKind] of [[true, "customer"], [false, "admin"]]) {
    const html = renderToStaticMarkup(createElement(ChatMessageCard, {
      message: { ...message, senderKind }, locale: "en", isAdmin
    }));
    assert.match(html, /bg-canvas border-subtle/);
    assert.match(html, /text-primary/);
    assert.doesNotMatch(html, /bg-\[color:var\(--color-accent\)\]/);
  }
});
