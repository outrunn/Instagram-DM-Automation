import dotenv from 'dotenv';
dotenv.config();

import { BrowserManager } from '../utils/browser.js';
import { logger } from '../core/utils.js';

async function manualLogin() {
  const browserManager = new BrowserManager();
  
  try {
    logger.info('🌐 Opening Instagram for manual login...');
    logger.info('📝 Please log in manually and then press Enter in this terminal to save cookies');
    
    // Override headless setting to false for manual login
    process.env['HEADLESS'] = 'false';
    
    // Initialize browser in visible mode
    await browserManager.initialize();
    const page = await browserManager.getPage();
    
    // Navigate to Instagram
    await page.goto('https://www.instagram.com/', {
      waitUntil: 'networkidle'
    });
    
    logger.info('🔐 Browser opened! Please:');
    logger.info('1. Log in to your Instagram account manually');
    logger.info('2. Complete any 2FA if required');
    logger.info('3. Make sure you see your Instagram feed');
    logger.info('4. Press Enter in this terminal when done');
    
    // Wait for user input
    await waitForUserInput();
    
    // Save cookies
    await browserManager.saveCookies();
    logger.info('✅ Cookies saved successfully!');
    
    // Test if login was successful
    const currentUrl = page.url();
    if (currentUrl.includes('instagram.com') && !currentUrl.includes('login')) {
      logger.info('🎉 Login successful! You can now use the DM automation.');
      logger.info('💡 Next time, your session will be automatically restored.');
    } else {
      logger.warn('⚠️ You may not be fully logged in. Please try again.');
    }
    
    logger.info('🔒 Closing browser...');
    await browserManager.close();
    
  } catch (error) {
    logger.error('❌ Error during manual login:', error);
    process.exit(1);
  }
}

function waitForUserInput(): Promise<void> {
  return new Promise((resolve) => {
    process.stdin.setRawMode(true);
    process.stdin.resume();
    process.stdin.on('data', (key) => {
      // Check for Enter key (13) or Ctrl+C (3)
      if (key[0] === 13) {
        process.stdin.setRawMode(false);
        process.stdin.pause();
        resolve();
      } else if (key[0] === 3) {
        logger.info('\n👋 Cancelled by user');
        process.exit(0);
      }
    });
  });
}

manualLogin(); 