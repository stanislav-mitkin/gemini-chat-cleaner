---
name: add-locale-string
description: Workflow for adding or changing a user-facing string in this extension. Use whenever adding a new t() call, changing existing UI copy, or touching anything under public/_locales/. Ensures all 18 locales stay in sync instead of only updating en.
---

This extension has 18 locales under `public/_locales/<locale>/messages.json`: ar, de, en, es, fr, id,
it, ja, ko, nl, pl, pt_BR, pt_PT, ru, tr, vi, zh_CN, zh_TW. `chrome.i18n` falls back silently on a
missing key for a given locale — a forgotten locale produces no error, just wrong/blank text for those
users. `en` is `default_locale` (set in `wxt.config.ts`) but is not a substitute for the others.

When adding or changing a UI string:

1. Add/edit the key in `public/_locales/en/messages.json` first, matching the existing shape (a
   `message` field, plus a `placeholders` block if the string takes a `$VAR$`-style substitution — see
   existing keys like `btn_delN`/`selN`/`confN` for the placeholder pattern with `$COUNT$`).
2. Propagate the same key to the other 17 locale files with a real translation (not a copy-pasted
   English placeholder) — match the tone of the existing strings in that locale file. If you can't
   produce a confident translation for a locale, say so explicitly to the user rather than guessing
   silently; don't leave a key missing.
3. Reference it in code via `t('key_name')` (or `t('key_name', [arg])` for placeholder substitution)
   from `modules/i18n.ts` — never hardcode user-facing text inline.
4. If the change is to the Chrome Web Store *listing* copy (not in-extension UI text), the relevant
   files are `store/description.txt` (English) and `store/description.<locale>.txt` — these are a
   separate set of files from `public/_locales/`, don't confuse the two.
5. Run `npm run build` and confirm all locale JSON files still parse (a build failure here usually
   means malformed JSON in one of the 18 files — check the one you just edited).
