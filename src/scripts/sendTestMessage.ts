import dotenv from 'dotenv';
dotenv.config();

import { sendDirectMessage } from '../core/dmManager.js';
import { logger } from '../core/utils.js';

async function sendTestMessage() {
  try {
    // Get target username from command line args or use default
    const targetUsername = process.argv[2] || 'your_alt_account_username';
    const testMessage = process.argv[3] || 'Hey! This is a test message from my Instagram Auto-DM system. 🚀';
    
    logger.info(`🧪 Starting test DM to @${targetUsername}...`);
    
    const success = await sendDirectMessage(targetUsername, testMessage);
    
    if (success) {
      logger.info('✅ Test message sent successfully!');
    } else {
      logger.error('❌ Failed to send test message');
      process.exit(1);
    }
    
  } catch (error) {
    logger.error('❌ Error in test script:', error);
    process.exit(1);
  }
}

sendTestMessage(); 