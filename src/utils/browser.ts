import { chromium, Browser, BrowserContext, Page } from 'playwright';
import { logger } from '../core/utils.js';

export class BrowserManager {
  private browser: Browser | null = null;
  private context: BrowserContext | null = null;
  private page: Page | null = null;

  async initialize(): Promise<void> {
    try {
      logger.info('🌐 Initializing browser...');
      
      this.browser = await chromium.launch({
        headless: process.env['HEADLESS'] === 'true',
        args: [
          '--no-sandbox',
          '--disable-setuid-sandbox',
          '--disable-dev-shm-usage',
          '--disable-accelerated-2d-canvas',
          '--no-first-run',
          '--no-zygote',
          '--disable-gpu',
          '--disable-background-timer-throttling',
          '--disable-backgrounding-occluded-windows',
          '--disable-renderer-backgrounding',
          '--disable-features=TranslateUI',
          '--disable-ipc-flooding-protection',
          '--user-agent=Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
        ]
      });

      this.context = await this.browser.newContext({
        viewport: { width: 1280, height: 720 },
        userAgent: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36',
        locale: 'en-US',
        timezoneId: 'America/New_York',
        permissions: ['geolocation'],
        extraHTTPHeaders: {
          'Accept-Language': 'en-US,en;q=0.9',
          'Accept-Encoding': 'gzip, deflate, br',
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
          'DNT': '1',
          'Connection': 'keep-alive',
          'Upgrade-Insecure-Requests': '1'
        }
      });

      // Add stealth scripts
      await this.context.addInitScript(`
        Object.defineProperty(navigator, 'webdriver', {
          get: () => undefined,
        });
        
        Object.defineProperty(navigator, 'plugins', {
          get: () => [1, 2, 3, 4, 5],
        });
        
        Object.defineProperty(navigator, 'languages', {
          get: () => ['en-US', 'en'],
        });
        
        const originalQuery = window.navigator.permissions.query;
        window.navigator.permissions.query = (parameters) => (
          parameters.name === 'notifications' ?
            Promise.resolve({ state: Notification.permission }) :
            originalQuery(parameters)
        );
      `);

      this.page = await this.context.newPage();
      
      // Set additional headers
      await this.page.setExtraHTTPHeaders({
        'Accept-Language': 'en-US,en;q=0.9',
        'Accept-Encoding': 'gzip, deflate, br',
        'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
        'DNT': '1',
        'Connection': 'keep-alive',
        'Upgrade-Insecure-Requests': '1'
      });

      logger.info('✅ Browser initialized successfully');
    } catch (error) {
      logger.error('❌ Failed to initialize browser:', error);
      throw error;
    }
  }

  async getPage(): Promise<Page> {
    if (!this.page) {
      throw new Error('Browser not initialized. Call initialize() first.');
    }
    return this.page;
  }

  async close(): Promise<void> {
    try {
      if (this.page) {
        await this.page.close();
      }
      if (this.context) {
        await this.context.close();
      }
      if (this.browser) {
        await this.browser.close();
      }
      logger.info('🔒 Browser closed successfully');
    } catch (error) {
      logger.error('❌ Error closing browser:', error);
    }
  }

  async saveCookies(): Promise<void> {
    if (!this.context) {
      throw new Error('Context not initialized');
    }
    
    const cookies = await this.context.cookies();
    const fs = await import('fs/promises');
    await fs.writeFile('./cookies.json', JSON.stringify(cookies, null, 2));
    logger.info('🍪 Cookies saved to cookies.json');
  }

  async loadCookies(): Promise<void> {
    try {
      const fs = await import('fs/promises');
      const cookiesData = await fs.readFile('./cookies.json', 'utf-8');
      const cookies = JSON.parse(cookiesData);
      
      if (this.context) {
        await this.context.addCookies(cookies);
        logger.info('🍪 Cookies loaded from cookies.json');
      }
    } catch (error) {
      logger.warn('⚠️ No cookies file found or invalid cookies');
    }
  }
} 