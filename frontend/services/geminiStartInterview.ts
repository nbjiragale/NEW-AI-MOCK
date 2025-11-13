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
                description: "A brief, friendly explanation for the consistency check. If inconsistent, explain why (e.g., 'The topics selected don't seem to align with a typical role for a ...').",
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
            contents: `Act as a helpful setup assistant for a mock interview platform. Your task is to quickly check if the user's chosen job role and practice topics make sense together. For example, a 'Java Developer' preparing for 'C++ fundamentals' would be an inconsistent combination.

Here are the user's selections:
- Role: ${setupData.role}
- Topics: ${setupData.topics}

Based on this, does this seem like a logical and consistent set of topics for someone in this role? Please provide a simple boolean 'isConsistent' and a short, friendly 'reasoning'.`,
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
            contents: `I'm an assistant helping a user set up a mock interview. They've entered a company name, and I need a quick check to see if it's a real company. Please consider common typos.

Company Name: "${companyName}"

Is this a known company? Please respond with a simple 'companyExists' boolean and a short, helpful 'reasoning'. For instance, if you're unsure, you could say 'This might be a smaller or private company, or a possible typo.'`,
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
 * Generates relevant interview topics for a given role and experience.
 * @param role The job title/role.
 * @param experience The years of experience.
 * @returns A comma-separated string of topics.
 */
export const generateTopicsForRole = async (role: string, experience: string): Promise<string> => {
    const ai = new GoogleGenAI({ apiKey: process.env.API_KEY as string });

    const prompt = `
        As an expert career coach, I need you to generate a list of key topics for a mock interview.
        Please provide a comma-separated list of 5 to 7 of the most important technical and/or behavioral topics for the following profile.
        The output should be a single string, with topics separated by commas. Do not add any introductory text like "Here are the topics:".

        - Job Role: "${role}"
        - Years of Experience: "${experience || 'not specified'}"

        Example output for 'Senior Frontend Developer' with '5 years experience':
        React Hooks, TypeScript, State Management (Redux/Zustand), Web Performance Optimization, System Design for Frontend, Accessibility (a11y), Behavioral Questions
    `;

    try {
        const apiCall = () => ai.models.generateContent({
            model: 'gemini-2.5-flash',
            contents: prompt,
        });

        const response = await callGeminiWithRetry(apiCall);

        const text = response.text.trim();
        // Clean up the response to ensure it's a clean, comma-separated list.
        return text.replace(/^- \s*/gm, '').replace(/\n/g, ', ').replace(/, ,/g, ',').trim();

    } catch (error) {
        console.error("Error generating topics with Gemini API:", error);
        throw new Error("Failed to generate topics.");
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
                description: "A list of practical, scenario-based, or coding problems. For 'Technical' and 'Combined' interviews, this MUST contain exactly one DSA, one SQL, and one 'Other' problem.",
                items: {
                    type: Type.OBJECT,
                    properties: {
                        title: { type: Type.STRING, description: "The title of the hands-on problem." },
                        description: { type: Type.STRING, description: "A detailed description of the problem, including inputs, outputs, and constraints." },
                        category: {
                            type: Type.STRING,
                            description: "The category of the question. Must be one of: 'DSA', 'SQL', or 'Other'."
                        },
                        leetcodeSlug: {
                            type: Type.STRING,
                            description: "If the category is 'DSA' and the question is a known LeetCode problem, provide its URL slug (e.g., 'two-sum', 'valid-parentheses'). Otherwise, return null."
                        }
                    },
                    required: ["title", "description", "category"],
                },
            },
        },
        required: ["handsOnQuestions"],
    };

    const buildPrompt = () => {
        let prompt: string;
    
        // --- Handle Practice Mode separately ---
        if (setupData.type === 'Practice Mode') {
            let questionFocus = '';
            switch(setupData.interviewType) {
                case 'HR':
                    questionFocus = `The questions should focus on cultural fit, past experiences, and career goals. The tone should be professional but welcoming. No technical questions, please. For any 'handsOnQuestions', let's create a simple workplace scenario and categorize it as 'Other'.`;
                    break;
                case 'Behavioral/Managerial':
                    questionFocus = `The questions should be behavioral and situational, encouraging the STAR method. Let's focus on leadership, teamwork, and problem-solving scenarios. No coding challenges. For any 'handsOnQuestions', we can create a complex project management scenario and categorize it as 'Other'.`;
                    break;
                default: // Technical, Combined
                    questionFocus = `The questions should be a mix of conceptual theory and practical hands-on challenges based on the topic. Let's start with fundamentals and gradually increase difficulty. For the hands-on challenges, please categorize them into 'DSA', 'SQL', or 'Other'. For topics like 'SQL', create an SQL question. For 'DSA' or 'algorithms', create a coding challenge. Otherwise, a practical question categorized as 'Other' would be perfect.`;
                    break;
            }

            if (setupData.practiceType === 'By Topic Name') {
                prompt = `You're an expert interview coach. A user wants to do a focused practice session on a specific topic. Your goal is to create a realistic and helpful set of questions for them.

Session Details:
- Interview Type: ${setupData.interviewType}
- Topic for Practice: ${setupData.topicName}

Your Task:
Craft a set of interview questions that dive deep into this topic. ${questionFocus}`;
            } else if (setupData.practiceType === 'By Notes') {
                prompt = `You're an expert interview coach. A user wants you to act as an interviewer and ask them questions based on the notes they've provided. Your goal is to create a realistic and helpful interview session.

Session Details:
- Interview Type: ${setupData.interviewType}
- User's Notes:
---
${setupData.notesContent}
---

Your Task:
Thoroughly analyze the user's notes. Based on the content, craft a set of interview questions that would be appropriate for the specified interview type. The questions should directly relate to the concepts, technologies, or experiences mentioned in the notes. ${questionFocus}`;
            } else if (setupData.practiceType === 'Build Confidence') {
                const reflections = setupData.confidenceAnswers.map((item: { question: string, answer: string }) => `- ${item.question}\n  - User's Answer: ${item.answer}`).join('\n');
                prompt = `You're an empathetic and encouraging interview coach. A user has shared some areas where they lack confidence and wants your help to practice and improve. Your goal is to build them up, not tear them down.

User's Reflections:
${reflections}

Your Task:
Based on the user's reflections, create a supportive practice session. Start with a few foundational questions to build their confidence, then gently introduce questions that touch on their stated areas of weakness. Your tone should always be positive and constructive. ${questionFocus}`;
            } else {
                 prompt = `You're an expert interview coach preparing a custom practice session.
                 
Your Task:
The user has provided a specific list of questions. Your only job is to format these questions correctly for the interview session within the 'theoryQuestions' array. Do not generate any new questions. For 'handsOnQuestions', please create a single, simple, general problem-solving scenario and categorize it as 'Other'.`;
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
                    persona = 'Imagine you are the coordinator for a panel interview. Your job is to script the entire interview for three different people: a meticulous Senior Engineer, a sharp Hiring Manager, and a friendly HR Specialist. You need to create distinct sets of questions that perfectly match each of their roles and perspectives.';
                    // Fix: Escaped backticks around property names to prevent them from being parsed as template literals.
                    questionInstructions = `Let's design the flow for this 'Combined' interview. Here's the plan:

1.  **For the Software Engineer:** Let's arm them with some solid conceptual questions for the \\\`technicalQuestions\\\` list.
2.  **For the Hiring Manager:** We need some great behavioral questions for \\\`behavioralQuestions\\\`. Think of situations that would reveal their leadership, teamwork, and problem-solving style. The STAR method is key here.
3.  **For the HR Specialist:** For the \\\`hrQuestions\\\`, let's focus on cultural fit, motivation, and their interest in the company.
4.  **Hands-On Challenges (\\\`handsOnQuestions\\\`):** This is crucial. We need exactly three practical problems:
    - **A DSA Challenge:** A classic algorithm or data structure problem. This is for the Engineer. Please categorize it as 'DSA'. If it's a known LeetCode problem, *please* find its URL slug and add it to \\\`leetcodeSlug\\\` (e.g., 'two-sum'). If not, just leave \\\`leetcodeSlug\\\` as null.
    - **An SQL Challenge:** A practical database query problem, maybe with a small schema to work from. Also for the Engineer. Categorize as 'SQL'. \\\`leetcodeSlug\\\` should be null.
    - **A Scenario Challenge:** A high-level problem-solving scenario a Hiring Manager would appreciate (e.g., 'How would you design X?', 'How would you improve process Y?'). Categorize this one as 'Other'. \\\`leetcodeSlug\\\` should be null.`;
                    break;
                case 'HR':
                    persona = "Step into the shoes of a warm and perceptive HR professional. You're conducting the first-round interview. Your main goal is to get to know the candidate, understand their motivations, and see if they would be a good fit for the company culture. You want them to feel comfortable and open up.";
                    questionInstructions = `Let's prepare for a comprehensive HR screening round. Here's what we need:

1.  **Motivation & Company Fit:** 3-4 questions to see if they've done their homework on the company and are genuinely interested in the role.
2.  **Background & Experience:** 4-5 questions to walk through their resume, explore their career choices, and understand their key accomplishments.
3.  **Hands-On Scenarios:** For \\\`handsOnQuestions\\\`, let's add one simple workplace scenario question and categorize it as 'Other'.
Just a reminder, let's keep all questions open-ended and avoid anything deeply technical.`;
                    break;
    
                case 'Behavioral/Managerial':
                    persona = "You are a sharp, experienced Hiring Manager. You've seen it all. You're looking for a top performer for your team. You need to dig deep into the candidate's past experiences to see how they handle real-world challenges. Your questions should be scenario-based, pushing them to provide concrete examples of their skills.";
                    questionInstructions = `We need a set of insightful behavioral questions that encourage the STAR method (Situation, Task, Action, Result). Let's structure it like this:

1.  **Leadership & Influence:** 3-4 questions about times they've led projects, mentored others, or influenced decisions.
2.  **Conflict & Problem Solving:** 3-4 questions about how they've handled disagreements, difficult stakeholders, and overcome project hurdles.
3.  **Hands-On Scenarios:** For \\\`handsOnQuestions\\\`, let's create 1-2 complex scenarios about team or project management and categorize them as 'Other'.
Framing these with 'Tell me about a time when...' is a great approach. No technical deep-dives for this one.`;
                    break;
    
                case 'Technical':
                default:
                    persona = "Put on the hat of a Senior Engineer who is passionate about technical excellence. You need to verify the candidate's skills and problem-solving abilities. Your questions should be precise, test their fundamental knowledge, and assess how they approach complex technical problems. You value clarity and a well-reasoned thought process.";
                    // Fix: Escaped backticks around property names to prevent them from being parsed as template literals.
                    questionInstructions = `Let's build a balanced technical interview. Here's the plan:

1.  **Conceptual Deep Dive (\\\`theoryQuestions\\\`):** Let's have 4-5 questions that really test their fundamental and advanced knowledge on the specified topics.
2.  **Hands-On Challenges (\\\`handsOnQuestions\\\`):** This part is key. We need exactly three practical problems:
    - **A DSA Challenge:** A classic data structure or algorithm problem. Please categorize it as 'DSA'. If it's a known LeetCode problem, find its URL slug for the \\\`leetcodeSlug\\\` field (e.g., 'two-sum'). Otherwise, \\\`leetcodeSlug\\\` should be null.
    - **An SQL Challenge:** A solid database query problem. Providing a simple schema would be helpful. Categorize it as 'SQL', with \\\`leetcodeSlug\\\` as null.
    - **An 'Other' Challenge:** A practical problem related to general programming, like Object-Oriented principles, functional programming, or concurrency. Let's categorize this as 'Other', with \\\`leetcodeSlug\\\` as null.`;
                    break;
            }
    
            prompt = `${persona}\n\nBased on the following candidate profile, please help me generate a set of interview questions.\n\n${profile}\n\n${questionInstructions}`;
        }
    
        prompt += `\n\nOne last thing, and this is important: please make sure every question is a single, focused query. Avoid compound questions. For instance, instead of "Tell me about X and Y", ask about X, then ask about Y as a separate question. This makes the interview flow much better.

Now, please provide the complete set of questions in the required JSON format, keeping the candidate's experience level in mind.`;
    
        return prompt;
    };

    try {
        const apiCall = () => ai.models.generateContent({
            model: 'gemini-2.5-pro',
            contents: buildPrompt(),
            config: {
                responseMimeType: "application/json",
                responseSchema: schema,
                thinkingConfig: { thinkingBudget: 32768 },
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