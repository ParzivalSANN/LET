import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// Guidelines: API key must be obtained exclusively from process.env.API_KEY and used directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a URL and description to provide a witty commentary.
 */
export const analyzeLink = async (url: string, description: string): Promise<string> => {
  try {
    const model = "gemini-2.5-flash";
    const prompt = `
      Sen eğlenceli ve hazırcevap bir web sitesi eleştirmenisin.
      Aşağıdaki linki ve kullanıcının açıklamasını analiz et.
      
      URL: ${url}
      Açıklama: ${description}
      
      Görevin:
      1. Bu sitenin ne olabileceğini tahmin et.
      2. 2-3 cümlelik, esprili, hafif iğneleyici ama arkadaş canlısı bir yorum yap. 
      3. Türkçe cevap ver.
      
      Yorumun direkt olarak kullanıcıya hitap etsin.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Hmm, bu link hakkında pek bir şey söyleyemiyorum. Gizemli!";
  } catch (error) {
    console.error("Gemini Error:", error);
    return "Yapay zeka şu an kahve molasında. Yorum yapılamadı.";
  }
};