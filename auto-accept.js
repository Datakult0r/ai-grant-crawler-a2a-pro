const puppeteer = require('puppeteer');

/**
 * Auto-Accept Script for Agent Laboratory
 *
 * This script automatically clicks the "START AGENT LAB" button
 * whenever it appears, keeping the research running continuously.
 */

async function autoAcceptResearch() {
  console.log('🤖 Starting Auto-Accept Bot...');

  // Launch browser
  const browser = await puppeteer.launch({
    headless: false, // Set to true to run in background
    defaultViewport: null,
    args: ['--start-maximized']
  });

  const page = await browser.newPage();

  // Navigate to the research page
  const url = 'http://localhost:5173'; // SvelteKit dev server default port
  console.log(`📍 Navigating to ${url}...`);
  await page.goto(url, { waitUntil: 'networkidle2' });

  console.log('✅ Page loaded successfully!');
  console.log('👀 Watching for "START AGENT LAB" button...\n');

  // Continuously check for and click the button
  const checkInterval = 1000; // Check every second

  while (true) {
    try {
      // Look for the START AGENT LAB button
      const buttonFound = await page.evaluate(() => {
        const buttons = Array.from(document.querySelectorAll('button'));
        const startButton = buttons.find(btn =>
          btn.textContent.includes('START AGENT LAB')
        );

        if (startButton && !startButton.disabled) {
          startButton.click();
          return true;
        }
        return false;
      });

      if (buttonFound) {
        const timestamp = new Date().toLocaleTimeString();
        console.log(`✨ [${timestamp}] Auto-clicked START AGENT LAB button!`);
      }

      // Wait before next check
      await new Promise(resolve => setTimeout(resolve, checkInterval));

    } catch (error) {
      console.error('⚠️  Error during auto-accept:', error.message);

      // If page crashed, try to reload
      if (error.message.includes('Session closed') || error.message.includes('Target closed')) {
        console.log('🔄 Reloading page...');
        await page.goto(url, { waitUntil: 'networkidle2' });
      }
    }
  }
}

// Handle script termination
process.on('SIGINT', () => {
  console.log('\n👋 Auto-Accept Bot stopped.');
  process.exit(0);
});

// Start the bot
autoAcceptResearch().catch(error => {
  console.error('❌ Fatal error:', error);
  process.exit(1);
});
