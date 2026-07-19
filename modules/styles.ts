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

conversations-list.gcc-sidebar-active {
  /* Horizontal-only shadow (no vertical offset/blur) so it isn't clipped by
     the list's vertical overflow — an outline/box-shadow with any vertical
     extent gets cut off top/bottom by the scroll container. */
  box-shadow: -3px 0 0 0 rgba(66, 133, 244, 0.6) !important;
  transition: box-shadow 0.15s ease-out !important;
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
