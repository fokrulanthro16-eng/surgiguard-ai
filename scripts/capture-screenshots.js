const puppeteer = require('puppeteer');
const path = require('path');
const fs = require('fs');

async function captureScreenshots() {
  const screenshotsDir = path.join(__dirname, '..', 'docs', 'screenshots');
  if (!fs.existsSync(screenshotsDir)) {
    fs.mkdirSync(screenshotsDir, { recursive: true });
  }

  console.log('Launching headless browser...');
  const browser = await puppeteer.launch({
    headless: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
  });

  const page = await browser.newPage();
  await page.setViewport({ width: 1440, height: 900, deviceScaleFactor: 2 });

  console.log('Navigating to http://localhost:3000...');
  await page.goto('http://localhost:3000', { waitUntil: 'networkidle0', timeout: 30000 });
  await new Promise((resolve) => setTimeout(resolve, 2000));

  // 1. Nominal Cleared GO
  console.log('Capturing 01-nominal-cleared-go.png...');
  await page.evaluate(() => window.scrollTo(0, 0));
  await new Promise((resolve) => setTimeout(resolve, 1000));
  await page.screenshot({
    path: path.join(screenshotsDir, '01-nominal-cleared-go.png'),
    fullPage: false,
  });

  // 2. Discrepancy Hazard HOLD (Scenario B)
  console.log('Selecting Scenario B...');
  const scenarioBClicked = await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const btn = buttons.find((b) => b.textContent && b.textContent.includes('Scenario B'));
    if (btn) {
      btn.click();
      return true;
    }
    return false;
  });

  if (scenarioBClicked) {
    await new Promise((resolve) => setTimeout(resolve, 1500));
  }
  console.log('Capturing 02-discrepancy-hazard-hold.png...');
  await page.screenshot({
    path: path.join(screenshotsDir, '02-discrepancy-hazard-hold.png'),
    fullPage: false,
  });

  // 3. Gravimetric Telemetry Widget
  console.log('Scrolling to Gravimetric Telemetry Widget...');
  await page.evaluate(() => {
    window.scrollTo(0, 450);
  });
  await new Promise((resolve) => setTimeout(resolve, 1200));
  console.log('Capturing 03-gravimetric-telemetry.png...');
  await page.screenshot({
    path: path.join(screenshotsDir, '03-gravimetric-telemetry.png'),
    fullPage: false,
  });

  // 4. SHA-256 Tamper Simulation
  console.log('Triggering Simulate Malicious Tamper in Audit Blackbox...');
  await page.evaluate(() => {
    window.scrollTo(0, 750);
  });
  await new Promise((resolve) => setTimeout(resolve, 800));

  await page.evaluate(() => {
    const buttons = Array.from(document.querySelectorAll('button'));
    const tamperBtn = buttons.find(
      (b) => b.textContent && b.textContent.toLowerCase().includes('simulate malicious tamper')
    );
    if (tamperBtn) {
      tamperBtn.click();
    }
  });

  await new Promise((resolve) => setTimeout(resolve, 1500));
  console.log('Capturing 04-sha256-audit-tamper.png...');
  await page.screenshot({
    path: path.join(screenshotsDir, '04-sha256-audit-tamper.png'),
    fullPage: false,
  });

  await browser.close();
  console.log('All 4 high-resolution screenshots captured successfully in docs/screenshots/!');
}

captureScreenshots().catch((err) => {
  console.error('Error capturing screenshots:', err);
  process.exit(1);
});
