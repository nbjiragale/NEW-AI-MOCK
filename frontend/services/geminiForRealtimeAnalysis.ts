import { GoogleGenAI, Type } from '@google/genai';

// Helper function for API calls with retry logic to handle model overload errors.
const callGeminiWithRetry = async (apiCall: () => Promise<any>, maxRetries = 2) => {
    let lastError: any;
    let delay = 1000;
    for (let i = 0; i < maxRetries; i++) {
        try {
            return await apiCall();
        } catch (error: any) {
            lastError = error;
            console.error(`Attempt ${i + 1} to analyze eye contact failed:`, error);
            const errorMessage = (error.message || error.toString()).toLowerCase();
            const isOverloadedError = errorMessage.includes('503') || errorMessage.includes('overloaded');

            if (isOverloadedError && i < maxRetries - 1) {
                console.log(`Model is overloaded. Retrying eye contact analysis in ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2;
            } else {
                throw error; // Not a retryable error or this was the last attempt
            }
        }
    }
    throw lastError; // Re-throw the last error if all retries fail
};


const schema = {
    type: Type.OBJECT,
    properties: {
        hasGoodEyeContact: {
            type: Type.BOOLEAN,
            description: "True if the person in the image appears to be looking towards the camera or screen, indicating good eye contact. False if they are clearly looking away, down, or to the side.",
        },
    },
    required: ["hasGoodEyeContact"],
};

export const analyzeEyeContact = async (base64Frame: string): Promise<{ hasGoodEyeContact: boolean }> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const prompt = `
        Analyze this single image frame of a person on a video call. Your only task is to determine if their eye contact is good.
        - "Good eye contact" means they are looking generally towards the camera/screen.
        - "Poor eye contact" means they are clearly looking away, downwards, or to the side.
        
        Respond only with the specified JSON format. Do not add any explanation.
    `;

    const imagePart = {
        inlineData: {
            mimeType: 'image/jpeg',
            data: base64Frame,
        }
    };

    const textPart = { text: prompt };

    try {
        const apiCall = () => ai.models.generateContent({
            model: 'gemini-2.5-pro', // Vision-capable model
            contents: { parts: [textPart, imagePart] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        
        const response = await callGeminiWithRetry(apiCall);
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error analyzing eye contact with Gemini API after all retries:", error);
        // Default to good eye contact to avoid false positives on API errors.
        return { hasGoodEyeContact: true };
    }
};