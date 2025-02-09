import OpenAI from 'openai';

const localMessages = [];

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});

// @desc    Send user message & receive assistance response.
// @method  POST /chat/assistantResponse
export const assistantResponse = async (req, res) => {
  res.setHeader("Content-Type", "text/plain");
  res.setHeader("Transfer-Encoding", "chunked");

  localMessages.push({ "role": "user", "content": req.body });
  console.log("User: " + req.body);

  try {
    const chatCompletion = await client.chat.completions.create({
      messages: localMessages,
      model: 'gpt-4o-mini',
      store: true,
      stream: true
    });

    process.stdout.write("Assistant: ");
    const entry = { "role": "assistant", "content": "" };

    for await (const chunk of chatCompletion) {
      if (chunk.choices[0].delta.content) {
        const content = chunk.choices[0].delta.content;
        entry.content += content;
        process.stdout.write(content);
        res.write(content);
      }
    }
    process.stdout.write("\n\n");
    localMessages.push(entry);
    res.end();

  } catch (error) {
    res.end(`Something went wrong: ${error}`);
  }
};

// @desc    Get chat history.
// @method  GET /chat/history
export const history = (req, res) => {
  res.send(localMessages);
};


// @desc    Clear chat history.
// @method  DELETE /chat/clear
export const clear = async (req, res) => {
  localMessages.length = 0;
  res.send('OK');
};