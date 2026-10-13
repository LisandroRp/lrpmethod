import assert from "node:assert/strict";
import { readFileSync } from "node:fs";
import { registerHooks } from "node:module";
import { test } from "node:test";

import { createElement } from "react";
import { renderToStaticMarkup } from "react-dom/server";
import typescript from "typescript";

registerHooks({
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

const { LoadingButton } = await import("./LoadingButton.tsx");

test("loading buttons hide their label visually while preserving button width and accessible text", () => {
  const html = renderToStaticMarkup(createElement(LoadingButton, {
    isLoading: true
  }, "Guardar rutina"));

  assert.match(html, /aria-busy="true"/);
  assert.match(html, /disabled=""/);
  assert.match(html, /<span class="[^"]*opacity-0[^"]*">Guardar rutina<\/span>/);
  assert.match(html, /absolute inset-0/);
  assert.match(html, /animate-spin/);
});

test("loading buttons restore their label after the request finishes", () => {
  const html = renderToStaticMarkup(createElement(LoadingButton, {
    isLoading: false
  }, "Guardar rutina"));

  assert.match(html, /aria-busy="false"/);
  assert.doesNotMatch(html, /disabled=""|opacity-0|animate-spin/);
  assert.match(html, />Guardar rutina<\/span>/);
});
