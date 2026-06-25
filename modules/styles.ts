const STYLE_ID = 'gcc-styles';

const CSS = `
a.gcc-hover {
  outline: 2px solid rgba(66, 133, 244, 0.7) !important;
  outline-offset: -2px !important;
  border-radius: 6px !important;
  cursor: pointer !important;
}

a.gcc-selected {
  background-color: rgba(66, 133, 244, 0.18) !important;
  border-radius: 6px !important;
}

a.gcc-hover.gcc-selected {
  background-color: rgba(66, 133, 244, 0.28) !important;
  outline-color: #4285f4 !important;
}
`;

export function injectStyles() {
  if (document.getElementById(STYLE_ID)) return;
  const el = document.createElement('style');
  el.id = STYLE_ID;
  el.textContent = CSS;
  document.head.appendChild(el);
}

export function removeStyles() {
  document.getElementById(STYLE_ID)?.remove();
}
