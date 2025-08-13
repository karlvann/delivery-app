const puppeteer = require('puppeteer');

async function delay(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}

(async () => {
  console.log('🔥 GORDON\'S COMPREHENSIVE ZONE DETECTION TEST');
  console.log('============================================\n');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox'],
    defaultViewport: { width: 1400, height: 900 }
  });
  
  const page = await browser.newPage();
  
  // Capture ALL console logs
  const allLogs = [];
  page.on('console', msg => {
    const text = msg.text();
    const type = msg.type();
    allLogs.push({ type, text, time: new Date().toISOString() });
    
    // Show important logs immediately
    if (text.includes('🔥') || text.includes('ZONE') || text.includes('zone') || 
        text.includes('Eastern') || text.includes('Western') || 
        text.includes('Northern') || text.includes('Southern') ||
        text.includes('postcode') || text.includes('2000')) {
      console.log(`[CONSOLE ${type.toUpperCase()}]: ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]: ${error.message}`);
  });

  console.log('Loading http://localhost:5180...');
  
  try {
    await page.goto('http://localhost:5180', { 
      waitUntil: 'networkidle2',
      timeout: 30000 
    });
    
    console.log('✅ Page loaded successfully\n');
    
    // Wait for React to hydrate
    console.log('Waiting for React hydration...');
    await delay(3000);
    
    // Find the address input
    console.log('Looking for address input field...');
    const inputSelector = 'input[placeholder*="delivery address" i]';
    
    await page.waitForSelector(inputSelector, { timeout: 10000 });
    console.log('✅ Found address input\n');
    
    // Click to focus
    await page.click(inputSelector);
    await delay(500);
    
    // Clear any existing text
    await page.evaluate((selector) => {
      const input = document.querySelector(selector);
      if (input) input.value = '';
    }, inputSelector);
    
    // Type the address character by character
    console.log('Typing address: 123 George Street, Sydney NSW 2000');
    const address = '123 George Street, Sydney NSW 2000';
    
    for (const char of address) {
      await page.keyboard.type(char);
      await delay(50); // Slow typing to trigger autocomplete
    }
    
    console.log('Waiting for Google Places autocomplete...');
    await delay(2000);
    
    // Check if pac-container exists
    const hasAutocomplete = await page.evaluate(() => {
      const pacContainer = document.querySelector('.pac-container');
      return pacContainer && pacContainer.style.display !== 'none';
    });
    
    if (hasAutocomplete) {
      console.log('✅ Autocomplete dropdown appeared');
      
      // Select first suggestion using arrow key
      await page.keyboard.press('ArrowDown');
      await delay(500);
      await page.keyboard.press('Enter');
      console.log('✅ Selected first autocomplete suggestion');
    } else {
      console.log('⚠️ No autocomplete dropdown - simulating manual entry');
      
      // If no autocomplete, just press Tab to trigger blur event
      await page.keyboard.press('Tab');
    }
    
    // Wait for any processing
    console.log('\nWaiting for zone detection to process...');
    await delay(3000);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'zone-test-result.png',
      fullPage: true 
    });
    
    console.log('\n============================================');
    console.log('📊 ANALYZING RESULTS');
    console.log('============================================\n');
    
    // Extract all relevant information
    const pageData = await page.evaluate(() => {
      // Get the address value
      const addressInput = document.querySelector('input[placeholder*="delivery address" i]');
      const addressValue = addressInput ? addressInput.value : '';
      
      // Look for blue info boxes
      const blueBoxes = Array.from(document.querySelectorAll('.bg-blue-50, .bg-blue-100'))
        .map(el => el.textContent?.trim())
        .filter(Boolean);
      
      // Check entire page for zone keywords
      const bodyText = document.body.textContent || '';
      const zoneKeywords = ['Eastern', 'Western', 'Northern', 'Southern', 'Central'];
      const foundZones = [];
      
      zoneKeywords.forEach(zone => {
        if (bodyText.includes(zone)) {
          // Try to get context around the zone keyword
          const index = bodyText.indexOf(zone);
          const context = bodyText.substring(Math.max(0, index - 20), Math.min(bodyText.length, index + 50));
          foundZones.push({ zone, context: context.trim() });
        }
      });
      
      // Check for delivery options
      const deliveryOptions = Array.from(document.querySelectorAll('input[type="radio"]'))
        .map(radio => {
          const label = radio.closest('label')?.textContent?.trim() || 
                       radio.parentElement?.textContent?.trim() || '';
          return {
            value: radio.value,
            checked: radio.checked,
            label: label
          };
        });
      
      // Check for any delivery type selection
      const selectedDeliveryType = document.querySelector('input[type="radio"]:checked');
      const selectedLabel = selectedDeliveryType ? 
        (selectedDeliveryType.closest('label')?.textContent?.trim() || 
         selectedDeliveryType.parentElement?.textContent?.trim()) : null;
      
      // Look for price displays
      const priceElements = Array.from(document.querySelectorAll('[class*="text-3xl"], [class*="text-2xl"], [class*="font-bold"]'))
        .filter(el => el.textContent?.includes('$'))
        .map(el => el.textContent?.trim());
      
      return {
        addressValue,
        blueBoxes,
        foundZones,
        deliveryOptions,
        selectedDeliveryType: selectedLabel,
        priceElements,
        hasZoneInPage: foundZones.length > 0
      };
    });
    
    // Display results
    console.log('📍 ADDRESS ENTERED:', pageData.addressValue || 'No address captured');
    
    console.log('\n📦 DELIVERY OPTIONS:');
    if (pageData.deliveryOptions.length > 0) {
      pageData.deliveryOptions.forEach(opt => {
        const checkmark = opt.checked ? '✅' : '⬜';
        console.log(`  ${checkmark} ${opt.label}`);
      });
      if (pageData.selectedDeliveryType) {
        console.log(`  → Selected: ${pageData.selectedDeliveryType}`);
      }
    } else {
      console.log('  No delivery options found');
    }
    
    console.log('\n🗺️ ZONE DETECTION:');
    if (pageData.foundZones.length > 0) {
      console.log('  ✅ ZONES FOUND IN PAGE:');
      pageData.foundZones.forEach(({ zone, context }) => {
        console.log(`    - ${zone} zone`);
        console.log(`      Context: "${context}"`);
      });
    } else {
      console.log('  ❌ NO ZONE INFORMATION FOUND IN UI');
    }
    
    console.log('\n💙 BLUE INFO BOXES:');
    if (pageData.blueBoxes.length > 0) {
      pageData.blueBoxes.forEach((box, i) => {
        console.log(`  ${i + 1}. ${box}`);
      });
    } else {
      console.log('  No blue info boxes found');
    }
    
    console.log('\n💰 PRICE DISPLAYS:');
    if (pageData.priceElements.length > 0) {
      pageData.priceElements.forEach(price => {
        console.log(`  - ${price}`);
      });
    } else {
      console.log('  No prices displayed');
    }
    
    console.log('\n============================================');
    console.log('🔍 CONSOLE LOG ANALYSIS');
    console.log('============================================\n');
    
    // Filter for zone-related logs
    const zoneLogs = allLogs.filter(log => 
      log.text.includes('ZONE') || log.text.includes('zone') || 
      log.text.includes('Eastern') || log.text.includes('Western') || 
      log.text.includes('Northern') || log.text.includes('Southern') ||
      log.text.includes('🔥') || log.text.includes('postcode') ||
      log.text.includes('2000')
    );
    
    if (zoneLogs.length > 0) {
      console.log(`Found ${zoneLogs.length} zone-related console logs:\n`);
      zoneLogs.forEach((log, i) => {
        console.log(`${i + 1}. [${log.type}] ${log.text}`);
      });
    } else {
      console.log('❌ No zone-related console logs captured');
      console.log('\nAll console logs:');
      allLogs.slice(0, 10).forEach(log => {
        console.log(`  [${log.type}] ${log.text.substring(0, 100)}`);
      });
    }
    
    console.log('\n============================================');
    console.log('📋 FINAL SUMMARY');
    console.log('============================================\n');
    
    const zoneDetected = pageData.hasZoneInPage || zoneLogs.some(log => 
      log.text.includes('Eastern') || log.text.includes('Western') || 
      log.text.includes('Northern') || log.text.includes('Southern')
    );
    
    console.log(`✅ Address entered: ${pageData.addressValue ? 'YES' : 'NO'}`);
    console.log(`${zoneDetected ? '✅' : '❌'} Zone detected: ${zoneDetected ? 'YES' : 'NO'}`);
    console.log(`📸 Screenshot saved: zone-test-result.png`);
    
    if (!zoneDetected) {
      console.log('\n⚠️ ZONE NOT DETECTED - POSSIBLE ISSUES:');
      console.log('  1. Zone detection code may not be running');
      console.log('  2. Console logs may be commented out');
      console.log('  3. UI may not be displaying zone information');
      console.log('  4. Postcode 2000 may not be in zone data');
    }
    
    console.log('\n🔧 Browser remains open for manual inspection.');
    console.log('Press Ctrl+C to close.\n');
    
  } catch (error) {
    console.error('❌ TEST FAILED:', error.message);
    await page.screenshot({ path: 'zone-test-error.png', fullPage: true });
    console.log('Error screenshot saved as zone-test-error.png');
  }
  
})();