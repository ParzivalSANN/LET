
import { GoogleGenAI } from "@google/genai";

const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

export const analyzeLink = async (url: string, description: string): Promise<string> => {
  try {
    const model = "gemini-3-flash-preview";
    const prompt = `
      Sen eğlenceli bir web sitesi eleştirmenisin.
      URL: ${url}
      Açıklama: ${description}
      Bu siteyi 2-3 cümlelik, esprili bir şekilde Türkçe yorumla.
    `;

    const response = await ai.models.generateContent({
      model: model,
      contents: prompt,
    });

    return response.text || "Gizemli bir link!";
  } catch (error) {
    return "Yapay zeka şu an meşgul.";
  }
};

export const generateAvatarImage = async (characterName: string): Promise<string | null> => {
  try {
    // Karakter ismine göre spesifik bir prompt oluşturuyoruz
    const finalPrompt = `A high-quality 3D avatar icon of a ${characterName}, Pixar style, vibrant colors, solid dark blue background, professional lighting, centered, masterpiece.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: finalPrompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });
    
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:image/png;base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (e) {
    console.error("Avatar generation failed:", e);
    return null;
  }
};
