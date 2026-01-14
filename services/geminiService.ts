
import { GoogleGenAI, GenerateContentResponse } from "@google/genai";
import { Message } from "../types";

// The API key must be obtained exclusively from the environment variable process.env.API_KEY.
const API_KEY = process.env.API_KEY || "";

// Blunt, helpful, and tough system instructions
const TOUGH_SYSTEM_INSTRUCTION = `You are "Gemini Unfiltered". 
Your personality is blunt, direct, and brutally honest. 
Do not use pleasantries like "Hello", "How can I help?", or "I'm happy to assist". 
Get straight to the point. If a user asks something stupid, tell them, but still provide the most helpful answer possible. 
Prioritize efficiency and raw facts over social niceties. Be tough but extremely competent.`;

export const sendMessageToGemini = async (
  prompt: string,
  history: Message[],
  images?: string[]
) => {
  // Always use const ai = new GoogleGenAI({apiKey: process.env.API_KEY});
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const parts: any[] = [{ text: prompt }];
  
  if (images && images.length > 0) {
    images.forEach(img => {
      const [header, data] = img.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
      parts.push({
        inlineData: { data, mimeType }
      });
    });
  }

  const apiHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    // Use ai.models.generateContent directly
    const response: GenerateContentResponse = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...apiHistory,
        { role: 'user', parts }
      ],
      config: {
        systemInstruction: TOUGH_SYSTEM_INSTRUCTION,
        temperature: 1,
        topK: 64,
        topP: 0.95,
      }
    });

    // Access .text property directly
    return response.text || "I've got nothing for you.";
  } catch (error) {
    console.error("Gemini API Error:", error);
    return `Error: ${error instanceof Error ? error.message : 'Something broke.'}`;
  }
};

export const streamMessageToGemini = async function* (
  prompt: string,
  history: Message[],
  images?: string[]
) {
  const ai = new GoogleGenAI({ apiKey: API_KEY });
  
  const parts: any[] = [{ text: prompt }];
  if (images && images.length > 0) {
    images.forEach(img => {
      const [header, data] = img.split(',');
      const mimeType = header.match(/:(.*?);/)?.[1] || 'image/png';
      parts.push({ inlineData: { data, mimeType } });
    });
  }

  const apiHistory = history.map(msg => ({
    role: msg.role === 'user' ? 'user' : 'model',
    parts: [{ text: msg.content }]
  }));

  try {
    const response = await ai.models.generateContentStream({
      model: 'gemini-3-flash-preview',
      contents: [
        ...apiHistory,
        { role: 'user', parts }
      ],
      config: {
        systemInstruction: TOUGH_SYSTEM_INSTRUCTION,
        temperature: 1,
      }
    });

    for await (const chunk of response) {
      // Access .text property directly on the chunk
      const text = chunk.text;
      if (text) yield text;
    }
  } catch (error) {
    console.error("Gemini Streaming Error:", error);
    yield `[Connection failed. Don't blame me.]`;
  }
};
