
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
    // Prompt'u daha güvenli ve açıklayıcı hale getirdik (reddedilme riskini azaltmak için)
    const finalPrompt = `A simple, stylized 3D icon of a cute ${characterName} character, centered, toy-like aesthetic, soft lighting, solid dark background, minimalist design, high resolution.`;
    
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: finalPrompt }] },
      config: {
        imageConfig: {
          aspectRatio: "1:1"
        }
      }
    });
    
    // Yanıtın içinde görsel verisini bulmak için tüm parçaları tarıyoruz
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                // Base64 verisinin başında boşluk vb. olmadığından emin oluyoruz
                const base64 = part.inlineData.data.trim();
                return `data:image/png;base64,${base64}`;
            }
        }
    }
    return null;
  } catch (e) {
    console.error("AI Avatar üretimi başarısız oldu:", e);
    return null;
  }
};
