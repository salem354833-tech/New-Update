# G9 Welcome Bot

Discord welcome bot for the G9 server. Greets new members with a custom card image.

## Prerequisites

- Node.js >= 20 LTS
- npm
- A Discord bot application with the **Server Members Intent** enabled

## Setup

1. Clone the repository and install dependencies:
   ```bash
   npm install
   ```

2. Copy the example environment file and fill in your values:
   ```bash
   cp .env.example .env
   ```
   | Variable | Description |
   |---|---|
   | `DISCORD_TOKEN` | Bot token from the Discord Developer Portal |
   | `CLIENT_ID` | Application (client) ID |
   | `GUILD_ID` | (Optional) Guild ID for guild-scoped command registration |

3. Place the G9 template image at `assets/template.png` (1100 × 400 px).

## Development

```bash
npm run dev          # Watch mode via tsx
npm run typecheck    # TypeScript type check
npm run lint         # ESLint
npm test             # Jest unit tests
```

## Production Deployment

### 1. Build

```bash
npm run build
```

### 2. Register Slash Commands

```bash
npm run deploy-commands
```

### 3. Start with PM2

```bash
npm install -g pm2
pm2 start ecosystem.config.js
pm2 save
pm2 startup          # Follow the printed instructions to enable autostart
```

### 4. Monitor

```bash
pm2 logs g9-welcome-bot
pm2 status
```

### Environment Variables on VPS

Set variables directly in the shell profile or use a secrets manager. Do **not** commit `.env` to source control.

```bash
export DISCORD_TOKEN="..."
export CLIENT_ID="..."
```

## Slash Commands

| Command | Description |
|---|---|
| `/set-channel` | Set the welcome channel (requires Manage Guild) |
| `/set-message` | Set the welcome text (requires Manage Guild) |
| `/set-color` | Set the frame hex colour (requires Manage Guild) |
| `/test-welcome` | Preview the welcome card for yourself |
| `/show-settings` | Display current configuration |

## Project Structure

```
src/
  index.ts              Entry point
  deploy-commands.ts    Slash command registration script
  config/
    defaultConfig.ts
  events/
    ready.ts
    guildMemberAdd.ts
  commands/
    setChannel.ts
    setMessage.ts
    setColor.ts
    testWelcome.ts
    showSettings.ts
  utils/
    imageGenerator.ts
    logger.ts
    configManager.ts
  types/
    index.ts
tests/
  utils/
    imageGenerator.test.ts
    configManager.test.ts
    logger.test.ts
```
