#!/usr/bin/env node
// Гард изоляции CRM-микросервиса (Д5: ESLint в проекте нет → отдельный Node-скрипт).
// Проверяет двусторонний барьер (§6 спеки):
//   (а) внутри app/src/crm/** НЕТ импортов запрещённых путей онбординга;
//   (б) ВНЕ crm/ нет прямых импортов внутрь crm/ кроме barrel (crm / crm/index).
// Ненулевой код при нарушении. Подключается через npm run check:crm (и в build при желании).

import { readdirSync, readFileSync, statSync } from 'node:fs';
import { join, relative, sep, resolve } from 'node:path';
import { fileURLToPath } from 'node:url';
import { dirname } from 'node:path';

const __dirname = dirname(fileURLToPath(import.meta.url));
const APP_SRC = join(__dirname, '..', 'app', 'src');
const CRM_DIR = join(APP_SRC, 'crm');

// Что crm/** импортить НЕ должен (онбординг/клиентский флоу).
// Сопоставляем по нормализованному specifier (с прямыми слешами).
const FORBIDDEN_FROM_CRM = [
  /(^|\/)screens\/v2\b/, // screens/v2*, включая screens/v2/company
  /(^|\/)mock\/v2\b/,
  /(^|\/)ui\/v2\b/,
];

// Разрешённые «наружу» из crm/ относительные импорты (кроме самих @mui/react/router — те всегда ок).
// Реально из соседних папок crm/ может импортить только ../rm/theme и ../rm/RmThemeProvider.
const ALLOWED_OUTBOUND_REL = [
  /(^|\/)rm\/theme$/,
  /(^|\/)rm\/RmThemeProvider$/,
];

const SRC_EXT = new Set(['.ts', '.tsx', '.js', '.jsx', '.mjs']);

function walk(dir) {
  const out = [];
  for (const name of readdirSync(dir)) {
    const full = join(dir, name);
    const st = statSync(full);
    if (st.isDirectory()) out.push(...walk(full));
    else {
      const dot = name.lastIndexOf('.');
      if (dot >= 0 && SRC_EXT.has(name.slice(dot))) out.push(full);
    }
  }
  return out;
}

// Достаём specifier'ы import/export-from и require.
function importsOf(code) {
  const specs = [];
  const re = /(?:import|export)\s[^'";]*?from\s*['"]([^'"]+)['"]|import\s*['"]([^'"]+)['"]|require\(\s*['"]([^'"]+)['"]\s*\)/g;
  let m;
  while ((m = re.exec(code)) !== null) {
    specs.push(m[1] || m[2] || m[3]);
  }
  return specs;
}

const toPosix = (p) => p.split(sep).join('/');

const violations = [];

// --- (а) crm/** не импортит запрещённое ---
const crmFiles = walk(CRM_DIR);
for (const file of crmFiles) {
  const code = readFileSync(file, 'utf8');
  const rel = toPosix(relative(APP_SRC, file));
  for (const spec of importsOf(code)) {
    // Bare-пакеты (alias на онбординг) ловим по regex на specifier.
    if (FORBIDDEN_FROM_CRM.some((re) => re.test(spec))) {
      violations.push(`[crm→forbidden] ${rel} imports "${spec}"`);
    }
    // Относительные импорты: резолвим против папки файла. Если результат выходит ЗА пределы
    // crm/ — это «наружу», разрешён только ../rm/{theme,RmThemeProvider}. Импорты, остающиеся
    // внутри crm/ (напр. crm/adapter/../types), легитимны.
    if (spec.startsWith('.')) {
      const resolved = resolve(dirname(file), spec);
      const insideCrm = resolved === CRM_DIR || resolved.startsWith(CRM_DIR + sep);
      if (!insideCrm) {
        const allowed = ALLOWED_OUTBOUND_REL.some((re) => re.test(spec));
        if (!allowed) {
          violations.push(`[crm→outside] ${rel} imports "${spec}" (only ../rm/{theme,RmThemeProvider} allowed)`);
        }
      }
    }
  }
}

// --- (б) вне crm/ нет прямых импортов ВНУТРЬ crm/ кроме barrel ---
const allFiles = walk(APP_SRC).filter((f) => !f.startsWith(CRM_DIR + sep));
for (const file of allFiles) {
  const code = readFileSync(file, 'utf8');
  const rel = toPosix(relative(APP_SRC, file));
  for (const spec of importsOf(code)) {
    const norm = toPosix(spec);
    // Ищем заход в crm/. Допустим только '.../crm' или '.../crm/index'.
    const m = norm.match(/(^|\/)crm(\/.*)?$/);
    if (!m) continue;
    const tail = m[2] || ''; // '' | '/index' | '/mock/...' | ...
    const isBarrel = tail === '' || tail === '/index' || tail === '/index.ts';
    if (!isBarrel) {
      violations.push(`[outside→crm-internal] ${rel} imports "${spec}" (use barrel "crm" only)`);
    }
  }
}

if (violations.length) {
  console.error('CRM isolation check FAILED:\n' + violations.map((v) => '  - ' + v).join('\n'));
  process.exit(1);
}
console.log(`CRM isolation check passed (${crmFiles.length} crm files, ${allFiles.length} outside files scanned).`);
