import React, { createContext, useState, useContext, ReactNode, useCallback } from 'react';

// Define the shape of our context state
interface InterviewState {
    page: string;
    setupData: any | null;
    interviewQuestions: any | null;
    interviewerDetails: any | null;
    interviewTranscript: any[] | null;
    interviewDuration: number | null;
    recordedVideoFrames: string[] | null;
    
    // Navigation and state update functions
    goToLanding: () => void;
    goToSetup: () => void;
    goToVerification: (data: any) => void;
    goToBeforeInterview: () => void;
    startInterview: (questions: any, details: any) => void;
    goToSummary: (transcript: any[], duration: number, frames: string[]) => void;
    backToSetup: () => void;
}

// Create the context with a default value
const InterviewContext = createContext<InterviewState | undefined>(undefined);

// Create the provider component
export const InterviewProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
    const [page, setPage] = useState('landing');
    const [setupData, setSetupData] = useState<any>(null);
    const [interviewQuestions, setInterviewQuestions] = useState<any>(null);
    const [interviewerDetails, setInterviewerDetails] = useState<any>(null);
    const [interviewTranscript, setInterviewTranscript] = useState<any[] | null>(null);
    const [interviewDuration, setInterviewDuration] = useState<number | null>(null);
    const [recordedVideoFrames, setRecordedVideoFrames] = useState<string[] | null>(null);

    const resetInterviewState = useCallback(() => {
        setSetupData(null);
        setInterviewQuestions(null);
        setInterviewerDetails(null);
        setInterviewTranscript(null);
        setInterviewDuration(null);
        setRecordedVideoFrames(null);
    }, []);

    const goToLanding = useCallback(() => {
        resetInterviewState();
        setPage('landing');
    }, [resetInterviewState]);
    
    const goToSetup = useCallback(() => {
        resetInterviewState();
        setPage('setup');
    }, [resetInterviewState]);

    const goToVerification = useCallback((data: any) => {
        setSetupData(data);
        setInterviewQuestions(null);
        setInterviewerDetails(null);
        setPage('verification');
    }, []);

    const goToBeforeInterview = useCallback(() => {
        setPage('before_interview');
    }, []);

    const startInterview = useCallback((questions: any, details: any) => {
        setInterviewQuestions(questions);
        setInterviewerDetails(details);
        setPage('interview');
    }, []);
    
    const goToSummary = useCallback((transcript: any[], duration: number, frames: string[]) => {
        setInterviewTranscript(transcript);
        setInterviewDuration(duration);
        setRecordedVideoFrames(frames);
        setPage('summary');
    }, []);

    const backToSetup = useCallback(() => {
        setPage('setup');
    }, []);


    const value = {
        page,
        setupData,
        interviewQuestions,
        interviewerDetails,
        interviewTranscript,
        interviewDuration,
        recordedVideoFrames,
        goToLanding,
        goToSetup,
        goToVerification,
        goToBeforeInterview,
        startInterview,
        goToSummary,
        backToSetup,
    };

    return (
        <InterviewContext.Provider value={value}>
            {children}
        </InterviewContext.Provider>
    );
};

// Create a custom hook for easy context access
export const useInterview = (): InterviewState => {
    const context = useContext(InterviewContext);
    if (context === undefined) {
        throw new Error('useInterview must be used within an InterviewProvider');
    }
    return context;
};
