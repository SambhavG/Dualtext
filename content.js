console.log('Chinese helper content script loaded');

function sendTextToAPI(text) {
  console.log('Sending text to API:', text);
  return new Promise((resolve, reject) => {
    chrome.runtime.sendMessage({ action: 'sendTextToAPI', text: text }, response => {
      // console.log('Received response:', response);
      if (response.success) {
        resolve(response.data);
      } else {
        console.error('Error:', response.error);
        resolve(text); // Return original text if there's an error
      }
    });
  });
}

function processTextNodes(node) {
  if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '' && node.textContent.length > 0) {  
    sendTextToAPI(node.textContent)
    .then(response => {
      // node.textContent = response + "\n" + response;
      // Create a new div element
      const div = document.createElement('div');
      // Create two p elements
      const p1 = document.createElement('p');
      const p2 = document.createElement('p');

      // Set the text content of each p element
      p1.textContent = response;
      p2.textContent = response;

      // Append the p elements to the div
      div.appendChild(p1);
      div.appendChild(p2);

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