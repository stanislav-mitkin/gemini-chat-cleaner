import tseslint from 'typescript-eslint';

export default tseslint.config(
  {
    // .gitignore already excludes these locally-saved Gemini page snapshots
    // (used for DOM inspection, not part of this extension's source).
    ignores: [
      '.output/**', '.wxt/**', 'node_modules/**',
      'gemini.html', 'gemini_files/**',
      'gemini-chat.html', 'gemini-chat_files/**',
    ],
  },
  ...tseslint.configs.recommended,
  {
    rules: {
      // This codebase uses `cond ? doA() : doB()` as a compact if/else for
      // side effects throughout keybindings.ts/overlay.ts — an established
      // style, not a mistake.
      '@typescript-eslint/no-unused-expressions': ['error', { allowTernary: true }],
    },
  },
);
