console.log('Background script loaded');

//Function to abstract out the 'sendTextToAPI' body
function chineseTranslate(text) {
  return "Translate the given text to Chinese as best you can, unless it's too short or doesn't make sense. Respond with ONLY chinese characters, not pinyin or english: " + text;
}

function pinyinTranslate(text) {
  return "Translate the given text to pinyin (in chinese, but with english characters) and respond with the pinyin translation: " + text;
}

chrome.runtime.onMessage.addListener((request, sender, sendResponse) => {
  let prompt = "";
  switch (request.action) {
    case 'ChineseTranslate':
      prompt = chineseTranslate(request.text);
      break;
    case 'pinyinTranslate':
      prompt = pinyinTranslate(request.text);
      break;

    default:
      console.error('Invalid action:', request.action);
      sendResponse({ success: false, error: 'Invalid action' });
      return; 
  }

  fetch('http://localhost:11434/api/generate', {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({
      model: "wangrongsheng/llama3-8b-chinese-chat",
      prompt: prompt,
      stream: false
    })
  })
  .then(response => {
    if (!response.ok) {
      throw new Error(`HTTP error! status: ${response.status}`);
    }
    return response.text(); // Get the response as text
  })
  .then(text => {
    try {
      const data = JSON.parse(text); // Attempt to parse the text as JSON
      console.log('API response:', data);
      sendResponse({ success: true, data: data.response });
    } catch (error) {
      throw new Error('Invalid JSON response');
    }
  })
  .catch(error => {
    console.error('Fetch error:', error);
    sendResponse({ success: false, error: error.message });
  });
  return true;  // Indicates we will send a response asynchronously
  
});