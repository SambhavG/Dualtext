console.log('Chinese helper content script loaded');

let pinyinLookup = {}

//the pinyin.json file has lines that look like this:
// 吖=ā
// Translate them to a dictionary
function fillPinyinLookup() {
  fetch(chrome.runtime.getURL('pinyin.json'))
  .then(response => response.text())
  .then(text => {
    const lines = text.split('\n');
    for (let line of lines) {
      const match = line.match(/(.+)=(.+)/);
      if (match) {
        pinyinLookup[match[1]] = match[2];
      }
    }
    console.log('Pinyin lookup table loaded');
    //Print size of pinyinLookup
    console.log(`Size of pinyinLookup: ${Object.keys(pinyinLookup).length}`);
  });
}

fillPinyinLookup();

function sendTextToAPI(text, action) {
  console.log(`Sending text to API with action ${action}:`, text);
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: action, text: text }, response => {
      if (chrome.runtime.lastError) {
        console.error('Runtime error:', chrome.runtime.lastError.message);
        resolve("error"); // Return "error" if there's a runtime error
      } else if (response && response.success) {
        resolve(response.data);
      } else {
        console.error('Error:', response ? response.error : 'No response received');
        resolve("error"); // Return "error" if there's an error
      }
    });
  });
}

let num = 0;
function processTextNodes(node) {
  //Wait until the pinyinLookup table is filled
  if (Object.keys(pinyinLookup).length != 20850) {
    setTimeout(() => processTextNodes(node), 200);
    return;
  }
  if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '' && node.textContent.length > 50 && num < 20) {  
    num++;
    Promise.all([
      sendTextToAPI(node.textContent, 'pinyinTranslate'),
      sendTextToAPI(node.textContent, 'sendTextToAPI')
    ])
    .then(([chineseResponse, pinyinResponse]) => {
      // Create a new div element
      const div = document.createElement('div');
      // Create three p elements
      const p1 = document.createElement('p');
      const p2 = document.createElement('p');
      const p3 = document.createElement('p');

      // Set the text content of each p element
      p1.textContent = node.textContent;
      p2.textContent = chineseResponse;
      p3.textContent = pinyinResponse;

      // Append the p elements to the div
      div.appendChild(p1);
      div.appendChild(p2);
      div.appendChild(p3);

      // Replace the text node with the new div
      const parent = node.parentNode;
      parent.replaceChild(div, node);

      console.log("Text updated");
    });
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    for (let child of node.childNodes) {
      processTextNodes(child);
    }
  }
}

window.addEventListener('load', () => {
  console.log('Processing text nodes');
  processTextNodes(document.body);
});