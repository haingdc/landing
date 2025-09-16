#!/usr/bin/env -S deno run --allow-read --allow-write

/**
 * build/minify.ts
 *
 * Usage examples:
 *  deno run --allow-read --allow-write build/minify.ts --src=public --out=dist --pattern='**.js' --sourcemap --suffix=.min --skipMinified
 *
 * Flags:
 *  --src         Source folder (default: "public")
 *  --out         Output folder (default: "dist")
 *  --pattern     Glob pattern relative to src (default: '**.js')
 *  --sourcemap   boolean (write sourcemaps) default: false
 *  --suffix      filename suffix before ext (e.g. ".min") default: ""
 *  --skipMinified boolean (skip files ending with .min.js) default: true
 */

import { expandGlob } from "@std/fs";
import { join, dirname, relative, parse as pathParse } from "@std/path";
import { transform } from "@swc/core";
import { parseArgs } from "@std/cli"

const raw = parseArgs(Deno.args, {
  string: ["src", "out", "pattern", "suffix"],
  boolean: ["sourcemap", "skipMinified"],
  default: {
    src: "public",
    out: "dist",
    pattern: "**/*.js",
    suffix: "",
    sourcemap: false,
    skipMinified: true,
  },
});

const SRC = String(raw.src);
const OUT = String(raw.out);
const PATTERN = String(raw.pattern);
const SUFFIX = String(raw.suffix || "");
const SOURCEMAP = Boolean(raw.sourcemap);
const SKIP_MINIFIED = Boolean(raw.skipMinified);

console.log(`Minify build:
  src: ${SRC}
  out: ${OUT}
  pattern: ${PATTERN}
  suffix: ${SUFFIX || "(none)"}
  sourcemap: ${SOURCEMAP}
  skipMinified: ${SKIP_MINIFIED}
`);

let total = 0;
let succeeded = 0;
let skipped = 0;
let failed = 0;

for await (const entry of expandGlob(join(SRC, PATTERN), { globstar: true })) {
  if (!entry.isFile) continue;
  total++;

  const rel = relative(SRC, entry.path); // relative path inside src
  const parsed = pathParse(rel);
  const isMin = parsed.base.endsWith(".min.js");

  if (SKIP_MINIFIED && isMin) {
    console.log(`skip (already .min.js): ${rel}`);
    skipped++;
    continue;
  }

  try {
    const srcText = await Deno.readTextFile(entry.path);

    // decide out filename (keep same name or add suffix before .js)
    const outBase = SUFFIX
      ? `${parsed.name}${SUFFIX}${parsed.ext}` // e.g. app + .min + .js => app.min.js
      : parsed.base; // keep same

    const outPath = join(OUT, parsed.dir, outBase);
    await Deno.mkdir(dirname(outPath), { recursive: true });

    // minify with swc
    const result = await transform(srcText, {
      filename: parsed.base,
      sourceMaps: SOURCEMAP,
      minify: true,
      sourceRoot: `/${SRC}`,  // Set source root to the original source directory
      jsc: {
        minify: {
          compress: {
            unused: true,
          },
          mangle: true
        }
      }
    });

    // Add sourcemap comment if sourcemap is enabled
    const code = SOURCEMAP
      ? `${result.code}\n//# sourceMappingURL=${outBase}.map`
      : result.code;
    
    // Modify sourcemap to point to original source file
    if (SOURCEMAP && result.map) {
      const sourceMap = JSON.parse(result.map);
      sourceMap.sources = [join(parsed.dir, parsed.base)]; // Set relative path to original source
      // delete sourceMap.sourcesContent; // Remove source content to reduce size
      result.map = JSON.stringify(sourceMap);
    }
    
    await Deno.writeTextFile(outPath, code);
    if (SOURCEMAP && result.map) {
      await Deno.writeTextFile(`${outPath}.map`, result.map);
    }

    console.log(`minified: ${rel} -> ${join(parsed.dir, outBase)}`);
    succeeded++;
  } catch (err) {
    console.error(`error: ${rel}`, err);
    failed++;
  }
}

console.log("----- done -----");
console.log(`total: ${total}, succeeded: ${succeeded}, skipped: ${skipped}, failed: ${failed}`);
if (failed > 0) Deno.exit(1);