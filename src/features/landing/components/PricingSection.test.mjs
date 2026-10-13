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

const [{ PricingSection }, { AccountProvider }, { getLandingContent }] = await Promise.all([
  import("./PricingSection.tsx"),
  import("@/features/contexts/AccountContext"),
  import("@/features/landing/i18n/messages")
]);

test("pricing shows button-sized skeletons instead of actions while account data loads", () => {
  const html = renderToStaticMarkup(
    createElement(AccountProvider, null,
      createElement(PricingSection, { content: getLandingContent("es") }))
  );
  const start = html.indexOf('<section id="plans"');
  assert.notEqual(start, -1);
  const end = html.indexOf("</section>", start);
  assert.notEqual(end, -1);
  const pricingHtml = html.slice(start, end);

  assert.match(pricingHtml, /aria-busy="true"/);
  assert.equal([...pricingHtml.matchAll(/class="pricing-button-skeleton mt-6"/g)].length, 3);
  assert.equal([...pricingHtml.matchAll(/<button\b/g)].length, 0);
  assert.equal([...pricingHtml.matchAll(/animate-spin/g)].length, 0);
});
