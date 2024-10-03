import { translateCardNames, waitForTableToLoad } from './translate.js'; // translate.js のパスを指定

chrome.runtime.onInstalled.addListener(() => {
  console.log("Card Name Translator installed.");
});

chrome.webNavigation.onCompleted.addListener((details) => {
  const url = details.url;

  if (url.startsWith("https://www.17lands.com/card_data?")) {
    // ここでは何もしない
    console.log("Navigated to the card data page.");
  }
}, { url: [{ urlMatches: 'https://www.17lands.com/card_data\\?*' }] });


function setupDropdownObserver() {
  // 現在のタブを取得
  chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
    const currentTab = tabs[0]; // アクティブなタブを取得

    if (currentTab) {
      chrome.scripting.executeScript({
        target: { tabId: currentTab.id }, // タブのIDを指定
        function: () => {
          const dropdowns = document.querySelectorAll('select'); // すべてのドロップダウンリストを選択

          if (dropdowns.length > 0) {
            dropdowns.forEach(dropdown => {
              dropdown.addEventListener('change', async () => {
                console.log("Dropdown changed, translating card names...");

                await waitForTableToLoad();
                translateCardNames(); // 翻訳を実行
              });
            });
          } else {
            console.error("Dropdowns not found.");
          }
        }
      });
    } else {
      console.error("No active tab found.");
    }
  });
}

// webNavigation.onCompletedの中でsetupDropdownObserverを呼び出す
chrome.webNavigation.onCompleted.addListener((details) => {
  const url = details.url;

  if (url.startsWith("https://www.17lands.com/card_data?")) {
    chrome.scripting.executeScript({
      target: { tabId: details.tabId },
      function: waitForTableToLoad
    }).then(() => {
      setupDropdownObserver(); // ドロップダウンの監視を設定
    });
  }
}, { url: [{ urlMatches: 'https://www.17lands.com/card_data\\?*' }] });