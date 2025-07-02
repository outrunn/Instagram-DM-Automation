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
    
    // Navigate to Instagram with longer timeout and better error handling
    logger.info('🌐 Navigating to Instagram...');
    try {
      await page.goto('https://www.instagram.com/', {
        waitUntil: 'domcontentloaded',
        timeout: 60000 // Increased timeout to 60 seconds
      });
      
      // Wait for page to stabilize
      await page.waitForTimeout(3000);
      
    } catch (error) {
      logger.error('❌ Failed to navigate to Instagram:', error);
      return false;
    }
    
    // Check if we're logged in by looking for specific elements
    logger.info('🔍 Checking login status...');
    const isLoggedIn = await checkLoginStatus(page);
    
    if (!isLoggedIn) {
      logger.error('❌ Not logged in to Instagram. Please run "npm run login" first.');
      return false;
    }
    
    logger.info('✅ Successfully logged in to Instagram');
    
    // Navigate to Instagram DMs
    logger.info('📨 Navigating to DMs...');
    await page.goto('https://www.instagram.com/direct/inbox/', {
      waitUntil: 'domcontentloaded',
      timeout: 30000
    });
    
    // Wait for DM page to load
    await page.waitForTimeout(5000);
    
    // Look for "New Message" button with multiple selectors
    logger.info('🔍 Looking for New Message button...');
    let newMessageButton = null;
    
    const selectors = [
      'a[href="/direct/new/"]',
      'button:has-text("New message")',
      'div[role="button"]:has-text("New message")',
      'svg[aria-label="New message"]'
    ];
    
    for (const selector of selectors) {
      try {
        newMessageButton = await page.$(selector);
        if (newMessageButton) {
          logger.info(`✅ Found New Message button with selector: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!newMessageButton) {
      logger.error('❌ Could not find "New Message" button');
      return false;
    }
    
    await newMessageButton.click();
    await page.waitForTimeout(3000);
    
    // Search for the target user with multiple selectors
    logger.info(`🔍 Searching for user: ${targetUsername}...`);
    let searchInput = null;
    
    const searchSelectors = [
      'input[placeholder*="Search"]',
      'input[placeholder*="search"]',
      'input[name="queryBox"]',
      'input[type="text"]'
    ];
    
    for (const selector of searchSelectors) {
      try {
        searchInput = await page.$(selector);
        if (searchInput) {
          logger.info(`✅ Found search input with selector: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!searchInput) {
      logger.error('❌ Could not find search input');
      return false;
    }
    
    await searchInput.fill(targetUsername);
    await page.waitForTimeout(3000);
    
    // Click on the first user result
    logger.info('👤 Selecting user from search results...');
    
    // Wait for search results to load
    await page.waitForTimeout(2000);
    
    // Try multiple approaches to click on user result
    let userClicked = false;
    
    // Approach 1: Look for user result with specific selectors
    const userSelectors = [
      `div[role="button"]:has-text("${targetUsername}")`,
      `div:has-text("${targetUsername}")[role="button"]`,
      'div[role="button"]',
      'button[type="button"]',
      'div[tabindex="0"]'
    ];
    
    for (const selector of userSelectors) {
      try {
        const userElements = await page.$$(selector);
        if (userElements.length > 0) {
          logger.info(`🎯 Found ${userElements.length} user elements with selector: ${selector}`);
          
          // Try to click the first one
          try {
            await userElements[0]?.click({ force: true, timeout: 5000 });
            userClicked = true;
            logger.info('✅ Successfully clicked on user result');
            break;
          } catch (clickError) {
            logger.warn(`⚠️ Failed to click with selector ${selector}, trying next...`);
            continue;
          }
        }
      } catch (error) {
        continue;
      }
    }
    
    // Approach 2: If normal click failed, try JavaScript click
    if (!userClicked) {
      logger.info('🔄 Trying JavaScript click...');
      try {
        const clicked = await page.evaluate(`
          (() => {
            const buttons = document.querySelectorAll('div[role="button"]');
            if (buttons.length > 0) {
              buttons[0].click();
              return true;
            }
            return false;
          })()
        `);
        if (clicked) {
          userClicked = true;
          logger.info('✅ Successfully clicked via JavaScript');
        }
      } catch (error) {
        logger.warn('⚠️ JavaScript click also failed');
      }
    }
    
    // Approach 3: Try keyboard navigation
    if (!userClicked) {
      logger.info('⌨️ Trying keyboard navigation...');
      try {
        await page.keyboard.press('ArrowDown');
        await page.waitForTimeout(500);
        await page.keyboard.press('Enter');
        userClicked = true;
        logger.info('✅ Successfully selected via keyboard');
      } catch (error) {
        logger.warn('⚠️ Keyboard navigation failed');
      }
    }
    
    if (!userClicked) {
      logger.error('❌ Could not select user from search results');
      return false;
    }
    
    // Wait for navigation after selecting user
    await page.waitForTimeout(3000);
    
    // Check if we need to click "Next" button or if we're already in chat
    logger.info('🔍 Checking for Next button or direct chat...');
    
    try {
      // Look for "Next" button with multiple selectors
      const nextSelectors = [
        'button:has-text("Next")',
        'div[role="button"]:has-text("Next")',
        'button[type="button"]:has-text("Next")',
        '[data-testid="next-button"]'
      ];
      
      let nextButton = null;
      for (const selector of nextSelectors) {
        nextButton = await page.$(selector);
        if (nextButton) {
          logger.info(`✅ Found Next button with selector: ${selector}`);
          break;
        }
      }
      
      if (nextButton) {
        logger.info('➡️ Clicking Next button...');
        await nextButton.click();
        await page.waitForTimeout(4000);
      } else {
        logger.info('ℹ️ No Next button found, assuming direct chat access');
      }
    } catch (error) {
      logger.warn('⚠️ Error handling Next button, continuing...');
    }
    
    // Find message input and send message
    logger.info('💬 Looking for message input...');
    
    // Wait longer for message input to appear
    await page.waitForTimeout(3000);
    
    const messageSelectors = [
      'textarea[placeholder*="Message"]',
      'textarea[placeholder*="message"]',
      'div[contenteditable="true"]',
      'textarea[aria-label*="Message"]',
      'textarea[aria-label*="message"]',
      'div[role="textbox"]',
      'textarea[data-testid="message-input"]',
      'div[contenteditable="true"][role="textbox"]',
      'textarea',
      'input[type="text"]'
    ];
    
    let messageInput = null;
    for (const selector of messageSelectors) {
      try {
        // Wait for each selector to appear
        await page.waitForSelector(selector, { timeout: 5000 });
        messageInput = await page.$(selector);
        if (messageInput) {
          logger.info(`✅ Found message input with selector: ${selector}`);
          break;
        }
      } catch (error) {
        // Continue to next selector if this one times out
        continue;
      }
    }
    
    if (!messageInput) {
      logger.error('❌ Could not find message input after trying all selectors');
      
      // Debug: Log current page URL and take screenshot for debugging
      const currentUrl = page.url();
      logger.info(`🔍 Current URL: ${currentUrl}`);
      
      // Try to find any input elements for debugging
      const allInputs = await page.$$('input, textarea, div[contenteditable]');
      logger.info(`🔍 Found ${allInputs.length} total input elements on page`);
      
      return false;
    }
    
    // Type the message
    logger.info('✏️ Typing message...');
    
    // Re-find the message input to avoid DOM detachment issues
    let messageInputSelector = '';
    for (const selector of messageSelectors) {
      try {
        const element = await page.$(selector);
        if (element) {
          messageInputSelector = selector;
          logger.info(`🎯 Using selector for typing: ${selector}`);
          break;
        }
      } catch (error) {
        continue;
      }
    }
    
    if (!messageInputSelector) {
      logger.error('❌ Could not re-find message input for typing');
      return false;
    }
    
    // Click on the input to focus it
    await page.click(messageInputSelector);
    await page.waitForTimeout(1000);
    
    // Clear any existing text using page methods instead of element handle
    await page.evaluate(`
      const element = document.querySelector('${messageInputSelector}');
      if (element) {
        element.value = '';
        element.textContent = '';
        element.innerText = '';
      }
    `);
    
    await page.waitForTimeout(500);
    
    // Type the message using page.type() which is more reliable
    await page.type(messageInputSelector, message, { delay: 100 });
    await page.waitForTimeout(2000);
    
    // Send the message
    logger.info('🚀 Sending message...');
    
    // Try multiple ways to send the message
    let messageSent = false;
    
    // Method 1: Press Enter
    try {
      await page.keyboard.press('Enter');
      messageSent = true;
      logger.info('✅ Message sent via Enter key');
    } catch (error) {
      logger.warn('⚠️ Enter key failed, trying send button...');
    }
    
    // Method 2: Look for send button if Enter didn't work
    if (!messageSent) {
      const sendSelectors = [
        'button[type="submit"]',
        'button:has-text("Send")',
        'div[role="button"]:has-text("Send")',
        'svg[aria-label="Send"]',
        '[data-testid="send-button"]'
      ];
      
      for (const selector of sendSelectors) {
        try {
          const sendButton = await page.$(selector);
          if (sendButton) {
            await sendButton.click();
            messageSent = true;
            logger.info(`✅ Message sent via send button: ${selector}`);
            break;
          }
        } catch (error) {
          continue;
        }
      }
    }
    
    if (!messageSent) {
      logger.error('❌ Could not send message - no send method worked');
      return false;
    }
    
    await page.waitForTimeout(3000);
    
    logger.info(`✅ Message sent successfully to @${targetUsername}`);
    return true;
    
  } catch (error) {
    logger.error('❌ Error sending DM:', error);
    return false;
  } finally {
    await browserManager.close();
  }
}

async function checkLoginStatus(page: any): Promise<boolean> {
  try {
    // Check multiple indicators of being logged in
    const loginIndicators = [
      'a[href*="/accounts/activity/"]',
      'svg[aria-label="Home"]',
      'a[href="/"]',
      'div[role="button"]:has-text("Home")',
      'nav[role="navigation"]'
    ];
    
    for (const selector of loginIndicators) {
      try {
        const element = await page.$(selector);
        if (element) {
          logger.info(`✅ Login confirmed with indicator: ${selector}`);
          return true;
        }
      } catch (error) {
        continue;
      }
    }
    
    // Check if we're on login page (indicates not logged in)
    const currentUrl = page.url();
    if (currentUrl.includes('/accounts/login/')) {
      logger.info('❌ On login page - not logged in');
      return false;
    }
    
    // If no clear indicators but not on login page, assume logged in
    logger.info('🤔 Login status unclear, but not on login page - assuming logged in');
    return true;
    
  } catch (error) {
    logger.error('❌ Error checking login status:', error);
    return false;
  }
} 