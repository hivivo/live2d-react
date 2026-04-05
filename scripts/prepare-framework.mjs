import { cpSync, mkdirSync, readdirSync, readFileSync, rmSync, statSync, unlinkSync, writeFileSync } from 'node:fs';
import { join } from 'node:path';

const root = new URL('..', import.meta.url);
const sourceDir = new URL('../src/cubism/framework', import.meta.url);
const outputDir = new URL('../dist/cubism/framework', import.meta.url);
const distDir = new URL('../dist', import.meta.url);

function walk(dir, visitor) {
  for (const entry of readdirSync(dir)) {
    const fullPath = join(dir, entry);
    const stats = statSync(fullPath);

    if (stats.isDirectory()) {
      walk(fullPath, visitor);
      continue;
    }

    visitor(fullPath);
  }
}

function withExplicitJsExtensions(source) {
  return source
    .replace(
      /\b(from\s+['"])(\.[^'"]*?)(['"])/g,
      (_, prefix, specifier, suffix) =>
        `${prefix}${appendJsExtension(specifier)}${suffix}`
    )
    .replace(
      /\b(import\s*\(\s*['"])(\.[^'"]*?)(['"]\s*\))/g,
      (_, prefix, specifier, suffix) =>
        `${prefix}${appendJsExtension(specifier)}${suffix}`
    )
    .replace(
      /\b(export\s+\*\s+from\s+['"])(\.[^'"]*?)(['"])/g,
      (_, prefix, specifier, suffix) =>
        `${prefix}${appendJsExtension(specifier)}${suffix}`
    );
}

function appendJsExtension(specifier) {
  if (/\.(?:[cm]?js|json|node)$/.test(specifier)) {
    return specifier;
  }

  return `${specifier}.js`;
}

rmSync(outputDir, { recursive: true, force: true });
mkdirSync(new URL('../dist/cubism', import.meta.url), { recursive: true });
cpSync(sourceDir, outputDir, { recursive: true });

walk(distDir.pathname, filePath => {
  if (filePath.endsWith('.map') || filePath.endsWith('.d.ts.map')) {
    unlinkSync(filePath);
    return;
  }

  if (!filePath.endsWith('.js')) {
    return;
  }

  const source = readFileSync(filePath, 'utf8');
  const cleaned = withExplicitJsExtensions(
    source.replace(/\n\/\/# sourceMappingURL=.*$/m, '')
  );

  if (cleaned !== source) {
    writeFileSync(filePath, cleaned);
  }
});
