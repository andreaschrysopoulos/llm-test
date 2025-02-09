import express from 'express';
import OpenAI from 'openai';

const router = express.Router();

const localMessages = [];

const client = new OpenAI({
  apiKey: process.env.OPENAI_API_KEY
});


router.post('/assistantResponse', async (req, res) => {
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
    localMessages.push(entry);
    res.end();

  } catch (error) {
    res.end(`Something went wrong: ${error}`);
  }
})

router.get('/history', (req, res) => {
  res.send(localMessages);
})

router.post('/clear', async (req, res) => {
  localMessages.length = 0;
  res.send('OK');
});

export default router;