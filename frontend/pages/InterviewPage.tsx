import React, { useState, useEffect, useRef } from 'react';
import { CameraOn } from '../icons/cameraOn';
import { CameraOff } from '../icons/CameraOff';
import { MicOn } from '../icons/MicOn';
import { MicOff } from '../icons/MicOff';

// Icons
const PhoneHangUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V6C19 4.34315 17.6569 3 16 3Z" transform="rotate(135 12 12)" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.5 9.5L9.5 14.5M9.5 9.5L14.5 14.5" transform="rotate(135 12 12)" />
    </svg>
);

const ControlButton: React.FC<{
  onClick: () => void;
  active: boolean;
  children: React.ReactNode;
  ariaLabel: string;
}> = ({ onClick, active, children, ariaLabel }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    className={`w-14 h-14 flex items-center justify-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-primary text-white ${
      active ? 'bg-slate-700/80 hover:bg-slate-600/80' : 'bg-red-600/80 hover:bg-red-500/80'
    }`}
  >
    {children}
  </button>
);

const VideoPlaceholder = ({ name, role, number }: { name: string, role: string, number: number }) => (
  <div className="w-full aspect-video bg-slate-800/50 rounded-2xl flex flex-col items-center justify-center border border-slate-700 p-4 relative shadow-lg">
    <p className="text-gray-300 font-bold text-lg">{`Interviewer ${number}`}</p>
    <div className="absolute bottom-3 left-3 text-sm bg-black/30 px-2 py-1 rounded-md">
      <span className="font-semibold text-amber-500">{name} - {role}</span>
    </div>
  </div>
);

const getInterviewerDetails = (setupData: any) => {
  const isCombined = setupData?.interviewType === 'Combined';
  if (isCombined) {
    return [
      { name: 'Alex Ray', role: 'Software Engineer' },
      { name: 'Casey Morgan', role: 'Hiring Manager' },
      { name: 'Jordan Lee', role: 'HR Specialist' },
    ];
  }

  let role = 'Interviewer';
  switch (setupData?.interviewType) {
    case 'Technical':
      role = 'Software Engineer';
      break;
    case 'Behavioral/Managerial':
      role = 'Hiring Manager';
      break;
    case 'HR':
      role = 'HR Specialist';
      break;
  }
  return [{ name: 'Alex Ray', role }];
};

const dummyTranscript = [
  { speaker: 'Interviewer', text: 'Thanks for joining today. Can you tell me a bit about yourself?' },
  { speaker: 'You', text: "Of course. I'm a passionate software engineer with 5 years of experience in building scalable web applications." },
  { speaker: 'Interviewer', text: "That's great to hear. Can you walk me through a challenging project you've worked on?" },
];

const dummyQuestion = {
    title: 'Find the Duplicate Number',
    details: 'Given an array of integers `nums` containing `n + 1` integers where each integer is in the range `[1, n]` inclusive.\n\nThere is only one repeated number in `nums`, return this repeated number.\n\nYou must solve the problem without modifying the array `nums` and using only constant extra space.'
};

interface InterviewPageProps {
  onLeave: () => void;
  setupData: any;
}

const InterviewPage: React.FC<InterviewPageProps> = ({ onLeave, setupData }) => {
  const [isCameraOn, setIsCameraOn] = useState(true);
  const [isMicOn, setIsMicOn] = useState(true);
  const [transcript, setTranscript] = useState(dummyTranscript);
  const [timeLeft, setTimeLeft] = useState(0);
  const videoRef = useRef<HTMLVideoElement>(null);
  const streamRef = useRef<MediaStream | null>(null);
  const transcriptEndRef = useRef<HTMLDivElement>(null);

  // State for coding mode
  const [isCodingMode, setIsCodingMode] = useState(false);
  const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(false);
  const [code, setCode] = useState("/* Write your code here */");
  const [fontSize, setFontSize] = useState(14);
  const [activeTab, setActiveTab] = useState('DSA');
  const tabs = ['DSA', 'SQL', 'Other'];


  useEffect(() => {
    if (setupData?.duration) {
      const durationMinutes = parseInt(setupData.duration, 10);
      if (!isNaN(durationMinutes)) {
        setTimeLeft(durationMinutes * 60);
      }
    }
  }, [setupData]);

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

  // This effect runs on every render to ensure the stream is attached.
  useEffect(() => {
    if (streamRef.current && videoRef.current) {
      if (videoRef.current.srcObject !== streamRef.current) {
        videoRef.current.srcObject = streamRef.current;
      }
    }
  });

  // This effect runs only once to get the media stream and set up cleanup.
  useEffect(() => {
    let isMounted = true;
    
    const getMedia = async () => {
      try {
        const stream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        if (isMounted) {
          streamRef.current = stream;
          setIsCameraOn(true); // Force a re-render to attach stream
        }
      } catch (err) {
        console.error("Error accessing media devices.", err);
        if (isMounted) {
          alert("Could not access camera and microphone. Please check permissions and try again.");
        }
      }
    };

    getMedia();

    return () => {
      isMounted = false;
      if (streamRef.current) {
        streamRef.current.getTracks().forEach(track => track.stop());
        streamRef.current = null;
      }
    };
  }, []);
  
  useEffect(() => {
      if(isCodingMode) return;
      const interval = setInterval(() => {
          setTranscript(prev => [...prev, { speaker: 'Interviewer', text: 'Tell me more about that...' }]);
      }, 5000);
      return () => clearInterval(interval);
  }, [isCodingMode]);

  useEffect(() => {
    transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [transcript]);

  const toggleCamera = () => {
    if (streamRef.current) {
      const videoTrack = streamRef.current.getVideoTracks()[0];
      if (videoTrack) {
        videoTrack.enabled = !isCameraOn;
        setIsCameraOn(!isCameraOn);
      }
    }
  };

  const toggleMic = () => {
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
    onLeave();
  };
  
  const interviewersDetails = getInterviewerDetails(setupData);

  return (
    <div className="bg-dark h-screen w-screen flex flex-col text-white font-sans">
      <header className="p-4 border-b border-slate-800 flex-shrink-0">
        <h1 className="text-xl font-bold text-white">InterviewAI</h1>
      </header>

      <div className="p-3 border-b border-slate-800 flex-shrink-0 bg-slate-900/50 flex justify-between items-center">
        {isCodingMode ? (
            <div className="flex items-center gap-4">
                <button onClick={() => setIsCodingMode(false)} className="px-3 py-2 text-sm font-semibold bg-blue-600 rounded-md hover:bg-blue-500 transition-colors text-white">
                    Back to the call
                </button>
                <div className="flex items-center border border-slate-700 rounded-md p-0.5">
                    {tabs.map(tab => (
                        <button 
                            key={tab} 
                            onClick={() => setActiveTab(tab)}
                            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${activeTab === tab ? 'bg-slate-700 text-white' : 'text-gray-400 hover:bg-slate-800'}`}
                        >
                            {tab}
                        </button>
                    ))}
                </div>
            </div>
        ) : (
            <>
                <div className="flex-1"></div>
                <div className="flex-1 flex justify-center">
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
                </div>
            </>
        )}
        
        <div className="flex justify-end items-center" style={{ flexBasis: isCodingMode ? 'auto' : '33.33%' }}>
          <div className="text-sm text-gray-300 bg-slate-800 px-4 py-2 rounded-md border border-slate-700">
            <span className="text-gray-400">Time Left: </span>
            <span className="font-mono font-semibold tracking-wider text-white">{formatTime(timeLeft)}</span>
          </div>
        </div>
      </div>
      
      <main className="flex flex-1 overflow-hidden">
        {isCodingMode ? (
            <>
                {/* Question Panel */}
                <aside className={`bg-slate-900/30 flex flex-col transition-all duration-300 ease-in-out relative border-r border-slate-700 ${isQuestionCollapsed ? 'w-12' : 'w-1/3'}`}>
                    <button onClick={() => setIsQuestionCollapsed(!isQuestionCollapsed)} className="absolute top-1/2 -translate-y-1/2 -right-3.5 z-10 w-7 h-7 bg-slate-700 hover:bg-primary rounded-full flex items-center justify-center transition-colors">
                        <span className="font-bold">{isQuestionCollapsed ? '>' : '<'}</span>
                    </button>
                    <div className={`transition-opacity duration-200 ${isQuestionCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="p-4 overflow-y-auto h-full">
                            <h3 className="text-lg font-semibold text-primary mb-3">{dummyQuestion.title}</h3>
                            <p className="text-gray-300 whitespace-pre-wrap text-sm">{dummyQuestion.details}</p>
                        </div>
                    </div>
                </aside>

                {/* Editor Panel */}
                <section className="flex-1 flex flex-col bg-slate-900/20">
                     <div className="flex-shrink-0 flex justify-end items-center gap-2 p-2 border-b border-slate-700">
                        <span className="text-xs text-gray-400">Zoom:</span>
                        <button onClick={() => setFontSize(s => Math.max(10, s - 1))} className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600">-</button>
                        <button onClick={() => setFontSize(s => Math.min(24, s + 1))} className="w-6 h-6 rounded bg-slate-700 hover:bg-slate-600">+</button>
                    </div>
                    <textarea 
                        value={code} 
                        onChange={e => setCode(e.target.value)} 
                        style={{ fontSize: `${fontSize}px` }}
                        className="flex-1 w-full bg-transparent p-4 font-mono focus:outline-none resize-none"
                        placeholder="Write your code here..."
                    />
                     <div className="flex-shrink-0 flex items-center gap-4 p-3 border-t border-slate-700">
                        {activeTab === 'DSA' && (
                            <a
                                href="https://leetcode.com/problems/find-the-duplicate-number/"
                                target="_blank"
                                rel="noopener noreferrer"
                                className="px-4 py-2 text-sm font-semibold bg-yellow-600 text-white rounded-md hover:bg-yellow-500 transition-colors flex items-center gap-2"
                            >
                                Solve on Leetcode
                                <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                                </svg>
                            </a>
                        )}
                        <div className="flex-grow"></div>
                        <button onClick={() => setCode("")} className="px-4 py-2 text-sm font-semibold bg-slate-700 rounded-md hover:bg-slate-600 transition-colors">Clear all</button>
                        <button onClick={() => alert('Validating...')} className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-md hover:bg-blue-500 transition-colors">Validate answer</button>
                    </div>
                </section>

                {/* Video & Controls Sidebar */}
                <aside className="w-[280px] bg-slate-800/50 flex flex-col border-l border-slate-700 p-4 gap-4 overflow-y-auto">
                    {interviewersDetails.map((details, index) => (
                        <div key={index} className="flex-shrink-0">
                           <VideoPlaceholder name={details.name} role={details.role} number={index + 1} />
                        </div>
                    ))}
                    <div className="w-full aspect-video bg-black rounded-xl relative overflow-hidden border border-slate-700 shadow-lg flex-shrink-0">
                         {!isCameraOn && <div className="absolute inset-0 bg-slate-900 flex items-center justify-center"><p className="text-gray-400 text-sm">Camera is off</p></div>}
                        <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} />
                        <div className="absolute bottom-2 left-2 text-xs bg-black/40 px-2 py-0.5 rounded">
                            <span className="font-semibold text-white">{setupData?.candidateName || 'User'}</span>
                        </div>
                    </div>
                    <div className="flex justify-center gap-4 py-1">
                        <button onClick={toggleMic} aria-label={isMicOn ? 'Mute microphone' : 'Unmute microphone'} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isMicOn ? 'bg-slate-600 hover:bg-slate-500' : 'bg-red-600 hover:bg-red-500'}`}>
                            {isMicOn ? <MicOn className="h-5 w-5" /> : <MicOff className="h-5 w-5" />}
                        </button>
                        <button onClick={toggleCamera} aria-label={isCameraOn ? 'Turn off camera' : 'Turn on camera'} className={`w-10 h-10 rounded-full flex items-center justify-center transition-colors ${isCameraOn ? 'bg-slate-600 hover:bg-slate-500' : 'bg-red-600 hover:bg-red-500'}`}>
                            {isCameraOn ? <CameraOn className="h-5 w-5" /> : <CameraOff className="h-5 w-5" />}
                        </button>
                    </div>
                    <div className="flex-grow"></div>
                     <button onClick={handleLeaveCall} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-2 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                        <span>Leave call</span>
                    </button>
                </aside>
            </>
        ) : (
            <>
                <div className="flex-1 flex flex-col p-4 gap-4">
                <div className={`flex-shrink-0 flex flex-wrap ${interviewersDetails.length === 1 ? 'justify-center' : 'justify-center md:justify-around'} gap-4`}>
                    {interviewersDetails.map((details, index) => (
                    <div key={index} className={
                        interviewersDetails.length === 1 ? 'w-full max-w-xl' :
                        interviewersDetails.length === 2 ? 'w-full md:w-1/2 max-w-sm' :
                        'w-full md:w-1/3 max-w-sm'
                    }>
                        <VideoPlaceholder name={details.name} role={details.role} number={index + 1} />
                    </div>
                    ))}
                </div>
                <div className="flex-1 flex items-center justify-center min-h-0">
                    <div className="w-full max-w-3xl aspect-video bg-black rounded-2xl relative overflow-hidden border border-slate-800 shadow-2xl">
                    {!isCameraOn && <div className="absolute inset-0 bg-slate-900 flex items-center justify-center"><p className="text-gray-400">Camera is off</p></div>}
                    <video ref={videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity ${isCameraOn ? 'opacity-100' : 'opacity-0'}`} />
                    
                    <div className="absolute bottom-3 left-3 text-sm bg-black/30 px-2 py-1 rounded-md">
                        <span className="font-semibold text-amber-500">{setupData?.candidateName || 'UserName'}</span>
                    </div>

                    <div className="absolute bottom-0 left-0 right-0 p-4 bg-gradient-to-t from-black/50 to-transparent flex justify-center items-center">
                        <div className="flex items-center gap-6">
                        <ControlButton onClick={toggleMic} active={isMicOn} ariaLabel={isMicOn ? 'Mute microphone' : 'Unmute microphone'}>
                            {isMicOn ? <MicOn className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
                        </ControlButton>
                        <ControlButton onClick={toggleCamera} active={isCameraOn} ariaLabel={isCameraOn ? 'Turn off camera' : 'Turn on camera'}>
                            {isCameraOn ? <CameraOn className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
                        </ControlButton>
                        </div>
                    </div>
                    </div>
                </div>
                </div>

                <aside className="w-[350px] bg-slate-800/50 flex flex-col border-l border-slate-700">
                <div className="p-4 border-b border-slate-700 flex-shrink-0">
                    <h2 className="text-lg font-semibold">Live Transcript</h2>
                </div>
                <div className="flex-1 p-4 overflow-y-auto space-y-4">
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
                    <button onClick={handleLeaveCall} className="w-full bg-red-600 hover:bg-red-500 text-white font-bold py-3 px-4 rounded-lg flex items-center justify-center gap-2 transition-colors">
                    <PhoneHangUpIcon />
                    <span>Leave call</span>
                    </button>
                </div>
                </aside>
            </>
        )}
      </main>
    </div>
  );
};

export default InterviewPage;