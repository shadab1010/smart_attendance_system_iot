const puppeteer = require('puppeteer');

(async () => {
  try {
    const browser = await puppeteer.launch({headless: 'new'});
    const page = await browser.newPage();
    
    page.on('console', msg => console.log('PAGE LOG:', msg.text()));
    page.on('pageerror', err => console.log('PAGE ERROR:', err.message));
    
    await page.goto('http://localhost:5173/');
    
    // Click login
    await page.waitForSelector('button:has-text("Admin Login")');
    await page.evaluate(() => {
       const buttons = Array.from(document.querySelectorAll('button'));
       const loginBtn = buttons.find(b => b.textContent && b.textContent.includes('Admin Login'));
       if(loginBtn) loginBtn.click();
    });
    
    // type pass
    await page.waitForSelector('input[type="password"]');
    await page.type('input[type="password"]', 'admin123');
    
    // click submit
    await page.evaluate(() => {
       const buttons = Array.from(document.querySelectorAll('button'));
       const signInBtn = buttons.find(b => b.textContent && b.textContent.includes('Sign In'));
       if(signInBtn) signInBtn.click();
    });
    
    await page.waitForTimeout(2000);
    
    await browser.close();
    console.log("Done");
  } catch (e) {
    console.error("SCRIPT ERROR:", e);
  }
})();
