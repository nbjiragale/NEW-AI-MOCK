import React, { useState } from 'react';
import { validateAnswer } from '../../services/geminiForValidation';
import ControlBar from './ControlBar';
import { LeetcodeModal } from './Modals';

// Icons
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

interface CodingViewProps {
    questions: any[];
    videoRef: React.RefObject<HTMLVideoElement>;
    isCameraOn: boolean;
    isUserSpeaking: boolean;
    isAiSpeaking: boolean;
    activeInterviewerName: string | null;
    setupData: any;
    interviewersDetails: any[];
    toggleCamera: () => void;
    toggleMic: () => void;
    isMicOn: boolean;
    onLeave: () => void;
}

const CodingView: React.FC<CodingViewProps> = (props) => {
    const { questions } = props;
    const [isQuestionCollapsed, setIsQuestionCollapsed] = useState(false);
    const [codes, setCodes] = useState<Record<string, string>>({});
    const [fontSize, setFontSize] = useState(14);
    
    const [activeQuestion, setActiveQuestion] = useState<any>(questions[0]);
    const [activeCategory, setActiveCategory] = useState<string>(questions[0]?.category);
    const [showLeetcodeModal, setShowLeetcodeModal] = useState(false);
    
    const [isValidating, setIsValidating] = useState(false);
    const [validationResult, setValidationResult] = useState<{ isCorrect: boolean | null; feedback: string; hint: string | null; } | null>(null);

    const availableCategories = [...new Set(questions.map((q: any) => q.category))] as string[];

    const handleCategoryClick = (category: string) => {
      setActiveCategory(category);
      const questionForCategory = questions.find(q => q.category === category);
      setActiveQuestion(questionForCategory);
      setValidationResult(null);
    };
  
    const handleValidateAnswer = async () => {
        const currentCode = codes[activeCategory] || '';
        if (!activeQuestion || !currentCode.trim()) {
            alert("Please select a question and write your answer first.");
            return;
        }
        setIsValidating(true);
        setValidationResult(null);
        try {
            const result = await validateAnswer(activeQuestion, currentCode);
            setValidationResult(result);
        } catch (error) {
            const errorMessage = error instanceof Error ? error.message : "An unknown error occurred during validation.";
            setValidationResult({ isCorrect: null, feedback: errorMessage, hint: null });
        } finally {
            setIsValidating(false);
        }
    };

    const handleCodeChange = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
        setCodes(prev => ({ ...prev, [activeCategory]: e.target.value }));
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
        <div className="flex flex-1 animate-fade-in-up" style={{ animationDuration: '0.5s' }}>
            {/* Question Panel */}
            <aside className={`bg-slate-900 flex flex-col transition-all duration-300 ease-in-out relative border-r border-slate-700 ${isQuestionCollapsed ? 'w-12' : 'w-1/3'}`}>
                <button onClick={() => setIsQuestionCollapsed(!isQuestionCollapsed)} className="absolute top-1/2 -translate-y-1/2 -right-3.5 z-10 w-7 h-7 bg-slate-700 hover:bg-primary rounded-full flex items-center justify-center transition-colors">
                    <span className="font-bold">{isQuestionCollapsed ? '>' : '<'}</span>
                </button>
                {activeQuestion && (
                    <div className={`p-6 transition-opacity duration-200 h-full overflow-y-auto ${isQuestionCollapsed ? 'opacity-0' : 'opacity-100'}`}>
                        <div className="flex items-center gap-2 mb-4">
                            {availableCategories.map(cat => (
                                <button key={cat} onClick={() => handleCategoryClick(cat)}
                                    className={`px-3 py-1 text-xs font-semibold rounded-full transition-colors ${activeCategory === cat ? 'bg-primary text-white' : 'bg-slate-700 text-gray-300 hover:bg-slate-600'}`}>
                                    {cat}
                                </button>
                            ))}
                        </div>
                        <h3 className="text-lg font-semibold text-primary mb-4">{activeQuestion.title}</h3>
                        <p className="text-gray-300 whitespace-pre-wrap text-sm leading-relaxed">{activeQuestion.description}</p>
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
                        <button onClick={() => setShowLeetcodeModal(true)}
                            className="px-4 py-2 text-sm font-semibold bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors flex items-center gap-2">
                            Solve on Leetcode
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-4 w-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" />
                            </svg>
                        </button>
                    )}
                    <div className="flex-grow flex items-center gap-2">
                        {validationResult && (
                            <div className={`flex items-center gap-2 p-2 rounded-md text-sm animate-fade-in-up ${
                                validationResult.isCorrect ? 'bg-green-900/50 text-green-300' : 'bg-red-900/50 text-red-300'
                            }`}>
                                {validationResult.isCorrect ? <CheckIcon /> : <CrossIcon />}
                                <span>{validationResult.feedback}</span>
                                {!validationResult.isCorrect && validationResult.hint && (
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
                    <button onClick={() => { setCodes(prev => ({ ...prev, [activeCategory]: '' })); setValidationResult(null); }} 
                        className="px-4 py-2 text-sm font-semibold bg-transparent border border-slate-600 text-gray-300 rounded-md hover:bg-slate-800 transition-colors">
                        Clear
                    </button>
                    <button onClick={handleValidateAnswer} disabled={isValidating} 
                        className="px-4 py-2 text-sm font-semibold bg-primary text-white rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 disabled:cursor-wait flex items-center justify-center w-32">
                        {isValidating ? <SpinnerIcon /> : 'Validate answer'}
                    </button>
                </div>
            </section>

            {/* Video & Controls Sidebar */}
            <aside className="w-[280px] bg-slate-800/50 flex flex-col border-l border-slate-700 p-4 gap-4 overflow-y-auto">
                {props.interviewersDetails.map((details, index) => (
                    <div key={index} className="flex-shrink-0">
                        <VideoPlaceholder name={details.name} role={details.role} isSpeaking={props.isAiSpeaking && props.activeInterviewerName === details.name} />
                    </div>
                ))}
                <div className={`w-full aspect-video bg-black rounded-xl relative overflow-hidden border border-slate-700 shadow-lg flex-shrink-0 transition-all duration-300 ${props.isUserSpeaking ? 'ring-2 ring-primary ring-offset-2 ring-offset-slate-800' : ''}`}>
                    <video ref={props.videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity ${props.isCameraOn ? 'opacity-100' : 'opacity-0'}`} />
                    <div className="absolute bottom-2 left-2 text-xs bg-black/40 px-2 py-0.5 rounded">
                        <span className="font-semibold text-white">{props.setupData?.candidateName || 'User'}</span>
                    </div>
                </div>
                
                <div className="flex-grow"></div>
                 <ControlBar
                    isCombinedMode={false}
                    toggleCamera={props.toggleCamera}
                    isCameraOn={props.isCameraOn}
                    toggleMic={props.toggleMic}
                    isMicOn={props.isMicOn}
                    onLeave={props.onLeave}
                    isAiSpeaking={props.isAiSpeaking}
                />
            </aside>
            <LeetcodeModal 
              isOpen={showLeetcodeModal}
              onClose={() => setShowLeetcodeModal(false)}
              onConfirm={() => {
                  const slug = activeQuestion?.leetcodeSlug;
                  const title = activeQuestion?.title;
                  let leetcodeUrl = `https://leetcode.com/problemset/?search=${encodeURIComponent(title || '')}`;
                  if (slug) leetcodeUrl = `https://leetcode.com/problems/${slug}/`;
                  window.open(leetcodeUrl, '_blank');
                  setShowLeetcodeModal(false);
              }}
            />
        </div>
    );
};

export default CodingView;
