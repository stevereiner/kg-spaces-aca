#!/usr/bin/env node
/**
 * Wire the KG Spaces extension into an Alfresco Content App checkout.
 *
 * Does install steps 3-5 from the README in one go, and is what the Docker build runs:
 *   3. register provideKgSpacesExtension() in app/src/app/extensions.module.ts
 *   4. add the plugin JSON and agent icon asset globs to app/project.json
 *   5. merge plugins.kgSpaces into app/src/app.config.json
 *
 * Usage:  node scripts/patch-aca.mjs <aca-root> [config/app.config.snippet.json]
 *
 * Expects the extension to already be at <aca-root>/projects/kg-spaces-aca-ext. Safe to run more
 * than once: each change is skipped if it is already present (step 5 only adds missing keys,
 * never overwriting a value). No dependencies beyond Node.
 */
import { readFileSync, writeFileSync } from 'node:fs';
import { join, dirname } from 'node:path';
import { fileURLToPath } from 'node:url';

const acaRoot = process.argv[2];
if (!acaRoot) {
  console.error('usage: node patch-aca.mjs <aca-root> [app.config.snippet.json]');
  process.exit(1);
}
const here = dirname(fileURLToPath(import.meta.url));
const snippetPath = process.argv[3] || join(here, '..', 'config', 'app.config.snippet.json');

const EXT_DIR = 'projects/kg-spaces-aca-ext';
const IMPORT_LINE =
  "import { provideKgSpacesExtension } from '../../../projects/kg-spaces-aca-ext/src/public-api';";

// --- 3. extensions.module.ts -------------------------------------------------------------
{
  const file = join(acaRoot, 'app/src/app/extensions.module.ts');
  let src = readFileSync(file, 'utf8');
  if (src.includes('provideKgSpacesExtension')) {
    console.log('extensions.module.ts: already registered');
  } else {
    // after the last top-level import
    const imports = [...src.matchAll(/^import .*;$/gm)];
    if (!imports.length) throw new Error('extensions.module.ts: no import lines found');
    const last = imports[imports.length - 1];
    const at = last.index + last[0].length;
    src = src.slice(0, at) + '\n' + IMPORT_LINE + src.slice(at);

    // first entry of the array returned by provideApplicationExtensions()
    const fn = /export function provideApplicationExtensions\(\)[^{]*\{\s*return \[/;
    if (!fn.test(src)) throw new Error('extensions.module.ts: provideApplicationExtensions() not found');
    src = src.replace(fn, (m) => m + '\n    ...provideKgSpacesExtension(),');
    writeFileSync(file, src);
    console.log('extensions.module.ts: registered provideKgSpacesExtension()');
  }
}

// --- 4. app/project.json asset globs ------------------------------------------------------
{
  const file = join(acaRoot, 'app/project.json');
  const pj = JSON.parse(readFileSync(file, 'utf8'));
  const assets = pj.targets.build.options.assets;
  let added = 0;
  for (const glob of ['kg-spaces.plugin.json', 'agent.png']) {
    const present = assets.some(
      (a) => typeof a === 'object' && a.glob === glob && a.input === `${EXT_DIR}/src/assets`
    );
    if (!present) {
      assets.push({ glob, input: `${EXT_DIR}/src/assets`, output: './assets/plugins' });
      added++;
    }
  }
  if (added) writeFileSync(file, JSON.stringify(pj, null, 2) + '\n');
  console.log(`project.json: ${added ? `added ${added} asset glob(s)` : 'asset globs already present'}`);
}

// --- 5. app.config.json plugins.kgSpaces -------------------------------------------------
{
  const file = join(acaRoot, 'app/src/app.config.json');
  const cfg = JSON.parse(readFileSync(file, 'utf8'));
  const snippet = JSON.parse(readFileSync(snippetPath, 'utf8')).plugins.kgSpaces;
  // the snippet's "_comment..." and "_sample..." keys are documentation, not configuration
  const kgSpaces = Object.fromEntries(Object.entries(snippet).filter(([k]) => !k.startsWith('_')));
  cfg.plugins = cfg.plugins || {};
  if (!cfg.plugins.kgSpaces) {
    cfg.plugins.kgSpaces = kgSpaces;
    writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
    console.log('app.config.json: added plugins.kgSpaces');
  } else {
    // Already configured: add only the keys it lacks -- settings added to the snippet in a
    // later release would otherwise never reach an existing install -- and never overwrite a
    // value someone has set.
    const missing = Object.keys(kgSpaces).filter((k) => !(k in cfg.plugins.kgSpaces));
    if (missing.length) {
      for (const k of missing) cfg.plugins.kgSpaces[k] = kgSpaces[k];
      writeFileSync(file, JSON.stringify(cfg, null, 2) + '\n');
      console.log(`app.config.json: added missing plugins.kgSpaces key(s): ${missing.join(', ')}`);
    } else {
      console.log('app.config.json: plugins.kgSpaces already complete, left as is');
    }
  }
}
