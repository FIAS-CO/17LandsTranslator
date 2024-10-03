document.addEventListener('DOMContentLoaded', function() {
  const translateBtn = document.getElementById('translateBtn');
  if (translateBtn) {
    translateBtn.addEventListener('click', () => {
      console.log("Translate button clicked");

      chrome.tabs.query({ active: true, currentWindow: true }, (tabs) => {
        chrome.scripting.executeScript({
          target: { tabId: tabs[0].id },
          function: translateCardNames
        }, (results) => {
          if (chrome.runtime.lastError) {
            console.error(chrome.runtime.lastError.message);
          } else {
            console.log("Script executed successfully", results);
          }
        });
      });
    });
  } else {
    console.error("Translate button not found");
  }
});

async function fetchTranslations() {
  const response = await fetch(chrome.runtime.getURL('translations.json'));
  return await response.json();
}

async function translateCardNames() {
  console.log("translateCardNames function running");
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
