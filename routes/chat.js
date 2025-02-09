import express from 'express';
import { assistantResponse, history, clear } from '../controllers/chatController.js';

const router = express.Router();

router.post('/assistantResponse', assistantResponse);

router.get('/history', history);

router.delete('/clear', clear);

export default router;