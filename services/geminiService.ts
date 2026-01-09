'use client';

import { GoogleGenAI } from "@google/genai";
import { MOCK_PRODUCTS } from "../constants";

const ai = new GoogleGenAI({ apiKey: process.env.NEXT_PUBLIC_GEMINI_API_KEY || '' });

export async function getStylistAdvice(userQuery: string, history: { role: 'user' | 'model', text: string }[]) {
  const productListStr = MOCK_PRODUCTS.map(p => 
    `${p.name} ($${p.price ?? p.base_price}) - ${p.description}. Category: ${p.category ?? p.categories?.[0]?.name ?? 'Fashion'}`
  ).join('\n');

  const systemInstruction = `
    You are the personal stylist for 'All in cloth', a luxury fashion e-commerce brand.
    Your goal is to help customers find the perfect outfit from our curated collection.
    
    Current Inventory:
    ${productListStr}
    
    Guidelines:
    - Be sophisticated, helpful, and concise.
    - If a user asks for recommendations, refer specifically to our inventory.
    - Suggest matching colors or accessories for items they might like.
    - If you don't have a specific item, suggest the closest alternative from the inventory.
    - Stay on the topic of fashion and All in cloth products.
  `;

  try {
    const response = await ai.models.generateContent({
      model: 'gemini-3-flash-preview',
      contents: [
        ...history.map(h => ({ role: h.role, parts: [{ text: h.text }] })),
        { role: 'user', parts: [{ text: userQuery }] }
      ],
      config: {
        systemInstruction,
        temperature: 0.7,
        topP: 0.8,
      },
    });

    return response.text || "I'm sorry, I'm having a little trouble thinking of the perfect look right now. How else can I assist you?";
  } catch (error) {
    console.error("Gemini Stylist Error:", error);
    return "Our stylists are currently busy. Please try again in a moment.";
  }
}

