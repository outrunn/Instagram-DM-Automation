import winston from 'winston';

export const logger = winston.createLogger({
  level: process.env['LOG_LEVEL'] || 'info',
  format: winston.format.combine(
    winston.format.colorize(),
    winston.format.timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }),
    winston.format.printf((info: { timestamp: string; level: string; message: string }) => {
      return `${info.timestamp} [${info.level}] ${info.message}`;
    })
  ),
  transports: [
    new winston.transports.Console()
  ]
}); 