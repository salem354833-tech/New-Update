# AGENTS.md — G9 Welcome Bot

## Project Overview

Discord welcome bot for the G9 server. Automatically greets new members with a
custom card image (member avatar composited onto a branded template) and exposes
slash commands so server admins can configure the bot without restarting it.

Source language: **Arabic** (human-facing text in the PRD); code and identifiers
are written in **English**. Comments may be bilingual.

---

## Tech Stack (planned)

| Layer | Choice |
|---|---|
| Runtime | Node.js ≥ 20 LTS |
| Discord library | discord.js v14 |
| Image generation | `@napi-rs/canvas` (or `canvas` npm package) |
| Config persistence | JSON file (`config.json`) or SQLite via `better-sqlite3` |
| Process manager | PM2 (production) |
| Language | TypeScript (strict mode) |
| Package manager | npm |

---

## Build / Run Commands

```bash
# Install dependencies
npm install

# Compile TypeScript
npm run build           # tsc --outDir dist

# Start in development (ts-node or tsx watch)
npm run dev             # tsx watch src/index.ts

# Start compiled output
npm start               # node dist/index.js

# Register slash commands with Discord
npm run deploy-commands # node dist/deploy-commands.js

# Run all tests
npm test                # jest

# Run a single test file
npx jest src/utils/imageGenerator.test.ts

# Run a single test by name pattern
npx jest --testNamePattern "generates welcome card"

# Lint
npm run lint            # eslint "src/**/*.ts"

# Lint and auto-fix
npm run lint:fix        # eslint "src/**/*.ts" --fix

# Type-check without emitting
npm run typecheck       # tsc --noEmit
```

> Until `package.json` is created, these are the canonical commands to implement.
> Always run `npm run lint` and `npm run typecheck` after any code change.

---

## Project Structure

```
src/
  index.ts              # Entry point — creates client, loads events & commands
  deploy-commands.ts    # One-shot script to register slash commands via REST
  config/
    defaultConfig.ts    # Default values; loaded at startup
  events/
    guildMemberAdd.ts   # Fires on member join → sends welcome card
    ready.ts            # Bot ready handler
  commands/
    setChannel.ts       # /set-channel
    setMessage.ts       # /set-message
    setColor.ts         # /set-color
    testWelcome.ts      # /test-welcome
    showSettings.ts     # /show-settings
  utils/
    imageGenerator.ts   # Composites member avatar onto the G9 template
    logger.ts           # Structured logging (errors + events)
    configManager.ts    # Read/write persistent config per guild
  types/
    index.ts            # Shared TypeScript interfaces
tests/
  utils/
    imageGenerator.test.ts
config.json             # Runtime config (gitignored if it contains tokens)
.env                    # DISCORD_TOKEN, CLIENT_ID, GUILD_ID (never commit)
```

---

## Code Style Guidelines

### TypeScript

- `strict: true` in `tsconfig.json`; no `any` unless absolutely unavoidable and
  always annotated with `// eslint-disable-next-line @typescript-eslint/no-explicit-any`
- Prefer `interface` over `type` for object shapes; use `type` for unions/aliases.
- All function parameters and return types must be explicitly typed.
- Use `const` by default; `let` only when reassignment is required; never `var`.
- Use `readonly` on properties that should not be mutated after construction.

### Imports

- Group imports: (1) Node built-ins, (2) third-party packages, (3) internal
  modules. Leave a blank line between groups.
- Use named imports; avoid `import * as X` unless the module requires it.
- Path aliases (e.g. `@/utils/logger`) are preferred over deep relative paths.

```ts
// Good
import path from 'node:path';

import { Client, GatewayIntentBits } from 'discord.js';

import { logger } from '@/utils/logger';
import type { GuildConfig } from '@/types';
```

### Naming Conventions

| Kind | Convention | Example |
|---|---|---|
| Files | `camelCase.ts` | `imageGenerator.ts` |
| Classes | `PascalCase` | `ConfigManager` |
| Functions / variables | `camelCase` | `sendWelcomeCard` |
| Constants (module-level) | `UPPER_SNAKE_CASE` | `DEFAULT_COLOR` |
| Discord slash command names | `kebab-case` | `/set-channel` |
| Interfaces / types | `PascalCase` | `GuildConfig` |

### Formatting

- 2-space indentation; no tabs.
- Single quotes for strings; template literals when interpolating.
- Trailing commas in multi-line structures (`"trailingComma": "all"` in Prettier).
- Max line length: 100 characters.
- Semicolons required.

### Comments

- **Do not add comments unless they explain non-obvious logic** (e.g. why a
  specific Discord API workaround is needed). Describing *what* the code does is
  unnecessary.
- JSDoc on exported functions and classes only.

---

## Error Handling

- All Discord API calls must be wrapped in `try/catch`; log the error via
  `logger.error` and continue — **a single failed welcome message must never
  crash the bot** (see PRD §6).
- Do not swallow errors silently; always log with context
  (`guildId`, `userId`, error message).
- Use typed custom error classes (extending `Error`) for application-level
  failures (e.g. `ConfigNotFoundError`).
- `.env` variables are validated at startup; throw immediately if required vars
  are missing rather than failing later.

```ts
// Good
try {
  await channel.send({ files: [attachment] });
} catch (err) {
  logger.error('Failed to send welcome message', { guildId, userId, err });
}
```

---

## Discord.js Specifics

- Always specify `intents` explicitly on the `Client` constructor; require
  `GuildMembers` privileged intent for `guildMemberAdd` events.
- Slash command handlers must defer the reply (`interaction.deferReply()`) before
  any async work that may exceed 3 seconds.
- Keep `InteractionCreate` handlers thin — delegate logic to command modules.
- Never store the bot token in source; read from `process.env.DISCORD_TOKEN`.

---

## Image Generation

- Target card dimensions: **1100 × 400 px** (adjust to match the G9 template).
- Avatar must be circular-cropped at **128 × 128 px** and composited at a fixed
  offset on the template.
- Cache the template background `Buffer` at module load; do not re-read from disk
  on every member join.
- Image generation must complete in **< 2 seconds** (PRD §6).

---

## Security

- Never log or expose `DISCORD_TOKEN`.
- Validate that slash-command callers have `ManageGuild` permission before
  mutating config.
- Do not trust user-supplied text in welcome messages without sanitising Discord
  markdown (strip `@everyone`, `@here`, and role mentions unless explicitly
  allowed).

---

## Testing

- Unit-test pure utilities (`imageGenerator`, `configManager`, `logger`).
- Mock `discord.js` `Client` and `TextChannel` in event/command tests.
- Test file naming: `<module>.test.ts` co-located under `tests/`.
- Coverage target: ≥ 70 % on `src/utils/`.
