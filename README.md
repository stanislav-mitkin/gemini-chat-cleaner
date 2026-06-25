# Gemini Chat Cleaner

A Chrome extension for bulk-deleting Gemini conversations. Select multiple chats and remove them all at once — no more clicking one by one.

## How it works

A small tab slides out from the right edge of the screen. Click it (or press `⌘⇧X` / `Ctrl+Shift+X`) to enter Select mode. Click conversations to select them, then delete with one confirmation.

```
┌──────────────────────┐
│ Select chats to      │◀
│ delete               │  ← tab always visible at screen edge
│                      │
│ 3 chats selected     │
│ [Clear]  [Delete 3]  │
│ [Exit Select mode]   │
└──────────────────────┘
```

## Keyboard shortcuts

| Key | Action |
|-----|--------|
| `⌘⇧X` / `Ctrl+Shift+X` | Enter / exit Select mode |
| Click | Toggle chat selection |
| `⌘A` / `Ctrl+A` | Select all chats |
| `⌘D` / `Ctrl+D` | Clear selection |
| `Enter` → `Enter` | Delete selected (two-step confirmation) |
| `Esc` | Exit Select mode |

## Features

- Bulk-select and delete any number of conversations
- Select All with one shortcut
- Two-step delete confirmation — no accidental deletions
- Progress bar during deletion, optimistic UI (chats disappear instantly, restored on error)
- Collapsible panel — slides out from the right edge, never covers content permanently
- Fully keyboard-driven
- Lightweight — no background scripts, no third-party servers
- No account, no login, no data collected

## Privacy

All processing happens locally in the browser tab. Delete requests go directly to Gemini's own API using your existing session — the same requests the Gemini website makes when you delete a chat manually. No data leaves your browser to any third-party server.

**Permissions:** `gemini.google.com` only — required to read the sidebar and call the delete API.

## Development

Built with [WXT](https://wxt.dev/) (Vite-based browser extension framework), TypeScript, Shadow DOM.

```bash
npm install
npm run build      # production build → .output/chrome-mv3/
npm run dev        # watch mode
```

Load the extension in Chrome: `chrome://extensions` → Developer mode → Load unpacked → select `.output/chrome-mv3/`.

### Project structure

```
entrypoints/
  content.ts          # entry point, waits for Gemini sidebar to load
modules/
  chat-list.ts        # finds conversation elements, extracts IDs/titles
  deleter.ts          # Gemini batchexecute API (RPC: GzXR5e), CSRF token extraction
  overlay.ts          # slide-out panel UI (Shadow DOM)
  selection.ts        # selection state, CSS highlight classes
  keybindings.ts      # keyboard shortcuts, mode orchestration
  styles.ts           # hover/selected CSS injected into page
  i18n.ts             # chrome.i18n wrapper
  platform.ts         # isMac() helper
public/
  icon.svg            # source icon (blue trash can with gradient)
  _locales/           # 18 languages
store/
  description.txt     # Chrome Web Store listing (EN)
  description.*.txt   # localized descriptions
```

### How deletion works

Gemini uses a `batchexecute` RPC endpoint. Each delete request:

1. Reads `WIZ_global_data` from the `<script data-id="_gd">` DOM element (CSRF token `SNlM0e`, build label `cfb2h`, session ID `FdrFJe`)
2. POSTs to `/_/BardChatUi/data/batchexecute?rpcids=GzXR5e&...`
3. Payload: `f.req=[[[GzXR5e,"[\"c_<hex_id>\"]",null,"generic"]]]`
4. Headers: `x-same-domain: 1`, `Content-Type: application/x-www-form-urlencoded`

Conversation IDs come from sidebar anchor `href` values (`/app/<hex>`) and are prefixed with `c_` for the API.

## Languages

English, Русский, Deutsch, Español, Français, Italiano, Português (BR/PT), Polski, Nederlands, Türkçe, Bahasa Indonesia, Tiếng Việt, 日本語, 한국어, 中文(简体/繁體), العربية

## License

MIT
