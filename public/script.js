const btn = document.getElementById('btn');
const textbox = document.getElementById('textbox');
const message = document.getElementById('message');
const form = document.getElementById('form');
const messageArea = document.getElementById('messageArea');
const clearChat = document.getElementById('clearChat');
const container = document.getElementById("scrollable");

document.addEventListener('keydown', () => {
  if (document.activeElement !== message)
    message.focus();

})

form.addEventListener('submit', (e) => {
  e.preventDefault();
})

clearChat.addEventListener('click', async () => {
  fetch('/chat/clear', {
    method: "POST"
  })
    .then(response => response.text())
    .then(() => location.reload());

});

// container.addEventListener('scroll', () => {
//   console.log(container.scrollHeight - container.scrollTop - container.clientHeight);
// })

function scrollToBottom() {
  const location = container.scrollHeight - container.scrollTop - container.clientHeight;
  if (location > 1 && location < 50) {
    container.scrollTop = container.scrollHeight;
  }
}

btn.addEventListener('click', async () => {
  // Only proceed if there is something to send
  if (message.value.trim()) {

    // Create the user message element and append it as you already do
    const userMessage = document.createElement('div');
    userMessage.classList.add('flex', 'justify-end', 'py-5');
    const userSpan = document.createElement('span');
    userSpan.classList.add('px-5', 'py-2.5', 'rounded-3xl', 'bg-stone-100', 'dark:bg-stone-800', 'dark:text-white', 'max-w-[70%]');
    userSpan.textContent = message.value.trim();
    userMessage.appendChild(userSpan);
    messageArea.appendChild(userMessage);

    // Save and then clear the message text
    const send = message.value;
    message.value = "";

    // Prepare the assistant reply container
    const assistantMessage = document.createElement('div');
    assistantMessage.classList.add('flex', 'justify-start', 'py-5', "dark:text-white");
    const assistantSpan = document.createElement('span');
    assistantMessage.appendChild(assistantSpan);
    messageArea.appendChild(assistantMessage);
    container.scrollTop = container.scrollHeight;

    // Update UI to indicate that the fetch is in progress
    btn.classList.add('pb-2.5');
    btn.classList.replace('text-xl', 'text-3xl');
    btn.textContent = "◼︎";


    try {
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

function displayHistory(theJSON) {
  // console.log(theJSON.length);
  for (let index = theJSON.length - 1; index >= 0; index--) {

    // create user message
    if (theJSON[index].role === "user") {
      const userMessage = document.createElement('div');
      userMessage.classList.add('flex', 'justify-end', 'py-5');
      const userSpan = document.createElement('span');
      userSpan.classList.add('px-5', 'py-2.5', 'rounded-3xl', 'bg-stone-100', 'dark:bg-stone-800', 'dark:text-white', 'max-w-[70%]');
      userSpan.textContent = theJSON[index].content;
      userMessage.appendChild(userSpan);
      messageArea.prepend(userMessage);
    }
    // Create assistant reply
    else if (theJSON[index].role === "assistant") {
      const assistantMessage = document.createElement('div');
      assistantMessage.classList.add('flex', 'justify-start', 'py-5', "dark:text-white");
      const assistantSpan = document.createElement('span');
      // assistantSpan.classList.add('py-4');
      assistantSpan.innerHTML = marked.parse(theJSON[index].content);
      assistantMessage.appendChild(assistantSpan);
      messageArea.prepend(assistantMessage);
    } else {
      console.log('Message role undefined');
    }
  }
  container.scrollTop = container.scrollHeight;
};

window.addEventListener('DOMContentLoaded', () => {


  fetch('/chat/history', { method: "GET" })
    .then(response => response.json())
    .then(response => {
      // console.log(response)
      displayHistory(response);
    });


})