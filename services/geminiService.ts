import { GoogleGenAI, Modality } from "@google/genai";

const getAiClient = () => {
  const apiKey = process.env.API_KEY;
  if (!apiKey) {
    throw new Error("API Key not found in environment variables.");
  }
  return new GoogleGenAI({ apiKey });
};

/**
 * Edits an image using Gemini 2.5 Flash Image based on a text prompt.
 * @param base64Image The original image in base64 format.
 * @param mimeType The mime type of the image (e.g., image/jpeg).
 * @param prompt The text instruction for editing (e.g., "Add a retro filter").
 * @returns A promise resolving to the base64 string of the edited image.
 */
export const editPizzaImage = async (
  base64Image: string,
  mimeType: string,
  prompt: string
): Promise<string> => {
  try {
    const ai = getAiClient();
    
    // Remove header from base64 string if present for the API call
    const base64Data = base64Image.replace(/^data:image\/\w+;base64,/, "");

    const response = await ai.models.generateContent({
      model: 'gemini-2.5-flash-image',
      contents: {
        parts: [
          {
            inlineData: {
              data: base64Data,
              mimeType: mimeType,
            },
          },
          {
            text: prompt,
          },
        ],
      },
      config: {
        responseModalities: [Modality.IMAGE],
      },
    });

    const part = response.candidates?.[0]?.content?.parts?.[0];
    if (part && part.inlineData && part.inlineData.data) {
        // Construct the full data URL for the frontend to display
        return `data:image/png;base64,${part.inlineData.data}`;
    }

    throw new Error("No image generated from Gemini.");
  } catch (error) {
    console.error("Error generating image:", error);
    throw error;
  }
};
