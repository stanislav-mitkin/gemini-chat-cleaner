import { initChatList, onChatListChange, destroyChatList } from '../modules/chat-list';
import { initKeybindings, destroyKeybindings } from '../modules/keybindings';
import { injectStyles, removeStyles } from '../modules/styles';
import { refreshClasses } from '../modules/selection';
import { initOverlay, destroyOverlay } from '../modules/overlay';

export default defineContentScript({
  matches: ['https://gemini.google.com/*'],
  main() {
    injectStyles();
    initOverlay();

    waitForSidebar(() => {
      initChatList();
      initKeybindings();
      onChatListChange(() => refreshClasses());
    });

    return () => {
      destroyKeybindings();
      destroyChatList();
      destroyOverlay();
      removeStyles();
    };
  },
});

function waitForSidebar(cb: () => void) {
  if (document.querySelector('gem-nav-list-item[data-test-id="conversation"]')) { cb(); return; }
  const mo = new MutationObserver(() => {
    if (document.querySelector('gem-nav-list-item[data-test-id="conversation"]')) {
      mo.disconnect();
      cb();
    }
  });
  mo.observe(document.body, { childList: true, subtree: true });
}
