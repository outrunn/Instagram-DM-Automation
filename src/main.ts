import dotenv from 'dotenv';
dotenv.config();

import { startDmManager } from './core/dmManager.js';
import { logger } from './core/utils.js';

async function main() {
  logger.info('🚀 Instagram Auto-DM system starting...');
  try {
    await startDmManager();
    logger.info('✅ DM Manager finished execution.');
  } catch (error) {
    logger.error('❌ Fatal error in main:', error);
    process.exit(1);
  }
}

main(); 