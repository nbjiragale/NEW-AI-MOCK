import { GoogleGenAI, Type } from '@google/genai';

interface TranscriptItem {
    speaker: string;
    text: string;
}

const schema = {
    type: Type.OBJECT,
    properties: {
        overallScore: {
            type: Type.NUMBER,
            description: "A single, overall score for the candidate's performance, from 0 to 100.",
        },
        overallFeedback: {
            type: Type.STRING,
            description: "A concise, one-paragraph summary of the candidate's performance, highlighting key takeaways."
        },
        performanceBreakdown: {
            type: Type.ARRAY,
            description: "A detailed breakdown of performance across different key categories relevant to the interview type.",
            items: {
                type: Type.OBJECT,
                properties: {
                    category: {
                        type: Type.STRING,
                        description: "The category being assessed (e.g., 'Technical Knowledge', 'Communication Skills', 'Problem Solving', 'Behavioral Competency')."
                    },
                    score: {
                        type: Type.NUMBER,
                        description: "A score from 0 to 100 for this specific category."
                    },
                    feedback: {
                        type: Type.STRING,
                        description: "Specific, constructive feedback for this category, citing examples from the transcript if possible."
                    }
                },
                required: ["category", "score", "feedback"],
            }
        },
        actionableSuggestions: {
            type: Type.ARRAY,
            description: "A list of 3-4 concrete, actionable tips for the candidate to improve for their next interview.",
            items: { type: Type.STRING },
        }
    },
    required: ["overallScore", "overallFeedback", "performanceBreakdown", "actionableSuggestions"],
};

export const generateInterviewReport = async (setupData: any, transcript: TranscriptItem[]) => {
    if (!transcript || transcript.length === 0) {
        throw new Error("No transcript data available to generate a report.");
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const transcriptText = transcript.map(item => `${item.speaker}: ${item.text}`).join('\n');

    const prompt = `
        You are a world-class career coach and a sharp, experienced hiring manager. Your task is to provide a rigorous, honest, and deeply insightful performance review for a candidate based on their mock interview. Your feedback should be direct, constructive, and aimed at genuinely helping the candidate improve. Do not sugarcoat, but remain professional.

        **Candidate & Interview Details:**
        - Role: ${setupData?.role || 'Not specified'}
        - Experience Level: ${setupData?.experience || 'Not specified'} years
        - Interview Type: ${setupData?.interviewType || 'General'}
        - Topics Discussed: ${setupData?.topics || 'General topics for the role'}

        **Full Interview Transcript:**
        ---
        ${transcriptText}
        ---

        **Your Analysis Task:**
        Based *only* on the provided transcript and interview details, perform a thorough analysis of the candidate's performance. Evaluate them across several key dimensions.

        1.  **Scoring:** Assign a numerical score (0-100) for the overall performance and for each key category. Be critical in your scoring. An average performance should be around 60-70. A score of 90+ should be reserved for truly exceptional answers.
        2.  **Categorical Feedback:** Provide specific feedback for categories relevant to the interview type. For a technical interview, focus on 'Technical Knowledge' and 'Problem Solving'. For a behavioral one, focus on 'Behavioral Competency' and 'Communication Skills'. For a combined interview, include all relevant categories. Use direct examples from the transcript to support your points.
        3.  **Overall Summary:** Write a concise summary of their performance.
        4.  **Actionable Suggestions:** Provide concrete, actionable steps the candidate can take to improve. Instead of "practice more," suggest "practice articulating your thought process on medium-level LeetCode problems, focusing on Big O notation."

        **Output Format:**
        Provide your complete analysis in a structured JSON format that adheres to the provided schema. Ensure all fields are populated with high-quality, insightful content.
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
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating interview report with Gemini API:", error);
        throw new Error("Failed to generate interview report. Please try again.");
    }
};