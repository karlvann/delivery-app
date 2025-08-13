const puppeteer = require('puppeteer');

(async () => {
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  const page = await browser.newPage();
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('ZONE DETECTION') || text.includes('Zone') || text.includes('zone')) {
      console.log(`[CONSOLE]: ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]: ${error.message}`);
  });

  await page.goto('http://localhost:5180', { waitUntil: 'networkidle0' });
  
  // Wait for the page to load
  await page.waitForSelector('input[placeholder*="address"]', { timeout: 10000 });
  
  console.log('Page loaded, starting test...');
  
  // Click on the address input to focus it
  const inputSelector = 'input[placeholder*="address"]';
  await page.click(inputSelector);
  
  // Type the address slowly to trigger autocomplete
  await page.type(inputSelector, '123 George Street, Sydney NSW 2000', { delay: 100 });
  
  // Wait for autocomplete suggestions to appear
  await page.waitForSelector('.pac-item', { timeout: 5000 });
  
  console.log('Autocomplete suggestions appeared');
  
  // Click the first suggestion
  await page.click('.pac-item:first-child');
  
  // Wait a bit for the selection to process
  await page.waitForTimeout(2000);
  
  // Take a screenshot of the full page
  await page.screenshot({ 
    path: 'zone-detection-test.png',
    fullPage: true 
  });
  
  // Check for the zone display in the blue info box
  const zoneInfo = await page.evaluate(() => {
    // Look for any element containing zone information
    const infoBoxes = document.querySelectorAll('.bg-blue-50, .bg-blue-100, [class*="blue"]');
    let zoneText = null;
    
    infoBoxes.forEach(box => {
      const text = box.textContent || '';
      if (text.toLowerCase().includes('zone') || text.includes('Eastern') || text.includes('Western') || text.includes('Northern') || text.includes('Southern')) {
        zoneText = text;
      }
    });
    
    // Also check for any zone-related elements
    const zoneElements = document.querySelectorAll('[class*="zone"], [id*="zone"]');
    const zoneTexts = Array.from(zoneElements).map(el => el.textContent);
    
    return {
      zoneText,
      zoneElements: zoneTexts,
      allBlueBoxText: Array.from(infoBoxes).map(box => box.textContent?.trim()).filter(Boolean)
    };
  });
  
  console.log('\n=== ZONE DETECTION TEST RESULTS ===');
  console.log('Zone text found:', zoneInfo.zoneText);
  console.log('Zone elements:', zoneInfo.zoneElements);
  console.log('All blue box content:', zoneInfo.allBlueBoxText);
  
  // Get the address that was selected
  const selectedAddress = await page.$eval(inputSelector, el => el.value);
  console.log('Selected address:', selectedAddress);
  
  // Check if delivery options are showing
  const deliveryOptions = await page.evaluate(() => {
    const radioButtons = document.querySelectorAll('input[type="radio"]');
    return Array.from(radioButtons).map(radio => {
      const label = radio.parentElement?.textContent || '';
      return {
        value: radio.value,
        checked: radio.checked,
        label: label.trim()
      };
    });
  });
  
  console.log('Delivery options:', deliveryOptions);
  
  console.log('\nScreenshot saved as zone-detection-test.png');
  console.log('Check browser console for debug logs...');
  
  // Keep browser open for manual inspection
  console.log('\nBrowser will stay open for inspection. Press Ctrl+C to close.');
  
})();