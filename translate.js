export async function translateCardNames() {
  console.log("translateCardNames function running in background.js");
  const elements = document.querySelectorAll(".list_card_name");
  console.log(`Number of card elements found: ${elements.length}`);

  // translations.jsonを読み込む
  const response = await fetch(chrome.runtime.getURL('translations.json'));
  const translations = await response.json();
  console.log("Translations loaded:", translations);

  elements.forEach(async (element) => {
    const cardName = element.innerText.trim();
    console.log(`Found card name: "${cardName}"`);

    // ローカル翻訳の適用
    if (translations[cardName]) {
      element.innerText = translations[cardName];
      console.log(`Replaced with (local): "${translations[cardName]}" for "${cardName}"`);
    } else {
      console.log(`No local translation found for "${cardName}", trying API...`);

      // APIを呼び出す
      const apiUrl = `https://api.scryfall.com/cards/search?q=${encodeURIComponent(cardName)}/lang:ja`;
      try {
        const apiResponse = await fetch(apiUrl);
        const data = await apiResponse.json();
        console.log(`API response for "${cardName}":`, data);

        if (data.total_cards > 0 && data.data[0].printed_name) {
          element.innerText = data.data[0].printed_name;
          console.log(`Replaced with (API): "${data.data[0].printed_name}" for "${cardName}"`);
        } else {
          console.log(`No Japanese name found for "${cardName}" in API response`);
        }
      } catch (error) {
        console.error("Error fetching data from Scryfall API:", error);
      }
    }
  });
}

export function waitForTableToLoad() {
  return new Promise((resolve) => {
    const observer = new MutationObserver((mutations, observer) => {
      const elements = document.querySelectorAll(".list_card_name");
      if (elements.length > 0) {
        const firstCardName = elements[0].textContent; // 1つ目のカード名を取得
        console.warn(`firstCardName: ${firstCardName}`);
        // 2バイト文字をチェックする正規表現
        const hasDoubleByteChars = /[^\x00-\x7F]/.test(firstCardName); // ASCII以外の文字を含むかチェック

        if (!hasDoubleByteChars) {
          observer.disconnect();
          resolve(); // 2バイト文字が含まれていない場合に解決
        } else {
          console.warn("2バイト文字が含まれているため、テーブルの更新を待機します。");
          // 何もしない、監視を続ける
        }
      }
    });

    observer.observe(document.body, {
      childList: true,
      subtree: true
    });
  });
}
