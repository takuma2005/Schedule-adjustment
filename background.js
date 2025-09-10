// background.js - Google Calendar API integration via OAuth (implicit flow)
// Note: Set your OAuth Client ID in chrome.storage.sync as { oauthClientId: '...apps.googleusercontent.com' }
// Scopes used: https://www.googleapis.com/auth/calendar.readonly

const SCOPES = [
  'https://www.googleapis.com/auth/calendar.readonly'
];

let tokenCache = {
  accessToken: null,
  expiresAt: 0
};

async function getClientId() {
  return new Promise((resolve) => {
    chrome.storage.sync.get({ oauthClientId: '' }, ({ oauthClientId }) => {
      resolve(oauthClientId || '');
    });
  });
}

function getRedirectUri() {
  // Chrome extensions should use the dynamically generated redirect URI
  // e.g. https://<extension-id>.chromiumapp.org/
  return chrome.identity.getRedirectURL('oauth2');
}

function buildAuthUrl(clientId) {
  const redirectUri = encodeURIComponent(getRedirectUri());
  const scope = encodeURIComponent(SCOPES.join(' '));
  const params = new URLSearchParams({
    client_id: clientId,
    response_type: 'token',
    redirect_uri: decodeURIComponent(redirectUri),
    scope,
    prompt: 'consent',
    include_granted_scopes: 'true'
  });
  return `https://accounts.google.com/o/oauth2/v2/auth?${params.toString()}`;
}

function parseFragmentParams(url) {
  const hashIndex = url.indexOf('#');
  if (hashIndex < 0) return {};
  const fragment = url.slice(hashIndex + 1);
  const usp = new URLSearchParams(fragment);
  const obj = {};
  for (const [k, v] of usp.entries()) obj[k] = v;
  return obj;
}

async function ensureTokenInteractive() {
  const clientId = await getClientId();
  if (!clientId) {
    throw new Error('OAuth Client ID is not set. Save it to chrome.storage.sync as { oauthClientId: "...apps.googleusercontent.com" }');
  }

  const authUrl = buildAuthUrl(clientId);
  const redirectUrl = await new Promise((resolve, reject) => {
    chrome.identity.launchWebAuthFlow(
      {
        url: authUrl,
        interactive: true
      },
      (responseUrl) => {
        if (chrome.runtime.lastError) {
          reject(new Error(chrome.runtime.lastError.message));
          return;
        }
        if (!responseUrl) {
          reject(new Error('Empty responseUrl from launchWebAuthFlow'));
          return;
        }
        resolve(responseUrl);
      }
    );
  });

  const params = parseFragmentParams(redirectUrl);
  const accessToken = params['access_token'];
  const expiresIn = parseInt(params['expires_in'] || '0', 10);
  if (!accessToken) throw new Error('Access token not found in auth response');

  tokenCache.accessToken = accessToken;
  tokenCache.expiresAt = Date.now() + (isFinite(expiresIn) ? expiresIn * 1000 : 3600 * 1000);
  return accessToken;
}

async function getAccessToken() {
  if (tokenCache.accessToken && Date.now() < tokenCache.expiresAt - 10_000) {
    return tokenCache.accessToken;
  }
  // Always use interactive flow when needed. You can optimize by trying non-interactive first.
  return ensureTokenInteractive();
}

async function callFreeBusy({ timeMin, timeMax, calendarId = 'primary' }) {
  const accessToken = await getAccessToken();
  const resp = await fetch('https://www.googleapis.com/calendar/v3/freeBusy', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      'Authorization': `Bearer ${accessToken}`
    },
    body: JSON.stringify({
      timeMin,
      timeMax,
      items: [{ id: calendarId }]
    })
  });
  if (!resp.ok) {
    const text = await resp.text();
    throw new Error(`freeBusy error: ${resp.status} ${text}`);
  }
  const data = await resp.json();
  return data; // { calendars: { [id]: { busy: [{ start, end }, ...] } } }
}

chrome.runtime.onMessage.addListener((msg, sender, sendResponse) => {
  (async () => {
    if (msg?.type === 'AUTH') {
      const token = await getAccessToken();
      sendResponse({ ok: true, token });
      return;
    }
    if (msg?.type === 'FREEBUSY') {
      const data = await callFreeBusy({
        timeMin: msg.timeMin,
        timeMax: msg.timeMax,
        calendarId: msg.calendarId || 'primary'
      });
      sendResponse({ ok: true, data });
      return;
    }
    sendResponse({ ok: false, error: 'Unknown message type' });
  })().catch(err => {
    console.error(err);
    sendResponse({ ok: false, error: String(err && err.message || err) });
  });
  // Indicate we will send a response asynchronously
  return true;
});

