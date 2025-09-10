# 技術仕様書

Google Calendar Free Time Finder の技術的詳細と開発者向け情報をまとめたドキュメントです。

## 🏗️ アーキテクチャ概要

### システム構成図
```
┌─────────────────┐    ┌─────────────────┐    ┌─────────────────┐
│   Google        │    │   Chrome        │    │   Content       │
│   Calendar      │◄──►│   Extension     │◄──►│   Script        │
│   (calendar.    │    │   (manifest.    │    │   (content.js)  │
│   google.com)   │    │   json)         │    │                 │
└─────────────────┘    └─────────────────┘    └─────────────────┘
        ▲                        │                        │
        │                        ▼                        ▼
        │               ┌─────────────────┐    ┌─────────────────┐
        └───────────────│   UI Injection  │    │   DOM Parser    │
                        │   (styles.css)  │    │   (Event        │
                        │                 │    │   Extraction)   │
                        └─────────────────┘    └─────────────────┘
```

### 主要コンポーネント

1. **Manifest V3 Extension**: Chrome拡張機能の核となる設定
2. **Content Script**: Googleカレンダーページに注入されるメインロジック
3. **DOM Parser**: カレンダーDOM解析エンジン
4. **UI Injector**: 検索ボタンとポップアップの動的生成
5. **Time Calculator**: 空き時間計算アルゴリズム

## 📋 ファイル別詳細仕様

### 1. manifest.json
**役割**: Chrome拡張機能の設定とメタデータ

```json
{
  "manifest_version": 3,
  "name": "Google Calendar Free Time Finder",
  "version": "1.0",
  "description": "Googleカレンダーの空き時間を検索・表示する拡張機能",
  "permissions": ["activeTab", "storage"],
  "content_scripts": [{
    "matches": [
      "https://calendar.google.com/*",
      "https://calendar.google.com/calendar/*/*"
    ],
    "js": ["content.js"],
    "css": ["styles.css"],
    "run_at": "document_end"
  }],
  "action": {
    "default_popup": "popup.html",
    "default_title": "空き時間検索"
  }
}
```

**セキュリティ要件**:
- `activeTab`: 現在アクティブなタブへの一時的アクセス
- `storage`: 拡張機能設定の永続化
- ホスト権限: calendar.google.com ドメインのみ

### 2. content.js（メインロジック）
**ファイルサイズ**: 約700行  
**主要関数**:

#### 2.1 初期化・UI生成
```javascript
// エントリーポイント
window.addEventListener('load', () => {
  setTimeout(addFreeTimeButton, 2000);
});

// SPA対応のURL変更監視
new MutationObserver(() => {
  if (location.href !== currentUrl) {
    currentUrl = location.href;
    setTimeout(addFreeTimeButton, 1000);
  }
}).observe(document, {subtree: true, childList: true});
```

#### 2.2 DOM解析エンジン
```javascript
function extractCalendarEvents(startDate, endDate, options) {
  // .XuJrye 要素の検索と解析
  const xuEls = document.querySelectorAll('.XuJrye');
  
  xuEls.forEach((el) => {
    const text = (el.textContent || '').trim();
    // 日付解析
    const day = parseLastJPDate(text, searchStart) || 
                parseRelativeJPDate(text, searchStart);
    // 時間抽出
    const timeRange = parseTimeRangeFromString(text, day);
    // イベント登録
    if (timeRange) {
      events.push({...});
    }
  });
}
```

#### 2.3 日時解析エンジン
```javascript
function parseTimeRangeFromString(text, baseDate) {
  // 対応形式:
  // - "9:00-10:30", "09:00〜10:30"
  // - "午前9時-午後2時"
  // - "9:00 AM - 2:00 PM"
  // - "終日", "all day"
  
  const patterns = [
    // 24時間形式
    /(\\d{1,2}):(\\d{2})\\s*[-–—〜～]\\s*(\\d{1,2}):(\\d{2})/,
    // AM/PM形式
    /(\\d{1,2}):(\\d{2})\\s*([APap][Mm])\\s*[-–—〜～]\\s*(\\d{1,2}):(\\d{2})\\s*([APap][Mm])/,
    // 日本語時間
    /午前(\\d{1,2})時\\s*[-–—〜～]\\s*午後(\\d{1,2})時/
  ];
  
  // パターンマッチングとDate オブジェクト生成
}
```

#### 2.4 空き時間計算アルゴリズム
```javascript
function findFreeSlotsForDay(date, events, params) {
  // 1. その日のイベントを時系列ソート
  const dayEvents = events.filter(event => 
    formatLocalYMD(event.start) === dateStr
  ).sort((a, b) => new Date(a.start) - new Date(b.start));
  
  // 2. バッファ時間を考慮したイベント境界計算
  // 3. イベント間のギャップを検出
  // 4. 必要時間以上のギャップを空き時間として抽出
  
  for (const event of dayEvents) {
    const bufferedStart = new Date(event.start.getTime() - (params.bufferTime * 60 * 1000));
    const bufferedEnd = new Date(event.end.getTime() + (params.bufferTime * 60 * 1000));
    
    if (gapDuration >= params.duration) {
      freeSlots.push({...});
    }
  }
}
```

### 3. styles.css（UI スタイル）
**役割**: 注入されるUIコンポーネントのスタイル定義

```css
/* メインボタン */
.free-time-btn {
  position: fixed !important;
  top: 12px !important;
  right: 12px !important;
  z-index: 2147483647 !important;  /* 最高優先度 */
  background-color: #1976d2;
  color: white;
  border: none;
  border-radius: 4px;
  padding: 8px 16px;
  font-size: 14px;
  cursor: pointer;
  transition: background-color 0.3s ease;
}

/* ポップアップオーバーレイ */
.free-time-popup {
  position: fixed !important;
  top: 0 !important;
  left: 0 !important;
  width: 100vw !important;
  height: 100vh !important;
  background-color: rgba(0, 0, 0, 0.5) !important;
  z-index: 2147483646 !important;
  display: flex !important;
  align-items: center !important;
  justify-content: center !important;
}
```

**設計原則**:
- `!important` による優先度確保
- Google Calendar CSSとの競合回避
- レスポンシブデザイン対応

### 4. popup.html（拡張機能ポップアップ）
**役割**: 拡張機能アイコンクリック時の簡易情報表示

```html
<!DOCTYPE html>
<html>
<head>
    <meta charset="utf-8">
    <style>
        body { width: 200px; padding: 10px; }
        .status { margin: 10px 0; }
    </style>
</head>
<body>
    <h3>空き時間検索</h3>
    <p>Googleカレンダーページで<br>「空き時間検索」ボタンをクリックしてください。</p>
    <div class="status">
        <small>週表示でご利用ください</small>
    </div>
</body>
</html>
```

## 🔍 DOM解析の詳細

### Googleカレンダー DOM構造分析

#### 週表示での要素構造
```html
<div class="XuJrye">
  今日 9:00-10:30 「プロジェクト会議」
</div>
<div class="XuJrye">
  明日 終日 「出張」
</div>
<div class="XuJrye">
  9月10日 14:00〜15:30 「面談」
</div>
```

#### 解析対象セレクタ
```javascript
const primarySelector = '.XuJrye';  // 週表示のイベント要素
const fallbackSelectors = [
  '[data-eventid]',     // イベントID属性
  '.EeJKSd',           // 月表示要素（参考）
  '[role="button"]'    // クリック可能イベント
];
```

### 日付解析パターン

#### 対応する日付形式
1. **相対日付**:
   - 今日, 明日
   - today, tomorrow

2. **絶対日付**:
   - 9月10日, 9/10, 9月10日(月)
   - September 10, Sep 10, 9/10/2024

3. **ISO形式**:
   - 2024-09-10
   - data-date属性値

#### 時間解析パターン
```javascript
const timePatterns = [
  // 基本形式: HH:MM-HH:MM
  /(\d{1,2}):(\d{2})\s*[-–—〜～]\s*(\d{1,2}):(\d{2})/,
  
  // AM/PM形式: H:MM AM - H:MM PM
  /(\d{1,2}):(\d{2})\s*([APap][Mm])\s*[-–—〜～]\s*(\d{1,2}):(\d{2})\s*([APap][Mm])/,
  
  // 日本語形式: 午前H時-午後H時
  /午前(\d{1,2})時\s*[-–—〜～]\s*午後(\d{1,2})時/,
  
  // 単体時間: HH:MM
  /(\d{1,2}):(\d{2})/,
  
  // 終日判定
  /終日|all\s*day|全日/i
];
```

## ⚡ パフォーマンス仕様

### 処理時間目標
- **初期化**: < 2秒（ページ読み込み後）
- **DOM解析**: < 1秒（通常の週表示）
- **空き時間計算**: < 500ms（1週間分）
- **UI描画**: < 200ms

### メモリ使用量
- **最大メモリ使用量**: < 10MB
- **DOM要素キャッシュ**: < 1000要素
- **イベントデータ**: < 1MB（1ヶ月分）

### 最適化手法
```javascript
// 1. デバウンス処理
const debouncedSearch = debounce(handleSearch, 300);

// 2. 要素キャッシュ
const elementCache = new Map();

// 3. 重複除去
const processedEvents = new Set();

// 4. 範囲外データの早期スキップ
if (!withinRange(eventDate, searchStart, searchEnd)) {
  continue;
}
```

## 🛡️ エラーハンドリング

### エラー分類と対処

#### 1. DOM解析エラー
```javascript
try {
  const events = extractCalendarEvents(startDate, endDate);
} catch (error) {
  console.error('カレンダーイベント取得エラー:', error);
  // フォールバック処理
  showErrorMessage('イベントの取得に失敗しました');
}
```

#### 2. 日時解析エラー
```javascript
function parseDate(dateString) {
  try {
    return new Date(dateString);
  } catch {
    // デフォルト値を返す
    return new Date();
  }
}
```

#### 3. ネットワークエラー
- オフライン時の動作制限
- タイムアウト処理
- リトライ機構

## 🔧 開発・テスト環境

### 開発環境セットアップ
```bash
# リポジトリクローン
git clone https://github.com/takuma2005/Schedule-adjustment.git
cd Schedule-adjustment

# 開発用サーバー（任意）
python -m http.server 8000

# Chrome拡張機能読み込み
# chrome://extensions/ → 開発者モード → パッケージ化されていない拡張機能を読み込む
```

### デバッグ設定
```javascript
// デバッグフラグ
const DEBUG = true;

// ログ出力制御
function debugLog(message, data) {
  if (DEBUG) {
    console.log(`[FreeTime Debug] ${message}`, data);
  }
}

// パフォーマンス計測
console.time('DOM解析');
// ... 処理 ...
console.timeEnd('DOM解析');
```

### テストケース
```javascript
// 基本機能テスト
testCases = [
  {
    name: '基本的な時間範囲解析',
    input: '9:00-10:30',
    expected: { start: '09:00', end: '10:30' }
  },
  {
    name: '日本語相対日付',
    input: '今日 14:00-15:00',
    expected: { date: 'today', start: '14:00', end: '15:00' }
  },
  {
    name: '終日イベント',
    input: '明日 終日 出張',
    expected: { date: 'tomorrow', allDay: true }
  }
];
```

## 🚀 デプロイメント・配布

### Chrome Web Store 公開準備
1. **マニフェスト最適化**
2. **アイコン作成** (16x16, 48x48, 128x128)
3. **スクリーンショット準備**
4. **プライバシーポリシー作成**
5. **説明文・キーワード設定**

### バージョン管理
```javascript
// manifest.json
{
  "version": "1.0.0",  // semantic versioning
  "version_name": "1.0 - Initial Release"
}

// 更新履歴
// 1.0.0 - 初期リリース
// 1.0.1 - バグ修正版  
// 1.1.0 - 機能追加版
// 2.0.0 - 大幅変更版
```

## 📊 拡張可能性

### 今後の機能拡張計画
1. **API統合**: Google Calendar API との連携
2. **複数カレンダー対応**: 統合カレンダーでの動作
3. **時間帯提案**: AI による最適時間帯提案
4. **外部連携**: Slack, Teams との統合
5. **モバイル対応**: Progressive Web App 化

### アーキテクチャ拡張
```javascript
// プラグインシステム
class ExtensionPlugin {
  constructor(name) {
    this.name = name;
  }
  
  onEventExtract(events) {
    // イベント抽出時の処理
  }
  
  onFreeTimeCalculate(freeSlots) {
    // 空き時間計算時の処理
  }
}

// プラグイン登録
PluginManager.register(new SlackIntegrationPlugin());
PluginManager.register(new AIRecommendationPlugin());
```

## 📝 ライセンス・法的事項

### オープンソースライセンス
- **License**: MIT License
- **著作権**: Copyright (c) 2024
- **商用利用**: 可能
- **再配布**: 可能（ライセンス表示必須）

### プライバシー方針
- **データ収集**: なし
- **外部送信**: なし  
- **ローカル保存**: 設定データのみ（chrome.storage.sync）
- **第三者提供**: なし

### Google API 規約遵守
- DOM操作によるデータ取得（公開情報のみ）
- スクレイピング制限の遵守
- 利用規約違反の回避

---

**メンテナンス情報**: 
- Google Calendar の仕様変更に対応するため、3ヶ月に1回の動作確認を推奨
- DOM セレクタの変更が最も影響を受けやすい部分
- 主要ブラウザでの動作確認: Chrome 90+, Edge 90+
