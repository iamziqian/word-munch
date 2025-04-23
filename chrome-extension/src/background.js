chrome.runtime.onInstalled.addListener(() => {
  chrome.action.setBadgeText({
      text: "OFF",
  });
});

chrome.action.onClicked.addListener(async (tab) => {
  // Check if the tab's URL is valid for scripting
  if (!tab.url || tab.url.startsWith("chrome://") || tab.url.startsWith("https://chrome.google.com/webstore")) {
      console.warn("This URL cannot be scripted:", tab.url);
      return;
  }

  // Retrieve the action badge to check if the extension is 'ON' or 'OFF'
  const prevState = await chrome.action.getBadgeText({ tabId: tab.id });
  // Next state will always be the opposite
  const nextState = prevState === "ON" ? "OFF" : "ON";

  // Set the action badge to the next state
  await chrome.action.setBadgeText({
      tabId: tab.id,
      text: nextState,
  });

  if (nextState === "ON") {
      await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          files: ["src/content.js"],
      });

      // Call the activateChunkReadingMode function
      await chrome.scripting.executeScript({
          target: { tabId: tab.id },
          func: () => {
              if (typeof activateChunkReadingMode === "function") {
                console.log("activateChunkReadingMode is defined. Calling it now...");
                activateChunkReadingMode();
              } else {
                  console.error("activateChunkReadingMode is not defined.");
              }
            },
          });
  } else if (nextState === "OFF") {
    await chrome.scripting.executeScript({
      target: { tabId: tab.id },
      func: () => {
        location.reload(); // Refresh the page
      },
    });  
  }
});


// deal with the message from the content script and send it to the api gateway
chrome.runtime.onMessage.addListener((message, sender, sendResponse) => {
  if (message.type === "WORD_SELECTED") {
    // Handle single word logic
    fetch('http://localhost:8000/vocabulary', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ word: message.text, context: message.context }),
    })
      .then((response) => response.json())
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error("Error fetching word data:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep the message channel open for async response
  }

  // Handle sentence selection
  if (message.type === "SENTENCE_SELECTED") {

    // Handle sentence logic (e.g., fetch sentence analysis)
    fetch('http://localhost:8000/sentence', {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ sentence: message.text, context: message.context }),
    })
      .then((response) => response.json())
      .then((data) => {
        sendResponse({ success: true, data });
      })
      .catch((error) => {
        console.error("Error fetching sentence data:", error);
        sendResponse({ success: false, error: error.message });
      });

    return true; // Keep the message channel open for async response
  }
});