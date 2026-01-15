# Auto-Accept Bot for Agent Laboratory

This script automatically clicks the "START AGENT LAB" button to keep the research running continuously without manual intervention.

## Setup

1. Install dependencies:
```bash
npm install
```

This will install Puppeteer, which is needed for browser automation.

## Usage

### Option 1: Run auto-accept separately

Start the development servers:
```bash
npm run dev
```

In a separate terminal, run the auto-accept bot:
```bash
npm run auto-accept
```

### Option 2: Run everything together (Recommended)

Start dev servers AND auto-accept bot at the same time:
```bash
npm run dev:with-auto
```

## How It Works

1. The script opens a browser window pointing to `http://localhost:5173`
2. Every second, it checks for the "START AGENT LAB" button
3. When found, it automatically clicks the button
4. The research process continues uninterrupted

## Configuration

Edit [auto-accept.js](auto-accept.js) to customize:

- **Headless mode**: Set `headless: true` to run without showing the browser window
- **Check interval**: Change `checkInterval` to adjust how often it checks for the button (in milliseconds)
- **URL**: Update the `url` variable if your frontend runs on a different port

## Stopping the Bot

Press `Ctrl+C` in the terminal where the bot is running to stop it gracefully.

## Troubleshooting

**Browser doesn't open:**
- Make sure the frontend is running (`npm run dev:frontend`)
- Check that port 5173 is the correct SvelteKit dev server port

**Button not being clicked:**
- Verify the button text is exactly "START AGENT LAB"
- Check browser console for errors
- Ensure JavaScript is enabled

**Bot crashes:**
- The script will automatically try to reload the page
- Check that your system has enough memory to run Chromium
