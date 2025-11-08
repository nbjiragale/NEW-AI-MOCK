import React, { useState, useEffect, useRef } from 'react';
import { checkDetailsConsistency, validateCompany, generateInterviewQuestions } from '../services/geminiStartInterview';

interface BeforeInterviewPageProps {
    setupData: any;
    onEdit: () => void;
    onStartInterview: (questions: any) => void;
}

type Stage = 
    'initializing' | 
    'consistency_check' | 
    'inconsistent' |
    'company_check' |
    'invalid_company' |
    'generating_questions' |
    'countdown' |
    'error';

const CheckIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const CrossIcon: React.FC = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-red-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-6 w-6 text-primary" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const BeforeInterviewPage: React.FC<BeforeInterviewPageProps> = ({ setupData, onEdit, onStartInterview }) => {
    const [stage, setStage] = useState<Stage>('initializing');
    const [message, setMessage] = useState('');
    const [countdown, setCountdown] = useState(10);
    const generatedQuestionsRef = useRef<any>(null);
    const processingStateRef = useRef({ hasStarted: false });


    useEffect(() => {
        let timer: NodeJS.Timeout;
        if (stage === 'countdown') {
            document.title = `Starting in ${countdown}...`;
            if (countdown > 0) {
                timer = setTimeout(() => setCountdown(c => c - 1), 1000);
            } else {
                onStartInterview(generatedQuestionsRef.current);
            }
        }
        return () => {
            clearTimeout(timer);
            document.title = 'AI Mock Interview';
        }
    }, [stage, countdown, onStartInterview]);


    const startProcess = async (forceCompany = false) => {
        try {
            // 1. Consistency Check
            setStage('consistency_check');
            const consistencyResult = await checkDetailsConsistency(setupData);
            if (!consistencyResult.isConsistent) {
                setStage('inconsistent');
                setMessage(consistencyResult.reasoning);
                return;
            }

            // 2. Company Check
            await processCompany(forceCompany);
            
        } catch (err) {
            console.error("Error during pre-interview setup:", err);
            setStage('error');
            setMessage(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
    };
    
    const processCompany = async (forceCompany = false) => {
        try {
            if (setupData.targetCompany && setupData.type !== 'Practice Mode' && !forceCompany) {
                setStage('company_check');
                const companyResult = await validateCompany(setupData.targetCompany);
                if (!companyResult.companyExists) {
                    setStage('invalid_company');
                    setMessage(companyResult.reasoning);
                    return;
                }
            }
            // 3. Generate Questions
            await generateQuestions();
        } catch (err) {
             console.error("Error during company check:", err);
             setStage('error');
             setMessage(err instanceof Error ? err.message : 'An unknown error occurred.');
        }
    };

    const generateQuestions = async () => {
         try {
            setStage('generating_questions');
            if (setupData?.practiceType === 'By List of Questions') {
                const questions = {
                    companySpecificQuestions: [],
                    theoryQuestions: setupData.questionList.split('\n').filter((q: string) => q.trim() !== ''),
                    handsOnQuestions: [],
                };
                generatedQuestionsRef.current = questions;
            } else {
                const questions = await generateInterviewQuestions(setupData);
                generatedQuestionsRef.current = questions;
            }
            
            // 4. Countdown
            setStage('countdown');
         } catch (err) {
             console.error("Error generating questions:", err);
             setStage('error');
             setMessage(err instanceof Error ? err.message : 'An unknown error occurred.');
         }
    };


    useEffect(() => {
        if (!processingStateRef.current.hasStarted) {
            processingStateRef.current.hasStarted = true;
            startProcess();
        }
    }, []);

    const renderContent = () => {
        switch (stage) {
            case 'initializing':
            case 'consistency_check':
            case 'company_check':
            case 'generating_questions':
                const checks = [
                    { name: 'Profile Consistency', stage: 'consistency_check', doneStages: ['company_check', 'generating_questions', 'countdown'] },
                    { name: 'Company Verification', stage: 'company_check', doneStages: ['generating_questions', 'countdown'] },
                    { name: 'Generating Questions', stage: 'generating_questions', doneStages: ['countdown'] }
                ];
                return (
                    <>
                        <h2 className="text-3xl font-bold text-white mb-4">Preparing your session...</h2>
                        <div className="space-y-4">
                            {checks.map(check => {
                                const isDone = check.doneStages.includes(stage) || (stage === 'generating_questions' && check.stage !== 'generating_questions');
                                const isRunning = stage === check.stage;
                                return (
                                    <div key={check.name} className="flex items-center gap-4 p-4 bg-slate-800 rounded-lg">
                                        {isDone ? <CheckIcon /> : isRunning ? <SpinnerIcon /> : <div className="h-6 w-6 border-2 border-slate-600 rounded-full"></div>}
                                        <span className={`text-lg ${isDone || isRunning ? 'text-white' : 'text-gray-500'}`}>{check.name}</span>
                                    </div>
                                );
                            })}
                        </div>
                    </>
                );
            case 'inconsistent':
            case 'invalid_company':
            case 'error':
                return (
                    <div className="text-center">
                        <div className="mx-auto bg-red-500/20 rounded-full h-16 w-16 flex items-center justify-center mb-4">
                           <CrossIcon />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">{stage === 'inconsistent' ? 'Profile Inconsistent' : stage === 'invalid_company' ? 'Company Not Verified' : 'An Error Occurred'}</h2>
                        <p className="text-gray-400 mb-6">{message}</p>
                        <div className="flex gap-4">
                            <button onClick={onEdit} className="flex-1 bg-slate-700 text-white font-bold py-3 px-6 rounded-lg hover:bg-slate-600 transition">Edit Details</button>
                            {stage !== 'error' && (
                                <button onClick={() => stage === 'inconsistent' ? processCompany() : startProcess(true)} className="flex-1 bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-500 transition">
                                    {stage === 'inconsistent' ? 'Proceed Anyway' : 'Force Add & Proceed'}
                                </button>
                            )}
                        </div>
                    </div>
                );
             case 'countdown':
                 return (
                    <div className="text-center">
                         <div className="mx-auto bg-green-500/20 rounded-full h-16 w-16 flex items-center justify-center mb-4">
                            <CheckIcon />
                        </div>
                        <h2 className="text-2xl font-bold text-white mb-2">Ready to Start!</h2>
                        <p className="text-gray-400 mb-6">Your AI-powered interview is ready. The session will begin automatically.</p>
                        <p className="text-6xl font-bold text-primary">{countdown}</p>
                    </div>
                 )
        }
    };

    return (
        <section className="min-h-screen flex items-center justify-center py-12">
            <div className="container mx-auto px-6">
                <div className="max-w-md mx-auto p-8 bg-slate-800/50 rounded-xl border border-slate-700 shadow-lg">
                    {renderContent()}
                </div>
            </div>
        </section>
    );
};

export default BeforeInterviewPage;
