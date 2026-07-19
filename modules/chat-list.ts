export interface ChatItem {
  id: string;
  element: HTMLAnchorElement;
  title: string;
}

type ChangeCallback = (chats: ChatItem[]) => void;

let chats: ChatItem[] = [];
let observer: MutationObserver | null = null;
const listeners: ChangeCallback[] = [];

// Extracts conversation ID from gemini.google.com/app/{hex_id}
export function extractIdFromHref(href: string): string | null {
  const match = href.match(/\/app\/([0-9a-f]+)$/i);
  return match ? match[1] : null;
}

function getTitleFromAnchor(el: HTMLAnchorElement): string {
  return el.getAttribute('aria-label') || el.textContent?.trim() || '';
}

function buildChatList(): ChatItem[] {
  const links = document.querySelectorAll<HTMLAnchorElement>(
    'gem-nav-list-item[data-test-id="conversation"] a[href*="/app/"]'
  );
  const result: ChatItem[] = [];
  links.forEach((el) => {
    const id = extractIdFromHref(el.getAttribute('href') || '');
    if (!id) return;
    result.push({ id, element: el, title: getTitleFromAnchor(el) });
  });
  return result;
}

function sameList(a: ChatItem[], b: ChatItem[]): boolean {
  if (a.length !== b.length) return false;
  return a.every((item, i) => item.id === b[i].id && item.element === b[i].element);
}

function refresh() {
  const next = buildChatList();
  // Gemini's SPA often re-renders sidebar rows (e.g. marking the active
  // conversation) by replacing the DOM nodes rather than mutating them, even
  // when the set of chat IDs stays the same. Comparing element references
  // (not just IDs) prevents `chats` from holding stale, detached elements
  // that silently fail to receive hover/selected CSS classes.
  if (sameList(chats, next)) return;
  chats = next;
  listeners.forEach((cb) => cb(chats));
}

export function getChatList(): ChatItem[] { return chats; }
export function onChatListChange(cb: ChangeCallback) { listeners.push(cb); }

export function initChatList() {
  refresh();
  observer = new MutationObserver(() => refresh());
  observer.observe(document.body, { childList: true, subtree: true });
  console.debug('[GCC] Chat list initialized, found:', chats.length, 'chats');
}

export function destroyChatList() {
  observer?.disconnect();
  observer = null;
  chats = [];
  listeners.length = 0;
}
