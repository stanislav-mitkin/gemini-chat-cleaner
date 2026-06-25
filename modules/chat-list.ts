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

function refresh() {
  const next = buildChatList();
  const prevIds = chats.map((c) => c.id).join(',');
  const nextIds = next.map((c) => c.id).join(',');
  if (prevIds === nextIds) return;
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
