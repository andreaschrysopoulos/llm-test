import express from 'express';
import chat from './routes/chat.js';

const app = express();
const port = process.env.PORT;

app.use(express.text());
app.use(express.static('public'));
app.use('/chat', chat);


app.listen(port, () => {
  console.log(`Site running at http://localhost:${port}\n`)
})