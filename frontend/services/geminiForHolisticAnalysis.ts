import { GoogleGenAI, Type } from '@google/genai';

interface TranscriptItem {
    speaker: string;
    text: string;
}

const schema = {
    type: Type.OBJECT,
    properties: {
        vocalDelivery: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER, description: "Score (0-100) for vocal delivery, including pace, confidence, and use of filler words." },
                feedback: { type: Type.STRING, description: "Detailed feedback on the user's vocal tone, clarity, and speaking pace." },
            },
            required: ["score", "feedback"],
        },
        nonVerbalCues: {
            type: Type.OBJECT,
            properties: {
                score: { type: Type.NUMBER, description: "Score (0-100) for non-verbal cues like eye contact, posture, and facial expressions." },
                feedback: { type: Type.STRING, description: "Detailed feedback on body language, referencing observed posture, expressions, and eye contact from the provided frames." },
            },
            required: ["score", "feedback"],
        },
    },
    required: ["vocalDelivery", "nonVerbalCues"],
};


export const generateHolisticAnalysis = async (transcript: TranscriptItem[], videoFrames: string[]) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const transcriptText = transcript.map(item => `${item.speaker}: ${item.text}`).join('\n');

    const prompt = `
        You are an expert communication coach and body language analyst. Your task is to provide a holistic performance review based on a user's mock interview. You will be given the full interview transcript and a series of image frames captured during the session. Analyze these two sources of information to evaluate the user's vocal delivery and non-verbal communication skills.

        **Analysis Task:**

        1.  **Vocal Delivery Analysis (from Transcript):**
            *   Read through the transcript (spoken by "You").
            *   Analyze the language used for signs of confidence, clarity, and conciseness.
            *   Infer the speaking pace and identify the potential overuse of filler words (e.g., "um," "ah," "like," "you know").
            *   Provide a score (0-100) and constructive feedback.

        2.  **Non-Verbal Cues Analysis (from Image Frames):**
            *   Examine the sequence of image frames provided.
            *   Assess the user's posture. Are they sitting upright and engaged, or slouching?
            *   Evaluate their facial expressions. Do they appear confident, engaged, and friendly, or nervous and distracted?
            *   Analyze their eye contact with the camera. Are they looking directly at the "interviewer" or looking away frequently?
            *   Provide a score (0-100) and specific feedback based on these visual observations.

        **Full Interview Transcript:**
        ---
        ${transcriptText}
        ---

        Please provide your complete analysis in the required JSON format. The feedback should be supportive and actionable.
    `;
    
    const textPart = { text: prompt };
    const imageParts = videoFrames.map(frame => ({
        inlineData: {
            mimeType: 'image/jpeg',
            data: frame,
        }
    }));

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: { parts: [textPart, ...imageParts] },
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 32768 },
            },
        });

        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating holistic analysis with Gemini API:", error);
        throw new Error("Failed to generate holistic analysis.");
    }
};