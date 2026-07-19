# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## What this is

A Chrome MV3 extension (WXT framework, TypeScript, no UI framework) that lets users bulk-select and
delete Gemini conversations from `gemini.google.com`. Single content script, Shadow DOM UI, no
background script, no build-time framework beyond WXT/Vite.

## Commands

- `npm install` — installs deps (use npm, not yarn/pnpm — `package-lock.json` is the real lockfile).
- `npm run build` — production build → `.output/chrome-mv3/`. Run this after any change to confirm
  the extension still compiles; it's the closest thing to an automated test this repo has (there is
  no test suite — don't invent `npm test`).
- `npm run lint` — ESLint (flat config in `eslint.config.js`, `typescript-eslint` recommended rules).
  Run this too after changes. Note: `no-unused-expressions` is configured with `allowTernary: true`
  since `cond ? doA() : doB()` is an established side-effect-as-statement style used throughout
  `keybindings.ts`/`overlay.ts` — don't "fix" that pattern, it's intentional.
- `npm run dev` — watch mode.
- `npm run zip` — packages `.output/chrome-mv3-<version>.zip` for Chrome Web Store upload.

## Architecture

`entrypoints/content.ts` is the sole entry point. It waits for the Gemini sidebar to appear in the
DOM, then wires up the modules in `modules/`:

- `chat-list.ts` — finds conversation `<a>` elements in the sidebar via `MutationObserver`, extracts
  IDs from `href`, exposes the current list + a change-notification callback.
- `selection.ts` — the `idle`/`active` mode state machine and selected-ID set. Owns CSS class
  toggling on chat rows (and the sidebar container) to reflect selection state.
- `overlay.ts` — the floating slide-out panel UI, built in an isolated Shadow DOM (`SHADOW_CSS`
  template string). By far the largest file (~570 lines) — most panel/animation changes live here.
- `keybindings.ts` — keyboard shortcuts and mouse click/hover delegation; the orchestration layer
  that calls into `selection.ts` and `deleter.ts` based on user input.
- `deleter.ts` — talks to Gemini's undocumented `batchexecute` RPC endpoint to actually delete
  conversations.
- `styles.ts` — injects a plain `<style>` tag into the real page's `document.head` for hover/selected/
  sidebar-highlight classes (separate from `overlay.ts`'s shadow-scoped styles — don't confuse the two
  stylesheets).
- `i18n.ts` / `platform.ts` — tiny `chrome.i18n` wrapper and an `isMac()` helper.

## Gotchas

- **No live Gemini session available to Claude.** There is no Google login in the dev/agent
  environment, so changes cannot be visually verified against the real authenticated app. Verify by
  reading code carefully + `npm run build` succeeding; ask the user to manually test via
  `chrome://extensions` → Load unpacked → `.output/chrome-mv3/`, or to provide a saved HTML snapshot
  of the relevant Gemini page for DOM inspection (the `.gitignore` entries for `gemini.html`/
  `gemini_files/` and `gemini-chat.html`/`gemini-chat_files/` are exactly this — locally saved
  reference pages, never commit them).
- **DOM selectors are coupled to Gemini's internal Angular/Material markup** (e.g.
  `gem-nav-list-item[data-test-id="conversation"]`, `conversations-list[data-test-id="all-conversations"]`).
  This is someone else's SPA — these can change without notice and will fail silently (elements just
  stop being found, no error thrown).
- **Gemini's SPA replaces DOM nodes, not just classes**, when it marks a conversation as active (e.g.
  navigating into an open chat re-renders the sidebar row). Code that caches element references (like
  `chat-list.ts`) must detect this by comparing element identity, not just ID lists, or selection state
  silently stops applying to the now-detached old nodes.
- **Deletion uses a reverse-engineered `batchexecute` RPC** (`rpcid GzXR5e`), with CSRF/session tokens
  scraped from `<script data-id="_gd">` (`window.WIZ_global_data`) in the page. This is inherently
  fragile — it breaks if Google changes the internal API shape, with no compile-time way to detect it.
- **Any user-facing string must be added to all 18 locale files** under `public/_locales/*/messages.json`
  (not just `en`). Chrome's `chrome.i18n` falls back silently on a missing key in a given locale, so a
  missed locale is easy to overlook — check all 18 when touching `t()` calls.

## Repo etiquette

Single-maintainer repo, no branch/PR process — commit directly to `main`.
