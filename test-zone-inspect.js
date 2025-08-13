const puppeteer = require('puppeteer');

async function inspectPage() {
  const browser = await puppeteer.launch({ 
    headless: false,
    defaultViewport: { width: 1280, height: 800 }
  });
  const page = await browser.newPage();
  
  console.log('Inspecting page structure...\n');
  
  try {
    // Navigate to the app
    await page.goto('http://localhost:5180', { waitUntil: 'networkidle2' });
    await new Promise(resolve => setTimeout(resolve, 3000));
    
    // Get all input fields
    const inputs = await page.evaluate(() => {
      const inputs = document.querySelectorAll('input');
      return Array.from(inputs).map(input => ({
        type: input.type,
        placeholder: input.placeholder,
        className: input.className,
        id: input.id,
        name: input.name
      }));
    });
    
    console.log('Found inputs:', JSON.stringify(inputs, null, 2));
    
    // Check page content
    const hasAddressText = await page.evaluate(() => {
      const text = document.body.textContent || '';
      return {
        hasDeliveryAddress: text.includes('Delivery Address'),
        hasEnterAddress: text.includes('Enter'),
        pageTitle: document.title,
        h1Text: document.querySelector('h1')?.textContent,
        bodyClasses: document.body.className
      };
    });
    
    console.log('\nPage content:', JSON.stringify(hasAddressText, null, 2));
    
    // Take a screenshot to see what's there
    await page.screenshot({ 
      path: 'page-inspection.png',
      fullPage: true 
    });
    console.log('\nScreenshot saved: page-inspection.png');
    
  } catch (error) {
    console.error('Inspection failed:', error);
  } finally {
    await new Promise(resolve => setTimeout(resolve, 2000));
    await browser.close();
  }
}

inspectPage();