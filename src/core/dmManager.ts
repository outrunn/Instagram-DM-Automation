import { BrowserManager } from '../utils/browser.js';
import { InstagramAuth } from '../auth/instagramAuth.js';
import { logger } from './utils.js';

export async function startDmManager(): Promise<void> {
  const browserManager = new BrowserManager();
  
  try {
    logger.info('🚀 Starting Instagram Auto-DM system...');
    
    // Initialize browser
    await browserManager.initialize();
    const page = await browserManager.getPage();
    
    // Load cookies if available
    await browserManager.loadCookies();
    
    // Initialize Instagram auth
    const instagramAuth = new InstagramAuth(page);
    
    // Check if already logged in
    const isLoggedIn = await instagramAuth.isLoggedIn();
    
    if (!isLoggedIn) {
      logger.info('🔐 Not logged in, attempting login...');
      
      const username = process.env['INSTAGRAM_USERNAME'];
      const password = process.env['INSTAGRAM_PASSWORD'];
      
      if (!username || !password) {
        throw new Error('Instagram credentials not found in environment variables');
      }
      
      const loginSuccess = await instagramAuth.login(username, password);
      
      if (!loginSuccess) {
        throw new Error('Failed to login to Instagram');
      }
      
      // Save cookies for future use
      await browserManager.saveCookies();
    } else {
      logger.info('✅ Already logged in to Instagram');
    }
    
    logger.info('🎯 Ready to send DMs! Use the test scripts to send messages.');
    
    // Keep the browser open for testing
    logger.info('⏸️ Browser will stay open for testing. Press Ctrl+C to exit.');
    
    // Wait for user to exit
    await new Promise(() => {
      // This will keep the process running until interrupted
    });
    
  } catch (error) {
    logger.error('❌ Error in DM Manager:', error);
    throw error;
  } finally {
    // Don't close browser immediately for testing
    // await browserManager.close();
  }
}

export async function sendDirectMessage(targetUsername: string, message: string): Promise<boolean> {
  const browserManager = new BrowserManager();
  
  try {
    logger.info(`💬 Attempting to send DM to @${targetUsername}...`);
    
    // Initialize browser
    await browserManager.initialize();
    const page = await browserManager.getPage();
    
    // Load cookies
    await browserManager.loadCookies();
    
    // Check login status
    const instagramAuth = new InstagramAuth(page);
    const isLoggedIn = await instagramAuth.isLoggedIn();
    
    if (!isLoggedIn) {
      logger.error('❌ Not logged in to Instagram');
      return false;
    }
    
    // Navigate to Instagram DMs
    await page.goto('https://www.instagram.com/direct/inbox/', {
      waitUntil: 'networkidle'
    });
    
    // Wait for DM page to load
    await page.waitForTimeout(3000);
    
    // Click on "New Message" button
    const newMessageButton = await page.$('a[href="/direct/new/"]');
    if (!newMessageButton) {
      logger.error('❌ Could not find "New Message" button');
      return false;
    }
    
    await newMessageButton.click();
    await page.waitForTimeout(2000);
    
    // Search for the target user
    const searchInput = await page.$('input[placeholder*="Search"]');
    if (!searchInput) {
      logger.error('❌ Could not find search input');
      return false;
    }
    
    await searchInput.fill(targetUsername);
    await page.waitForTimeout(2000);
    
    // Click on the first user result
    const userResult = await page.$('div[role="button"]');
    if (!userResult) {
      logger.error('❌ Could not find user in search results');
      return false;
    }
    
    await userResult.click();
    await page.waitForTimeout(1000);
    
    // Click "Next" button
    const nextButton = await page.$('button:has-text("Next")');
    if (nextButton) {
      await nextButton.click();
      await page.waitForTimeout(2000);
    }
    
    // Find message input and send message
    const messageInput = await page.$('textarea[placeholder*="Message"]');
    if (!messageInput) {
      logger.error('❌ Could not find message input');
      return false;
    }
    
    await messageInput.fill(message);
    await page.waitForTimeout(1000);
    
    // Send the message
    await page.keyboard.press('Enter');
    await page.waitForTimeout(2000);
    
    logger.info(`✅ Message sent successfully to @${targetUsername}`);
    return true;
    
  } catch (error) {
    logger.error('❌ Error sending DM:', error);
    return false;
  } finally {
    await browserManager.close();
  }
} 