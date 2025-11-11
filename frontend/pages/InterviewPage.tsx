import React, { useState, useEffect, useRef } from 'react';
import { CameraOn } from '../icons/cameraOn';
import { CameraOff } from '../icons/CameraOff';
import { MicOn } from '../icons/MicOn';
import { MicOff } from '../icons/MicOff';
import { initiateLiveSession } from '../services/geminiLiveService';
import { CombinedLiveController } from '../services/combinedLiveController';
import { validateAnswer } from '../services/geminiForValidation';

// Icons
const PhoneHangUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V6C19 4.34315 17.6569 3 16 3Z" transform="rotate(135 12 12)" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.5 9.5L9.5 14.5M9.5 9.5L14.5 14.5" transform="rotate(135 12 12)" />
    </svg>
);

const CheckIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M5 13l4 4L19 7" />
    </svg>
);

const CrossIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
    </svg>
);

const SpinnerIcon: React.FC = () => (
    <svg className="animate-spin h-5 w-5 text-white" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

const HintIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 cursor-pointer text-blue-300 hover:text-blue-200" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
    </svg>
);

const ControlButton: React.FC<{
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
  ariaLabel: string;
  disabled?: boolean;
}> = ({ onClick, active, children, ariaLabel, disabled }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    disabled={disabled}
    className={`w-14 h-14 flex items-center justify-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-primary text-white ${
      active ? 'bg-slate-700/80 hover:bg-slate-600/80' : 'bg-red-600/80 hover:bg-red-500/80'
    } ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

// **Helper for mic/cam button state**
const ToggleControlButton: React.FC<{
    onClick: () => void;
    active: boolean;
    children: React.ReactNode;
    ariaLabel: string;
    disabled?: boolean;
  }> = ({ onClick, active, children, ariaLabel, disabled }) => (
    <button
      onClick={onClick}
      aria-label={ariaLabel}
      disabled={disabled}
      className={`w-14 h-14 flex items-center justify-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-primary text-white ${
        active ? 'bg-slate-700/80 hover:bg-slate-600/80' : 'bg-red-600/80 hover:bg-red-500/80'
      } ${disabled ? 'opacity-50 cursor-not-allowed' : ''} ${active ? 'bg-slate-700/80 hover:bg-slate-600/80' : 'bg-red-600/80 hover:bg-red-500/80'}`}
    >
      {children}
    </button>
  );


const VideoPlaceholder = ({ name, role, isSpeaking }: { name: string, role: string, isSpeaking: boolean }) => (
    <div className={`w-full h-full bg-black rounded-xl flex flex-col items-center justify-center border transition-all duration-300 p-3 shadow-lg relative overflow-hidden min-h-0 ${isSpeaking ? 'ring-2 ring-primary border-primary' : 'border-slate-700'}`}>
        <div className="h-16 w-16 bg-slate-700 rounded-full flex items-center justify-center ring-4 ring-slate-600 mb-2">
            <span className="text-2xl font-bold text-primary">{name.charAt(0)}</span>
        </div>
        <div className="absolute bottom-2 left-2 text-xs bg-black/40 px-2 py-0.5 rounded text-left">
            <p className="font-semibold text-white">{name}</p>
            <p className="text-gray-300">{role}</p>
        </div>
    </div>
);

interface TranscriptItem {
    speaker: string;
    text: string;
}

interface InterviewPageProps {
  onLeave: (transcript: TranscriptItem[], duration: number) => void;
  setupData: any;
  interviewQuestions: any;
  interviewerDetails: any[];
}

type Persona = 'technical' | 'behavioral' | 'hr';

const InterviewPage: React.FC<InterviewPageProps> = ({ onLeave, setupData, interviewQuestions, interviewerDetails }) => {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  
  const [transcript, setTranscript] = useState<TranscriptItem[]>([]);
  const [sessionStatus, setSessionStatus] = useState<'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR'>('IDLE');
  const [showLeaveConfirm, setShowLeaveConfirm] = useState(false);
  
  const isCombinedMode = setupData?.interviewType === 'Combined';
  const interviewersDetails = interviewerDetails || [{ name: 'Interviewer', role: 'AI' }];

  const [timeLeft, setTimeLeft] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const sessionManagerRef = useRef<{ close: () => void; askQuestion?: (type: Persona) => void; } | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);
  const [streamLoaded, setStreamLoaded] = useState(false);
  const [isUserSpeaking, setIsUserSpeaking] = useState(false);
  const [isAiSpeaking, setIsAiSpeaking] = useState(false);
  const [activeInterviewerName, setActiveInterviewerName] = useState<string | null>(null);
  const audioContextRef = useRef<AudioContext | null>(null);
  const animationFrameIdRef = useRef<number | null>(null);
  const isSpeakingRef = useRef(false);
  const startTimeRef = useRef<number | null>(null);

  // State for coding mode
  const [isCodingMode, setIsCodingMode] = useState(false);
  const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(false);
  const [codes, setCodes] = useState<Record<string, string>>({});
  const [fontSize, setFontSize] = useState(14);
  
  const [handsOnQuestions, setHandsOnQuestions] = useState<any[]>([]);
  const [activeHandsOnQuestion, setActiveHandsOnQuestion] = useState<any>(null);
  const [availableCategories, setAvailableCategories] = useState<string[]>([]);
  const [activeCategory, setActiveCategory] = useState<string>('');
  const [showLeetcodeModal, setShowLeetcodeModal] = useState(false);
  
  // State for answer validation
  const [isValidating, setIsValidating] = useState(false);
  const [validationResult, setValidationResult] = useState<{
      isCorrect: boolean | null;
      feedback: string;
      hint: string | null;
  } | null>(null);

  const hasHandsOnQuestions = handsOnQuestions && handsOnQuestions.length > 0;
  const canShowHandsOnButton = (setupData?.interviewType === 'Technical' || setupData?.interviewType === 'Combined') && hasHandsOnQuestions;

  useEffect(() => {
    if (setupData?.duration) {
      const durationMinutes = parseInt(setupData.duration, 10);
      if (!isNaN(durationMinutes)) {
        setTimeLeft(durationMinutes * 60);
      }
    }
    const hsQuestions = interviewQuestions?.handsOnQuestions || [];
    if (hsQuestions.length > 0) {
        setHandsOnQuestions(hsQuestions);
        const questionCategories = [...new Set(hsQuestions.map((q: any) => q.category))] as string[];
        setAvailableCategories(questionCategories);

        const firstQuestion = hsQuestions[0];
        setActiveHandsOnQuestion(firstQuestion);
        setActiveCategory(firstQuestion.category);
    }
  }, [setupData, interviewQuestions]);

  useEffect(() => {
    if (timeLeft <= 0) return;

    const timerId = setInterval(() => {
      setTimeLeft(prevTime => prevTime - 1);
    }, 1000);

    return () => clearInterval(timerId);
  }, [timeLeft]);

  const formatTime = (seconds: number) => {
    if (seconds < 0) seconds = 0;
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  // Main effect for media and live session
  useEffect(() => {
    let isMounted = true;
    startTimeRef.current = Date.now();

    const setupAudioAnalysis = (stream: MediaStream) => {
      if (!isMounted || !stream.getAudioTracks().length) return;
      const audioContext = new ((window as any).AudioContext || (window as any).webkitAudioContext)();
      audioContextRef.current = audioContext;
      const analyser = audioContext.createAnalyser();
      analyser.fftSize = 512;
      const source = audioContext.createMediaStreamSource(stream);
      source.connect(analyser);
      const dataArray = new Uint8Array(analyser.frequencyBinCount);

      const checkSpeaking = () => {
        if (!isMounted) return;
        if (!streamRef.current?.getAudioTracks()[0]?.enabled) {
          if (isSpeakingRef.current) {
            isSpeakingRef.current = false;
            setIsUserSpeaking(false);
          }
          animationFrameIdRef.current = requestAnimationFrame(checkSpeaking);
          return;
        }
        analyser.getByteTimeDomainData(dataArray);
        let sum = 0.0;
        for (const value of dataArray) {
          const normalizedValue = (value - 128) / 128.0;
          sum += normalizedValue * normalizedValue;
        }
        const rms = Math.sqrt(sum / dataArray.length);
        const speaking = rms > 0.02; 

        if (speaking !== isSpeakingRef.current) {
          isSpeakingRef.current = speaking;
          setIsUserSpeaking(speaking);
        }
        animationFrameIdRef.current = requestAnimationFrame(checkSpeaking);
      };
      checkSpeaking();
    };

    const startSession = async (stream: MediaStream) => {
      setSessionStatus('CONNECTING');
      
      try {
        if (isCombinedMode) {
            const controller = new CombinedLiveController({
                interviewers: interviewersDetails,
                questions: interviewQuestions,
                setupData: setupData,
                callbacks: {
                    onTranscriptionUpdate: (item) => {
                        setActiveInterviewerName(item.speaker);
                        setTranscript(prev => {
                            const newTranscript = [...prev];
                            const lastItem = newTranscript[newTranscript.length - 1];
                            if (lastItem && lastItem.speaker === item.speaker) {
                                lastItem.text = item.text;
                            } else {
                                newTranscript.push(item);
                            }
                            return newTranscript;
                        });
                    },
                    onAudioStateChange: (speaking) => {
                        setIsAiSpeaking(speaking);
                        if (!speaking) {
                            setActiveInterviewerName(null);
                        }
                    },
                }
            });
            await controller.start(stream);
            sessionManagerRef.current = controller;
        } else {
            const theoryQs = interviewQuestions?.theoryQuestions || [];
            const companyQs = interviewQuestions?.companySpecificQuestions || [];
            const allQuestions = [...theoryQs, ...companyQs];
            
            const candidateName = setupData.candidateName || 'there';
            const interviewerName = interviewersDetails?.[0]?.name || 'Interviewer';
            const interviewerRole = interviewersDetails?.[0]?.role || 'hiring manager';
            const companyName = setupData.targetCompany || 'our company';
            const experienceYears = Math.floor(Math.random() * 3) + 4; // 4, 5, or 6

            const intro = `Begin the interview now. First, greet the candidate, ${candidateName}, by name. Then, introduce yourself. Say something like: "Hi ${candidateName}, I'm ${interviewerName}. I'll be interviewing you today. I'm a ${interviewerRole} at ${companyName} and I've been here for about ${experienceYears} years."`;
            
            let systemInstruction;
            if (allQuestions.length > 0) {
              const questionList = allQuestions.map((q, i) => `${i + 1}. ${q}`).join('\n');
              systemInstruction = `You are an expert interviewer named ${interviewerName}. Your persona is ${setupData.persona || 'friendly'}. Your task is to conduct a mock interview with a candidate named ${candidateName}. Your goal is to have a natural, helpful, and conversational interview.

Here is the list of main questions you should guide the conversation through:
${questionList}

**Your Conversational Style (VERY IMPORTANT):**
- **Engage, Don't Just Interrogate:** Your primary goal is a natural, two-way conversation, not a rigid Q&A.
- **Acknowledge and Validate:** After the candidate answers, briefly acknowledge their response. Use phrases like "That's an interesting approach," "Thanks for sharing that detail," or "I see."
- **Provide Gentle Feedback:** If an answer is good, offer brief, positive reinforcement ("That's a great example."). If an answer is unclear or weak, gently probe for more information ("Could you elaborate on that point?" or "How did you handle the outcome?") instead of just moving on.
- **Ask Follow-up Questions:** Based on the candidate's answer, ask one relevant follow-up question to dig deeper. This is key to making the conversation feel real. For example, if they mention a project, ask about their specific role in it. Only after the follow-up should you move to the next main question.
- **Natural Transitions:** When you are ready to move to the next main question from your list, use a smooth transition. For example: "Okay, that makes sense. Let's switch gears a bit..." or "Great, thanks for clarifying. Now, I'd like to ask about..."

**Interview Flow:**
1. ${intro}
2. After your introduction, ask a simple conversational question like "How are you doing today?" or "Shall we begin?".
3. Wait for their response, then proceed with the first question from your list.
4. Follow the conversational style described above for the entire interview.`;
            } else {
              systemInstruction = `You are an expert interviewer named ${interviewerName}. Your persona is ${setupData.persona || 'friendly'}. Your task is to conduct a mock interview with a candidate named ${candidateName}.
              ${intro} After your introduction, ask a simple conversational question like "How are you doing today?" or "Shall we begin?". Wait for their response, and then you can ask the candidate to tell you a bit about themselves.
              CRITICAL RULE: Ask only ONE question at a time and wait for their full response.`;
            }

            sessionManagerRef.current = await initiateLiveSession({
                stream,
                systemInstruction,
                onTranscriptionUpdate: (item) => {
                    setTranscript(prev => {
                        const newTranscript = [...prev];
                        const lastItem = newTranscript[newTranscript.length - 1];
                        if (lastItem && lastItem.speaker === item.speaker) {
                            lastItem.text = item.text;
                        } else {
                            newTranscript.push(item);
                        }
                        return newTranscript;
                    });
                    if (item.speaker === 'Interviewer') setIsAiSpeaking(true);
                },
                onAudioFinished: () => {
                    setIsAiSpeaking(false);
                },
            });
        }
        setSessionStatus('CONNECTED');
      } catch (error) {
        console.error("Failed to initiate live session:", error);
        setSessionStatus('ERROR');
        alert("Could not connect to the interview service. Please try again later.");
      }
    };
    
    const getMediaAndStart = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (isMounted) {
          streamRef.current = stream;
          setStreamLoaded(true);
          setupAudioAnalysis(stream);
          await startSession(stream);
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
        if (isMounted) {
          alert("Could not access camera and microphone. Please check permissions and try again.");
          setIsCameraOn(false);
          setIsMicOn(false);
          setSessionStatus('ERROR');
        }
      }
    };

    getMediaAndStart();

    return () => {
      isMounted = false;
      if (animationFrameIdRef.current) {
        cancelAnimationFrame(animationFrameIdRef.current);
      }
      audioContextRef.current?.close().catch(console.error);
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
      sessionManagerRef.current?.close();
    };
  }, [isCombinedMode]); // Rerun effect if mode changes, though it shouldn't in practice.

  useEffect(() => {
    // Automatically mute/unmute microphone based on AI speaking state
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        if (isAiSpeaking) {
          // AI is speaking, so mute the user's mic.
          if (isMicOn) {
            audioTrack.enabled = false;
            setIsMicOn(false);
          }
        } else {
          // AI has finished speaking, so unmute the user's mic for them to respond.
          if (!isMicOn) {
            audioTrack.enabled = true;
            setIsMicOn(true);
          }
        }
      }
    }
  }, [isAiSpeaking]);

  useEffect(() => {
    if (streamLoaded && videoRef.current && streamRef.current) {
      videoRef.current.srcObject = streamRef.current;
    }
  }, [streamLoaded, isCodingMode]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const toggleCamera = async () => {
    if (!streamRef.current) return;
    if (isCameraOn) {
      const videoTracks = streamRef.current.getVideoTracks();
      // Stop and remove all video tracks from the stream
      videoTracks.forEach(track => {
        track.stop();
        streamRef.current.removeTrack(track);
      });
      setIsCameraOn(false);
    } else {
      try {
        const videoStream = await navigator.mediaDevices.getUserMedia({ video: true });
        const newVideoTrack = videoStream.getVideoTracks()[0];
        
        // Clean up any old video tracks before adding the new one.
        streamRef.current.getVideoTracks().forEach(track => {
            streamRef.current.removeTrack(track);
        });

        streamRef.current.addTrack(newVideoTrack);
        if (videoRef.current) {
            videoRef.current.srcObject = streamRef.current;
        }
        setIsCameraOn(true);
      } catch (err) {
        console.error("Error accessing camera.", err);
        alert("Could not access camera. Please check permissions and try again.");
      }
    }
  };

  const toggleMic = () => {
    // Disable manual mic control while AI is speaking
    if (isAiSpeaking) {
      return;
    }
    if (streamRef.current) {
      const audioTrack = streamRef.current.getAudioTracks()[0];
      if (audioTrack) {
        audioTrack.enabled = !isMicOn;
        setIsMicOn(!isMicOn);
      }
    }
  };

  const handleLeaveCall = () => {
    if (streamRef.current) {
      streamRef.current.getTracks().forEach(track => track.stop());
    }
    sessionManagerRef.current?.close();
    const endTime = Date.now();
    const durationInSeconds = startTimeRef.current ? Math.round((endTime - startTimeRef.current) / 1000) : 0;
    onLeave(transcript, durationInSeconds);
  };
  
  const handleAskQuestion = (type: Persona) => {
    if (sessionManagerRef.current?.askQuestion && !isAiSpeaking) {
      sessionManagerRef.current.askQuestion(type);
    }
  };

  const getTranscriptStatus = () => {
    switch(sessionStatus) {
      case 'CONNECTING':
        return 'Connecting to interview panel...';
      case 'CONNECTED':
        if(transcript.length === 0) return 'Interviewer is ready. The session will begin shortly.';
        return null; // Don't show anything if transcript is active
      case 'ERROR':
        return 'Connection failed. Please try leaving and starting a new session.';
      default:
        return 'Initializing...';
    }
  }
  const transcriptStatusMessage = getTranscriptStatus();

  const handleCategoryClick = (category: string) => {
      setActiveCategory(category);
      const questionForCategory = handsOnQuestions.find(q => q.category === category);
      setActiveHandsOnQuestion(questionForCategory);
      setValidationResult(null); // Reset validation on question change
  };
  
  const handleValidateAnswer = async () => {
    const currentCode = codes[activeCategory] || '';
    if (!activeHandsOnQuestion || !currentCode.trim()) {
        alert("Please select a question and write your answer first.");
        return;
    }
    setIsValidating(true);
    setValidationResult(null);
    try {
        const result = await validateAnswer(activeHandsOnQuestion, currentCode);
        setValidationResult(result);
    } catch (error) {
        const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during validation.";
        setValidationResult({ isCorrect: null, feedback: errorMessage, hint: null });
    } finally {
        setIsValidating(false);
    }
  };

  const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setCodes(prev => ({
      ...prev,
      [activeCategory]: e.target.value,
    }));
  };

  const getPlaceholderForCategory = () => {
    switch(activeCategory) {
        case 'SQL': return "Write your SQL query here...";
        case 'Other': return "Write your solution/explanation here...";
        case 'DSA':
        default: return "Write your code here...";
    }
  }

  return (
    <div className="bg-dark h-screen w-screen flex flex-col text-white font-sans">
      {/* ======================================================================
      IMPROVEMENT 1: Unified Header Bar
      ======================================================================
      */}
      <header className="p-3 border-b border-slate-800 flex-shrink-0 bg-slate-900/50 flex justify-between items-center">
        {/* Left Side */}
        <div className="flex items-center gap-4">
            <h1 className="text-xl font-bold text-white">InterviewAI</h1>
            
            {isCodingMode && (
                <>
                    <div className="w-px h-6 bg-slate-700 hidden md:block"></div>
                    <button onClick={() => setIsCodingMode(false)} className="px-3 py-2 text-sm font-semibold bg-green-600 rounded-md hover:bg-green-500 transition-colors text-white">
                        Back to the call
                    </button>
                    {availableCategories.length > 0 && (
                        <div className="hidden md:flex items-center border border-slate-700 rounded-md p-0.5">
                            {availableCategories.map(cat => (
                                <button 
                                    key={cat} 
                                    onClick={() => handleCategoryClick(cat)}
                                    className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeCategory === cat ? 'bg-slate-700 text-white' : 'text-gray-400 hover:bg-slate-800'}`}
                                >
                                    {cat}
                                </button>
                            ))}
                        </div>
                    )}
                </>
            )}
        </div>

        {/* Right Side */}
        <div className="flex justify-end items-center gap-4">
            {!isCodingMode && canShowHandsOnButton && (
                <div className="relative group">
                    <button 
                    onClick={() => setIsCodingMode(true)}
                    className="px-4 py-2 text-sm font-mono bg-slate-800 rounded-md hover:bg-slate-700 transition-colors text-gray-300 border border-slate-700"
                    aria-label="Hands-On Coding"
                    >
                    &lt;/&gt;
                    </button>
                    <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                    Hands-On
                    </div>
                </div>
            )}
            <div className="text-sm text-gray-300 bg-slate-800 px-4 py-2 rounded-md border border-slate-700">
                <span className="text-gray-400">Time Left: </span>
                <span className="font-mono font-semibold tracking-wider text-white">{formatTime(timeLeft)}</span>
            </div>
        </div>
      </header>
      
      <main className="flex flex-1 overflow-hidden">
        {isCodingMode ? (
          <div key="coding-view" className="flex flex-1 animate-fade-in-up" style={{ animationDuration: '0.5s' }}>
              {/* Question Panel */}
              <aside className={`bg-slate-900 flex flex-col transition-all duration-300 ease-in-out relative border-r border-slate-700 ${isQuestionCollapsed ? 'w-12' : 'w-1/3'}`}>
                  <button onClick={() => setIsQuestionCollapsed(!isQuestionCollapsed)} className="absolute top-1/2 -translate-y-1/2 -right-3.5 z-10 w-7 h-7 bg-slate-700 hover:bg-primary rounded-full flex items-center justify-center transition-colors">
                      <span className="font-bold">{isQuestionCollapsed ? '>' : '<'}</span>
                  </button>
                  {activeHandsOnQuestion && (
                      <div className={`p-6 transition-opacity duration-200 h-full overflow-y-auto ${isQuestionCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                          <h3 className="text-lg font-semibold text-primary mb-4">{activeHandsOnQuestion.title}</h3>
                          <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{activeHandsOnQuestion.description}</p>
                      </div>
                  )}
              </aside>

              {/* Editor Panel */}
              <section className="flex-1 flex flex-col bg-slate-900/20">
                   <div className="flex-shrink-0 flex justify-end items-center gap-2 p-2 border-b border-slate-700">
                       <span className="text-xs text-gray-400">Zoom:</span>
                       <button onClick={() => setFontSize(s => Math.max(10, s - 1))} className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600">-</button>
                       <button onClick={() => setFontSize(s => Math.min(24, s + 1))} className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600">+</button>
                   </div>
                  <textarea 
                      value={codes[activeCategory] || ''} 
                      onChange={handleCodeChange} 
                      style={{ fontSize: `${fontSize}px` }}
                      className="flex-1 w-full bg-transparent p-4 font-mono focus:outline-none resize-none"
                      placeholder={getPlaceholderForCategory()}
                  />
                   <div className="flex-shrink-0 flex items-center gap-4 p-3 border-t border-slate-700">
                      {activeCategory === 'DSA' && (
                           <button
                               onClick={() => setShowLeetcodeModal(true)}
                               /* ======================================================================
                               IMPROVEMENT 3: Cleaner Coder Buttons
                               ======================================================================
                               */
                               className="px-4 py-2 text-sm font-semibold bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors flex items-center gap-2"
                           >
                               Solve on Leetcode
                               <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                   <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                               </svg>
                           </button>
                      )}
                      <div className="flex-grow flex items-center gap-2">
                          {validationResult && (
                              <div className={`flex items-center gap-2 p-2 rounded-md text-sm animate-fade-in-up ${
                                  validationResult.isCorrect === true ? 'bg-green-900/50 text-green-300' : 
                                  validationResult.isCorrect === false ? 'bg-red-900/50 text-red-300' :
                                  'bg-yellow-900/50 text-yellow-300'
                              }`}>
                                  {validationResult.isCorrect === true && <CheckIcon />}
                                  {validationResult.isCorrect === false && <CrossIcon />}
                                  <span>{validationResult.feedback}</span>
                                  {validationResult.isCorrect === false && validationResult.hint && (
                                      <div className="relative group">
                                          <HintIcon />
                                          <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 w-72 hidden group-hover:block bg-slate-900 text-white text-sm rounded py-2 px-3 shadow-lg border border-slate-700 z-10">
                                              <strong>Hint:</strong> {validationResult.hint}
                                          </div>
                                      </div>
                                  )}
                              </div>
                          )}
                      </div>
                      <button 
                        onClick={() => { setCodes(prev => ({ ...prev, [activeCategory]: '' })); setValidationResult(null); }} 
                        /* ======================================================================
                        IMPROVEMENT 3: Cleaner Coder Buttons
                        ======================================================================
                        */
                        className="px-4 py-2 text-sm font-semibold bg-transparent border border-slate-600 text-gray-300 rounded-md hover:bg-slate-800 transition-colors"
                      >
                        Clear
                      </button>
                      <button 
                        onClick={handleValidateAnswer} 
                        disabled={isValidating} 
                        className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center w-32"
                      >
                          {isValidating ? (
                              <SpinnerIcon />
                          ) : (
                              'Validate answer'
                          )}
                      </button>
                  </div>
              </section>

              {/* Video & Controls Sidebar */}
              <aside className="w-[280px] bg-slate-800/50 flex flex-col border-l border-slate-700 p-4 gap-4 overflow-y-auto">
                  {interviewersDetails.map((details, index) => (
                      <div key={index} className="flex-shrink-0">
                         <VideoPlaceholder name={details.name} role={details.role} isSpeaking={isAiSpeaking && activeInterviewerName === details.name} />
                      </div>
                  ))}
                  <div className={`w-full aspect-video bg-black rounded-xl relative overflow-hidden border border-slate-700 shadow-lg flex-shrink-0 transition-all duration-300 ${isUserSpeaking ? 'ring-2 ring-primary ring-offset-2 ring-offset-slate-800' : ''}`}>
                        {!isCameraOn && <div className="absolute inset-0 bg-slate-900 flex items-end justify-start p-3"><p className="font-semibold text-white text-sm">{setupData?.candidateName || 'User'}</p></div>}
                      <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} />
                        {isCameraOn && <div className="absolute bottom-2 left-2 text-xs bg-black/40 px-2 py-0.5 rounded">
                          <span className="font-semibold text-white">{setupData?.candidateName || 'User'}</span>
                      </div>}
                  </div>
                  
                  {/* ======================================================================
                  IMPROVEMENT 2: Consistent Control Bar
                  ======================================================================
                  */}
                  <div className="flex-grow"></div>
                  <div className="flex justify-center gap-4 py-1">
                        <ToggleControlButton onClick={toggleMic} active={isMicOn} ariaLabel={isMicOn ? 'Mute microphone' : 'Unmute microphone'} disabled={isAiSpeaking}>
                            {isMicOn ? <MicOn className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                        </ToggleControlButton>
                        <ToggleControlButton onClick={toggleCamera} active={isCameraOn} ariaLabel={isCameraOn ? 'Turn off camera' : 'Turn on camera'}>
                            {isCameraOn ? <CameraOn className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
                        </ToggleControlButton>
                        <ControlButton onClick={() => setShowLeaveConfirm(true)} active={false} ariaLabel="Leave call">
                            <PhoneHangUpIcon />
                        </ControlButton>
                  </div>
              </aside>
          </div>
        ) : isCombinedMode ? (
          <div key="combined-call-view" className="flex flex-1 animate-fade-in-up" style={{ animationDuration: '0.5s' }}>
              <div className="flex-1 flex flex-col bg-black min-w-0 min-h-0">
                  <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 p-4 overflow-hidden">
                      <div className={`w-full h-full bg-black rounded-xl relative overflow-hidden border border-slate-700 shadow-lg flex-shrink-0 transition-all duration-300 min-h-0 ${isUserSpeaking ? 'ring-2 ring-primary ring-offset-2 ring-offset-black' : ''}`}>
                          {!isCameraOn && (
                              <div className="absolute inset-0 bg-slate-900 flex items-end justify-start p-3">
                                  <p className="font-semibold text-white text-sm">{setupData?.candidateName || 'User'}</p>
                              </div>
                          )}
                          <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} />
                          {isCameraOn && (
                              <div className="absolute bottom-2 left-2 text-xs bg-black/40 px-2 py-0.5 rounded">
                                  <span className="font-semibold text-white">{setupData?.candidateName || 'User'}</span>
                              </div>
                          )}
                      </div>

                      {/* FIX: Wrapped VideoPlaceholder in a div and moved the key to the wrapper to resolve props error. */}
                      {interviewersDetails.map((details, index) => (
                          <div key={index}>
                            <VideoPlaceholder name={details.name} role={details.role} isSpeaking={isAiSpeaking && activeInterviewerName === details.name} />
                          </div>
                      ))}
                  </div>

                  {/* ======================================================================
                  IMPROVEMENT 2: Consistent Control Bar
                  ======================================================================
                  */}
                  <div className="flex-shrink-0 p-3 bg-dark/50 border-t border-slate-800 flex justify-center items-center gap-3">
                      <button onClick={() => handleAskQuestion('technical')} disabled={isAiSpeaking} className="px-4 py-2 text-sm font-semibold bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Ask Technical</button>
                      <button onClick={() => handleAskQuestion('behavioral')} disabled={isAiSpeaking} className="px-4 py-2 text-sm font-semibold bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Ask Behavioral</button>
                      <button onClick={() => handleAskQuestion('hr')} disabled={isAiSpeaking} className="px-4 py-2 text-sm font-semibold bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Ask HR</button>

                      <div className="w-px h-8 bg-slate-700 mx-2"></div>

                      <ToggleControlButton onClick={toggleMic} active={isMicOn} ariaLabel={isMicOn ? 'Mute microphone' : 'Unmute microphone'} disabled={isAiSpeaking}>
                          {isMicOn ? <MicOn className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                      </ToggleControlButton>
                      <ToggleControlButton onClick={toggleCamera} active={isCameraOn} ariaLabel={isCameraOn ? 'Turn off camera' : 'Turn on camera'}>
                          {isCameraOn ? <CameraOn className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
                      </ToggleControlButton>
                  </div>
              </div>

              <aside className="w-[350px] bg-slate-800/50 flex flex-col border-l border-slate-700">
                  <div className="p-4 border-b border-slate-700 flex-shrink-0">
                      <h2 className="text-lg font-semibold">Live Transcript</h2>
                  </div>
                  <div className="flex-1 p-4 overflow-y-auto space-y-4">
                      {transcriptStatusMessage && (
                      <div className="flex justify-center items-center h-full">
                          <p className="text-gray-400 text-center">{transcriptStatusMessage}</p>
                      </div>
                      )}
                      {transcript.map((item, index) => (
                      <div key={index} className={`flex flex-col ${item.speaker === 'You' ? 'items-end' : 'items-start'}`}>
                          <div className={`rounded-lg px-3 py-2 max-w-[90%] ${item.speaker === 'You' ? 'bg-primary text-white' : 'bg-slate-700'}`}>
                          <p className="text-xs font-bold mb-1">{item.speaker}</p>
                          <p className="text-sm">{item.text}</p>
                          </div>
                      </div>
                      ))}
                      <div ref={transcriptEndRef} />
                  </div>
                  <div className="p-4 border-t border-slate-700 flex-shrink-0">
                    <button
                        onClick={() => setShowLeaveConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-500 transition-transform transform hover:scale-105 duration-300"
                    >
                        <PhoneHangUpIcon />
                        <span>Leave Call</span>
                    </button>
                  </div>
              </aside>
          </div>
        ) : (
          <div key="call-view" className="flex flex-1 animate-fade-in-up" style={{ animationDuration: '0.5s' }}>
              <div className="flex-1 flex flex-col p-4 gap-4">
              <div className={`flex-shrink-0 flex flex-wrap ${interviewersDetails.length === 1 ? 'justify-center' : 'justify-center md:justify-around'} gap-4`}>
                  {interviewersDetails.map((details, index) => (
                  <div
                    key={index}
                    className={`w-full aspect-video ${
                      interviewersDetails.length === 1 ? 'max-w-xl' : 'md:w-1/3 max-w-sm'
                    }`}
                  >
                    <VideoPlaceholder name={details.name} role={details.role} isSpeaking={isAiSpeaking && activeInterviewerName === details.name} />
                  </div>
                  ))}
              </div>
              <div className="flex-1 flex items-center justify-center min-h-0 p-4">
                  <div className={`w-full max-w-2xl aspect-video bg-black rounded-2xl relative overflow-hidden border border-slate-800 shadow-2xl transition-all duration-300 ${isUserSpeaking ? 'ring-4 ring-primary ring-offset-4 ring-offset-dark' : ''}`}>
                  {!isCameraOn && <div className="absolute inset-0 bg-slate-900 flex items-end justify-start p-3"><p className="font-semibold text-white text-sm">{setupData?.candidateName || 'User'}</p></div>}
                  <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} />
                  
                    {isCameraOn && <div className="absolute bottom-3 left-3 text-sm bg-black/30 px-2 py-1 rounded-md">
                      <span className="font-semibold text-amber-500">{setupData?.candidateName || 'UserName'}</span>
                  </div>}

                  {/* ======================================================================
                  IMPROVEMENT 2: Removed overlay controls from here
                  ======================================================================
                  */}
                  </div>
              </div>
              {/* ======================================================================
              IMPROVEMENT 2: Added static control bar at the bottom
              ======================================================================
              */}
              <div className="flex-shrink-0 p-3 bg-dark/50 flex justify-center items-center gap-4">
                <ToggleControlButton onClick={toggleMic} active={isMicOn} ariaLabel={isMicOn ? 'Mute microphone' : 'Unmute microphone'} disabled={isAiSpeaking}>
                    {isMicOn ? <MicOn className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                </ToggleControlButton>
                <ToggleControlButton onClick={toggleCamera} active={isCameraOn} ariaLabel={isCameraOn ? 'Turn off camera' : 'Turn on camera'}>
                    {isCameraOn ? <CameraOn className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
                </ToggleControlButton>
              </div>
              </div>

              <aside className="w-[350px] bg-slate-800/50 flex flex-col border-l border-slate-700">
              <div className="p-4 border-b border-slate-700 flex-shrink-0">
                  <h2 className="text-lg font-semibold">Live Transcript</h2>
              </div>
              <div className="flex-1 p-4 overflow-y-auto space-y-4">
                  {transcriptStatusMessage && (
                    <div className="flex justify-center items-center h-full">
                      <p className="text-gray-400 text-center">{transcriptStatusMessage}</p>
                    </div>
                  )}
                  {transcript.map((item, index) => (
                  <div key={index} className={`flex flex-col ${item.speaker === 'You' ? 'items-end' : 'items-start'}`}>
                      <div className={`rounded-lg px-3 py-2 max-w-[90%] ${item.speaker === 'You' ? 'bg-primary text-white' : 'bg-slate-700'}`}>
                      <p className="text-xs font-bold mb-1">{item.speaker}</p>
                      <p className="text-sm">{item.text}</p>
                      </div>
                  </div>
                  ))}
                  <div ref={transcriptEndRef} />
              </div>
              <div className="p-4 border-t border-slate-700 flex-shrink-0">
                    <button
                        onClick={() => setShowLeaveConfirm(true)}
                        className="w-full flex items-center justify-center gap-2 bg-red-600 text-white font-bold py-3 px-6 rounded-lg hover:bg-red-500 transition-transform transform hover:scale-105 duration-300"
                    >
                        <PhoneHangUpIcon />
                        <span>Leave Call</span>
                    </button>
                </div>
              </aside>
          </div>
        )}
      </main>
      
      {showLeetcodeModal && (
        <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
          <div className="bg-slate-800 rounded-lg shadow-xl p-8 max-w-md w-full border border-slate-700 relative">
            <button 
              onClick={() => setShowLeetcodeModal(false)}
              className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors"
              aria-label="Close"
            >
              <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
              </svg>
            </button>
            <div className="text-center">
              <h3 className="text-xl font-semibold text-white mb-4">Ready to Solve on Leetcode?</h3>
              <p className="text-gray-300 mb-8">
                Solve and come back and paste your code here.
              </p>
              <button
                onClick={() => {
                  const slug = activeHandsOnQuestion?.leetcodeSlug;
                  const title = activeHandsOnQuestion?.title;
                  
                  let leetcodeUrl = `https://leetcode.com/problemset/?search=${encodeURIComponent(title || '')}`;

                  if (slug) {
                    leetcodeUrl = `https://leetcode.com/problems/${slug}/`;
                  }
                  
                  window.open(leetcodeUrl, '_blank');
                  setShowLeetcodeModal(false);
                }}
                className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-500 transition transform hover:scale-105"
              >
                Proceed
              </button>
            </div>
          </div>
        </div>
      )}

        {showLeaveConfirm && (
            <div className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up" style={{ animationDuration: '0.3s' }}>
            <div className="bg-slate-800 rounded-lg shadow-xl p-8 max-w-md w-full border border-slate-700 text-center">
                <h3 className="text-xl font-semibold text-white mb-4">Leave Interview?</h3>
                <p className="text-gray-300 mb-8">
                Are you sure you want to end the interview session? Your progress will be saved and you will be taken to the summary page.
                </p>
                <div className="flex justify-center gap-4">
                <button
                    onClick={() => setShowLeaveConfirm(false)}
                    className="px-6 py-2 font-semibold bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors"
                >
                    Cancel
                </button>
                <button
                    onClick={() => {
                    setShowLeaveConfirm(false);
                    handleLeaveCall();
                    }}
                    className="px-6 py-2 font-semibold bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors"
                >
                    Leave
                </button>
                </div>
            </div>
            </div>
        )}
    </div>
  );
};

export default InterviewPage;