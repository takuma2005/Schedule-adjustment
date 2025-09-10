// Override the label of the injected button from the reference extension
// - Reads custom label from chrome.storage.sync: { buttonLabel: string }
// - Defaults to '空き時間検索'
// - Keeps watching DOM and re-applies when the reference UI re-renders
(function () {
  const DEFAULT_LABEL = '空き時間検索';

  function getButtonLabel(cb) {
    try {
      if (chrome?.storage?.sync) {
        chrome.storage.sync.get({ buttonLabel: DEFAULT_LABEL }, (res) => {
          cb(res?.buttonLabel || DEFAULT_LABEL);
        });
      } else {
        cb(DEFAULT_LABEL);
      }
    } catch {
      cb(DEFAULT_LABEL);
    }
  }

  function renameCandidates(label) {
    let changed = false;

    const candidates = [
      ...document.querySelectorAll('button, [role="button"]')
    ];

    for (const el of candidates) {
      const text = (el.textContent || '').trim();
      // Replace typical label from the reference extension
      if (/^GOTSUGO$/i.test(text) || /GOTSUGO/i.test(text)) {
        if (el.textContent !== label) {
          el.textContent = label;
          el.setAttribute('title', label);
          changed = true;
        }
      }
      // Also cover our legacy id if present
      if (el.id === 'free-time-finder-btn') {
        if (el.textContent !== label) {
          el.textContent = label;
          el.setAttribute('title', label);
          changed = true;
        }
      }
    }

    return changed;
  }

  function start(label) {
    // Initial try after DOM is ready
    const apply = () => renameCandidates(label);
    if (document.readyState === 'loading') {
      document.addEventListener('DOMContentLoaded', apply);
    } else {
      apply();
    }

    // Watch and re-apply when UI updates
    const mo = new MutationObserver(() => {
      renameCandidates(label);
    });
    mo.observe(document.documentElement || document.body, {
      subtree: true,
      childList: true,
      characterData: true
    });
  }

  getButtonLabel((label) => start(label));
})();

