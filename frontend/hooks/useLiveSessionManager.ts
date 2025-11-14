import { useState, useEffect, useRef, useCallback } from 'react';
import { initiateLiveSession } from '../services/geminiLiveService';
import { CombinedLiveController } from '../services/combinedLiveController';

const MAX_RETRIES = 3;

export interface TranscriptItem {
    speaker: string; text: string; id: number; status: 'interim' | 'finalized';
}
type Persona = 'technical' | 'behavioral' | 'hr';

export const useLiveSessionManager = (setupData: any, interviewQuestions: any, interviewerDetails: any[]) => {
    const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
    const transcriptIdCounter = useRef(0);
    const [sessionStatus, setSessionStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
    const [isReconnecting, setIsReconnecting] = useState(false);
    const [isAiSpeaking, setIsAiSpeaking] = useState(false);
    const [activeInterviewerName, setActiveInterviewerName] = useState<string | null>(null);
    const sessionManagerRef = useRef<{ close: () => void; askQuestion?: (type: Persona) => void; askForCandidateQuestions?: () => void; retryCount?: number } | null>(null);
    const retryCountRef = useRef(0);
    const transcriptRef = useRef<TranscriptItem[]>([]);

    useEffect(() => { transcriptRef.current = transcript; }, [transcript]);

    const handleTranscriptionUpdate = useCallback(({ speaker, text, isFinal }: { speaker: string; text: string; isFinal: boolean }) => {
        setTranscript(prev => {
            const newTranscript = [...prev];
            // FIX: The `findLastIndex` method is not available in all environments.
            // Manually implementing the logic ensures broader compatibility.
            let lastInterimIndex = -1;
            for (let i = newTranscript.length - 1; i >= 0; i--) {
                if (newTranscript[i].speaker === speaker && newTranscript[i].status === 'interim') {
                    lastInterimIndex = i;
                    break;
                }
            }

            if (lastInterimIndex !== -1) {
                newTranscript[lastInterimIndex].text = text;
                if (isFinal) {
                    newTranscript[lastInterimIndex].status = 'finalized';
                }
            } else if (!isFinal) {
                newTranscript.push({ speaker, text, id: transcriptIdCounter.current++, status: 'interim' });
            }
            return newTranscript;
        });
    }, []);

    const getSystemInstruction = useCallback(() => {
        const candidateName = setupData.candidateName || 'there';
        const interviewerName = interviewerDetails?.[0]?.name || 'Interviewer';
        
        if (setupData?.type === 'Practice Mode' && setupData?.practiceType === 'Fluency Practice') {
            const questionList = (interviewQuestions?.theoryQuestions || [])
                .map((q: string, i: number) => `${i + 1}. ${q}`)
                .join('\n');
            
            return `You are a practice partner named ${interviewerName} for an interview fluency drill. The user, ${candidateName}, has provided a list of questions they want to practice answering. Your role is to help them rehearse.

**Your Instructions (VERY IMPORTANT):**
1.  Your ONLY task is to ask these questions to the user, one by one, in the exact order they are provided.
2.  Read each question verbatim. Do NOT rephrase it.
3.  After the user provides their answer, your ONLY response should be a simple, neutral transition like "Okay, thank you.", "Got it. Let's move on.", or "Alright, next question."
4.  After your transition, immediately ask the next question from the list.
5.  **DO NOT ask any follow-up questions.**
6.  **DO NOT provide any feedback on their answers.**
7.  **DO NOT engage in small talk or chitchat.** Your role is strictly to read the questions from the script.

Here is the list of questions you must ask:
${questionList}

Start by saying "Hello ${candidateName}, I'll be your practice partner today. Let's begin with your first question." and then immediately ask the first question on the list.`;
        }
        
        if (setupData?.interviewType === 'Combined') return ''; // Handled by controller

        const interviewerRole = interviewerDetails?.[0]?.role || 'hiring manager';
        const companyName = setupData.targetCompany || 'our company';
        const experienceYears = Math.floor(Math.random() * 3) + 4;
        
        const theoryQs = interviewQuestions?.theoryQuestions || [];
        const companyQs = interviewQuestions?.companySpecificQuestions || [];
        const allQuestions = [...theoryQs, ...companyQs];

        const intro = `Begin the interview with a warm and welcoming tone. First, greet the candidate, ${candidateName}, by name. Then, introduce yourself. Say something like: "Hi ${candidateName}, it's great to meet you! My name is ${interviewerName}, and I'll be your interviewer today. I'm a ${interviewerRole} at ${companyName}, and I've been here for about ${experienceYears} years."`;
        
        if (allQuestions.length > 0) {
          const questionList = allQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
          return `You are an expert interviewer named ${interviewerName}. Your persona is ${setupData.persona || 'friendly'}, but above all, you are empathetic, encouraging, and aim to make this a positive and constructive experience for the candidate, ${candidateName}. Your goal is to simulate a realistic yet supportive interview. Make the candidate feel comfortable enough to give their best answers.

Here is your list of main questions to guide the conversation:
${questionList}

**Your Conversational Style (VERY IMPORTANT):**
- **Engage, Don't Just Interrogate:** Your primary goal is a natural, two-way conversation.
- **Listen Actively & Ask Follow-ups:** Your follow-up questions are the most critical part of making this feel real. They MUST be based on what the candidate actually said. Ask one insightful follow-up question to dig deeper into their response before moving on.
- **Be Human & Vary Your Phrasing:** Avoid robotic repetition. Acknowledge their answers with varied phrases like "That makes sense," "Thanks for walking me through that," "I appreciate you sharing that detail," or "That's a great point."
- **Provide Encouragement:** If a candidate seems to be struggling or is very nervous, offer a brief, encouraging comment. Use phrases like "Take your time, there's no rush," or "That's a tough question, just walk me through your thought process." Your goal is to help them succeed, not to intimidate them.
- **Use Natural Transitions:** When you are ready to move to the next main question from your list, use a smooth transition. For example: "Okay, that's very clear. Let's switch gears a bit..." or "Great, thanks for clarifying. The next thing I'd like to discuss is..."

**Interview Flow:**
1. ${intro}
2. After your introduction, start with a simple, warm-up question like "So, how's your day going so far?".
3. Wait for their response, then proceed with the first question from your list.
4. Follow the conversational style described above for the entire interview.`;
        }
        return `You are an expert interviewer named ${interviewerName}. Your persona is ${setupData.persona || 'friendly'}. Your task is to conduct a mock interview with a candidate named ${candidateName}.
                  ${intro} After your introduction, ask a simple conversational question. Wait for their response, and then you can ask the candidate to tell you a bit about themselves.
                  CRITICAL RULE: Ask only ONE question at a time and wait for their full response.`;
    }, [setupData, interviewQuestions, interviewerDetails]);
    
    const startSessionManager = useCallback(async (stream: MediaStream) => {
        if (sessionManagerRef.current) {
            sessionManagerRef.current.close();
        }
        setSessionStatus('CONNECTING');
        setIsReconnecting(retryCountRef.current > 0);

        const handleSessionError = (e: ErrorEvent) => {
            console.error("Session error:", e);
            if (retryCountRef.current >= MAX_RETRIES) {
                setSessionStatus('ERROR');
                setIsReconnecting(false);
                alert("We've lost connection and couldn't reconnect. You can try leaving and starting a new interview.");
                return;
            }
            retryCountRef.current += 1;
            const delay = Math.pow(2, retryCountRef.current) * 1000;
            setTimeout(() => startSessionManager(stream), delay);
        };

        try {
            if (setupData?.interviewType === 'Combined') {
                const controller = new CombinedLiveController({
                    interviewers: interviewerDetails, questions: interviewQuestions, setupData: setupData,
                    initialHistory: transcriptRef.current.filter(t => t.status === 'finalized').map(({speaker, text}) => ({speaker, text})),
                    callbacks: { 
                        onTranscriptionUpdate: handleTranscriptionUpdate, 
                        onAudioStateChange: setIsAiSpeaking, 
                        onError: handleSessionError,
                    }
                });
                await controller.start(stream);
                sessionManagerRef.current = controller;
            } else {
                 sessionManagerRef.current = await initiateLiveSession({
                    stream,
                    systemInstruction: getSystemInstruction(),
                    history: transcriptRef.current.filter(t => t.status === 'finalized').map(({speaker, text}) => ({speaker, text})),
                    onTranscriptionUpdate: handleTranscriptionUpdate, 
                    onAudioStateChange: setIsAiSpeaking, 
                    onError: handleSessionError,
                 });
            }
            if (sessionManagerRef.current) sessionManagerRef.current.retryCount = retryCountRef.current;
            setSessionStatus('CONNECTED');
            setIsReconnecting(false);
            retryCountRef.current = 0;
        } catch (error) {
            console.error("Failed to initiate live session:", error);
            setSessionStatus('ERROR');
            setIsReconnecting(false);
        }
    }, [setupData, interviewQuestions, interviewerDetails, handleTranscriptionUpdate, getSystemInstruction]);
    
    const handleAskQuestion = (type: Persona) => {
        if (sessionManagerRef.current?.askQuestion && !isAiSpeaking) {
            sessionManagerRef.current.askQuestion(type);
        }
    };
    
    const handleAskForCandidateQuestions = () => {
        sessionManagerRef.current?.askForCandidateQuestions?.();
    };

    return { transcript, sessionStatus, isReconnecting, isAiSpeaking, activeInterviewerName, sessionManagerRef, startSessionManager, handleAskQuestion, handleAskForCandidateQuestions };
};