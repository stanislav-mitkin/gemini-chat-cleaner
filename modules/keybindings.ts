import {
  getMode, enterMode, exitMode,
  toggleById, selectAll, clearAll,
  selectById, deselectById,
  setHovered, getSelectedIds, getSelectedItems,
} from './selection';
import { extractIdFromHref } from './chat-list';
import { deleteConversations } from './deleter';
import {
  showConfirm, showProgress, showDeletedInStrip, clearStatus,
  onSelectButtonClick, onDeleteButtonClick, onClearButtonClick, onExitButtonClick,
} from './overlay';
import { isMac } from './platform';

const CONFIRM_TIMEOUT_MS = 2000;

let pendingDelete = false;
let confirmTimer: ReturnType<typeof setTimeout> | null = null;

// null = brush not active; true = brushing selects; false = brushing deselects
let brushAction: boolean | null = null;

const isModifier = (e: KeyboardEvent) => isMac() ? e.metaKey : e.ctrlKey;

function cancelPending() {
  pendingDelete = false;
  if (confirmTimer) { clearTimeout(confirmTimer); confirmTimer = null; }
  clearStatus();
}

async function executeDelete() {
  const ids = [...getSelectedIds()];
  if (!ids.length) return;

  const items = getSelectedItems();
  items.forEach((item) => {
    // Hide the whole gem-nav-list-item row
    const row = item.element.closest('gem-nav-list-item') ?? item.element.parentElement ?? item.element;
    (row as HTMLElement).style.display = 'none';
  });

  exitMode();

  const result = await deleteConversations(ids, (done, total) => showProgress(done, total));

  result.failed.forEach((failedId) => {
    const item = items.find((it) => it.id === failedId);
    if (item) {
      const row = item.element.closest('gem-nav-list-item') ?? item.element.parentElement ?? item.element;
      (row as HTMLElement).style.display = '';
    }
  });

  showDeletedInStrip(result.succeeded.length, result.failed.length);
}

async function confirmAndDelete() {
  if (!getSelectedIds().size) return;

  if (!pendingDelete) {
    pendingDelete = true;
    showConfirm(getSelectedIds().size);
    confirmTimer = setTimeout(cancelPending, CONFIRM_TIMEOUT_MS);
    return;
  }

  cancelPending();
  await executeDelete();
}

// ── keyboard ──────────────────────────────────────────────────────────────────

function onKeyDown(e: KeyboardEvent) {
  if (isModifier(e) && e.shiftKey && e.code === 'KeyX') {
    e.preventDefault();
    getMode() === 'idle' ? enterMode() : (cancelPending(), exitMode());
    return;
  }

  if (getMode() !== 'active') return;
  if (e.key === 'Shift') return;

  if (e.key === 'Escape') {
    e.preventDefault();
    brushAction = null;
    cancelPending();
    exitMode();
    return;
  }

  const active = document.activeElement;
  const inInput = active && (
    active.tagName === 'INPUT' ||
    active.tagName === 'TEXTAREA' ||
    (active as HTMLElement).isContentEditable
  );
  if (inInput) return;

  switch (e.code) {
    case 'KeyA':
      if (isModifier(e)) { e.preventDefault(); cancelPending(); selectAll(); }
      break;
    case 'KeyD':
      if (isModifier(e)) { e.preventDefault(); cancelPending(); clearAll(); }
      break;
    case 'Enter':
      e.preventDefault();
      confirmAndDelete();
      break;
  }
}

function onKeyUp(e: KeyboardEvent) {
  if (e.key === 'Shift') brushAction = null;
}

// ── mouse: hover + click delegation ──────────────────────────────────────────

const CHAT_SELECTOR = 'gem-nav-list-item[data-test-id="conversation"] a[href*="/app/"]';

function getChatEl(target: EventTarget | null): HTMLAnchorElement | null {
  if (!target || !(target instanceof Element)) return null;
  return target.closest<HTMLAnchorElement>(CHAT_SELECTOR);
}

function onMouseOver(e: MouseEvent) {
  if (getMode() !== 'active') return;
  const el = getChatEl(e.target);
  if (!el) return;
  const id = el.dataset.chatId ?? extractIdFromHref(el.getAttribute('href') || '');
  if (!id) return;
  if (!el.dataset.chatId) el.dataset.chatId = id;
  setHovered(id);

  if (e.shiftKey) {
    if (brushAction === null) {
      brushAction = !getSelectedIds().has(id);
    }
    brushAction ? selectById(id) : deselectById(id);
  }
}

function onMouseOut(e: MouseEvent) {
  if (getMode() !== 'active') return;
  const el = getChatEl(e.target);
  if (!el) return;
  // Keep hover when mouse moves within the same gem-nav-list-item
  const row = el.closest('gem-nav-list-item') ?? el.parentElement;
  if (row && row.contains(e.relatedTarget as Node)) return;
  setHovered(null);
}

function isActionsMenuButton(target: EventTarget | null): boolean {
  if (!target || !(target instanceof Element)) return false;
  return !!target.closest('[data-test-id="actions-menu-button"]');
}

function onMouseDown(e: MouseEvent) {
  if (getMode() !== 'active') return;
  if (isActionsMenuButton(e.target)) {
    e.preventDefault();
    e.stopPropagation();
  }
}

function onClick(e: MouseEvent) {
  if (getMode() !== 'active') return;

  if (isActionsMenuButton(e.target)) {
    e.preventDefault();
    e.stopPropagation();
    return;
  }

  const el = getChatEl(e.target);
  if (!el) return;
  e.preventDefault();
  e.stopPropagation();
  const id = el.dataset.chatId ?? extractIdFromHref(el.getAttribute('href') || '');
  if (id) toggleById(id);
}

// ── init / destroy ────────────────────────────────────────────────────────────

export function initKeybindings() {
  onSelectButtonClick(() => enterMode());
  onDeleteButtonClick(() => executeDelete());
  onClearButtonClick(() => clearAll());
  onExitButtonClick(() => { cancelPending(); exitMode(); });
  document.addEventListener('keydown', onKeyDown, { capture: true });
  document.addEventListener('keyup', onKeyUp, { capture: true });
  document.addEventListener('mousedown', onMouseDown, { capture: true });
  document.addEventListener('mouseover', onMouseOver, { capture: true });
  document.addEventListener('mouseout', onMouseOut, { capture: true });
  document.addEventListener('click', onClick, { capture: true });
}

export function destroyKeybindings() {
  cancelPending();
  brushAction = null;
  document.removeEventListener('keydown', onKeyDown, { capture: true });
  document.removeEventListener('keyup', onKeyUp, { capture: true });
  document.removeEventListener('mousedown', onMouseDown, { capture: true });
  document.removeEventListener('mouseover', onMouseOver, { capture: true });
  document.removeEventListener('mouseout', onMouseOut, { capture: true });
  document.removeEventListener('click', onClick, { capture: true });
}
