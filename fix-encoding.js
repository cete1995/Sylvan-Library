const fs = require('fs');
const path = require('path');

const srcPages = 'frontend/src/pages';

const fixes = [
  // Pages with min-h-screen only
  ['HomePage.tsx',       'min-h-screen"', 'min-h-screen pb-28 md:pb-0"'],
  ['CatalogPage.tsx',    'min-h-screen"', 'min-h-screen pb-28 md:pb-0"'],
  ['CartPage.tsx',       'min-h-screen"', 'min-h-screen pb-28 md:pb-0"'],
  ['ProfilePage.tsx',    'min-h-screen"', 'min-h-screen pb-28 md:pb-0"'],
  ['OrderHistoryPage.tsx','min-h-screen"','min-h-screen pb-28 md:pb-0"'],
  ['CafePage.tsx',       'min-h-screen"', 'min-h-screen pb-28 md:pb-0"'],
  // Pages with min-h-screen flex
  ['LoginPage.tsx',    'min-h-screen flex"', 'min-h-screen flex pb-28 md:pb-0"'],
  ['RegisterPage.tsx', 'min-h-screen flex"', 'min-h-screen flex pb-28 md:pb-0"'],
];

for (const [file, from, to] of fixes) {
  const fp = path.join(srcPages, file);
  let c = fs.readFileSync(fp, 'utf8');
  const before = c.split(from).length - 1;
  c = c.split(from).join(to);
  fs.writeFileSync(fp, c, 'utf8');
  console.log(`${file}: ${before} replacement(s)`);
}
console.log('Done');


// Each mojibake sequence was produced by PowerShell reading UTF-8 as Windows-1252
// and then writing back as UTF-8, double-encoding every non-ASCII char.
function fixFile(path, replacements) {
  let content = fs.readFileSync(path, 'utf8');
  for (const [bad, good] of replacements) {
    content = content.split(bad).join(good);
  }
  fs.writeFileSync(path, content, { encoding: 'utf8' });
  console.log('Fixed:', path);
}

// Shared sequences
const ARROW_R = '\u00e2\u2020\u2019';   // â†' -> →
const ARROW_L = '\u00e2\u2020\u0090';   // â†  -> ←
const MIDDOT  = '\u00c2\u00b7';          // Â·  -> ·
const BOX     = '\u00e2\u201d\u20ac';   // â"€  -> ─ (comment decorations)
const PKG     = '\u00f0\u0178\u201c\u00a6'; // ðŸ"¦ -> 📦

fixFile('frontend/src/pages/ManaboxUploadPage.tsx', [
  [PKG,                                             '\u{1f4e6}'],  // 📦
  ['\u00f0\u0178\u201c\u2039',                      '\u{1f4cb}'],  // 📋
  ['\u00e2\u2039\u00ae',                            '\u22ee'   ],  // ⋮
  [ARROW_R,                                         '\u2192'   ],  // →
  [MIDDOT,                                          '\u00b7'   ],  // ·
  ['\u00e2\u009d\u0152',                            '\u274c'   ],  // ❌
  ['\u00e2\u008f\u00b3',                            '\u23f3'   ],  // ⏳
  ['\u00f0\u0178\u0161\u20ac',                      '\u{1f680}'],  // 🚀
  ['\u00e2\u0153\u2026',                            '\u2705'   ],  // ✅
  ['\u00e2\u0161\u00a0\u00ef\u00b8\u008f',          '\u26a0\ufe0f'],// ⚠️
  ['\u00e2\u20ac\u201d',                            '\u2013'   ],  // –
  ['\u00f0\u0178\u2019\u00a1',                      '\u{1f4a1}'],  // 💡
  ['\u00e2\u201e\u00b9\u00ef\u00b8\u008f',          '\u2139\ufe0f'],// ℹ️
  ['\u00f0\u0178\u2019\u00b1',                      '\u{1f4b1}'],  // 💱
  ['\u00f0\u0178\u201c\u0160',                      '\u{1f4ca}'],  // 📊
  ['\u00e2\u0153\u00a8',                            '\u2728'   ],  // ✨
  ['\u00f0\u0178\u2019\u00b0',                      '\u{1f4b0}'],  // 💰
  ['\u00f0\u0178\u201d\u201e',                      '\u{1f504}'],  // 🔄
  [BOX,                                             '\u2500'   ],  // ─ (comments)
]);

fixFile('frontend/src/pages/SellerDashboardPage.tsx', [
  ['\u00f0\u0178\u008f\u00aa',                      '\u{1f3ea}'],  // 🏪
  [PKG,                                             '\u{1f4e6}'],  // 📦
  ['\u00f0\u0178\u0192\u008f',                      '\u{1f0cf}'],  // 🃏
  [MIDDOT,                                          '\u00b7'   ],  // ·
  [ARROW_L,                                         '\u2190'   ],  // ←
  [ARROW_R,                                         '\u2192'   ],  // →
  [BOX,                                             '\u2500'   ],  // ─ (comments)
]);

console.log('Done!');
