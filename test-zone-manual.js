const puppeteer = require('puppeteer');

(async () => {
  console.log('Starting manual zone detection test...');
  console.log('This test will open a browser window for you to interact with manually.');
  
  const browser = await puppeteer.launch({ 
    headless: false,
    devtools: true,
    args: ['--no-sandbox', '--disable-setuid-sandbox']
  });
  
  const page = await browser.newPage();
  
  // Capture all console logs
  const zoneLogs = [];
  page.on('console', async msg => {
    const text = msg.text();
    
    // Capture zone-related logs
    if (text.includes('ZONE') || text.includes('zone') || text.includes('Zone') || 
        text.includes('Eastern') || text.includes('Western') || 
        text.includes('Northern') || text.includes('Southern') ||
        text.includes('🔥')) {
      zoneLogs.push({
        type: msg.type(),
        text: text,
        time: new Date().toISOString()
      });
      console.log(`[${msg.type().toUpperCase()}]: ${text}`);
    }
  });
  
  page.on('pageerror', error => {
    console.log(`[PAGE ERROR]: ${error.message}`);
  });

  console.log('Navigating to http://localhost:5180...');
  
  try {
    await page.goto('http://localhost:5180', { 
      waitUntil: 'networkidle0',
      timeout: 60000 
    });
    
    console.log('\n=== BROWSER OPENED ===');
    console.log('Please manually:');
    console.log('1. Click on the address input field');
    console.log('2. Type: 123 George Street, Sydney NSW 2000');
    console.log('3. Select the address from the dropdown');
    console.log('4. Press Enter in this terminal when done\n');
    
    // Wait for user input
    await new Promise(resolve => {
      process.stdin.once('data', resolve);
    });
    
    console.log('\n=== ANALYZING RESULTS ===');
    
    // Take a screenshot
    await page.screenshot({ 
      path: 'zone-detection-manual.png',
      fullPage: true 
    });
    
    // Get the current state
    const results = await page.evaluate(() => {
      // Get address input value
      const inputs = document.querySelectorAll('input[type="text"]');
      let addressValue = '';
      inputs.forEach(input => {
        if (input.value && input.value.includes('Sydney')) {
          addressValue = input.value;
        }
      });
      
      // Get all text content from blue info boxes
      const blueBoxes = Array.from(document.querySelectorAll('.bg-blue-50, .bg-blue-100, [class*="blue"]'))
        .map(el => el.innerText?.trim())
        .filter(Boolean);
      
      // Get delivery options
      const deliveryOptions = Array.from(document.querySelectorAll('input[type="radio"]'))
        .map(radio => ({
          value: radio.value,
          checked: radio.checked,
          label: radio.parentElement?.innerText?.trim() || ''
        }));
      
      // Look for zone information anywhere
      const bodyText = document.body.innerText;
      const zoneMatches = bodyText.match(/(Eastern|Western|Northern|Southern|Central)\s*(Sydney\s*)?(zone)?/gi) || [];
      
      // Check for any elements with zone-related classes or IDs
      const zoneElements = Array.from(document.querySelectorAll('[class*="zone" i], [id*="zone" i]'))
        .map(el => ({
          tag: el.tagName,
          className: el.className,
          text: el.innerText?.trim()?.substring(0, 100)
        }));
      
      return {
        addressValue,
        blueBoxes,
        deliveryOptions,
        zoneMatches,
        zoneElements
      };
    });
    
    console.log('\n=== CAPTURED DATA ===');
    console.log('Address entered:', results.addressValue);
    console.log('\nBlue box content:');
    results.blueBoxes.forEach((box, i) => console.log(`  ${i + 1}. ${box}`));
    
    console.log('\nDelivery options:');
    results.deliveryOptions.forEach(opt => 
      console.log(`  - ${opt.label} (value: ${opt.value}, checked: ${opt.checked})`)
    );
    
    console.log('\nZone matches found in text:', results.zoneMatches);
    
    console.log('\nElements with zone-related classes:');
    results.zoneElements.forEach(el => 
      console.log(`  - <${el.tag}> class="${el.className}" text="${el.text}"`)
    );
    
    console.log('\n=== CONSOLE LOGS CAPTURED ===');
    if (zoneLogs.length > 0) {
      console.log(`Found ${zoneLogs.length} zone-related console logs:`);
      zoneLogs.forEach((log, i) => {
        console.log(`\n${i + 1}. [${log.type}] at ${log.time}:`);
        console.log(`   ${log.text}`);
      });
    } else {
      console.log('No zone-related console logs were captured.');
    }
    
    console.log('\n=== TEST COMPLETE ===');
    console.log('Screenshot saved as zone-detection-manual.png');
    console.log('\nSUMMARY:');
    console.log(`- Zone detected in UI: ${results.zoneMatches.length > 0 ? 'YES - ' + results.zoneMatches.join(', ') : 'NO'}}`);
    console.log(`- Zone logs in console: ${zoneLogs.length > 0 ? 'YES - ' + zoneLogs.length + ' logs' : 'NO'}`);
    console.log(`- Address selected: ${results.addressValue ? 'YES' : 'NO'}`);
    
    console.log('\nBrowser will remain open. Press Ctrl+C to close.');
    
  } catch (error) {
    console.error('Test failed:', error.message);
    await page.screenshot({ path: 'zone-detection-error.png', fullPage: true });
    console.log('Error screenshot saved as zone-detection-error.png');
  }
  
})();