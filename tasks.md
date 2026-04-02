# tasks.md — G9 Welcome Bot

## Milestones & Tasks

---

### M1 — Foundation
> Project scaffolding, environment setup, Discord client connection

- [x] Initialise Node.js project (`npm init`) and commit `package.json`
- [x] Configure TypeScript (`tsconfig.json`, strict mode, path aliases)
- [x] Add ESLint + Prettier with project rules
- [x] Create `.env.example` with `DISCORD_TOKEN`, `CLIENT_ID`, `GUILD_ID`
- [x] Validate required env vars at startup; throw if missing
- [x] Instantiate `discord.js` `Client` with correct intents (including `GuildMembers`)
- [x] Implement `ready.ts` event handler (logs bot username on connect)
- [x] Wire up dynamic event/command loader in `src/index.ts`

---

### M2 — Welcome System
> Member join event handler + welcome card image generation

- [x] Implement `guildMemberAdd.ts` — fetch welcome channel from config, send message
- [x] Build `imageGenerator.ts` — load and cache G9 template buffer at module init
- [x] Fetch new member avatar as `Buffer` (fallback to default avatar)
- [x] Circular-crop avatar at 128 × 128 px and composite onto template (1100 × 400 px)
- [x] Support dynamic frame/background colour from guild config
- [x] Return final image as `AttachmentBuilder`; include member mention + welcome text
- [x] Assert generation completes in < 2 s

---

### M3 — Slash Commands
> All five admin commands implemented and registered

- [x] `/set-channel` — save welcome channel ID to guild config
- [x] `/set-message` — save custom welcome text; sanitise `@everyone`/`@here`/role mentions
- [x] `/set-color` — validate hex colour and save to guild config
- [x] `/test-welcome` — generate and send a card for the calling member without a real join
- [x] `/show-settings` — display current guild config as an embed
- [x] Gate all mutating commands behind `ManageGuild` permission check
- [x] Defer replies (`interaction.deferReply()`) before any async work
- [x] Write `deploy-commands.ts` and register commands via Discord REST API

---

### M4 — Stability
> Error handling, structured logging, env validation

- [x] Implement `logger.ts` with structured output (level, timestamp, context)
- [x] Wrap all Discord API calls in `try/catch`; log `guildId` + `userId` on failure
- [x] Define `ConfigNotFoundError` and other typed custom error classes
- [x] Implement `configManager.ts` — per-guild read/write with atomic file save
- [x] Ensure a failed welcome message does not crash or stall the bot process

---

### M5 — Testing
> Unit tests for utilities; integration smoke tests

- [x] Configure Jest with `ts-jest` and path alias support
- [x] Unit tests for `imageGenerator` — mock canvas, assert output buffer is non-empty
- [x] Unit tests for `configManager` — read, write, missing-file error path
- [x] Unit tests for `logger` — assert correct log levels and context fields
- [x] Command tests — mock `ChatInputCommandInteraction`, assert replies and config changes
- [x] Achieve ≥ 70 % coverage on `src/utils/`

---

### M6 — Deployment
> PM2 config, VPS setup, 24/7 uptime verified

- [x] Create `ecosystem.config.js` for PM2 with auto-restart and log paths
- [x] Document deployment steps (VPS / cloud platform) in `README.md`
- [ ] Configure environment variables on the production server (no `.env` file in prod)
- [ ] Run `npm run deploy-commands` in production to register slash commands globally
- [ ] Verify bot responds to commands in < 3 s and generates card in < 2 s under load
- [ ] Confirm bot reconnects automatically after a network drop
