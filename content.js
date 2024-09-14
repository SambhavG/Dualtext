console.log('Chinese helper content script loaded');

function sendTextToAPI(text) {
  // console.log('Sending text to API:', text);
  // return new Promise((resolve, reject) => {
  //   chrome.runtime.sendMessage({ action: 'sendTextToAPI', text: text }, response => {
  //     console.log('Received response:', response);
  //     if (response.success) {
  //       resolve(response.data);
  //     } else {
  //       console.error('Error:', response.error);
  //       resolve(text); // Return original text if there's an error
  //     }
  //   });
  // });
  return text;
}

function processTextNodes(node) {
  if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '' && node.textContent.length > 50) {
    if (num > 20) {
      return;
    }
  
    sendTextToAPI(node.textContent)
    .then(response => {
      node.textContent = response + "\n" + response;
    });
    num++;
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