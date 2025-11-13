import React, { useState, useEffect, useRef, useCallback } from 'react';
import { useInterview } from '../contexts/InterviewContext';
import { checkDetailsConsistency, validateCompany, generateInterviewQuestions } from '../services/geminiStartInterview';

import { UserIcon } from '../icons/UserIcon';
import { BuildingIcon } from '../icons/BuildingIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';

const interviewerNames = [
  'Anna', 'Lily', 'Sara', 'Nina', 'Emma', 'Zoe', 'Lucy', 'Ruby', 'Ella',
  'Kate', 'Leah', 'Ivy', 'Maya', 'Tina', 'Amy', 'Chloe', 'Nora', 'Lila', 'Grace', 'Eva'
];

const getRandomNames = (count: number): string[] => {
  const shuffled = [...interviewerNames].sort(() => 0.5 - Math.random());
  return shuffled.slice(0, count);
};

const getInterviewerDetails = (setupData: any) => {
  const isCombined = setupData?.interviewType === 'Combined';
  if (isCombined) {
    const randomNames = getRandomNames(3);
    return [
      { name: randomNames[0], role: 'Software Engineer' },
      { name: randomNames[1], role: 'Hiring Manager' },
      { name: randomNames[2], role: 'HR Specialist' },
    ];
  }
  let role = 'Interviewer';
  const name = getRandomNames(1)[0];
  switch (setupData?.interviewType) {
    case 'Technical': role = 'Senior Engineer'; break;
    case 'Behavioral/Managerial': role = 'Hiring Manager'; break;
    case 'HR': role = 'HR Specialist'; break;
  }
  return [{ name, role }];
};


const Spinner: React.FC = () => (
    <div className="h-5 w-5 border-2 border-slate-500 border-t-primary rounded-full animate-spin"></div>
);

interface Step {
    id: number;
    text: string;
    icon: React.ReactNode;
    status: 'pending' | 'running' | 'done' | 'error';
    detail?: string;
}

const StepItem: React.FC<{ step: Step }> = ({ step }) => {
    const getStatusIcon = () => {
        switch(step.status) {
            case 'running': return <Spinner />;
            case 'done': return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
            case 'error': return <XCircleIcon className="w-5 h-5 text-red-400" />;
            case 'pending':
            default: return <div className="h-5 w-5 rounded-full border-2 border-slate-600"></div>;
        }
    };
    
    return (
        <div className={`flex items-start gap-4 transition-opacity duration-500 ${step.status === 'pending' ? 'opacity-50' : 'opacity-100'}`}>
            <div className="flex-shrink-0">{step.icon}</div>
            <div className="flex-grow">
                <p className={`font-medium transition-colors ${step.status === 'done' ? 'text-white' : 'text-gray-300'} ${step.status === 'error' ? 'text-red-400' : ''}`}>{step.text}</p>
                {step.detail && <p className="text-sm text-gray-400 mt-1">{step.detail}</p>}
            </div>
            <div className="flex-shrink-0 w-5 h-5">{getStatusIcon()}</div>
        </div>
    );
};

const InterviewerCard: React.FC<{ name: string, role: string, index: number }> = ({ name, role, index }) => (
    <div className="flex items-center gap-3 bg-slate-800/50 p-3 rounded-lg animate-fade-in-up" style={{ animationDelay: `${index * 150}ms` }}>
        <div className="h-10 w-10 bg-slate-700 rounded-full flex items-center justify-center ring-2 ring-slate-600">
            <span className="text-lg font-bold text-primary">{name.charAt(0)}</span>
        </div>
        <div>
            <p className="font-semibold text-white">{name}</p>
            <p className="text-sm text-gray-400">{role}</p>
        </div>
    </div>
);

const BeforeInterviewPage: React.FC = () => {
    const { setupData, backToSetup, startInterview } = useInterview();

    const initialSteps: Step[] = [
        { id: 1, text: "Analyzing Candidate Profile", icon: <UserIcon className="w-6 h-6 text-primary" />, status: 'pending' },
        ...(setupData?.targetCompany ? [{ id: 2, text: `Verifying Target Company: ${setupData.targetCompany}`, icon: <BuildingIcon className="w-6 h-6 text-primary" />, status: 'pending' as 'pending' }] : []),
        { id: 3, text: `Tailoring Questions for ${setupData?.role || 'Role'}`, icon: <ClipboardListIcon className="w-6 h-6 text-primary" />, status: 'pending' },
        { id: 4, text: "Assigning Interview Panel", icon: <UsersIcon className="w-6 h-6 text-primary" />, status: 'pending' },
        { id: 5, text: "Finalizing Session Brief", icon: <FileTextIcon className="w-6 h-6 text-primary" />, status: 'pending' },
    ];
    
    const [steps, setSteps] = useState<Step[]>(initialSteps);
    const [interviewersToShow, setInterviewersToShow] = useState<any[]>([]);
    const [processStatus, setProcessStatus] = useState<'running' | 'paused' | 'error' | 'finished'>('running');
    const [pauseReason, setPauseReason] = useState<'inconsistent' | 'invalid_company' | null>(null);
    const [countdown, setCountdown] = useState(5);
    const [showPreparation, setShowPreparation] = useState(true);

    const interviewerDetailsRef = useRef(getInterviewerDetails(setupData));
    const generatedQuestionsRef = useRef<any>(null);
    const processingStateRef = useRef({ hasStarted: false });

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const updateStep = (id: number, newStatus: Step['status'], detail?: string) => {
        setSteps(prev => prev.map(s => s.id === id ? { ...s, status: newStatus, detail } : s));
    };

    const runProcess = useCallback(async (skipCompanyCheck = false) => {
        setProcessStatus('running');
        setPauseReason(null);
        setInterviewersToShow([]);
        setSteps(initialSteps.map(s => ({ ...s, status: 'pending' })));
        await delay(500);

        try {
            // --- Consistency Check ---
            updateStep(1, 'running');
            const consistencyResult = await checkDetailsConsistency(setupData);
            await delay(1000);
            if (!consistencyResult.isConsistent) {
                updateStep(1, 'error', consistencyResult.reasoning);
                setProcessStatus('paused');
                setPauseReason('inconsistent');
                return;
            }
            updateStep(1, 'done');

            // --- Company Check ---
            const companyStep = steps.find(s => s.id === 2);
            if (companyStep && !skipCompanyCheck) {
                updateStep(2, 'running');
                const companyResult = await validateCompany(setupData.targetCompany);
                await delay(1000);
                if (!companyResult.companyExists) {
                    updateStep(2, 'error', companyResult.reasoning);
                    setProcessStatus('paused');
                    setPauseReason('invalid_company');
                    return;
                }
                updateStep(2, 'done');
            }
            if (companyStep && skipCompanyCheck) updateStep(2, 'done', 'Verification skipped by user.');

            // --- Question Generation ---
            updateStep(3, 'running');
            let questions;
            if (setupData?.practiceType === 'By List of Questions') {
                questions = { theoryQuestions: setupData.questionList.split('\n').filter((q: string) => q.trim() !== ''), handsOnQuestions: [] };
            } else if (setupData?.practiceType === 'Fluency Practice') {
                questions = { theoryQuestions: setupData.qaPairs.map((p: any) => p.question), handsOnQuestions: [] };
            } else {
                questions = await generateInterviewQuestions(setupData);
            }
            generatedQuestionsRef.current = questions;
            await delay(1500);
            updateStep(3, 'done');
            
            // --- Assign Panel ---
            updateStep(4, 'running');
            await delay(1000);
            updateStep(4, 'done');
            setInterviewersToShow(interviewerDetailsRef.current);

            // --- Finalize ---
            updateStep(5, 'running');
            await delay(800);
            updateStep(5, 'done');
            setProcessStatus('finished');

        } catch (err) {
            console.error("Error during pre-interview setup:", err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            const currentStep = steps.find(s => s.status === 'running');
            if (currentStep) {
                updateStep(currentStep.id, 'error', message);
            }
            setProcessStatus('error');
        }
    }, [setupData, initialSteps]);

    useEffect(() => {
        if (!processingStateRef.current.hasStarted) {
            processingStateRef.current.hasStarted = true;
            runProcess();
        }
    }, [runProcess]);
    
    useEffect(() => {
        if (processStatus === 'finished') {
            setTimeout(() => setShowPreparation(false), 1500);
        }
    }, [processStatus]);

    useEffect(() => {
        if (!showPreparation) {
            document.title = `Starting in ${countdown}...`;
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                startInterview(generatedQuestionsRef.current, interviewerDetailsRef.current);
            }
        }
        return () => { document.title = 'AI Mock Interview'; };
    }, [showPreparation, countdown, startInterview]);
    
    const handleRetry = () => {
        runProcess(pauseReason === 'invalid_company');
    };

    return (
        <section className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden bg-dark">
            <div className="absolute inset-0 bg-grid-slate-800/[0.1] -z-10"></div>
            
            {showPreparation ? (
                <div className="w-full max-w-2xl mx-auto animate-fade-in-up">
                    <div className="bg-slate-900/70 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-xl">
                        <div className="p-6 text-center border-b border-slate-700">
                            <h2 className="text-2xl font-bold text-white">Preparing Your Session</h2>
                            <p className="text-gray-400 mt-2">Your personalized interview is being configured...</p>
                        </div>

                        <div className="p-6 md:p-8 space-y-6">
                            {steps.map(step => <StepItem key={step.id} step={step} />)}
                            
                            {interviewersToShow.length > 0 && (
                                <div className="pt-4 border-t border-slate-800 mt-6">
                                    <h3 className="text-lg font-semibold text-primary mb-4">Your Interview Panel:</h3>
                                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                                        {interviewersToShow.map((interviewer, i) => (
                                            <InterviewerCard key={interviewer.name} {...interviewer} index={i} />
                                        ))}
                                    </div>
                                </div>
                            )}
                        </div>
                        
                        {(processStatus === 'paused' || processStatus === 'error') && (
                             <div className="p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl animate-fade-in-up">
                                <div className="flex flex-col sm:flex-row gap-4">
                                    <button onClick={backToSetup} className="flex-1 bg-slate-600 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-slate-500 transition-colors">Edit Details</button>
                                    <button onClick={handleRetry} className="flex-1 bg-primary text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-blue-500 transition-colors">
                                        {processStatus === 'error' ? 'Try Again' : 'Proceed Anyway'}
                                    </button>
                                </div>
                            </div>
                        )}
                    </div>
                </div>
            ) : (
                <div className="text-center flex flex-col items-center animate-fade-in-up">
                    <h2 className="text-3xl font-bold text-white mb-2">Your Interview is Ready.</h2>
                    <p className="text-gray-300 text-lg mb-8">The session will begin in...</p>
                    <p className="text-8xl font-bold text-white font-mono animate-pop-in" key={countdown}>{countdown}</p>
                </div>
            )}
        </section>
    );
};

export default BeforeInterviewPage;
