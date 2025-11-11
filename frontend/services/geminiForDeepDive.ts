import { GoogleGenAI } from '@google/genai';

/**
 * Generates AI-powered feedback on a specific interview answer.
 * @param interviewQuestion The question asked by the interviewer.
 * @param userAnswer The user's answer to the question.
 * @param userQuery The user's specific query about their answer.
 * @returns A string containing the AI's feedback.
 */
export const getDeepDiveFeedback = async (
    interviewQuestion: string,
    userAnswer: string,
    userQuery: string
): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const prompt = `
        You are an elite interview coach providing a "Deep Dive" analysis on a specific user answer from a mock interview. Your feedback must be sharp, constructive, and directly address the user's query.

        **Context:**
        - **The Interview Question was:** "${interviewQuestion}"
        - **The User's Answer was:** "${userAnswer}"
        - **The User is now asking for feedback with this specific query:** "${userQuery}"

        **Your Task:**
        1.  Carefully analyze the user's answer in the context of the original question.
        2.  Directly address the user's query. Provide actionable advice, suggestions, or alternative phrasing.
        3.  Keep your feedback focused and concise. Use formatting like bullet points or bold text to make your advice easy to digest.
        4.  Maintain a supportive and professional tone.
    `;

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-flash', // Flash is suitable for this focused, conversational task.
            contents: prompt,
        });
        return response.text.trim();
    } catch (error) {
        console.error("Error getting deep dive feedback from Gemini API:", error);
        throw new Error("Failed to get feedback. The AI may be experiencing high demand. Please try again later.");
    }
};
