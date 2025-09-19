# 空いてる時間書き出してくれるやつ

Googleカレンダーの週表示から空き時間を自動検索・表示するChrome拡張機能です。

## 特徴

### 🎯 高精度イベント抽出
- Googleカレンダーの週表示から確実にイベントを抽出
- 日本語/英語の日時形式に対応
- 相対日付表現（今日/明日）の自動解析
- 終日イベントの適切な処理

### ⚙️ 柔軟な設定オプション
- **検索期間**: 開始日～終了日を自由に設定
- **検索時間帯**: 営業時間や希望時間帯に絞った検索
- **所要時間**: 15分～240分（15分刻み）で設定可能
- **前後の余裕時間**: 会議の前後バッファ時間を考慮
- **土日の除外**: 平日のみの検索オプション
- **終日予定の扱い**: 終日イベントがある日の除外オプション

### 📋 使いやすいUI
- 右上固定位置の「空き時間検索」ボタン
- 折りたたみ可能な詳細設定パネル
- ワンクリックでのコピー機能
- リサイズ可能な結果表示エリア

## インストール方法

### 1. 開発者モードの有効化
1. Google Chromeを開く
2. アドレスバーに `chrome://extensions/` と入力
3. 右上の「デベロッパーモード」トグルを有効にする

### 2. 拡張機能の読み込み
1. 「パッケージ化されていない拡張機能を読み込む」をクリック
2. このプロジェクトフォルダを選択
3. 拡張機能が一覧に追加されることを確認

## 使用方法

### 🔗 クイックアクセス
**GoogleカレンダーのDURL**: 以下をコピーしてブラウザのアドレスバーに貼り付けてください。
```
https://calendar.google.com/
```

### 基本的な使い方
1. Googleカレンダーを開く
   - **方法1**: アドレスバーに `https://calendar.google.com/` をコピー・ペースト
   - **方法2**: Google検索で「Google カレンダー」と入力してアクセス
   - **方法3**: Googleアプリメニュー（アイコン一覧）から「カレンダー」を選択
2. **週表示**に切り替える（重要: 月表示や日表示では正しく動作しません）
   - カレンダー上部の表示切り替えボタンで「週」または「Week」をクリック
   - キーボードショートカット: `W` キーを押す
   - 週表示では1週間分の予定が横方向に並んで表示されます
3. 画面右上の「空き時間検索」ボタンをクリック
4. デフォルト設定で「更新」ボタンを押すか、設定をカスタマイズ

### 設定のカスタマイズ
1. 「設定」ボタンをクリックして設定パネルを開く
2. 各項目を必要に応じて調整：
   - **検索期間**: 今日から1週間後などの期間設定
   - **時間範囲**: 9:00-18:00（営業時間）など
   - **所要時間**: ミーティング時間（30分、60分など）
   - **前後の余裕**: 移動時間や準備時間（15分推奨）
   - **終日の予定を予定として含める**: チェックを外すと終日予定がある日を除外
   - **土日を含める**: チェックを外すと平日のみ検索
3. 「更新」ボタンで検索実行

### 結果の活用
- 表示された空き時間をコピーして、メールやスケジュール調整に使用
- 複数の候補時間が表示されるため、相手方に選択肢を提示可能

## 技術仕様

### 対応ブラウザ
- Google Chrome（Manifest V3 対応）
- Microsoft Edge（Chromiumベース）

### 対応Googleカレンダービュー
- ✅ 週表示（必須・推奨）
- ❌ 月表示（現在未対応）
- ❌ 日表示（現在未対応）

### イベント抽出の仕組み
拡張機能は以下の方式でイベントを検出します：

1. **DOM要素の監視**: 週表示のイベントを含む要素を検索
2. **日付解析**: イベントテキストから日付情報を抽出
3. **時間抽出**: 24時間形式、AM/PM表記、日本語時間表現に対応
4. **重複除去**: 同一イベントの重複を自動排除
5. **空き時間計算**: イベント間のギャップを算出し、条件に合致する時間を抽出

## ファイル構成

```
Schedule-adjustment/
├── manifest.json          # Chrome拡張機能のマニフェストファイル
├── content.js             # メインロジック（DOM解析・空き時間検索）
├── styles.css             # UI スタイルシート
├── popup.html             # 拡張機能アイコンクリック時のポップアップ
├── background.js          # サービスワーカー（現在未使用）
├── assets/                # 静的リソース
│   ├── content-script-loader.index.tsx.d4aa0665.33e3b97f.js
│   ├── index.tsx.d4aa0665.js
│   └── override-gotsugo.js
└── README.md              # このドキュメント
```

### 主要ファイルの説明

- **manifest.json**: Chrome拡張機能の設定・権限定義
- **content.js**: カレンダーページに注入されるメインスクリプト（約700行）
  - DOM監視とイベント抽出
  - 日本語/英語日時解析
  - 空き時間計算アルゴリズム
  - UI生成・イベントハンドリング
- **styles.css**: ボタン・ポップアップのスタイル定義
- **popup.html**: 拡張機能アイコンからアクセスするポップアップページ

## トラブルシューティング

### よくある問題

#### 1. ボタンが表示されない
- **原因**: Googleカレンダーが完全に読み込まれていない
- **解決策**: ページを再読み込みして2秒ほど待つ

#### 2. 空き時間が表示されない
- **原因**: 月表示または日表示になっている
- **解決策**: 週表示に切り替える

#### 3. イベントが正しく認識されない
- **原因**: Googleカレンダーの仕様変更
- **解決策**: ブラウザの開発者コンソールでエラーを確認、issueを報告

#### 4. 日本語の日時が正しく解析されない
- **確認点**: 
  - イベントタイトルに日付・時間情報が含まれているか
  - 対応形式: "9:00", "午前9時", "今日", "明日" など

### デバッグ方法

1. ブラウザの開発者ツール（F12）を開く
2. Consoleタブで以下のメッセージを確認：
   ```
   カレンダーイベントの取得を開始 (週表示専用)
   週表示要素候補: XX 個
   抽出したイベント: XX 件
   [FreeTime Debug] 今日 {...}
   ```
3. エラーメッセージがある場合は内容を確認

## 制限事項・注意点

### 技術的制限
- GoogleカレンダーのDOM構造に依存するため、Google側のアップデートで動作不良の可能性
- 複雑な繰り返しイベントや例外設定への完全対応は限定的
- 複数カレンダーの統合表示における一部制約

### 使用上の注意
- **プライバシー**: 拡張機能はブラウザ内でのみ動作し、データを外部送信しません
- **パフォーマンス**: 大量のイベントがある場合、処理に数秒要する場合があります
- **正確性**: 抽出結果は参考値として使用し、重要なスケジュールでは必ず手動確認してください

## 開発・カスタマイズ

### ローカル開発
1. このリポジトリをクローン
2. `content.js` を編集して機能を拡張
3. Chrome拡張機能ページで「再読み込み」ボタンを押して変更を反映

### カスタマイズ可能な要素
- **ボタンの位置・スタイル**: `styles.css` の `.free-time-btn` クラス
- **デフォルト設定値**: `content.js` の初期値
- **日時解析パターン**: `parseTimeRangeFromString()` 関数
- **出力フォーマット**: `displayFreeSlots()` 関数

## ライセンス・著作権

**MIT License**

Copyright (c) 2024

Permission is hereby granted, free of charge, to any person obtaining a copy of this software and associated documentation files (the "Software"), to deal in the Software without restriction, including without limitation the rights to use, copy, modify, merge, publish, distribute, sublicense, and/or sell copies of the Software, and to permit persons to whom the Software is furnished to do so, subject to the following conditions:

The above copyright notice and this permission notice shall be included in all copies or substantial portions of the Software.

THE SOFTWARE IS PROVIDED "AS IS", WITHOUT WARRANTY OF ANY KIND, EXPRESS OR IMPLIED, INCLUDING BUT NOT LIMITED TO THE WARRANTIES OF MERCHANTABILITY, FITNESS FOR A PARTICULAR PURPOSE AND NONINFRINGEMENT. IN NO EVENT SHALL THE AUTHORS OR COPYRIGHT HOLDERS BE LIABLE FOR ANY CLAIM, DAMAGES OR OTHER LIABILITY, WHETHER IN AN ACTION OF CONTRACT, TORT OR OTHERWISE, ARISING FROM, OUT OF OR IN CONNECTION WITH THE SOFTWARE OR THE USE OR OTHER DEALINGS IN THE SOFTWARE.

## サポート・フィードバック

- **GitHub Issues**: バグ報告・機能要求
- **GitHub Repository**: [https://github.com/takuma2005/Schedule-adjustment](https://github.com/takuma2005/Schedule-adjustment)

---

**開発者向けメモ**: このツールはGoogleカレンダーの週表示DOMを解析してスケジュールを抽出しています。Google側の仕様変更に対応するため、定期的なメンテナンスが必要です。
