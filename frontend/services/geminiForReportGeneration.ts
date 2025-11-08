import { GoogleGenAI, Type } from '@google/genai';

interface TranscriptItem {
    speaker: string;
    text: string;
}

const schema = {
    type: Type.OBJECT,
    properties: {
        strengths: {
            type: Type.ARRAY,
            description: "A list of 3-4 specific strengths the candidate demonstrated during the interview, with brief examples from the transcript.",
            items: { type: Type.STRING },
        },
        weaknesses: {
            type: Type.ARRAY,
            description: "A list of 2-3 specific areas where the candidate could improve, presented constructively.",
            items: { type: Type.STRING },
        },
        improvements: {
            type: Type.ARRAY,
            description: "A list of 2-3 actionable tips or suggestions for the candidate to work on for future interviews.",
            items: { type: Type.STRING },
        },
        overallFeedback: {
            type: Type.STRING,
            description: "A concise, one-paragraph summary of the candidate's performance, highlighting key takeaways."
        }
    },
    required: ["strengths", "weaknesses", "improvements", "overallFeedback"],
};

export const generateInterviewReport = async (setupData: any, transcript: TranscriptItem[]) => {
    if (!transcript || transcript.length === 0) {
        return {
            strengths: ["No transcript available to analyze."],
            weaknesses: ["No transcript available to analyze."],
            improvements: ["Complete an interview to get feedback."],
            overallFeedback: "No transcript was provided, so a report could not be generated. Please complete an interview session to receive feedback on your performance."
        };
    }

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const transcriptText = transcript.map(item => `${item.speaker}: ${item.text}`).join('\n');

    const prompt = `
        You are an expert career coach and interview analyst. Your task is to provide constructive feedback to a candidate based on their mock interview performance.

        **Candidate & Interview Details:**
        - Role: ${setupData?.role || 'Not specified'}
        - Experience Level: ${setupData?.experience || 'Not specified'} years
        - Interview Type: ${setupData?.interviewType || 'General'}
        - Topics Discussed: ${setupData?.topics || 'General topics for the role'}

        **Full Interview Transcript:**
        ---
        ${transcriptText}
        ---

        **Analysis Task:**
        Based *only* on the provided transcript and interview details, analyze the candidate's performance. Identify their strengths, weaknesses, and provide actionable suggestions for improvement. Be specific and use examples from the transcript where possible. The feedback should be encouraging but honest.

        **Output Format:**
        Provide your analysis in a structured JSON format that adheres to the provided schema. Each point in the lists should be a complete sentence.
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
