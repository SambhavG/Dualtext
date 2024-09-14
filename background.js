console.log('Background script loaded');

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  // console.log('Received message in background:', request);
  sendResponse({ success: true, data: request.text });
  // if (request.action === 'sendTextToAPI') {
  //   fetch('http://localhost:11434/api/generate', {
  //     method: 'POST',
  //     headers: {
  //       'Content-Type': 'application/json'
  //     },
  //     body: JSON.stringify({
  //       model: "llama3",
  //       prompt: `Translate the given text to Chinese as best you can, unless it's too short or doesn't make sense. Respond with ONLY chinese characters, not pinyin or english: ${request.text}`, 
  //       stream: false
  //     })
  //   })
  //   .then(response => {
  //     return response.json()})
  //   .then(data => {
  //     console.log('API response:', data);
  //     sendResponse({ success: true, data: data.response });
  //   })
  //   .catch(error => {
  //     console.error('Fetch error:', error);
  //     sendResponse({ success: false, error: error.message });
  //   });
  //   return true;  // Indicates we will send a response asynchronously
  // }
});