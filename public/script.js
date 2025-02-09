const btn = document.getElementById('btn');
const textbox = document.getElementById('textbox');
const message = document.getElementById('message');
const form = document.getElementById('form');
const messageArea = document.getElementById('messageArea');
const clearChat = document.getElementById('clearChat');
const container = document.getElementById("scrollable");
let detachAutoScroll = false;
const autoScrollSensitivity = 70;

document.addEventListener('keydown', () => {
  if (document.activeElement !== message) message.focus();
});

form.addEventListener('submit', (e) => {
  e.preventDefault();
});

clearChat.addEventListener('click', () => {
  fetch('/chat/clear', { method: "DELETE" }).then(location.reload());
});

// Detach autoscroll whenever the user scrolls up, so that the transition is smoother. (NOT FOR MOBILE: STILL NEED TO TEST THAT)
container.addEventListener('wheel', (e) => {
  if (e.deltaY < 0)
    detachAutoScroll = true;
  else if ((e.deltaY > 0) && (container.scrollHeight - container.scrollTop - container.clientHeight) < autoScrollSensitivity)
    detachAutoScroll = false;
});

function scrollToBottom() {
  if (detachAutoScroll)
    return;
  const location = container.scrollHeight - container.scrollTop - container.clientHeight;
  if (location > 1 && location < autoScrollSensitivity) container.scrollTop = container.scrollHeight;
};

function appendUserMessage(message) {
  const userMessage = document.createElement('div');
  userMessage.classList.add('flex', 'justify-end', 'py-5');
  const userSpan = document.createElement('span');
  userSpan.classList.add('px-5', 'py-2.5', 'rounded-3xl', 'bg-stone-100', 'dark:bg-stone-800', 'dark:text-white', 'max-w-[70%]');
  userSpan.innerHTML = message;
  userMessage.appendChild(userSpan);
  messageArea.appendChild(userMessage);
};

function appendAssistantMessage(message) {
  const assistantMessage = document.createElement('div');
  assistantMessage.classList.add('flex', 'justify-start', 'py-5', "dark:text-white");
  const assistantSpan = document.createElement('span');
  assistantSpan.innerHTML = message;
  assistantMessage.appendChild(assistantSpan);
  messageArea.appendChild(assistantMessage);
};

// @desc: Send message to the backend and receive the assistant's response.
btn.addEventListener('click', async () => {
  // Only proceed if there is something to send
  if (message.value.trim()) {

    // Create the user message element and append it
    appendUserMessage(message.value.trim());

    // Save and then clear the message text
    const send = message.value;
    message.value = "";

    // Prepare the assistant reply container
    const assistantMessage = document.createElement('div');
    assistantMessage.classList.add('flex', 'justify-start', 'py-5', "dark:text-white");
    const assistantSpan = document.createElement('span');
    assistantMessage.appendChild(assistantSpan);
    messageArea.appendChild(assistantMessage);

    // Scroll to the bottom
    container.scrollTop = container.scrollHeight;

    // Update UI to indicate that the fetch is in progress
    btn.classList.add('pb-2.5');
    btn.classList.replace('text-xl', 'text-3xl');
    btn.textContent = "◼︎";

    try {
      // Send message to backend and await stream
      const response = await fetch('/chat/assistantResponse', {
        method: 'POST',
        headers: {
          'Content-Type': 'text/plain'
        },
        body: send
      });

      // Read the stream with a reader
      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let markdownBuffer = "";
      // Process the stream data
      reader.read().then(function processText({ done, value }) {
        if (done) {
          btn.disabled = false;
          btn.classList.remove('pb-2.5');
          btn.classList.replace('text-3xl', 'text-xl');
          btn.textContent = "↑";
          return;
        }
        scrollToBottom();
        markdownBuffer += decoder.decode(value);
        assistantSpan.innerHTML = marked.parse(markdownBuffer);

        // Continue reading
        reader.read().then(processText);
      });
    } catch (error) {
      console.error('Fetch encountered an error:', error);
      btn.classList.remove('pb-2.5');
      btn.classList.replace('text-3xl', 'text-xl');
      btn.textContent = "↑";
    }
  }
});

// @desc: Display the chat history.
function displayHistory(theJSON) {

  // For every entry in the array, display user and assitant messages.
  for (let i = 0; i < theJSON.length; i++) {
    const role = theJSON[i].role;
    const content = theJSON[i].content;

    // For each 'role' entry, use appropriate function to display message
    if (role === "user")
      appendUserMessage(content);
    else if (role === "assistant")
      appendAssistantMessage(marked.parse(content));
    else
      console.log(`Message role: "${role}" is undefined`);
  }

  // Scroll to the bottom
  container.scrollTop = container.scrollHeight;
};

// @desc: Get chat history & run displayHistory() function.
window.addEventListener('DOMContentLoaded', () => {
  fetch('/chat/history', { method: "GET" })
    .then(response => response.json())
    .then(json => displayHistory(json));
})