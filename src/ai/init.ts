import { GoogleGenAI } from '@google/genai';
import { config } from 'dotenv';

config();

const ai = new GoogleGenAI({
    apiKey: process.env.GEMINI_API_KEY,
});

export default ai;
