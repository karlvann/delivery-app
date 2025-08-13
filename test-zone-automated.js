const puppeteer = require('puppeteer');

async function testZoneDetection() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();
  
  console.log('Starting zone detection tests...\n');
  
  // Enable console logging
  page.on('console', msg => {
    const text = msg.text();
    if (text.includes('Zone') || text.includes('zone') || text.includes('postcode') || text.includes('Error')) {
      console.log('Page console:', text);
    }
  });
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:5180', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Test 1: Sydney CBD address
    console.log('Test 1: Testing Sydney CBD address (should be Eastern zone)');
    console.log('Address: 123 George Street, Sydney NSW 2000\n');
    
    // Find and clear the input field
    const addressInput = await page.waitForSelector('input[placeholder*="delivery address"]', { timeout: 5000 });
    
    // Type the address slowly to trigger autocomplete
    await addressInput.click({ clickCount: 3 }); // Select all
    await addressInput.type('123 George Street, Sydney NSW 2000', { delay: 50 });
    
    // Wait for autocomplete dropdown to appear
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to find and click the first autocomplete option
    const firstOption = await page.$('button[class*="hover:bg-blue-50"]');
    if (firstOption) {
      console.log('Clicking autocomplete option...');
      await firstOption.click();
    } else {
      console.log('No autocomplete option found, pressing Enter...');
      await page.keyboard.press('Enter');
    }
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check if zone info appears
    const zoneInfo1 = await page.evaluate(() => {
      // Look for the blue info box
      const blueBoxes = document.querySelectorAll('.bg-blue-50');
      for (const box of blueBoxes) {
        const text = box.textContent || '';
        if (text.includes('zone') || text.includes('Zone')) {
          return text;
        }
      }
      
      // Also check for any text containing zone
      const allText = document.body.textContent || '';
      const zoneMatch = allText.match(/(\w+)\s+zone/i);
      if (zoneMatch) {
        return `Found zone: ${zoneMatch[0]}`;
      }
      
      return 'No zone information found';
    });
    
    console.log('Zone detection result:', zoneInfo1);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'zone-test-sydney.png',
      fullPage: false 
    });
    console.log('Screenshot saved: zone-test-sydney.png\n');
    
    // Test 2: Parramatta address
    console.log('Test 2: Testing Parramatta address (should be Western zone)');
    console.log('Address: 1 Parramatta Road, Parramatta NSW 2150\n');
    
    // Clear and type the second address
    await addressInput.click({ clickCount: 3 }); // Select all
    await addressInput.type('1 Parramatta Road, Parramatta NSW 2150', { delay: 50 });
    
    // Wait for autocomplete
    await new Promise(resolve => setTimeout(resolve, 2000));
    
    // Try to click first option again
    const secondOption = await page.$('button[class*="hover:bg-blue-50"]');
    if (secondOption) {
      console.log('Clicking autocomplete option...');
      await secondOption.click();
    } else {
      console.log('No autocomplete option found, pressing Enter...');
      await page.keyboard.press('Enter');
    }
    
    // Wait for processing
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Check for zone info
    const zoneInfo2 = await page.evaluate(() => {
      // Look for the blue info box
      const blueBoxes = document.querySelectorAll('.bg-blue-50');
      for (const box of blueBoxes) {
        const text = box.textContent || '';
        if (text.includes('zone') || text.includes('Zone')) {
          return text;
        }
      }
      
      // Also check for any text containing zone
      const allText = document.body.textContent || '';
      const zoneMatch = allText.match(/(\w+)\s+zone/i);
      if (zoneMatch) {
        return `Found zone: ${zoneMatch[0]}`;
      }
      
      return 'No zone information found';
    });
    
    console.log('Zone detection result:', zoneInfo2);
    
    // Take screenshot
    await page.screenshot({ 
      path: 'zone-test-parramatta.png',
      fullPage: false 
    });
    console.log('Screenshot saved: zone-test-parramatta.png\n');
    
    // Summary
    console.log('=== TEST SUMMARY ===');
    console.log('Test 1 (Sydney CBD - 2000):', 
      zoneInfo1.toLowerCase().includes('eastern') ? '✅ PASS - Eastern zone detected' : 
      zoneInfo1.toLowerCase().includes('zone') ? `⚠️ PARTIAL - Zone detected but not Eastern: ${zoneInfo1}` :
      '❌ FAIL - No zone detected');
    
    console.log('Test 2 (Parramatta - 2150):', 
      zoneInfo2.toLowerCase().includes('western') ? '✅ PASS - Western zone detected' : 
      zoneInfo2.toLowerCase().includes('zone') ? `⚠️ PARTIAL - Zone detected but not Western: ${zoneInfo2}` :
      '❌ FAIL - No zone detected');
    
  } catch (error) {
    console.error('Test failed:', error);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
  }
}

testZoneDetection();