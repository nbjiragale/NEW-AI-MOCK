import { GoogleGenAI, Type } from '@google/genai';

// Helper function for API calls with retry logic
const callGeminiWithRetry = async (apiCall: () => Promise<any>, maxRetries = 3) => {
    let delay = 1000; // Start with 1 second delay
    for (let i = 0; i < maxRetries; i++) {
        try {
            const result = await apiCall();
            return result; // Success
        } catch (error: any) {
            console.error(`Attempt ${i + 1} failed:`, error);
            const isOverloadedError = error.message && (error.message.includes('503') || error.message.toLowerCase().includes('overloaded'));
            if (isOverloadedError && i < maxRetries - 1) {
                console.log(`Model is overloaded. Retrying in ${delay / 1000} seconds...`);
                await new Promise(resolve => setTimeout(resolve, delay));
                delay *= 2; // Exponential backoff
            } else {
                throw error; // Re-throw on non-retryable error or last attempt
            }
        }
    }
};


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
        const apiCall = () => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Analyze the following candidate profile for logical consistency, specifically between the 'Role' and the 'Main Topics to Focus On'. For example, a 'Java Developer' role is inconsistent with 'C++' as a main topic. 
        
- Role: ${setupData.role}
- Main Topics to Focus On: ${setupData.topics}
        
Is this combination consistent for a job interview preparation? Provide a boolean response and a brief reason.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const response = await callGeminiWithRetry(apiCall);

        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);

        if (typeof result.isConsistent === 'boolean' && typeof result.reasoning === 'string') {
            return result;
        } else {
            console.warn("Gemini consistency check response did not match schema:", result);
            return { isConsistent: true, reasoning: "AI response format was unexpected, proceeding." };
        }
    } catch (error) {
        console.error("Error checking consistency with Gemini API after retries:", error);
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
        const apiCall = () => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: `Please verify if "${companyName}" is a real, publicly known company. Consider common typos or variations. Provide a boolean response and a brief reason.`,
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });

        const response = await callGeminiWithRetry(apiCall);
        
        const jsonText = response.text.trim();
        const result = JSON.parse(jsonText);
        
        if (typeof result.companyExists === 'boolean' && typeof result.reasoning === 'string') {
            return result;
        } else {
            console.warn("Gemini response did not match schema:", result);
            return { companyExists: true, reasoning: "AI response format was unexpected, proceeding as valid." };
        }

    } catch (error) {
        console.error("Error validating company with Gemini API after retries:", error);
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

    const isCombinedInterview = setupData.interviewType === 'Combined';

    const schema = {
        type: Type.OBJECT,
        properties: {
            ...(isCombinedInterview ? {
                technicalQuestions: {
                    type: Type.ARRAY,
                    description: "A list of 4-5 conceptual technical questions for the Software Engineer to ask.",
                    items: { type: Type.STRING },
                },
                behavioralQuestions: {
                    type: Type.ARRAY,
                    description: "A list of 3-4 behavioral (STAR method) questions for the Hiring Manager to ask.",
                    items: { type: Type.STRING },
                },
                hrQuestions: {
                    type: Type.ARRAY,
                    description: "A list of 2-3 HR/cultural fit questions for the HR Specialist to ask.",
                    items: { type: Type.STRING },
                },
            } : {
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
            }),
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
        required: ["handsOnQuestions"],
    };

    const buildPrompt = () => {
        let prompt: string;
    
        // --- Handle Practice Mode separately ---
        if (setupData.type === 'Practice Mode') {
            prompt = `You are an AI practice partner. Your goal is to help a user prepare for an interview. Generate a set of questions based on the following session details.

Session Details:
- Interview Type: ${setupData.interviewType}`;
    
            let questionFocus = '';
            switch(setupData.interviewType) {
                case 'HR':
                    questionFocus = 'Generate questions focusing on cultural fit, past experiences, and career goals. Your tone should be professional but welcoming. Avoid technical questions.';
                    break;
                case 'Behavioral/Managerial':
                    questionFocus = 'Generate behavioral and situational questions (STAR method). Focus on leadership, teamwork, and problem-solving scenarios. Avoid coding challenges.';
                    break;
                default: // Technical, Combined
                    questionFocus = 'Generate a mix of conceptual theory questions and practical hands-on coding challenges based on the topic. Start with fundamentals and gradually increase difficulty.';
                    break;
            }

            if (setupData.practiceType === 'By Topic Name') {
                prompt += `\n- Topic: ${setupData.topicName}`;
                prompt += `\n\nYour Task: Generate a series of questions related to this topic. ${questionFocus}`;
            } else if (setupData.practiceType === 'Build Confidence') {
                const reflections = setupData.confidenceAnswers.map((item: { question: string, answer: string }) => `- ${item.question}\n  - User's Answer: ${item.answer}`).join('\n');
                prompt += `\n\nUser's Reflections to Build Confidence On:\n${reflections}`;
                prompt += `\n\nYour Task: The user wants to build confidence. Based on their reflections, generate a set of questions that gently challenge these areas. Your tone should be encouraging and supportive. Start with easier questions to build momentum, and then introduce slightly more complex scenarios. ${questionFocus}`;
            }
            
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
                case 'Combined':
                    persona = 'You are an AI system controlling a panel of three interviewers: a Senior Engineer, a Hiring Manager, and an HR Specialist. Your task is to generate distinct sets of questions appropriate for each of them based on the candidate profile.';
                    questionInstructions = `Generate questions for a 'Combined' interview:
1.  **For the Software Engineer:** Populate \`technicalQuestions\` with conceptual questions and \`handsOnQuestions\` with a practical coding challenge, all related to the candidate's topics and experience.
2.  **For the Hiring Manager:** Populate \`behavioralQuestions\` with situational questions that probe leadership, teamwork, and problem-solving skills using the STAR method.
3.  **For the HR Specialist:** Populate \`hrQuestions\` with questions about motivation, cultural fit, and career goals, considering the target company if provided.`;
                    break;
                case 'HR':
                    persona = 'You are an experienced and empathetic HR professional conducting an initial screening interview. Your goal is to assess the candidate\'s personality, motivation, cultural fit, and basic qualifications. You should be welcoming and aim to understand the candidate\'s career aspirations and how they align with the company\'s values.';
                    questionInstructions = `Generate questions suitable for a comprehensive HR screening round:
1.  **Company-Specific & Motivation:** 3-4 questions to gauge their research on the company, their genuine interest in the role, and what attracts them to our mission.
2.  **Career & Background:** 4-5 questions exploring their resume, career journey, key achievements, and reasons for leaving previous roles.
3.  **Behavioral & Situational:** 2-3 questions about teamwork, handling pressure, and workplace communication style.
Important: Ensure all questions are open-ended. DO NOT generate technical or coding problems. HandsOnQuestions should contain 0-1 simple workplace scenario questions.`;
                    break;
    
                case 'Behavioral/Managerial':
                    persona = 'You are a seasoned Hiring Manager for a fast-paced team. You are looking for a candidate who not only has the right experience but also demonstrates strong leadership, problem-solving, and collaborative skills. Your interview style is probing and based on real-world scenarios. You want to understand *how* a candidate has handled situations in the past.';
                    questionInstructions = `Generate behavioral and situational questions designed to be answered using the STAR method (Situation, Task, Action, Result):
1.  **Leadership & Influence:** 3-4 questions about leading projects, mentoring others, and influencing decisions.
2.  **Conflict & Problem Solving:** 3-4 questions about resolving disagreements, handling difficult stakeholders, and overcoming challenges.
3.  **Teamwork & Collaboration:** 2-3 questions about their role in a team and contributing to team success.
4.  **Hands-On Scenarios:** For the HandsOnQuestions, generate 1-2 complex scenario-based problems about team or project management.
Important: Frame questions with 'Tell me about a time when...' or 'Describe a situation where...'. DO NOT generate technical or coding problems.`;
                    break;
    
                case 'Technical':
                default:
                    persona = 'You are a Senior Engineer and a key technical interviewer for your team. You value clear communication, strong fundamentals, and a practical approach to problem-solving. Your goal is to accurately assess the candidate\'s technical depth, their ability to write clean and efficient code, and how they articulate their thought process.';
                    questionInstructions = `Generate a balanced set of technical interview questions for the specified profile:
1.  **Company-Specific / Stack-Relevant:** 2-3 questions that might relate to the target company's known technology stack or business domain.
2.  **Conceptual Deep Dive (Theory):** 4-5 questions that test fundamental and advanced concepts related to the specified topics.
3.  **Hands-On Coding Challenge:** 1 challenging, practical coding problem that requires not just a solution, but also a discussion of trade-offs and optimizations. Provide a clear title and a detailed description with examples.`;
                    break;
            }
    
            prompt = `${persona}\n\nBased on the following candidate profile, generate a set of interview questions.\n\n${profile}\n\n${questionInstructions}`;
        }
    
        prompt += `\n\nIMPORTANT: Each question must be a single, focused query. Do NOT create compound questions that ask multiple things at once. For example, instead of asking "What is the difference between an interface and an abstract class, and when would you use each?", create two separate questions.
    
    Return the response in a structured JSON format adhering to the provided schema. Ensure the questions are appropriate for the candidate's experience level.`;
    
        return prompt;
    };

    try {
        const apiCall = () => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: buildPrompt(),
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
            },
        });
        const response = await callGeminiWithRetry(apiCall);
        const jsonText = response.text.trim();
        return JSON.parse(jsonText);
    } catch (error) {
        console.error("Error generating interview questions with Gemini API after retries:", error);
        throw new Error("Failed to generate interview questions. Please try again.");
    }
};