// Function to calculate word count
function getWordCount(text) {
    const wordMatchRegExp = /[^\s]+/g;
    const words = text.match(wordMatchRegExp) || [];
    return words.length;
}

// Function to calculate reading time
function calculateReadingTime(article) {
  const text = article.textContent;
  const wordCount = getWordCount(text);
  const readingTime = Math.round(wordCount / 200);

  const badge = document.createElement("p");
  badge.classList.add("color-secondary-text", "type--caption");
    badge.textContent = `${readingTime} min read`;
    badge.style.color = "#007BFF";

    const heading = article.querySelector('h1');
    const date = article.querySelector('time')?.parentNode;

    (date ?? heading).insertAdjacentElement("afterend", badge);

}

// Function to send selection to background
function sendSelectionToBackground(selectedText, context, isSingleWord, selection) {
  chrome.runtime.sendMessage(
    {
      type: isSingleWord ? "WORD_SELECTED" : "SENTENCE_SELECTED",
      text: selectedText,
      context: context,
    },
    (response) => {
      if (chrome.runtime.lastError) {
        console.error("Error sending message:", chrome.runtime.lastError.message);
      } else {
        console.log("Message sent successfully:", response);
        showPopup(selection, response); // Show the popup with the response
      }
    }
  );
}

// Function to listen for user selection of vocabulary or sentence
function handleSelection() {
  const selection = window.getSelection();
  const selectedText = selection.toString().trim();

  if (selectedText.length > 0) {
    // Check if the selection is a single word or a sentence
    const isSingleWord = !selectedText.includes(" ");

    // Get the context (e.g., the surrounding text or paragraph)
    const range = selection.getRangeAt(0);
    const container = range.commonAncestorContainer;
    const parentElement = container.nodeType === 3 ? container.parentElement : container;

    let context;
    if (isSingleWord) {
      // For a single word, use the parent element's text as context
      context = parentElement.textContent.trim();
    } else {
      // For a sentence, use the entire paragraph as context
      const paragraph = parentElement.closest('p'); // Find the closest <p> tag
      context = paragraph ? paragraph.textContent.trim() : parentElement.textContent.trim();
    }

    console.log("Selected text:", selectedText);
    console.log("Is single word:", isSingleWord);
    console.log("Context:", context);

    // Send the message to background.js
    sendSelectionToBackground(selectedText, context, isSingleWord, selection);
  }
}

// Render the popup
function showPopup(selection, result) {
  // Get the location of the selection
  const range = selection.getRangeAt(0);
  const rect = range.getBoundingClientRect();

  // Remove the existing popup if it exists
  const oldPopup = document.getElementById('vocab-popup');
  if (oldPopup) oldPopup.remove();

  // Create new popup element
  const popup = document.createElement('div');
  popup.id = 'vocab-popup';
  popup.classList.add('vocab-popup');
  popup.style.top = `${window.scrollY + rect.top - 150}px`;
  popup.style.left = `${window.scrollX + rect.left}px`;

  // Store the selected text and context in the popup's dataset
  popup.dataset.selectedText = selection.toString().trim();
  popup.dataset.context = result.context;

  // Insert content into the popup
  popup.innerHTML = `
    <p>${result.data.definition}</p>
    <hr />
    <button id="simplify-btn">Simplify</button>
  `;

  document.body.appendChild(popup);

  // Add functionality to the "Simplify" button
  document.getElementById('simplify-btn').addEventListener('click', () => {
    const selectedText = popup.dataset.selectedText;
    const context = popup.dataset.context;

    if (!selectedText || !context) {
      alert('No text or context available for simplification.');
      return;
    }

    // Determine if it's a single word or a sentence
    const isSingleWord = !selectedText.includes(" ");

    // Simulate the selection object (optional, for popup positioning)
    const selection = window.getSelection();

    // Resend the message to background.js
    sendSelectionToBackground(selectedText, context, isSingleWord, selection);
  });

  // Close the popup when clicking outside
  document.addEventListener(
    'click',
    (e) => {
      if (!popup.contains(e.target)) {
        popup.remove();
      }
    },
    { once: true }
  );
}

function createWrapper() {
  const wrapper = document.createElement("div");
  wrapper.style.position = "fixed";
  wrapper.style.top = "50%";
  wrapper.style.left = "50%";
  wrapper.style.transform = "translate(-50%, -50%)"; // Center the wrapper

  wrapper.style.marginBottom = "20px";
  wrapper.style.border = "1px solid #ccc";
  wrapper.style.padding = "20px";
  wrapper.style.borderRadius = "5px";
  wrapper.style.backgroundColor = "lightblue";
  wrapper.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)"; // Add a shadow for better visibility
  wrapper.style.zIndex = "1000"; // Ensure it appears above other elements
  wrapper.style.display = "none"; // Initially hidden
  wrapper.setAttribute("data-original-content-wrapper", "true"); // Add attribute to identify the wrapper
  return wrapper;
}

function createInteractiveParagraph(text) {
  const newParagraph = document.createElement("p");
  text.split(" ").forEach((word) => {
    const span = document.createElement("span");
    span.textContent = word + " ";
    span.style.display = "inline-block";
    span.style.transition = "opacity 0.5s ease";
    span.style.whiteSpace = "pre";
    newParagraph.appendChild(span);
  });
  return newParagraph;
}

function activateChunkReadingMode() {
  const paragraphs = document.querySelectorAll("p");
  const wrappers = []; // Store all wrappers
  let currentIndex = 0; // Track the current wrapper
  const summaries = [];

  // Create a dimming overlay container
  const overlayContainer = document.createElement("div");
  overlayContainer.style.position = "fixed"; // Use fixed to cover the entire viewport
  overlayContainer.style.top = "0";
  overlayContainer.style.left = "0";
  overlayContainer.style.width = "100%";
  overlayContainer.style.height = "100%";
  overlayContainer.style.pointerEvents = "none"; // Prevent interaction with blurred elements
  overlayContainer.style.zIndex = "999";
  overlayContainer.style.backgroundColor = "rgba(255, 255, 255, 0.5)"; // Add a semi-transparent background for debugging
  document.body.appendChild(overlayContainer);

  paragraphs.forEach((paragraph) => {
    // Skip paragraphs that are already wrapped
    if (paragraph.parentElement?.hasAttribute("data-original-content-wrapper")) {
      return;
    }

    // Skip the badge paragraph (identified by its class)
    if (paragraph.classList.contains("color-secondary-text") && paragraph.classList.contains("type--caption")) {
      return;
    }

    // Create the wrapper and interactive paragraph
    const wrapper = createWrapper();
    const newParagraph = createInteractiveParagraph(paragraph.textContent);

    // Append paragraph to the wrapper
    wrapper.appendChild(newParagraph);
    document.body.appendChild(wrapper); // Append the wrapper to the body
    wrappers.push(wrapper); // Store the wrapper
  });

  if (wrappers.length > 0) {
    function showNextWrapper() {
      if (currentIndex >= wrappers.length) {
        // Stop condition: Remove the overlay when done
        overlayContainer.remove(); // Remove the overlay container
        return;
      }

      const moveToNextWrapper = () => {
        const currentWrapper = wrappers[currentIndex];

        // Create a summary container on the right side of the screen
        const summaryContainer = document.createElement("div");
        summaryContainer.style.position = "fixed";
        summaryContainer.style.top = `${20 + currentIndex * 100}px`; // Stack summaries vertically
        summaryContainer.style.right = "20px"; // Fix it to the right side
        summaryContainer.style.width = "300px";
        summaryContainer.style.zIndex = "1000";
        summaryContainer.style.border = "1px solid #ccc";
        summaryContainer.style.padding = "10px";
        summaryContainer.style.borderRadius = "5px";
        summaryContainer.style.backgroundColor = "#f9f9f9";
        summaryContainer.style.boxShadow = "0 4px 8px rgba(0, 0, 0, 0.2)";
        summaryContainer.textContent = `Summary ${currentIndex + 1}: ${summaries[currentIndex].text}`;
        document.body.appendChild(summaryContainer);

        // Hide the current wrapper and move to the next one
        currentWrapper.style.display = "none";
        currentIndex++;
        document.removeEventListener("keydown", handleKeydown);
        showNextWrapper(); // Show the next wrapper
      };

      const handleKeydown = (event) => {
        if (event.key === "Enter") {
          const summary = prompt(
            `Summarize this paragraph:\n\n"${wrappers[currentIndex].textContent.trim()}"`
          );
          if (summary) {
            summaries.push({ id: currentIndex, text: summary });
            console.log(`Summary for paragraph ${currentIndex + 1}:`, summary);
            moveToNextWrapper();
          } else {
            alert("Please provide a summary before proceeding.");
          }
        }
      };

      const wrapper = wrappers[currentIndex];
      wrapper.style.display = "block"; // Show the current wrapper
      wrapper.style.zIndex = "1000"; // Ensure the wrapper is above the overlay container
      document.addEventListener("keydown", handleKeydown);
    }

    showNextWrapper();
  }
}

function init() {
  const article = document.querySelector('article');
  if (article) {
    calculateReadingTime(article);
  }
  // listen for user selection
  document.addEventListener('mouseup', handleSelection);
}

init();