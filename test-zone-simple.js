const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting zone detection test...');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture all console logs
  const consoleLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    consoleLogs.push(text);
    // Show zone-related logs immediately
    if (text.includes('ZONE') || text.includes('zone') || text.includes('Zone') || 
        text.includes('Eastern') || text.includes('Western') || 
        text.includes('Northern') || text.includes('Southern')) {
      console.log(`[CONSOLE LOG]: ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]: ${error.message}`);
  });

  console.log('Navigating to http://localhost:5180...');
  
  try {
    // Navigate with longer timeout and wait for client-side rendering
    await page.goto('http://localhost:5180', { 
      waitUntil: 'domcontentloaded',
      timeout: 60000 
    });
    
    console.log('Page loaded, waiting for client-side hydration...');
    
    // Wait for the app to fully hydrate
    await new Promise(resolve => setTimeout(resolve, 5000));
    
    // Wait for the address input to be available
    const inputSelector = 'input[placeholder*="address" i], input[placeholder*="delivery" i], input[type="text"]';
    await page.waitForSelector(inputSelector, { timeout: 30000 });
    
    console.log('Address input found, typing address...');
    
    // Clear and type the address
    await page.click(inputSelector);
    await page.keyboard.down('Control');
    await page.keyboard.press('A');
    await page.keyboard.up('Control');
    await page.keyboard.press('Backspace');
    
    // Type the address
    await page.type(inputSelector, '123 George Street, Sydney NSW 2000', { delay: 150 });
    
    console.log('Waiting for autocomplete suggestions...');
    
    // Wait for Google Places autocomplete
    await page.waitForSelector('.pac-container .pac-item', { 
      visible: true, 
      timeout: 10000 
    });
    
    console.log('Autocomplete suggestions appeared, selecting first option...');
    
    // Click the first suggestion
    await page.keyboard.press('ArrowDown');
    await page.keyboard.press('Enter');
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    console.log('\n=== CAPTURING FINAL STATE ===');
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'zone-detection-final.png',
      fullPage: true 
    });
    
    // Get the selected address
    const selectedAddress = await page.$eval(inputSelector, el => el.value);
    console.log('Selected address:', selectedAddress);
    
    // Check for zone information in the UI
    const pageContent = await page.evaluate(() => {
      const allText = document.body.innerText;
      const blueBoxes = Array.from(document.querySelectorAll('.bg-blue-50, .bg-blue-100, [class*="blue"]'))
        .map(el => el.innerText?.trim())
        .filter(Boolean);
      
      // Look for zone-related text
      const zoneKeywords = ['zone', 'eastern', 'western', 'northern', 'southern', 'central'];
      const foundZoneText = blueBoxes.find(text => 
        zoneKeywords.some(keyword => text.toLowerCase().includes(keyword))
      );
      
      // Check for delivery options
      const deliveryOptions = Array.from(document.querySelectorAll('input[type="radio"]'))
        .map(radio => ({
          value: radio.value,
          checked: radio.checked,
          label: radio.parentElement?.innerText?.trim() || ''
        }));
      
      return {
        foundZoneText,
        blueBoxContent: blueBoxes,
        deliveryOptions,
        hasZoneInPage: zoneKeywords.some(keyword => allText.toLowerCase().includes(keyword))
      };
    });
    
    console.log('\n=== TEST RESULTS ===');
    console.log('Zone text found:', pageContent.foundZoneText || 'NOT FOUND');
    console.log('Blue box content:', pageContent.blueBoxContent);
    console.log('Has zone keyword anywhere on page:', pageContent.hasZoneInPage);
    console.log('Delivery options:', pageContent.deliveryOptions);
    
    console.log('\n=== CONSOLE LOGS WITH ZONE KEYWORDS ===');
    const zoneLogs = consoleLogs.filter(log => 
      log.includes('ZONE') || log.includes('zone') || log.includes('Zone') ||
      log.includes('Eastern') || log.includes('Western') || 
      log.includes('Northern') || log.includes('Southern')
    );
    
    if (zoneLogs.length > 0) {
      zoneLogs.forEach(log => console.log(log));
    } else {
      console.log('No zone-related console logs found');
    }
    
    console.log('\nScreenshot saved as zone-detection-final.png');
    console.log('Browser will remain open for manual inspection. Press Ctrl+C to close.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'zone-detection-error.png', fullPage: true });
    console.log('Error screenshot saved as zone-detection-error.png');
  }
  
})();