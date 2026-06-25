const CHUNK_SIZE = 5;
const CHUNK_DELAY_MS = 200;

interface DeleteResult {
  succeeded: string[];
  failed: string[];
}

// Captured from network: POST /_/BardChatUi/data/batchexecute?rpcids=GzXR5e&...
const DELETE_RPC = 'GzXR5e';

let reqId = Math.floor(Math.random() * 9_000_000) + 1_000_000;

interface PageData { atToken: string; bl: string; fSid: string; }

// Walk the raw script text to find the exact closing } of the top-level JSON object,
// correctly skipping braces inside strings and escaped characters.
function extractJsonObject(raw: string, start: number): string | null {
  let depth = 0;
  let inStr = false;
  let esc = false;
  for (let i = start; i < raw.length; i++) {
    const c = raw[i];
    if (esc)          { esc = false; continue; }
    if (c === '\\' && inStr) { esc = true;  continue; }
    if (c === '"')    { inStr = !inStr; continue; }
    if (inStr)        continue;
    if (c === '{')    depth++;
    else if (c === '}') { if (--depth === 0) return raw.slice(start, i + 1); }
  }
  return null;
}

// Content scripts run in ISOLATED world — cannot access window.WIZ_global_data directly.
// But WIZ_global_data is already in the DOM as text inside <script data-id="_gd">,
// so we parse it from there without any script injection (no CSP issues).
function extractPageData(): PageData | null {
  try {
    const scriptEl = document.querySelector<HTMLScriptElement>('script[data-id="_gd"]');
    if (!scriptEl) {
      console.error('[GCC] <script data-id="_gd"> not found');
      return null;
    }
    const raw = scriptEl.textContent ?? '';
    const start = raw.indexOf('{');
    if (start < 0) {
      console.error('[GCC] could not find JSON object in script tag');
      return null;
    }
    // Walk brackets to find the exact closing } of the top-level object
    const jsonStr = extractJsonObject(raw, start);
    if (!jsonStr) {
      console.error('[GCC] could not extract JSON from script tag');
      return null;
    }
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const d: any = JSON.parse(jsonStr);
    const data: PageData = {
      atToken: d.SNlM0e ?? '',
      bl:      d.cfb2h  ?? '',
      fSid:    d.FdrFJe ?? '',
    };
    console.debug('[GCC] extractPageData:', data);
    return data;
  } catch (err) {
    console.error('[GCC] extractPageData error:', err);
    return null;
  }
}

function buildUrl(id: string, data: PageData): string {
  const params = new URLSearchParams({
    rpcids:        DELETE_RPC,
    'source-path': `/app/${id}`,
    bl:            data.bl,
    'f.sid':       data.fSid,
    hl:            navigator.language.split('-')[0] || 'en',
    _reqid:        String(reqId += 100),
    rt:            'c',
  });
  return `https://gemini.google.com/_/BardChatUi/data/batchexecute?${params}`;
}

async function deleteOne(id: string, atToken: string, data: PageData): Promise<boolean> {
  const convId = `c_${id}`;
  const fReq = JSON.stringify([[[DELETE_RPC, JSON.stringify([convId]), null, 'generic']]]);
  const body = new URLSearchParams({ 'f.req': fReq, at: atToken }).toString() + '&';
  const url = buildUrl(id, data);

  console.debug('[GCC] deleteOne →', url);
  console.debug('[GCC] body →', body);

  try {
    const res = await fetch(url, {
      method: 'POST',
      credentials: 'include',
      mode: 'cors',
      headers: {
        'Content-Type': 'application/x-www-form-urlencoded;charset=UTF-8',
        'x-same-domain': '1',
      },
      body,
    });
    const text = await res.text().catch(() => '(unreadable)');
    console.debug('[GCC] response status:', res.status, res.statusText);
    console.debug('[GCC] response body (first 300):', text.slice(0, 300));
    return res.ok;
  } catch (err) {
    console.error('[GCC] fetch error:', err);
    return false;
  }
}

function chunk<T>(arr: T[], size: number): T[][] {
  const out: T[][] = [];
  for (let i = 0; i < arr.length; i += size) out.push(arr.slice(i, i + size));
  return out;
}

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

export async function deleteConversations(
  ids: string[],
  onProgress?: (done: number, total: number) => void,
): Promise<DeleteResult> {
  console.debug('[GCC] deleteConversations, ids:', ids);

  const pageData = extractPageData();
  if (!pageData) {
    console.error('[GCC] extractPageData returned null');
    return { succeeded: [], failed: ids };
  }
  if (!pageData.atToken) {
    console.error('[GCC] at token is empty — WIZ_global_data.SNlM0e not found');
    return { succeeded: [], failed: ids };
  }

  const succeeded: string[] = [];
  const failed: string[] = [];
  const chunks = chunk(ids, CHUNK_SIZE);
  let done = 0;

  for (const batch of chunks) {
    const results = await Promise.all(batch.map((id) => deleteOne(id, pageData.atToken, pageData)));
    batch.forEach((id, i) => {
      if (results[i]) succeeded.push(id);
      else failed.push(id);
    });
    done += batch.length;
    onProgress?.(done, ids.length);
    if (done < ids.length) await sleep(CHUNK_DELAY_MS);
  }

  return { succeeded, failed };
}
