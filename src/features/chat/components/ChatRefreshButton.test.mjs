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
    if (!specifier.startsWith("@/")) return nextResolve(specifier, context);

    const basePath = join(projectRoot, "src", specifier.slice(2));
    const filePath = [basePath, `${basePath}.tsx`, `${basePath}.ts`].find(existsSync);
    assert.ok(filePath, `Cannot resolve ${specifier}`);
    return nextResolve(pathToFileURL(filePath).href, context);
  },
  load(url, context, nextLoad) {
    if (!url.endsWith(".tsx")) return nextLoad(url, context);

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

const { ChatRefreshButton } = await import("./ChatRefreshButton.tsx");

test("chat refresh button shows a spinning loader and disables repeat clicks while refreshing", () => {
  const html = renderToStaticMarkup(createElement(ChatRefreshButton, {
    label: "Actualizar",
    isRefreshing: true,
    onRefresh: () => {}
  }));

  assert.match(html, /aria-busy="true"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /animate-spin/);
  assert.match(html, /text-accent/);
  assert.match(html, /opacity-0/);
  assert.match(html, /Actualizar/);
});

test("chat refresh button restores its idle icon when refreshing ends", () => {
  const html = renderToStaticMarkup(createElement(ChatRefreshButton, {
    label: "Actualizar",
    isRefreshing: false,
    onRefresh: () => {}
  }));

  assert.match(html, /aria-busy="false"/);
  assert.doesNotMatch(html, /disabled=""|animate-spin|opacity-0/);
});
