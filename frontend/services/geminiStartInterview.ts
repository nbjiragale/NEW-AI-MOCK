import { GoogleGenAI, Type } from '@google/genai';

/**
 * Checks for logical consistency between the candidate's role and topics.
 * @param setupData The configuration data for the interview session.
 * @returns An object with consistency status and reasoning.
 */
export const checkDetailsConsistency = async (setupData: any): Promise<{ isConsistent: boolean; reasoning: string }> => {
    // Dynamically import to avoid load-time issues
    const { GoogleGenAI, Type } = await import('@google/genai');
    
    const schema = {
        type: Type.OBJECT,
        properties: {
            isConsistent: {
                type: Type.BOOLEAN,
                description: "True if the job role and topics are consistent and logical for an interview. False otherwise.",
            },
            reasoning: {
                type: Type.STRING,
                description: "A brief explanation for the consistency check. If inconsistent, explain why (e.g., 'The topics do not match the specified job role.').",
            },
        },
        required: ["isConsistent", "reasoning"],
    };

    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    // Don't run this check for practice mode or if topics/role are empty
    if (setupData.type === 'Practice Mode' || !setupData.topics || !setupData.role || !setupData.topics.trim()) {
        return { isConsistent: true, reasoning: "Consistency check not applicable for this mode." };
    }

    try {
        const prompt = `Analyze the following candidate profile for logical consistency, specifically between the 'Role' and the 'Main Topics to Focus On'. For example, a 'Java Developer' role is inconsistent with 'C++' as a main topic. 
        
        - Role: ${setupData.role}
        - Main Topics to Focus On: ${setupData.topics}
        
        Is this combination consistent for a job interview preparation? Provide a boolean response and a brief reason.`;

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

        if (typeof result.isConsistent === 'boolean' && typeof result.reasoning === 'string') {
            return result;
        } else {
            console.warn("Gemini consistency check response did not match schema:", result);
            return { isConsistent: true, reasoning: "AI response format was unexpected, proceeding." };
        }
    } catch (error) {
        console.error("Error checking consistency with Gemini API:", error);
        return { isConsistent: true, reasoning: "Could not perform consistency check due to a technical error." };
    }
};

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


/**
 * Generates interview questions using the Gemini API based on setup data.
 * @param setupData The configuration data for the interview session.
 * @returns A structured object of interview questions.
 */
export const generateInterviewQuestions = async (setupData: any) => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const schema = {
        type: Type.OBJECT,
        properties: {
            companySpecificQuestions: {
                type: Type.ARRAY,
                description: "A list of 3-5 research-based or cultural fit questions relevant to the target company. If no company is specified, generate generic cultural fit questions.",
                items: { type: Type.STRING },
            },
            theoryQuestions: {
                type: Type.ARRAY,
                description: "A list of 5-7 conceptual questions based on the role, experience, and topics provided.",
                items: { type: Type.STRING },
            },
            handsOnQuestions: {
                type: Type.ARRAY,
                description: "A list of 1-2 practical, scenario-based, or coding problems. For coding problems, provide a title and a detailed description.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "The title of the hands-on problem." },
                        description: { type: Type.STRING, description: "A detailed description of the problem, including inputs, outputs, and constraints." },
                    },
                    required: ["title", "description"],
                },
            },
        },
        required: ["companySpecificQuestions", "theoryQuestions", "handsOnQuestions"],
    };

    const buildPrompt = () => {
        let prompt = `You are an expert technical interviewer preparing for a mock interview. Based on the following candidate profile, generate a set of interview questions.
        
Candidate Profile:
- Role: ${setupData.role || 'Not specified'}
- Experience: ${setupData.experience || 'Not specified'} years
- Interview Type: ${setupData.interviewType}
- Key Topics to focus on: ${setupData.topics || 'General topics for the role'}
- Target Company / Style: ${setupData.targetCompany || 'A generic tech company'}`;

        if (setupData.type === 'Practice Mode') {
            prompt = `You are an AI practice partner. Generate interview questions for a user in practice mode.
            
Session Details:
- Interview Type: ${setupData.interviewType}`;
            if (setupData.practiceType === 'By Topic Name') {
                prompt += `\n- Topic: ${setupData.topicName}`;
            } else if (setupData.practiceType === 'Build Confidence') {
                 const reflections = setupData.confidenceAnswers.map((item: {question: string, answer: string}) => `- ${item.question}\n  - ${item.answer}`).join('\n');
                 prompt += `\n- The user wants to build confidence. Based on their reflections below, create questions that target their weaker areas in a supportive way.\n${reflections}`;
            }
        }

        prompt += `\n\nGenerate questions categorized into three types:
1. Company-Specific Questions: Relevant to the company style.
2. Theory Questions: Conceptual questions based on the profile.
3. Hands-On Questions: Practical problems or coding challenges. For each coding challenge, provide a title and a detailed description.

Return the response in a structured JSON format adhering to the provided schema. Ensure the questions are appropriate for the candidate's experience level.`;

        return prompt;
    };

    try {
        const response = await ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: buildPrompt(),
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating interview questions with Gemini API:", error);
        throw new Error("Failed to generate interview questions. Please try again.");
    }
};