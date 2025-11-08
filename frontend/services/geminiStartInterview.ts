/**
 * Validates the target company name using the Gemini API.
 * @param companyName The name of the company to validate.
 * @returns An object with validation status and reasoning.
 */
export const validateCompany = async (companyName: string): Promise<{ companyExists: boolean; reasoning: string }> => {
    // Dynamically import to avoid load-time issues
    const { GoogleGenAI, Type } = await import('@google/genai');

    const schema = {
        type: Type.OBJECT,
        properties: {
            companyExists: {
                type: Type.BOOLEAN,
                description: "True if the company is a known, real entity. False otherwise.",
            },
            reasoning: {
                type: Type.STRING,
                description: "A brief explanation for the validation result. For example, if false, explain why (e.g., 'Likely a typo' or 'No public information found').",
            },
        },
        required: ["companyExists", "reasoning"],
    };

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    try {
        const prompt = `Please verify if "${companyName}" is a real, publicly known company. Consider common typos or variations. Provide a boolean response and a brief reason.`;
        
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        // Basic check to ensure the result matches the expected structure
        if (typeof result.companyExists === 'boolean' && typeof result.reasoning === 'string') {
            return result;
        } else {
             // Fallback if the AI returns an unexpected structure
            console.warn("Gemini response did not match schema:", result);
            return { companyExists: true, reasoning: "AI response format was unexpected, proceeding as valid." };
        }

    } catch (error) {
        console.error("Error validating company with Gemini API:", error);
        // In case of API error, let the user proceed rather than blocking them.
        return { companyExists: true, reasoning: "Could not verify due to a technical error. Proceeding." };
    }
};
