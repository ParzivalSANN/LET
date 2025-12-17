import { GoogleGenAI } from "@google/genai";

// Initialize Gemini
// Guidelines: API key must be obtained exclusively from process.env.API_KEY and used directly.
const ai = new GoogleGenAI({ apiKey: process.env.API_KEY });

/**
 * Analyzes a URL and description to provide a witty commentary.
 */
export const analyzeLink = async (url: string, description: string): Promise<string> => {
  try {
    // Using gemini-3-flash-preview for basic text tasks as per guidelines
    const model = "gemini-3-flash-preview";
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

/**
 * Generates an avatar image based on a prompt.
 * Returns a Base64 string of the image.
 */
export const generateAvatarImage = async (prompt: string): Promise<string | null> => {
  try {
    const finalPrompt = `${prompt} . Vector art style, flat design, cute, simple, minimal details, solid white background, square aspect ratio.`;
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: finalPrompt }] },
    });
    
    // Find image part
    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (e) {
    console.error("Avatar generation failed:", e);
    return null;
  }
};

/**
 * Generates a single large image containing a grid of avatars.
 */
export const generateAvatarGrid = async (prompt: string): Promise<string | null> => {
  try {
    // We use gemini-2.5-flash-image for image generation.
    // The prompt explicitly asks for a grid, which the model attempts to follow.
    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: { parts: [{ text: prompt }] },
      config: {
        // Nano banana models do not support aspect ratio config for non-square in the same way, 
        // but we can ask for it in the prompt.
      }
    });

    if (response.candidates?.[0]?.content?.parts) {
        for (const part of response.candidates[0].content.parts) {
            if (part.inlineData && part.inlineData.data) {
                return `data:${part.inlineData.mimeType};base64,${part.inlineData.data}`;
            }
        }
    }
    return null;
  } catch (e) {
    console.error("Grid generation failed:", e);
    return null;
  }
};