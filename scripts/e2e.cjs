// End to end in Chromium against a running build and the Firebase emulators, with the AI routes stubbed.
// npx firebase emulators:start --only auth,database (database.rules.json), npm run build && npm start, then: node scripts/e2e.cjs http://127.0.0.1:3000
const { chromium } = require('playwright');
const OUT = process.env.SHOTS || require('os').tmpdir();
const BASE = process.argv[2] || 'http://127.0.0.1:3000';
const box = (id, name, x, color) => ({ id, name, purpose: "Test part", attachesTo: [], material: "PLA", color, finish: "matte", visible: true, position: [x, 0, 0], rotation: [0, 0, 0],
  params: { w: { value: 20, min: 5, max: 60, unit: "mm", source: "researched", factId: "f1" }, h: { value: 10, min: 2, max: 40, unit: "mm", source: "estimated" } },
  shape: { type: "subtract", children: [{ type: "box", w: "w", d: 20, h: "h" }, { type: "cylinder", d: 4, h: "h + 1" }] } });
const project = (id) => ({ v: 1, id, name: "Phone stand", description: "A phone stand", brief: "for my desk", research: [{ id: "f1", text: "Phones are about 75 mm wide", url: "https://example.com/phones", title: "Phone sizes" }],
  parts: [box("base", "Base", 0, "#d9a441"), box("back", "Back rest", 30, "#4a7bd6")], createdAt: 1, updatedAt: 1 });
async function stub(page) {
  await page.route(u => /(googleapis|gstatic|firebaseapp)\.com$|firebaseio\.com$/.test(new URL(u).hostname), r => r.abort());
  await page.route('**/api/design', async r => {
    const body = JSON.parse(r.request().postData());
    const lines = [{ step: "Planning the research" }, { step: "Searching “phone stand angle”" }, { label: "DeepSeek V3.1" }, { step: "Designing every part" }, { project: project(body.id) }];
    await r.fulfill({ status: 200, contentType: 'application/x-ndjson', body: lines.map(l => JSON.stringify(l)).join("\n") + "\n" });
  });
  await page.route('**/api/edit', async r => {
    const body = JSON.parse(r.request().postData());
    await r.fulfill({ json: { changes: [{ op: "set_param", part: body.selected || "base", name: "w", value: 30 }], message: "Made it 30 mm wide.", label: "DeepSeek V3.1", project: body.project } });
  });
  await page.route('**/api/realistic', r => r.fulfill({ status: 502, json: { error: "TRELLIS answered 500 (NVIDIA's 3D service is having trouble; try again later)." } }));
}
(async () => {
  const browser = await chromium.launch({ args: ['--use-gl=angle', '--use-angle=swiftshader', '--enable-unsafe-swiftshader'] });
  const errs = [];
  const ctx = await browser.newContext({ viewport: { width: 1440, height: 900 } });
  const page = await ctx.newPage();
  page.on('pageerror', e => errs.push('PAGEERROR ' + e.message));
  await stub(page);
  await page.goto(BASE + '/?emulators=1');
  await page.getByLabel("What are you building?").fill("A phone stand for my desk");
  await page.getByRole('button', { name: 'Research and design it' }).click();
  await page.getByRole('button', { name: 'New here? Create an account' }).click();
  const email = "maker" + Date.now() + "@example.com";
  const dlg = page.getByRole('dialog'); await dlg.getByLabel('Name', { exact: true }).fill('Test Maker'); await dlg.getByLabel('Email').fill(email); await dlg.getByLabel('Password').fill('secret123');
  await page.getByRole('button', { name: 'Create account' }).click();
  await page.waitForTimeout(2500);
  if (await page.getByRole('dialog').count()) { console.log('DIALOG:', (await page.getByRole('dialog').innerText()).replace(/\n/g, ' | ')); }
  console.log('signed in:', await page.getByText(email).count() === 1);
  await page.getByRole('button', { name: 'Research and design it' }).click();
  await page.waitForURL(/\/p\//, { timeout: 20000 });
  const url = page.url(); const id = url.split('/p/')[1].split(/[?#]/)[0];
  await page.waitForTimeout(3000);
  console.log('designed project page:', url, '| parts listed:', await page.locator('aside li').count());
  // research tab
  await page.getByRole('tab', { name: 'Research' }).click();
  console.log('research shows fact:', await page.getByText('Phones are about 75 mm wide').count() === 1);
  // select and ask AI
  await page.getByRole('button', { name: 'Base', exact: true }).click();
  await page.getByRole('tab', { name: 'Ask AI' }).click();
  await page.getByLabel('Ask the AI').fill('make it 30 mm wide'); await page.getByRole('button', { name: 'Send' }).click();
  await page.waitForTimeout(1500);
  console.log('AI reply:', await page.getByText(/Made it 30 mm wide/).count() === 1);
  await page.getByRole('tab', { name: 'Part' }).click();
  console.log('w now:', await page.getByLabel('w', { exact: true }).inputValue());
  // realistic failure is explained
  await page.getByRole('button', { name: 'Make it look real' }).click();
  await page.waitForTimeout(1500);
  console.log('realistic error shown:', await page.getByText(/TRELLIS answered 500/).count() >= 1);
  // undo goes back to 20
  await page.locator('body').click({ position: { x: 700, y: 400 } }).catch(() => {});
  await page.keyboard.press('Control+z'); await page.waitForTimeout(500);
  await page.getByRole('button', { name: 'Base', exact: true }).click(); await page.waitForTimeout(300);
  console.log('after undo w:', await page.getByLabel('w', { exact: true }).inputValue());
  // share
  await page.getByRole('button', { name: 'Share' }).click();
  await page.getByText('Anyone with the link can view and download').click();
  await page.waitForTimeout(2500);
  console.log('share link field:', (await page.locator('input[readonly]').first().inputValue()).endsWith('/p/' + id));
  await page.screenshot({ path: OUT + '/share.png' });
  await page.getByRole('button', { name: 'Done' }).click();
  // a stranger, signed out
  const ctx2 = await browser.newContext({ viewport: { width: 900, height: 600 } });
  const p2 = await ctx2.newPage(); await stub(p2);
  p2.on('pageerror', e => errs.push('PAGEERROR(view) ' + e.message));
  await p2.goto(BASE + '/p/' + id + '/view?emulators=1'); await p2.waitForTimeout(5000);
  console.log('embed view shows name:', await p2.getByText('Phone stand ↗').count() === 1);
  await p2.screenshot({ path: OUT + '/embed.png' });
  await p2.goto(BASE + '/p/' + id + '?emulators=1'); await p2.waitForTimeout(4000);
  console.log('stranger sees view only bar:', await p2.getByText('Shared with you · view only').count() === 1, '| no Share button:', await p2.getByRole('button', { name: 'Share' }).count() === 0);
  // unshare → stranger refused
  await page.getByRole('button', { name: 'Share' }).click();
  await page.getByText('Anyone with the link can view and download').click(); await page.waitForTimeout(2500);
  const p3 = await (await browser.newContext()).newPage(); await stub(p3);
  await p3.goto(BASE + '/p/' + id + '/view?emulators=1'); await p3.waitForTimeout(4000);
  console.log('unshared is refused:', (await p3.locator('body').innerText()).slice(0, 120).replace(/\n/g, ' '));
  console.log(errs.slice(0, 8).join('\n') || 'no page errors');
  await browser.close();
})().catch(e => { console.error('FAILED', e.message); process.exit(1); });
