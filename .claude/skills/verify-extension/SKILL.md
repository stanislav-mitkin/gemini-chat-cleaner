---
name: verify-extension
description: Verification checklist for this repo before considering a change done — run the build and be explicit about what can't be checked automatically (no live Gemini session available). Use after editing any file under entrypoints/ or modules/, or before telling the user a fix/feature is complete.
---

This repo has no test suite and no live authenticated Gemini session available in this environment —
`npm run build` succeeding is necessary but not sufficient proof a change works.

1. Run `npm run build` and `npm run lint` from the repo root. Both must succeed with no errors. There
   is no test suite — don't invent or look for `npm test`.
2. Re-read the diff against the DOM assumptions in CLAUDE.md: does it rely on a specific Gemini
   selector (`gem-nav-list-item`, `conversations-list[data-test-id="all-conversations"]`, `<script
   data-id="_gd">`, etc.)? If so, double check the assumption against any saved reference HTML the
   user has provided (commonly `gemini.html`/`gemini_files/` or `gemini-chat.html`/`gemini-chat_files/`
   in the repo root — gitignored, not always present) rather than guessing from memory.
3. If the change touches selection/highlight state (`selection.ts`, `styles.ts`, `overlay.ts`), reason
   through the enter/exit symmetry by hand: does every class added on mode-enter get removed on
   mode-exit, and vice versa? There's no runtime check for this.
4. State plainly, in the final report to the user, that visual/behavioral confirmation on the real
   Gemini page has NOT been done, and that the build passing only proves the TypeScript compiles and
   bundles. Ask the user to test via `chrome://extensions` → Developer mode → Load unpacked →
   `.output/chrome-mv3/`, or offer to inspect a saved HTML snapshot if they can provide one — don't
   claim the feature "works" without one of those two.
