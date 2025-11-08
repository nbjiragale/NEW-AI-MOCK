import { GoogleGenAI, Type } from '@google/genai';

interface ValidationResult {
    isCorrect: boolean | null;
    feedback: string;
    hint: string | null;
}

const schema = {
    type: Type.OBJECT,
    properties: {
        isCorrect: {
            type: Type.BOOLEAN,
            description: "True if the user's answer correctly solves the problem, False otherwise.",
        },
        feedback: {
            type: Type.STRING,
            description: "A brief, one-sentence explanation for why the answer is correct or incorrect. For example: 'This is a correct and efficient solution.' or 'The logic is flawed because it doesn't handle edge cases.'",
        },
        hint: {
            type: Type.STRING,
            description: "If the answer is incorrect, provide a concise hint to guide the user towards the correct solution. If the answer is correct, this should be null.",
        },
    },
    required: ["isCorrect", "feedback"],
};

export const validateAnswer = async (question: { title: string; description: string; category: string }, userAnswer: string): Promise<ValidationResult> => {
    if (!userAnswer || !userAnswer.trim()) {
        return {
            isCorrect: false,
            feedback: "No answer was provided to validate.",
            hint: "Please write your answer in the editor first."
        };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const prompt = `
        You are an expert technical interviewer. Your task is to validate a candidate's answer to a hands-on interview question.

        **The Question:**
        - Title: ${question.title}
        - Category: ${question.category}
        - Description: ${question.description}

        **The Candidate's Answer:**
        ---
        ${userAnswer}
        ---

        **Validation Task:**
        1.  Analyze the candidate's answer and determine if it correctly and efficiently solves the problem described.
        2.  Provide a brief, one-sentence feedback message explaining your decision.
        3.  If the answer is incorrect or suboptimal, provide a helpful hint to guide the candidate. The hint should not give away the full solution.

        **Output Format:**
        Provide your analysis in a structured JSON format that adheres to the provided schema.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: prompt,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        // Ensure hint is null if correct
        if (result.isCorrect) {
            result.hint = null;
        }
        return result;
    } catch (error) {
        console.error("Error validating answer with Gemini API:", error);
        throw new Error("Failed to validate the answer. Please try again.");
    }
};