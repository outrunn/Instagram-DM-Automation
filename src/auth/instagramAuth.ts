import { Page } from 'playwright';
import { logger } from '../core/utils.js';

export class InstagramAuth {
  private page: Page;

  constructor(page: Page) {
    this.page = page;
  }

  async login(username: string, password: string): Promise<boolean> {
    try {
      logger.info('🔐 Attempting Instagram login...');
      
      // Navigate to Instagram login page
      await this.page.goto('https://www.instagram.com/accounts/login/', {
        waitUntil: 'networkidle'
      });

      // Wait for login form to load
      await this.page.waitForSelector('input[name="username"]', { timeout: 10000 });
      
      // Fill in credentials
      await this.page.fill('input[name="username"]', username);
      await this.page.fill('input[name="password"]', password);
      
      // Click login button
      await this.page.click('button[type="submit"]');
      
      // Wait for navigation or error
      try {
        // Wait for either successful login or error
        await Promise.race([
          this.page.waitForURL('https://www.instagram.com/', { timeout: 10000 }),
          this.page.waitForSelector('[data-testid="login-error-message"]', { timeout: 5000 })
        ]);
        
        // Check if we're on the main Instagram page (successful login)
        const currentUrl = this.page.url();
        if (currentUrl.includes('instagram.com') && !currentUrl.includes('login')) {
          logger.info('✅ Instagram login successful');
          
          // Wait a bit for the page to fully load
          await this.page.waitForTimeout(3000);
          
          // Handle any popups that might appear
          await this.handlePostLoginPopups();
          
          return true;
        } else {
          logger.error('❌ Instagram login failed - still on login page');
          return false;
        }
      } catch (error) {
        logger.error('❌ Login timeout or error:', error);
        return false;
      }
    } catch (error) {
      logger.error('❌ Failed to login to Instagram:', error);
      return false;
    }
  }

  private async handlePostLoginPopups(): Promise<void> {
    try {
      // Handle "Save Login Info" popup
      const saveLoginButton = await this.page.$('button:has-text("Not Now")');
      if (saveLoginButton) {
        await saveLoginButton.click();
        logger.info('📝 Handled "Save Login Info" popup');
        await this.page.waitForTimeout(1000);
      }

      // Handle "Turn on Notifications" popup
      const notificationsButton = await this.page.$('button:has-text("Not Now")');
      if (notificationsButton) {
        await notificationsButton.click();
        logger.info('🔔 Handled notifications popup');
        await this.page.waitForTimeout(1000);
      }

      // Handle "Add to Home Screen" popup
      const homeScreenButton = await this.page.$('button:has-text("Cancel")');
      if (homeScreenButton) {
        await homeScreenButton.click();
        logger.info('📱 Handled "Add to Home Screen" popup');
        await this.page.waitForTimeout(1000);
      }
    } catch (error) {
      logger.warn('⚠️ Error handling post-login popups:', error);
    }
  }

  async isLoggedIn(): Promise<boolean> {
    try {
      await this.page.goto('https://www.instagram.com/', { waitUntil: 'networkidle' });
      
      // Check if we're redirected to login page
      if (this.page.url().includes('/accounts/login/')) {
        return false;
      }
      
      // Check for profile icon (indicates logged in)
      const profileIcon = await this.page.$('a[href*="/accounts/activity/"]');
      return !!profileIcon;
    } catch (error) {
      logger.error('❌ Error checking login status:', error);
      return false;
    }
  }

  async logout(): Promise<void> {
    try {
      logger.info('🚪 Logging out of Instagram...');
      
      // Navigate to profile page
      await this.page.goto('https://www.instagram.com/accounts/activity/', {
        waitUntil: 'networkidle'
      });
      
      // Click on settings menu
      await this.page.click('svg[aria-label="Settings"]');
      await this.page.waitForTimeout(1000);
      
      // Click logout
      await this.page.click('a[href="/accounts/logout/"]');
      await this.page.waitForTimeout(2000);
      
      // Confirm logout
      await this.page.click('button:has-text("Log Out")');
      
      logger.info('✅ Logged out successfully');
    } catch (error) {
      logger.error('❌ Error logging out:', error);
    }
  }
} 