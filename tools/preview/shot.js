// Renders preview.html (made by make.py in this folder) to preview.png at 1200x630. Run from this folder.
const { chromium } = require('playwright');
(async () => {
  const b = await chromium.launch(); const p = await b.newPage({ viewport: { width: 1200, height: 630 }, deviceScaleFactor: 1 });
  await p.goto('file://' + process.cwd() + '/preview.html'); await p.evaluate(() => document.fonts.ready);
  await p.screenshot({ path: 'preview.png' }); await b.close();
})();
