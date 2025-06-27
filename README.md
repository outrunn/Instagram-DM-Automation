# Instagram Auto-DM System

A professional Instagram Direct Message automation system built with TypeScript, Node.js, and Playwright. This system can read leads from Google Sheets and automatically send personalized direct messages to them on Instagram.

## 🚀 Features

- **Instagram Authentication**: Secure login with session management
- **Browser Automation**: Stealth browser automation with Playwright
- **Message Personalization**: Dynamic templates with variable substitution
- **Rate Limiting**: Ethical delays and human behavior simulation
- **Google Sheets Integration**: Read leads and track DM status
- **Discord Notifications**: Real-time monitoring and alerts
- **Error Handling**: Comprehensive logging and retry mechanisms

## 📋 Prerequisites

- Node.js 18+ 
- Instagram account credentials
- Google Sheets API (for full functionality)
- Discord webhook (for notifications)

## 🛠️ Installation

1. **Clone the repository**
   ```bash
   git clone git@github.com:outrunn/Instagram-DM-Automation.git
   cd Instagram-DM-Automation
   ```

2. **Install dependencies**
   ```bash
   npm install
   ```

3. **Install Playwright browsers**
   ```bash
   npx playwright install chromium
   ```

4. **Set up environment variables**
   ```bash
   cp env.example .env
   ```
   
   Edit `.env` with your credentials:
   ```env
   INSTAGRAM_USERNAME=your_instagram_username
   INSTAGRAM_PASSWORD=your_instagram_password
   DISCORD_WEBHOOK_URL=your_discord_webhook_url
   SHEET_ID=your_google_sheet_id
   ```
5. Share Google sheet with google service account

6. Add service account crediantials key which should be a .json file downloaded from Google cloud.

## 🧪 Testing

### Test Instagram Connection
```bash
npm run dev
```

### Send Test Message
```bash
npm run send-test your_alt_account_username "Hello! This is a test message."
```

### View Statistics
```bash
npm run stats
```

### Message Templates (`src/config/dmTemplates.json`)
Configure personalized message templates with variables:
- `{username}` - Instagram username
- `{name}` - Display name
- `{profession}` - Professional field
- `{bio_highlight}` - Bio highlight

### DM Settings (`src/config/dmSettings.json`)
Configure rate limiting and behavior:
- Daily message limits
- Delay between messages
- Time restrictions
- Human behavior simulation