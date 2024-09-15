console.log('Chinese helper content script loaded');

let pinyinLookup = {}
let freqLookup = {}
let defLookup = {}

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

//Each line of freq.txt is a tab separated line where first is rank and second is character
function fillFreqLookup() {
  fetch(chrome.runtime.getURL('freq.txt'))
  .then(response => response.text())
  .then(text => {
    const lines = text.split('\n');
    for (let line of lines) {
      line = line.split('\t');
      if (line && !(line[1] in freqLookup)) {
        freqLookup[line[1]] = parseInt(line[0]);
      }
      if (line && !(line[1] in defLookup) && line.length > 5) {
        defLookup[line[1]] = line[5].split('/')[0];
      }
    }
    console.log('Frequency lookup table loaded');
    //Print size of freqLookup
    console.log(`Size of freqLookup: ${Object.keys(freqLookup).length}`);
  });

}

fillPinyinLookup();
fillFreqLookup();

function sendTextToAPI(text, action) {

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

function convertTextNodesToSentences(node) {
  if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '') { 
    const sentences = node.textContent.split(/(?<=[.!?])\s+/);
    console.log(sentences);
    if (sentences.length > 1) {
      const parent = node.parentNode;
      for (let i = 0; i < sentences.length; i++) {
        const sentence = sentences[i];
        const p = document.createElement('p');
        p.textContent = sentence;
        parent.insertBefore(p, node);
      }
      parent.removeChild(node);
    }
  } else if (node.nodeType === Node.ELEMENT_NODE) {
    for (let child of node.childNodes) {
      convertTextNodesToSentences(child);
    }
  }
}

let num = 0;
function processTextNodes(node) {
  //Wait until the pinyinLookup table is filled
  if (Object.keys(pinyinLookup).length != 20850) {
    setTimeout(() => processTextNodes(node), 200);
    return;
  }
  if (node.nodeType === Node.TEXT_NODE && node.textContent.trim() !== '' && node.textContent.length > 10 && num < 60) {  
    num++;


    Promise.all([
      sendTextToAPI(node.textContent, 'ChineseTranslate')
    ])
    .then(([chineseResponse]) => {
      // Create a new div element
      const div = document.createElement('div');
      // Create three p elements
      const p1 = document.createElement('p');
      p1.textContent = node.textContent;

      const stacksContainer = document.createElement('div');

      chineseResponse.split('').forEach((char) => {
        const charContainer = document.createElement('div');
        charContainer.style.display = 'inline-block'; // Display inline-block to align characters in a line
        charContainer.style.textAlign = 'center'; // Center align the text

        const charElement = document.createElement('p');
        charElement.textContent = char;
        charElement.style.margin = '0'; // Remove default margin

        const pinyinElement = document.createElement('p');
        if (char in pinyinLookup) {
          pinyinElement.textContent = pinyinLookup[char];
        }
        pinyinElement.style.margin = '0'; // Remove default margin

        //Style the charElement and pinyinElement with a color based on freqLookup[char]
        // if (char in freqLookup) {
        //   let freq = freqLookup[char];
        //   if (freq <= 100) {
        //     charElement.style.color = 'green';
        //     pinyinElement.style.color = 'green';
        //   } else if (freq <= 500) {
        //     //light green
        //     charElement.style.color = 'lightgreen';
        //     pinyinElement.style.color = 'lightgreen';
        //   } else {
        //     //red
        //     charElement.style.color = 'gray';
        //     pinyinElement.style.color = 'gray';
        //   }
        // }
        
        //Darkest green for freq 1, lighter to 500, where 500 becomes gray
        if (char in freqLookup) {
          let freq = freqLookup[char];
          green = [0, 0, 0];
          gray = [192, 192, 192];
          color = [];
          for (let i = 0; i < 3; i++) {
            color[i] = Math.round(green[i] + (gray[i] - green[i]) * (freq / 500));
            if (freq > 500) {
              color[i] = gray[i];
            }
            
          }
          if (freq <= 100) {
            color = [0, 255, 0];
          }
          color = `rgb(${color[0]}, ${color[1]}, ${color[2]})`;
          charElement.style.color = color;
          pinyinElement.style.color = color;
        }


        const defElement = document.createElement('p');
        if (char in defLookup) {
          defElement.textContent = defLookup[char];
        }
        defElement.style.margin = '0'; // Remove default margin
        //make italic
        defElement.style.fontStyle = 'italic';
        //make font size .5 em
        defElement.style.fontSize = '.5em';

        charContainer.appendChild(charElement);
        charContainer.appendChild(pinyinElement);
        charContainer.appendChild(defElement);
        // charContainer.appendChild(freqElement);
        //Add right margin of 5px to each character
        charContainer.style.marginRight = '5px';

        stacksContainer.appendChild(charContainer);
      });

      // Append the p elements to the div
      div.appendChild(p1);
      div.appendChild(stacksContainer);

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
  convertTextNodesToSentences(document.body);
  processTextNodes(document.body);
});