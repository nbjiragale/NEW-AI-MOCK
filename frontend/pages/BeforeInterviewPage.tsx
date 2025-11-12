import React, { useState, useEffect, useRef } from 'react';
import { checkDetailsConsistency, validateCompany, generateInterviewQuestions } from '../services/geminiStartInterview';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { ChevronRightIcon } from '../icons/ChevronRightIcon';
import { XCircleIcon } from '../icons/XCircleIcon';

interface BeforeInterviewPageProps {
    setupData: any;
    onEdit: () => void;
    onStartInterview: (questions: any, interviewerDetails: any) => void;
}

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

interface LogEntry {
  id: number;
  text: string;
  status: 'running' | 'done' | 'error' | 'paused';
}

const useTypingEffect = (text: string, speed = 20, start = true) => {
    const [displayedText, setDisplayedText] = useState('');
    useEffect(() => {
        if (!start || !text) {
            setDisplayedText('');
            return;
        };
        setDisplayedText('');
        let i = 0;
        const intervalId = setInterval(() => {
            if (i < text.length) {
                setDisplayedText(prev => prev + text.charAt(i));
                i++;
            } else {
                clearInterval(intervalId);
            }
        }, speed);
        return () => clearInterval(intervalId);
    }, [text, speed, start]);
    return displayedText;
};

const LogItem: React.FC<{ entry: LogEntry }> = ({ entry }) => {
    const displayText = useTypingEffect(entry.text, 20, entry.status === 'running');
    const Icon = () => {
        switch (entry.status) {
            case 'done': return <CheckCircleIcon className="w-5 h-5 text-green-400" />;
            case 'error': return <XCircleIcon className="w-5 h-5 text-red-400" />;
            default: return <ChevronRightIcon className="w-5 h-5 text-primary" />;
        }
    };
    return (
        <div className="flex items-start gap-3 font-mono text-base animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
            <div className="flex-shrink-0 pt-0.5"><Icon /></div>
            <p className={`${entry.status === 'error' ? 'text-red-400' : 'text-gray-300'}`}>
                {entry.status === 'running' ? displayText : entry.text}
                {entry.status === 'running' && <span className="inline-block w-2 h-4 bg-primary ml-1 animate-blink"></span>}
            </p>
        </div>
    );
};

const BeforeInterviewPage: React.FC<BeforeInterviewPageProps> = ({ setupData, onEdit, onStartInterview }) => {
    const [logs, setLogs] = useState<LogEntry[]>([]);
    const [processStatus, setProcessStatus] = useState<'running' | 'paused' | 'error' | 'finished'>('running');
    const [pauseReason, setPauseReason] = useState<'inconsistent' | 'invalid_company' | null>(null);
    const [countdown, setCountdown] = useState(5);
    const [showConsole, setShowConsole] = useState(true);

    const interviewerDetailsRef = useRef(getInterviewerDetails(setupData));
    const generatedQuestionsRef = useRef<any>(null);
    const processingStateRef = useRef({ hasStarted: false });

    const delay = (ms: number) => new Promise(res => setTimeout(res, ms));

    const addLog = (text: string, status: LogEntry['status'] = 'running') => {
        setLogs(prev => [...prev.map(l => ({ ...l, status: l.status === 'running' ? 'paused' : l.status })), { id: Date.now(), text, status }]);
    };
    const updateLastLog = (text: string, status: LogEntry['status']) => {
        setLogs(prev => {
            const newLogs = [...prev];
            if (newLogs.length > 0) {
                newLogs[newLogs.length - 1] = { ...newLogs[newLogs.length - 1], text, status };
            }
            return newLogs;
        });
    };

    const runProcess = async (skipCompanyCheck = false) => {
        setProcessStatus('running');
        setPauseReason(null);
        
        try {
            // --- Consistency Check ---
            addLog(`First, I'm reviewing your profile for the "${setupData.role}" role...`);
            await delay(1500);
            updateLastLog(`First, I'm reviewing your profile for the "${setupData.role}" role...`, 'paused');
            
            const consistencyResult = await checkDetailsConsistency(setupData);
            if (!consistencyResult.isConsistent) {
                updateLastLog(`Hmm, something seems off. ${consistencyResult.reasoning}`, 'error');
                setProcessStatus('paused');
                setPauseReason('inconsistent');
                return;
            }
            updateLastLog('Looks good. Your profile details are consistent.', 'done');
            await delay(1000);

            // --- Company Check ---
            if (setupData.targetCompany && setupData.type !== 'Practice Mode' && !skipCompanyCheck) {
                addLog(`Now, I'm quickly verifying the company: "${setupData.targetCompany}"...`);
                await delay(1500);
                const companyResult = await validateCompany(setupData.targetCompany);
                if (!companyResult.companyExists) {
                    updateLastLog(`I'm having a bit of trouble with the company name. ${companyResult.reasoning}`, 'error');
                    setProcessStatus('paused');
                    setPauseReason('invalid_company');
                    return;
                }
                updateLastLog('Company verified. Great!', 'done');
                await delay(1000);
            }

            // --- Question Generation ---
            addLog('Alright, everything checks out. Time to prepare our conversation.');
            await delay(1500);
            updateLastLog('Alright, everything checks out. Time to prepare our conversation.', 'done');

            addLog(`I'm tailoring questions for a candidate with ${setupData.experience || 'your specified'} years of experience.`);
            await delay(1500);
            updateLastLog(`I'm tailoring questions for a candidate with ${setupData.experience || 'your specified'} years of experience.`, 'done');
            
            addLog('Generating a personalized set of interview questions...');
            
            let questions;
            if (setupData?.practiceType === 'By List of Questions') {
                questions = { 
                    theoryQuestions: setupData.questionList.split('\n').filter((q: string) => q.trim() !== ''),
                    handsOnQuestions: []
                };
            } else if (setupData?.practiceType === 'Fluency Practice') {
                questions = {
                    theoryQuestions: setupData.qaPairs.map((p: any) => p.question),
                    handsOnQuestions: []
                };
            } else {
                questions = await generateInterviewQuestions(setupData);
            }
            generatedQuestionsRef.current = questions;
            await delay(2000);
            updateLastLog('The questions are ready.', 'done');
            
            addLog('Finalizing the session setup...');
            await delay(1000);
            updateLastLog('All set! The interview will begin shortly.', 'done');
            setProcessStatus('finished');

        } catch (err) {
            console.error("Error during pre-interview setup:", err);
            const message = err instanceof Error ? err.message : 'An unknown error occurred.';
            updateLastLog(`A system error occurred: ${message}`, 'error');
            setProcessStatus('error');
        }
    };
    
    const startPreparation = async (isRetry = false) => {
        const initialMessage = isRetry ? "Okay, let's try that again..." : "Okay, let's get you set up...";
        setLogs([]);
        setProcessStatus('running');
        setPauseReason(null);
        
        await delay(200);
        
        addLog(initialMessage);
        await delay(1500);
        updateLastLog(initialMessage, 'done');
        
        runProcess();
    };
    
    useEffect(() => {
        if (processStatus === 'finished') {
            setTimeout(() => setShowConsole(false), 1000); // Allow time to read final log
        }
    }, [processStatus]);

    useEffect(() => {
        if (!showConsole) {
            document.title = `Starting in ${countdown}...`;
            if (countdown > 0) {
                const timer = setTimeout(() => setCountdown(c => c - 1), 1000);
                return () => clearTimeout(timer);
            } else {
                onStartInterview(generatedQuestionsRef.current, interviewerDetailsRef.current);
            }
        }
        return () => { document.title = 'AI Mock Interview'; };
    }, [showConsole, countdown, onStartInterview]);
    
    useEffect(() => {
        if (!processingStateRef.current.hasStarted) {
            processingStateRef.current.hasStarted = true;
            startPreparation(false);
        }
    }, []);

    const primaryInterviewer = interviewerDetailsRef.current[0];

    return (
        <section className="min-h-screen flex items-center justify-center py-12 px-4 relative overflow-hidden">
            <div className="absolute inset-0 bg-grid-slate-800/[0.1] -z-10"></div>
            
            {showConsole && (
                <div className="w-full max-w-3xl mx-auto animate-fade-in-up">
                    <div className="relative bg-slate-900/70 rounded-2xl border border-slate-700 shadow-2xl backdrop-blur-xl">
                        <div className="p-6 border-b border-slate-700 flex items-center gap-2">
                            <span className="h-3.5 w-3.5 bg-red-500 rounded-full"></span>
                            <span className="h-3.5 w-3.5 bg-yellow-500 rounded-full"></span>
                            <span className="h-3.5 w-3.5 bg-green-500 rounded-full"></span>
                            <p className="text-center flex-grow text-gray-400 font-mono text-md">Interview is setting up!</p>
                        </div>
                        <div className="p-6 md:p-8 h-80 overflow-y-auto space-y-3">
                            {logs.map(log => <LogItem key={log.id} entry={log} />)}
                        </div>
                        {(processStatus === 'paused' || processStatus === 'error') && (
                             <div className="p-4 border-t border-slate-700 bg-slate-800/50 rounded-b-2xl">
                                {processStatus === 'paused' && (
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button onClick={onEdit} className="flex-1 bg-slate-600 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-slate-500 transition-colors">Edit Details</button>
                                        <button onClick={() => runProcess(pauseReason === 'invalid_company')} className="flex-1 bg-primary text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-blue-500 transition-colors">
                                            Proceed Anyway
                                        </button>
                                    </div>
                                )}
                                {processStatus === 'error' && (
                                    <div className="flex flex-col sm:flex-row gap-4">
                                        <button onClick={onEdit} className="flex-1 bg-slate-600 text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-slate-500 transition-colors">Go Back & Edit</button>
                                        <button onClick={() => startPreparation(true)} className="flex-1 bg-primary text-white font-semibold py-2.5 px-5 rounded-lg hover:bg-blue-500 transition-colors">
                                            Try Again
                                        </button>
                                    </div>
                                )}
                            </div>
                        )}
                    </div>
                </div>
            )}
            
            {!showConsole && (
                 <div className="text-center flex flex-col items-center animate-fade-in-up">
                    <div className="relative mb-6 h-32 w-32 bg-slate-800 rounded-full flex items-center justify-center ring-8 ring-slate-700/50">
                        <span className="text-5xl font-bold text-primary">{primaryInterviewer.name.charAt(0)}</span>
                    </div>
                    <h2 className="text-3xl font-bold text-white mb-2">{primaryInterviewer.name} is ready.</h2>
                    <p className="text-gray-300 text-lg mb-8">Your session will begin in...</p>
                    <p className="text-8xl font-bold text-white font-mono animate-pop-in" key={countdown}>{countdown}</p>
                </div>
            )}
        </section>
    );
};

export default BeforeInterviewPage;
