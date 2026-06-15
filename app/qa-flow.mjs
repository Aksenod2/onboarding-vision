import { chromium } from 'playwright';

const BASE = 'http://localhost:5174';
const consoleErrors = [];
const steps = [];
const log = (...a) => console.log(...a);

const browser = await chromium.launch();
const ctx = await browser.newContext({ viewport: { width: 1320, height: 950 } });
const page = await ctx.newPage();
page.on('console', (m) => { if (m.type() === 'error') consoleErrors.push(m.text()); });
page.on('pageerror', (e) => consoleErrors.push('PAGEERROR: ' + e.message));

const snap = (n) => page.screenshot({ path: `/tmp/qa_${n}.png`, fullPage: true }).catch(()=>{});
const bodyText = async () => (await page.locator('body').innerText());
const wait = (ms) => page.waitForTimeout(ms);
const clickBtn = async (re, label) => {
  const b = page.getByRole('button', { name: re }).first();
  await b.waitFor({ state: 'visible', timeout: 8000 });
  await b.click();
  log('CLICK', label || re);
};
const record = (id, note) => { steps.push(`${id}: url=${page.url().replace(BASE,'')} ${note||''}`); };

// type OTP into CodeField (4 separate inputs) or single field
const typeOtp = async () => {
  const ins = page.locator('input');
  const n = await ins.count();
  // CodeField = multiple small inputs at end; type 0000 sequentially into focused
  await ins.first().scrollIntoViewIfNeeded().catch(()=>{});
  // try per-input fill on last 4 inputs
  await page.keyboard.type('0000', { delay: 60 }).catch(()=>{});
  // fallback: focus each code input
  log('  typed OTP 0000 (inputs on page:', n, ')');
};

try {
  // ===== 1. LANDING =====
  await page.goto(BASE + '/v2', { waitUntil: 'networkidle' });
  await wait(400);
  const lt = await bodyText();
  record('LANDING', `defaultEN=${lt.includes('Become our customer')} hasRU=${lt.includes('Стать клиентом')}`);
  await snap('01_landing');
  // toggle RU then back EN
  await page.getByText('RU', { exact: true }).first().click().catch(()=>{});
  await wait(200);
  const ltru = await bodyText();
  log('  RU toggle -> hasСтать:', ltru.includes('Стать клиентом'));
  await snap('01b_landing_ru');
  await page.getByText('EN', { exact: true }).first().click().catch(()=>{});
  await wait(200);

  await clickBtn(/Become our customer|Стать клиентом/i, 'landing CTA');
  await wait(600);

  // ===== 2. REGISTER step1 =====
  record('REGISTER1', '');
  await snap('02_register');
  // fill email + phone
  const emailInput = page.locator('input[type="email"]').first();
  if (await emailInput.count()) await emailInput.fill('demo@demo.in');
  const phoneInput = page.locator('input').nth(1);
  await phoneInput.click().catch(()=>{});
  await page.keyboard.type('98765 43210', { delay: 20 }).catch(()=>{});
  await clickBtn(/Continue|Продолжить/i, 'register send code');
  await wait(700);

  // ===== EMAIL screen =====
  record('EMAIL', '');
  await snap('03_email');
  await clickBtn(/Confirm email and continue|Подтвердить email/i, 'email confirm');
  await wait(700);

  // ===== REGISTER step2 OTP =====
  record('OTP', '');
  await snap('04_otp');
  await typeOtp();
  await wait(1200);
  record('AFTER-OTP', '(expect /v2/pan)');
  log('  after OTP url:', page.url());

  // ===== 3. PAN (step1) =====
  await snap('05_pan');
  let bt = await bodyText();
  record('PAN', `hasConsent=${/реестр|registr/i.test(bt)}`);
  // CTA should be disabled before consent
  const panCta = page.getByRole('button', { name: /Allow and continue|Разрешить и продолжить/i }).first();
  const panDisabledBefore = await panCta.isDisabled().catch(()=>'?');
  log('  PAN CTA disabled before consent:', panDisabledBefore);
  // fill PAN
  await page.locator('input').first().fill('ABFPS4321K');
  // check consent checkbox
  await page.locator('input[type="checkbox"]').first().check().catch(async()=>{
    await page.locator('label').filter({ hasText: /реестр|registr|consent|соглас/i }).first().click().catch(()=>{});
  });
  await wait(200);
  const panDisabledAfter = await panCta.isDisabled().catch(()=>'?');
  log('  PAN CTA disabled after consent:', panDisabledAfter);
  await snap('05b_pan_filled');
  await panCta.click();
  log('CLICK PAN allow&continue');
  await wait(3200); // verifying ~2.4s then auto-nav
  record('AFTER-PAN', '(expect /v2/aadhaar-qr)');
  log('  after PAN url:', page.url());

  // ===== 4. AADHAAR =====
  await snap('06_aadhaar');
  bt = await bodyText();
  record('AADHAAR', `hasAadhaar=${/aadhaar/i.test(bt)}`);
  const scanBtn = page.getByRole('button', { name: /I have scanned the code|Я отсканировал/i }).first();
  const scanDisabledBefore = await scanBtn.isDisabled().catch(()=>'?');
  log('  AADHAAR scan btn disabled before consent:', scanDisabledBefore);
  await page.locator('input[type="checkbox"]').first().check().catch(()=>{});
  await wait(200);
  const scanDisabledAfter = await scanBtn.isDisabled().catch(()=>'?');
  log('  AADHAAR scan btn disabled after consent:', scanDisabledAfter);
  await scanBtn.click();
  log('CLICK aadhaar scanned');
  await wait(2600); // waiting ~2s -> success
  await snap('06b_aadhaar_success');
  bt = await bodyText();
  log('  AADHAAR success text present:', /verified by UIDAI|подтверждена UIDAI/i.test(bt));
  await clickBtn(/Continue to questionnaire|Продолжить к анкете/i, 'aadhaar continue');
  await wait(700);
  record('AFTER-AADHAAR', '(expect /v2/bnq)');
  log('  after Aadhaar url:', page.url());

  // ===== 5. BNQ questionnaire =====
  await snap('07_bnq');
  // answer questions: click first option then Next, loop until leaves bnq
  let guard = 0;
  while (page.url().includes('/v2/bnq') && guard < 20) {
    guard++;
    // pick a selectable option if present (radio-like buttons)
    const opt = page.locator('button').filter({ hasText: /^(No|Yes|Нет|Да|India|Resident|Индия|Резидент)/i }).first();
    if (await opt.count()) { await opt.click().catch(()=>{}); await wait(150); }
    const next = page.getByRole('button', { name: /^(Next|Далее|Continue|Продолжить|Confirm|Подтвердить|Finish|Submit|Готово)$/i }).first();
    if (await next.count() && await next.isVisible().catch(()=>false)) {
      const dis = await next.isDisabled().catch(()=>false);
      if (!dis) { await next.click(); await wait(300); continue; }
    }
    // try any visible accent button to advance
    const anyNext = page.getByRole('button', { name: /Next|Далее|Continue|Продолжить|Submit|Finish/i }).first();
    if (await anyNext.count() && !(await anyNext.isDisabled().catch(()=>true))) { await anyNext.click(); await wait(300); }
    else break;
  }
  record('AFTER-BNQ', `guard=${guard} (expect /v2/data-consents)`);
  await snap('07b_after_bnq');
  log('  after BNQ url:', page.url());

  // ===== 6. DATA CONSENTS =====
  if (page.url().includes('data-consents')) {
    await snap('08_dataconsents');
    bt = await bodyText();
    record('DATACONSENTS', `present=${/Data Principals|субъект/i.test(bt)}`);
    // check both
    const cbs = page.locator('input[type="checkbox"]');
    const cn = await cbs.count();
    for (let i=0;i<cn;i++) await cbs.nth(i).check().catch(()=>{});
    await wait(200);
    await clickBtn(/Continue|Продолжить/i, 'data-consents continue');
    await wait(700);
    record('AFTER-DATACONSENTS', '(expect /v2/company)');
    log('  after data-consents url:', page.url());
  } else {
    record('DATACONSENTS', 'SKIPPED - not reached');
  }

  // ===== 7. COMPANY =====
  if (page.url().includes('/v2/company')) {
    await snap('09_company');
    record('COMPANY', '');
    await clickBtn(/Continue|Продолжить|Confirm|Подтвердить|Next|Далее|Proceed/i, 'company confirm');
    await wait(700);
    record('AFTER-COMPANY', '(expect /v2/pre-vcip)');
    log('  after company url:', page.url());
  } else { record('COMPANY','not at company, url='+page.url()); }

  // ===== 8. PRE-VCIP =====
  if (page.url().includes('pre-vcip')) {
    await snap('10_prevcip');
    bt = await bodyText();
    record('PREVCIP', `vkycOnly=${/VKYC|видеоидентификации/i.test(bt)} hasAadhaarConsent=${/Aadhaar/i.test(bt)} hasAccuracy=${/accuracy|достоверн/i.test(bt)}`);
    const proceed = page.getByRole('button', { name: /Proceed to video|Перейти к видео/i }).first();
    const pvDisBefore = await proceed.isDisabled().catch(()=>'?');
    log('  PREVCIP proceed disabled before consent:', pvDisBefore);
    await page.locator('input[type="checkbox"]').first().check().catch(()=>{});
    await wait(200);
    const pvDisAfter = await proceed.isDisabled().catch(()=>'?');
    log('  PREVCIP proceed disabled after consent:', pvDisAfter);
    await proceed.click();
    log('CLICK pre-vcip proceed');
    await wait(800);
    record('AFTER-PREVCIP', '(expect /v2/vcip)');
    log('  after pre-vcip url:', page.url());
  } else { record('PREVCIP','not reached url='+page.url()); }

  // ===== 9. VCIP =====
  if (page.url().includes('/v2/vcip')) {
    await snap('11_vcip');
    bt = await bodyText();
    // check back-link absence + progress jump lock
    const hasResume = /resume|возобнов/i.test(bt);
    record('VCIP', `hasResume=${hasResume}`);
    // check progress segments disabled (jump lock)
    const segs = page.locator('button[title]');
    log('  vcip: starting identification');
    await clickBtn(/Start Video Identification|Начать видеоидентификацию/i, 'vcip start');
    await wait(1000);
    await snap('11b_vcip_running');
    // The vcip likely auto-progresses; wait then click continue if present
    let g2=0;
    while (g2<30 && page.url().includes('/v2/vcip')) {
      g2++;
      const cont = page.getByRole('button', { name: /Continue to signing|Продолжить к подписанию/i }).first();
      if (await cont.count() && await cont.isVisible().catch(()=>false) && !(await cont.isDisabled().catch(()=>true))) {
        await cont.click(); log('CLICK vcip continue->sign'); break;
      }
      await wait(1000);
    }
    record('AFTER-VCIP', `waited=${g2}s (expect /v2/sign)`);
    log('  after vcip url:', page.url());
  } else { record('VCIP','not reached url='+page.url()); }

  // ===== 10. SIGN =====
  if (page.url().includes('/v2/sign')) {
    await snap('12_sign');
    bt = await bodyText();
    record('SIGN', `hasAccuracy=${/accuracy|достоверн/i.test(bt)}`);
    const auth = page.getByRole('button', { name: /Sign by OTP|Подписать по OTP/i }).first();
    const signDisBefore = await auth.isDisabled().catch(()=>'?');
    log('  SIGN authorize disabled before accuracy:', signDisBefore);
    await page.locator('input[type="checkbox"]').first().check().catch(()=>{});
    await wait(200);
    const signDisAfter = await auth.isDisabled().catch(()=>'?');
    log('  SIGN authorize disabled after accuracy:', signDisAfter);
    await auth.click();
    log('CLICK sign authorize');
    await wait(500);
    await snap('12b_sign_otp');
    await typeOtp();
    await wait(1500);
    await snap('12c_sign_done');
    bt = await bodyText();
    record('SIGN-DONE', `success=${/All Done|Готово/i.test(bt)}`);
    log('  sign done text present:', /All Done|Готово/i.test(bt));
    // go to dashboard
    await clickBtn(/Go to application dashboard|К дашборду/i, 'to dashboard');
    await wait(800);
  } else { record('SIGN','not reached url='+page.url()); }

  // ===== 11. DASHBOARD =====
  await snap('13_dashboard');
  bt = await bodyText();
  record('DASHBOARD', `verifying=${/verif|провер/i.test(bt)}`);
  log('  dashboard url:', page.url());

  // ===== language toggle spot-check on a step (pan) =====
  await page.goto(BASE + '/v2/aadhaar-qr', { waitUntil:'networkidle' });
  await wait(400);
  // try toggle via header lang switch if present
  const ruBtn = page.getByText('RU', { exact:true }).first();
  if (await ruBtn.count()) { await ruBtn.click().catch(()=>{}); await wait(300); }
  await snap('14_aadhaar_ru');
  bt = await bodyText();
  log('  aadhaar RU has Cyrillic:', /[а-яА-Я]/.test(bt), '| any latin-only leftover words:', (bt.match(/\b(Continue|Back|Consent|Scan)\b/g)||[]).join(','));

} catch (e) {
  log('FATAL:', e.message);
  await snap('zz_fatal');
}

await snap('zz_last');
log('\n===== STEP TRACE =====');
steps.forEach(s=>log(' ', s));
log('\n===== CONSOLE ERRORS =====');
log(consoleErrors.length ? consoleErrors.join('\n') : '(none)');
await browser.close();
