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
        let prompt: string;
    
        // --- Handle Practice Mode separately ---
        if (setupData.type === 'Practice Mode') {
            prompt = `You are an AI practice partner. Generate interview questions for a user in practice mode based on the following session details.
    
    Session Details:
    - Interview Type: ${setupData.interviewType}`;
    
            if (setupData.practiceType === 'By Topic Name') {
                prompt += `\n- Topic: ${setupData.topicName}`;
            } else if (setupData.practiceType === 'Build Confidence') {
                const reflections = setupData.confidenceAnswers.map((item: { question: string, answer: string }) => `- ${item.question}\n  - ${item.answer}`).join('\n');
                prompt += `\n- User's Reflections to Build Confidence On:\n${reflections}`;
            }
            
            let questionFocus = '';
            switch(setupData.interviewType) {
                case 'HR':
                    questionFocus = 'Generate questions focusing on cultural fit, past experiences, and career goals. Avoid technical questions.';
                    break;
                case 'Behavioral/Managerial':
                    questionFocus = 'Generate behavioral and situational questions (STAR method). Focus on leadership, teamwork, and problem-solving scenarios. Avoid coding challenges.';
                    break;
                default: // Technical, Combined
                    questionFocus = 'Generate a mix of conceptual theory questions and practical hands-on coding challenges based on the topic.';
                    break;
            }
    
            prompt += `\n\nQuestion Focus: ${questionFocus}`;
    
        // --- Handle Standard Interview Modes ---
        } else {
            const profile = `Candidate Profile:
    - Role: ${setupData.role || 'Not specified'}
    - Experience: ${setupData.experience || 'Not specified'} years
    - Interview Type: ${setupData.interviewType}
    - Key Topics to focus on: ${setupData.topics || 'General topics for the role'}
    - Target Company / Style: ${setupData.targetCompany || 'A generic tech company'}`;
    
            let persona = '';
            let questionInstructions = '';
    
            switch (setupData.interviewType) {
                case 'HR':
                    persona = 'You are an expert HR interviewer preparing for a screening call.';
                    questionInstructions = `Generate questions suitable for an HR round.
    1. Company-Specific Questions: 3-5 questions about cultural fit and motivation to join.
    2. Theory Questions: 5-7 questions about career history, strengths/weaknesses, and teamwork.
    3. Hands-On Questions: Generate 0-1 simple workplace scenario question. DO NOT generate technical or coding problems.`;
                    break;
    
                case 'Behavioral/Managerial':
                    persona = 'You are an expert Hiring Manager conducting a behavioral interview.';
                    questionInstructions = `Generate behavioral and managerial questions.
    1. Company-Specific Questions: 3-5 questions related to leadership principles and company values.
    2. Theory Questions: 7-10 behavioral questions (STAR method) on leadership, conflict, and project management.
    3. Hands-On Questions: Generate 1-2 scenario-based problems about team or project management. DO NOT generate technical or coding problems.`;
                    break;
    
                case 'Technical':
                case 'Combined':
                default:
                    persona = 'You are an expert technical interviewer preparing for a mock interview.';
                    questionInstructions = `Generate questions categorized into three types:
    1. Company-Specific Questions: Relevant to the company style and potential technical stack.
    2. Theory Questions: Conceptual technical questions based on the candidate's profile.
    3. Hands-On Questions: 1-2 practical coding challenges. For each, provide a title and a detailed description.`;
                    break;
            }
    
            prompt = `${persona}\n\nBased on the following candidate profile, generate a set of interview questions.\n\n${profile}\n\n${questionInstructions}`;
        }
    
        // --- Common Instructions for all modes ---
        prompt += `\n\nIMPORTANT: Each question must be a single, focused query. Do NOT create compound questions that ask multiple things at once. For example, instead of asking "What is the difference between an interface and an abstract class, and when would you use each?", create two separate questions.
    
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