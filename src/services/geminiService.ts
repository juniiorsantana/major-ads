
import { GoogleGenAI, Type } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: import.meta.env.VITE_GEMINI_API_KEY || '' });

export const geminiService = {
  async generateAdCopy(productName: string, targetAudience: string) {
    const response = await ai.models.generateContent({
      model: "gemini-3-flash-preview",
      contents: `Generate 3 variations of Facebook Ad Copy for a product called "${productName}" targeting "${targetAudience}". Include a primary text, headline, and a call to action. Return as JSON.`,
      config: {
        responseMimeType: "application/json",
        responseSchema: {
          type: Type.ARRAY,
          items: {
            type: Type.OBJECT,
            properties: {
              primaryText: { type: Type.STRING },
              headline: { type: Type.STRING },
              cta: { type: Type.STRING }
            },
            required: ["primaryText", "headline", "cta"]
          }
        }
      }
    });

    return JSON.parse(response.text);
  },

  async analyzeMetrics(campaigns: any[]) {
    const response = await ai.models.generateContent({
      model: "gemini-3-pro-preview",
      contents: `Analyze these Facebook Ad campaigns and provide 3 key insights for optimization: ${JSON.stringify(campaigns)}`,
      config: {
        thinkingConfig: { thinkingBudget: 4000 }
      }
    });

    return response.text;
  }
};
