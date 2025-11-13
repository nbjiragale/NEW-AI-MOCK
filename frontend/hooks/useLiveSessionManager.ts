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
        if (setupData?.interviewType === 'Combined') return ''; // Handled by controller

        const theoryQs = interviewQuestions?.theoryQuestions || [];
        const companyQs = interviewQuestions?.companySpecificQuestions || [];
        const allQuestions = [...theoryQs, ...companyQs];
        
        const candidateName = setupData.candidateName || 'there';
        const interviewerName = interviewerDetails?.[0]?.name || 'Interviewer';
        const interviewerRole = interviewerDetails?.[0]?.role || 'hiring manager';
        const companyName = setupData.targetCompany || 'our company';
        const experienceYears = Math.floor(Math.random() * 3) + 4;

        const intro = `Begin the interview now. First, greet the candidate, ${candidateName}, by name. Then, introduce yourself. Say something like: "Hi ${candidateName}, I'm ${interviewerName}. I'll be interviewing you today. I'm a ${interviewerRole} at ${companyName} and I've been here for about ${experienceYears} years."`;
        
        if (allQuestions.length > 0) {
          const questionList = allQuestions.map((q: string, i: number) => `${i + 1}. ${q}`).join('\n');
          return `You are an expert interviewer named ${interviewerName}. Your persona is ${setupData.persona || 'friendly'}. Your task is to conduct a mock interview with a candidate named ${candidateName}. Your goal is to have a natural, helpful, and conversational interview.

Here is the list of main questions you should guide the conversation through:
${questionList}

**Your Conversational Style (VERY IMPORTANT):**
- **Engage, Don't Just Interrogate:** Your primary goal is a natural, two-way conversation, not a rigid Q&A.
- **Acknowledge and Validate:** After the candidate answers, briefly acknowledge their response. Use phrases like "That's an interesting approach," or "I see."
- **Ask Follow-up Questions:** Based on the candidate's answer, ask one relevant follow-up question to dig deeper. This is key to making the conversation feel real. Only after the follow-up should you move to the next main question.
- **Natural Transitions:** When you are ready to move to the next main question from your list, use a smooth transition.

**Interview Flow:**
1. ${intro}
2. After your introduction, ask a simple conversational question like "How are you doing today?".
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
