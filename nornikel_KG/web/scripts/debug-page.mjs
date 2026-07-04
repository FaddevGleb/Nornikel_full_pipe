import { chromium } from 'playwright';

const browser = await chromium.launch();
const page = await browser.newPage();
const errors = [];
const failed = [];

page.on('pageerror', (e) => errors.push(`pageerror: ${e.message}`));
page.on('console', (msg) => {
  if (msg.type() === 'error') errors.push(`console: ${msg.text()}`);
});
page.on('requestfailed', (req) => {
  failed.push(`${req.url()} -> ${req.failure()?.errorText ?? 'failed'}`);
});

await page.goto('http://localhost:3847/', { waitUntil: 'networkidle', timeout: 30000 });
await page.waitForTimeout(3000);

const snapshot = await page.evaluate(() => ({
  rootLen: document.getElementById('root')?.innerHTML?.length ?? 0,
  text: document.body?.innerText?.slice(0, 400) ?? '',
  script: document.querySelector('script[type="module"]')?.getAttribute('src') ?? null,
}));

console.log(JSON.stringify({ snapshot, errors, failed }, null, 2));
await browser.close();
