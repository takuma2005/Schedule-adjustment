// Googleカレンダーに空き時間検索ボタンを追加するコンテンツスクリプト

let freeTimeButton = null;
let popup = null;

// ページ読み込み完了後にボタンを追加
window.addEventListener('load', () => {
  setTimeout(addFreeTimeButton, 2000);
});

// SPAのページ変更を監視
let currentUrl = location.href;
new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    setTimeout(addFreeTimeButton, 1000);
  }
}).observe(document, {subtree: true, childList: true});

function addFreeTimeButton() {
  // 既存のボタンがあれば削除
  if (freeTimeButton) {
    freeTimeButton.remove();
  }

  // 空き時間検索ボタンを作成（固定配置）
  freeTimeButton = document.createElement('button');
  freeTimeButton.id = 'free-time-finder-btn';
  freeTimeButton.textContent = '空き時間検索';
  freeTimeButton.className = 'free-time-btn';
  // 念のためインラインで固定配置を指定（CSSと二重指定）
  freeTimeButton.style.position = 'fixed';
  freeTimeButton.style.top = '12px';
  freeTimeButton.style.right = '12px';
  freeTimeButton.style.zIndex = '2147483647';
  
  // クリックイベント
  freeTimeButton.addEventListener('click', showFreeTimePopup);
  
  // ボタンを追加
  document.body.appendChild(freeTimeButton);
}

function showFreeTimePopup() {
  // 既存のポップアップを削除
  if (popup) {
    popup.remove();
  }

  // ポップアップを作成
  popup = document.createElement('div');
  popup.id = 'free-time-popup';
  popup.className = 'free-time-popup';
  
  // ポップアップのinner HTMLを作成
  const popupContainer = document.createElement('div');
  popupContainer.className = 'popup-container';
  
  popupContainer.innerHTML = `
    <div class="popup-header">
      <button id="close-popup" class="close-btn">×</button>
    </div>
    <div class="popup-content">
      <div class="output-area">
        <textarea id="free-slots" class="free-time-output" placeholder="空き時間検索結果がここに表示されます。結果を自由に編集できます。"></textarea>
      </div>
      
      <div class="button-section">
        <button id="copy-button" class="copy-btn">コピー</button>
        <button id="update-search" class="update-btn">更新</button>
      </div>
      
      <div class="settings-panel" id="settings-panel">
        <div class="settings-section">
          <div class="date-range-settings">
            <div class="setting-row">
              <label>検索期間</label>
              <div class="date-inputs">
                <input type="date" id="start-date" value="${getDefaultStartDate()}" class="date-input">
                <span>〜</span>
                <input type="date" id="end-date" value="${getDefaultEndDate()}" class="date-input">
              </div>
            </div>
          </div>
          
          <div class="time-settings">
            <div class="time-setting-item">
              <label>開始</label>
              <input type="time" id="start-time" value="09:00" class="time-input">
            </div>
            <div class="time-setting-item">
              <label>終了</label>
              <input type="time" id="end-time" value="20:00" class="time-input">
            </div>
          </div>
          
      <div class="duration-settings">
            <div class="duration-item">
              <label>所要時間</label>
              <div class="duration-input-group">
                <input type="number" id="duration" min="15" max="240" value="30" step="15" class="number-input">
                <span>分</span>
              </div>
            </div>
            <div class="duration-item">
              <label>前後の余裕</label>
              <div class="duration-input-group">
                <input type="number" id="buffer-time" min="0" max="60" value="15" step="5" class="number-input">
                <span>分</span>
              </div>
            </div>
          </div>

          <div class="toggle-settings">
<label><input type="checkbox" id="include-all-day" checked> 終日の予定を予定として含める</label>
          </div>
          <div class="toggle-settings">
            <label><input type="checkbox" id="include-weekends" checked> 土日を含める</label>
          </div>
        </div>
      </div>
    </div>
  `;
  
  popup.appendChild(popupContainer);
  
  document.body.appendChild(popup);
  
  // イベントリスナーを設定
  document.getElementById('close-popup').addEventListener('click', () => {
    popup.remove();
    popup = null;
  });
  
  // コピーボタン
  document.getElementById('copy-button').addEventListener('click', () => {
    const output = document.getElementById('free-slots');
    
    // テキストを選択してコピー
    output.select();
    output.setSelectionRange(0, 99999); // モバイル対応
    
    try {
      // 現代的なClipboard APIを使用
      navigator.clipboard.writeText(output.value).then(() => {
        showCopySuccess();
      }).catch(() => {
        // フォールバック: 古い方法
        document.execCommand('copy');
        showCopySuccess();
      });
    } catch (err) {
      // 最終フォールバック
      document.execCommand('copy');
      showCopySuccess();
    }
    
    function showCopySuccess() {
      const copyBtn = document.getElementById('copy-button');
      const originalText = copyBtn.textContent;
      copyBtn.textContent = 'コピー済';
      copyBtn.style.background = '#4caf50';
      setTimeout(() => {
        copyBtn.textContent = originalText;
        copyBtn.style.background = '';
      }, 1500);
    }
  });
  
  // 設定パネルを常に表示
  const settingsPanel = document.getElementById('settings-panel');
  settingsPanel.style.display = 'block';
  settingsPanel.classList.add('show');
  
  // 入力値のバリデーション
  const durationInput = document.getElementById('duration');
  const bufferTimeInput = document.getElementById('buffer-time');
  
  durationInput.addEventListener('change', () => {
    if (durationInput.value < 15) durationInput.value = 15;
    if (durationInput.value > 240) durationInput.value = 240;
  });
  
  bufferTimeInput.addEventListener('change', () => {
    if (bufferTimeInput.value < 0) bufferTimeInput.value = 0;
    if (bufferTimeInput.value > 60) bufferTimeInput.value = 60;
  });
  
  document.getElementById('update-search').addEventListener('click', () => {
    handleSearch();
  });
  
  // 出力エリアの編集状態を監視
  const outputArea = document.getElementById('free-slots');
  let isEdited = false;
  
  outputArea.addEventListener('input', () => {
    if (!isEdited) {
      isEdited = true;
      outputArea.classList.add('edited');
    }
  });
  
  // 新しい検索結果で編集状態をリセット
  const originalHandleSearch = handleSearch;
  window.handleSearch = function() {
    isEdited = false;
    outputArea.classList.remove('edited');
    originalHandleSearch();
  };
  
  // 初期表示時に空き時間検索を実行
  setTimeout(() => {
    handleSearch();
  }, 100);
  
  // 初回検索を自動実行
  handleSearch();
  
  // ポップアップ外をクリックで閉じる
  popup.addEventListener('click', (e) => {
    if (e.target === popup) {
      popup.remove();
      popup = null;
    }
  });
}

function getDefaultStartDate() {
  // Use local date to avoid UTC shift issues
  const d = new Date();
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

function getDefaultEndDate() {
  const date = new Date();
  date.setDate(date.getDate() + 7);
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const day = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ====== DOM parsing helpers (robust) ======
function normalizeDateOnly(d) {
  const x = new Date(d);
  x.setHours(0,0,0,0);
  return x;
}

function withinRange(day, startDate, endDate) {
  if (!day) return false;
  const d = normalizeDateOnly(day);
  if (!startDate || !endDate) return true;
  return d >= normalizeDateOnly(startDate) && d <= normalizeDateOnly(endDate);
}

function parseYMDLocal(ymd) {
  if (!ymd) return null;
  const parts = ymd.split('-').map(Number);
  if (parts.length !== 3 || parts.some(isNaN)) return null;
  return new Date(parts[0], parts[1]-1, parts[2]);
}

function formatLocalYMD(date) {
  const y = date.getFullYear();
  const m = String(date.getMonth() + 1).padStart(2, '0');
  const d = String(date.getDate()).padStart(2, '0');
  return `${y}-${m}-${d}`;
}

function parseYearSafe(baseDate) {
  return (baseDate && !isNaN(baseDate.getFullYear())) ? baseDate.getFullYear() : (new Date()).getFullYear();
}

function parseDateFromString(s, baseDate) {
  if (!s) return null;
  // YYYY-MM-DD or YYYY/M/D
  let m = s.match(/(\d{4})[\/-](\d{1,2})[\/-](\d{1,2})/);
  if (m) {
    return new Date(parseInt(m[1]), parseInt(m[2])-1, parseInt(m[3]));
  }
  // YYYY年 M月 D日（日本語）
  m = s.match(/(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (m) {
    return new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  }
  // M月D日（日本語）
  m = s.match(/(\d{1,2})\s*月\s*(\d{1,2})\s*日/);
  if (m) {
    const y = parseYearSafe(baseDate);
    return new Date(y, parseInt(m[1])-1, parseInt(m[2]));
  }
  // English like: September 10, 2025 or Sep 10
  m = s.match(/([A-Za-z]+)\s+(\d{1,2})(?:,\s*(\d{4}))?/);
  if (m) {
    const y = m[3] ? parseInt(m[3]) : parseYearSafe(baseDate);
    const monthNames = {
      jan:0,feb:1,mar:2,apr:3,may:4,jun:5,jul:6,aug:7,sep:8,oct:9,nov:10,dec:11
    };
    const idx = monthNames[m[1].slice(0,3).toLowerCase()];
    if (idx != null) return new Date(y, idx, parseInt(m[2]));
  }
  return null;
}

function findDateForElement(el) {
  // Search ancestors for data-date/data-datekey or aria-label containing a date
  const base = new Date();
  const node = el.closest('[data-date], [data-datekey], [role="gridcell"], [aria-label]');
  if (!node) return null;
  const candidates = [
    node.getAttribute('data-date'),
    node.getAttribute('data-datekey'),
    node.getAttribute('aria-label')
  ].filter(Boolean);
  for (const s of candidates) {
    const d = parseDateFromString(s, base);
    if (d) return d;
  }
  // If not found, try parent grid cells
  let p = node.parentElement;
  while (p) {
    const s1 = p.getAttribute && (p.getAttribute('data-date') || p.getAttribute('data-datekey') || p.getAttribute('aria-label'));
    if (s1) {
      const d = parseDateFromString(s1, base);
      if (d) return d;
    }
    p = p.parentElement;
  }
  // Fallback: today
  return new Date();
}

function to24h(h, m, ampm) {
  if (ampm) {
    const a = ampm.toLowerCase();
    if (a.includes('pm') || a.includes('午後')) {
      if (h < 12) h += 12;
    } else if (a.includes('am') || a.includes('午前')) {
      if (h === 12) h = 0;
    }
  }
  return { h, m };
}

function parseTimeRangeFromString(s, baseDate) {
  if (!s) return null;
  // Normalize dashes/tilde
  let str = s.replace(/[–−〜～]/g, '-');

  // Normalize Japanese hour/minute expressions: 11時30分 -> 11:30, 11時 -> 11:00
  str = str.replace(/(\d{1,2})\s*時\s*(\d{1,2})\s*分/g, '$1:$2');
  str = str.replace(/(\d{1,2})\s*時/g, '$1:00');

  // 1) 24h: HH:MM - HH:MM
  let m = str.match(/(\d{1,2})[:：](\d{2})\s*-\s*(\d{1,2})[:：](\d{2})/);
  if (m) {
    const d = new Date(baseDate);
    const start = new Date(d); start.setHours(parseInt(m[1]), parseInt(m[2]), 0, 0);
    const end   = new Date(d); end.setHours(parseInt(m[3]), parseInt(m[4]), 0, 0);
    return { start, end };
  }

  // 2) With 午前/午後 or AM/PM, minutes optional: 午前9:30-午後1 / 9-10am / 9am-10:15am
  m = str.match(/(午前|午後|am|pm|a\.m\.|p\.m\.)?\s*(\d{1,2})(?:[:：](\d{2}))?\s*-\s*(午前|午後|am|pm|a\.m\.|p\.m\.)?\s*(\d{1,2})(?:[:：](\d{2}))?/i);
  if (m) {
    const am1 = m[1] || '';
    let h1 = parseInt(m[2]); let mm1 = m[3] ? parseInt(m[3]) : 0;
    const am2 = m[4] || '';
    let h2 = parseInt(m[5]); let mm2 = m[6] ? parseInt(m[6]) : 0;
    ({h:h1,m:mm1} = to24h(h1, mm1, am1));
    ({h:h2,m:mm2} = to24h(h2, mm2, am2));
    const d = new Date(baseDate);
    const start = new Date(d); start.setHours(h1, mm1, 0, 0);
    const end   = new Date(d); end.setHours(h2, mm2, 0, 0);
    return { start, end };
  }

  // 3) Bare hours: 9-10
  m = str.match(/\b(\d{1,2})\s*-\s*(\d{1,2})\b/);
  if (m) {
    const d = new Date(baseDate);
    const start = new Date(d); start.setHours(parseInt(m[1]), 0, 0, 0);
    const end   = new Date(d); end.setHours(parseInt(m[2]), 0, 0, 0);
    return { start, end };
  }

  return null;
}

function isAllDayLabel(s) {
  if (!s) return false;
  return /終日|all\s*day/i.test(s);
}

// 専用: テキスト内の「最後に現れる日付（日本語表記）」を抽出
function parseLastJPDate(text, baseDate) {
  if (!text) return null;
  let last = null;
  // 1) YYYY年 M月 D日（グローバルに最後を取る）
  const reFull = /(\d{4})\s*年\s*(\d{1,2})\s*月\s*(\d{1,2})\s*日/g;
  let m;
  while ((m = reFull.exec(text)) !== null) {
    last = new Date(parseInt(m[1]), parseInt(m[2]) - 1, parseInt(m[3]));
  }
  if (last) return last;
  // 2) M月 D日（グローバルに最後を取る）
  const reMD = /(\d{1,2})\s*月\s*(\d{1,2})\s*日/g;
  const y = parseYearSafe(baseDate);
  while ((m = reMD.exec(text)) !== null) {
    last = new Date(y, parseInt(m[1]) - 1, parseInt(m[2]));
  }
  return last;
}

function parseRelativeJPDate(text, baseDate) {
  if (!text) return null;
  const d = new Date(baseDate || new Date());
  if (/今日/.test(text)) {
    return new Date(d.getFullYear(), d.getMonth(), d.getDate());
  }
  if (/明日/.test(text)) {
    const t = new Date(d);
    t.setDate(t.getDate() + 1);
    return new Date(t.getFullYear(), t.getMonth(), t.getDate());
  }
  return null;
}

function handleSearch(e) {
  if (e && e.preventDefault) {
    e.preventDefault();
  }
  
  const startDate = document.getElementById('start-date').value;
  const endDate = document.getElementById('end-date').value;
  const startTime = document.getElementById('start-time').value;
  const endTime = document.getElementById('end-time').value;
  const duration = parseInt(document.getElementById('duration').value);
  const bufferTime = parseInt(document.getElementById('buffer-time').value);
  const includeAllDay = document.getElementById('include-all-day').checked;
  const includeWeekends = document.getElementById('include-weekends').checked;
  
  searchFreeTime({
    startDate,
    endDate,
    startTime,
    endTime,
    duration,
    bufferTime,
    includeAllDay,
    includeWeekends
  });
}

function searchFreeTime(params) {
  const freeSlotsDiv = document.getElementById('free-slots');
  
  // ローディング表示（textarea）
  if ('value' in freeSlotsDiv) {
    freeSlotsDiv.value = '検索中...';
  }
  
  try {
    const events = extractCalendarEvents(params.startDate, params.endDate, { includeAllDay: params.includeAllDay });
    const freeSlots = findFreeTimeSlots(events, params);
    displayFreeSlots(freeSlots, freeSlotsDiv);
  } catch (error) {
    freeSlotsDiv.innerHTML = '<div class="error">エラーが発生しました: ' + error.message + '</div>';
  }
}

function extractCalendarEvents(startDate, endDate, options = { includeAllDay: true }) {
  const events = [];
  const processed = new Set();

  try {
    console.log('カレンダーイベントの取得を開始 (.XuJrye 専用)', { startDate, endDate });

    // 期間（ローカル）
    let searchStart = parseYMDLocal(startDate);
    let searchEnd = parseYMDLocal(endDate);
    if (!searchStart || isNaN(searchStart)) searchStart = normalizeDateOnly(new Date());
    if (!searchEnd || isNaN(searchEnd)) { searchEnd = new Date(searchStart); searchEnd.setDate(searchEnd.getDate() + 30); }

    // .XuJrye だけを予定として扱う
    const xuEls = document.querySelectorAll('.XuJrye');
    console.log(`XuJrye候補: ${xuEls.length} 個`);
    xuEls.forEach((el) => {
      try {
        const text = (el.textContent || '').trim();
        if (!text) return;
        // 日付はテキストの最後の日本語日付 > 相対日本語（今日/明日）
        const day = parseLastJPDate(text, searchStart) || parseRelativeJPDate(text, searchStart);
        if (!day || !withinRange(day, searchStart, searchEnd)) return;
        // タイトルは「」内を優先
        const titleMatch = text.match(/「([^」]+)」/);
        const title = titleMatch ? titleMatch[1] : text;

        // 終日対応
        if (isAllDayLabel(text)) {
          if (options.includeAllDay) {
            const start = new Date(day); start.setHours(0,0,0,0);
            const end = new Date(day); end.setHours(23,59,0,0);
            const key = `${normalizeDateOnly(day).getTime()}_allday_${title}`;
            if (processed.has(key)) return;
            processed.add(key);
            events.push({ title, start, end, originalText: text });
          }
          return;
        }

        // 時間帯を抽出
        const tr = parseTimeRangeFromString(text, day);
        if (!tr) return;
        const key = `${normalizeDateOnly(day).getTime()}_${tr.start.getHours()}:${tr.start.getMinutes()}-${tr.end.getHours()}:${tr.end.getMinutes()}_${title}`;
        if (processed.has(key)) return;
        processed.add(key);
        events.push({ title, start: tr.start, end: tr.end, originalText: text });
      } catch (e) {
        console.debug('XuJrye解析エラー', e);
      }
    });

    console.log(`.XuJryeから ${events.length} 件のイベント`);
  } catch (error) {
    console.error('カレンダーイベント取得エラー:', error);
  }

  return events;
}

function extractTimeFromElement(element) {
  // 簡易的な時間抽出（実際のGoogleカレンダーのDOM構造に応じて調整が必要）
  const text = element.textContent || '';
  const timeRegex = /(\d{1,2}):(\d{2})\s*[–-]\s*(\d{1,2}):(\d{2})/;
  const match = text.match(timeRegex);
  
  if (match) {
    const today = new Date();
    const start = new Date(today);
    start.setHours(parseInt(match[1]), parseInt(match[2]), 0, 0);
    
    const end = new Date(today);
    end.setHours(parseInt(match[3]), parseInt(match[4]), 0, 0);
    
    return { start, end };
  }
  
  return null;
}

function findFreeTimeSlots(events, params) {
  const freeSlots = [];
  let startDate = parseYMDLocal(params.startDate);
  let endDate = parseYMDLocal(params.endDate);
  if (!startDate || isNaN(startDate)) startDate = normalizeDateOnly(new Date());
  if (!endDate || isNaN(endDate)) { endDate = new Date(startDate); endDate.setDate(endDate.getDate() + 30); }
  
  // 日付をループ
  for (let currentDate = new Date(startDate); currentDate <= endDate; currentDate.setDate(currentDate.getDate() + 1)) {
    const dow = currentDate.getDay();
    if (params.includeWeekends === false && (dow === 0 || dow === 6)) {
      continue;
    }
    const daySlots = findFreeSlotsForDay(currentDate, events, params);
    freeSlots.push(...daySlots);
  }
  
  return freeSlots;
}

function findFreeSlotsForDay(date, events, params) {
  const freeSlots = [];
  const dateStr = formatLocalYMD(date);
  
  // その日のイベントを抽出
  const dayEvents = events.filter(event => {
    const eventDate = formatLocalYMD(new Date(event.start));
    return eventDate === dateStr;
  }).sort((a, b) => new Date(a.start) - new Date(b.start));
  
  // 開始時間と終了時間を設定
  const [startHour, startMinute] = params.startTime.split(':').map(Number);
  const [endHour, endMinute] = params.endTime.split(':').map(Number);
  
  const dayStart = new Date(date);
  dayStart.setHours(startHour, startMinute, 0, 0);
  
  const dayEnd = new Date(date);
  dayEnd.setHours(endHour, endMinute, 0, 0);
  
  // イベントがない場合は全時間が空き
  if (dayEvents.length === 0) {
    freeSlots.push({
      date: dateStr,
      start: dayStart,
      end: dayEnd,
      duration: (dayEnd - dayStart) / (1000 * 60)
    });
    return freeSlots;
  }
  
  let currentTime = new Date(dayStart);
  let added = 0;
  
  // イベントの間の空き時間を探す
  for (const event of dayEvents) {
    const eventStart = new Date(event.start);
    const eventEnd = new Date(event.end);
    
    // バッファ時間を考慮したイベント時間
    const bufferedEventStart = new Date(eventStart.getTime() - (params.bufferTime * 60 * 1000));
    const bufferedEventEnd = new Date(eventEnd.getTime() + (params.bufferTime * 60 * 1000));
    
    // 業務時間内にクランプ
    const clampedStart = new Date(Math.max(dayStart, bufferedEventStart));
    const clampedEnd = new Date(Math.min(dayEnd, bufferedEventEnd));

    if (clampedStart > currentTime) {
      const gapDuration = (clampedStart - currentTime) / (1000 * 60); // 分
      const requiredTime = params.duration;
      
      if (gapDuration >= requiredTime) {
        freeSlots.push({
          date: dateStr,
          start: new Date(currentTime),
          end: new Date(clampedStart),
          duration: gapDuration
        });
        added++;
      }
    }
    
    currentTime = new Date(Math.max(currentTime, clampedEnd));
  }
  
  // 最後のイベント後の空き時間
  if (currentTime < dayEnd) {
    const gapDuration = (dayEnd - currentTime) / (1000 * 60);
    const requiredTime = params.duration;
    
    if (gapDuration >= requiredTime) {
      freeSlots.push({
        date: dateStr,
        start: new Date(currentTime),
        end: new Date(dayEnd),
        duration: gapDuration
      });
      added++;
    }
  }

  // デバッグ: 今日の判定を可視化
  try {
    const todayStr = formatLocalYMD(new Date());
    if (dateStr === todayStr) {
      console.debug('[FreeTime Debug] 今日', {
        dateStr,
        startTime: params.startTime,
        endTime: params.endTime,
        bufferTime: params.bufferTime,
        duration: params.duration,
        events: dayEvents.map(ev => ({
          start: ev.start.toLocaleString(),
          end: ev.end.toLocaleString(),
          title: ev.title
        })),
        added,
        currentTime: currentTime.toLocaleString()
      });
    }
  } catch {}

  // その日に予定はあるが空きがなかった場合も日付を表示したい
  if (added === 0 && dayEvents.length > 0) {
    freeSlots.push({
      date: dateStr,
      start: dayStart,
      end: dayStart,
      duration: 0,
      noFree: true
    });
  }
  
  return freeSlots;
}

function displayFreeSlots(freeSlots, container) {
  if (freeSlots.length === 0) {
    container.value = '指定された条件で空き時間が見つかりませんでした。';
    return;
  }
  
  // 日付ごとにグループ化
  const slotsByDate = {};
  freeSlots.forEach(slot => {
    if (!slotsByDate[slot.date]) {
      slotsByDate[slot.date] = [];
    }
    slotsByDate[slot.date].push(slot);
  });
  
  const lines = [];
  Object.entries(slotsByDate).forEach(([dateStr, slots]) => {
    const [yy, mm, dd] = dateStr.split('-').map(Number);
    const date = new Date(yy, (mm||1)-1, dd||1);
    const month = date.getMonth() + 1;
    const day = date.getDate();
    const weekday = ['日', '月', '火', '水', '木', '金', '土'][date.getDay()];

    // その日の空き時間のみを表示（空きがない日は出力しない）
    const freeOnly = slots.filter(slot => !slot.noFree);
    if (freeOnly.length === 0) {
      return; // skip this day entirely
    }

    const timeRanges = freeOnly
      .map(slot => {
        const startHour = slot.start.getHours();
        const startMin = slot.start.getMinutes();
        const endHour = slot.end.getHours();
        const endMin = slot.end.getMinutes();
        const startStr = `${String(startHour).padStart(2, '0')}:${String(startMin).padStart(2, '0')}`;
        const endStr = `${String(endHour).padStart(2, '0')}:${String(endMin).padStart(2, '0')}`;
        return `${startStr}-${endStr}`;
      }).join(' / ');

    lines.push(`${month}月 ${day}日 (${weekday}曜日)  ${timeRanges}`);
  });
  
  container.value = lines.length > 0 ? lines.join('\n') : '指定された条件で空き時間が見つかりませんでした。';
}
