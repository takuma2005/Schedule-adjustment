// popup.js - 拡張機能ポップアップ用スクリプト

document.addEventListener('DOMContentLoaded', () => {
  // Googleカレンダーを開くボタンのイベントリスナー
  document.getElementById('open-calendar').addEventListener('click', () => {
    // 新しいタブでGoogleカレンダーを開く
    chrome.tabs.create({ url: 'https://calendar.google.com' });
    // ポップアップを閉じる
    window.close();
  });
});
