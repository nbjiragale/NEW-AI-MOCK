import React from 'react';

interface InterviewHeaderProps {
    isCodingMode: boolean;
    setIsCodingMode: (isCoding: boolean) => void;
    canShowHandsOnButton: boolean;
    isTimerEnabled: boolean;
    timeLeft: number;
    isTimeUp: boolean;
    formatTime: (seconds: number) => string;
    sessionStatus: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
    isReconnecting: boolean;
    retryCount: number;
}

const MAX_RETRIES = 3;

const InterviewHeader: React.FC<InterviewHeaderProps> = (props) => {
    
    const renderConnectionStatus = () => {
        if (props.isReconnecting) {
            return (
                <div className="absolute top-0 left-0 right-0 bg-yellow-600 text-white text-center py-1 z-50 text-sm font-semibold animate-pulse">
                    Connection lost. Attempting to reconnect... (Attempt {props.retryCount}/{MAX_RETRIES})
                </div>
            );
        }
        if (props.sessionStatus === 'ERROR' && !props.isReconnecting) {
            return (
                <div className="absolute top-0 left-0 right-0 bg-red-600 text-white text-center py-1 z-50 text-sm font-semibold">
                    Connection failed. Please start a new interview.
                </div>
            );
        }
        return null;
    }

    return (
        <header className="p-3 border-b border-slate-800 flex-shrink-0 bg-slate-900/50 flex justify-between items-center relative">
            {renderConnectionStatus()}
            <div className="flex items-center gap-4">
                <h1 className="text-xl font-bold text-white">InterviewAI</h1>
                {props.isCodingMode && (
                    <>
                        <div className="w-px h-6 bg-slate-700 hidden md:block"></div>
                        <button onClick={() => props.setIsCodingMode(false)} className="px-3 py-2 text-sm font-semibold bg-green-600 rounded-md hover:bg-green-500 transition-colors text-white">
                            Back to the call
                        </button>
                    </>
                )}
            </div>
            <div className="flex justify-end items-center gap-4">
                {!props.isCodingMode && props.canShowHandsOnButton && (
                    <div className="relative group">
                        <button onClick={() => props.setIsCodingMode(true)}
                            className="px-4 py-2 text-sm font-mono bg-slate-800 rounded-md hover:bg-slate-700 transition-colors text-gray-300 border border-slate-700"
                            aria-label="Hands-On Coding">
                            &lt;/&gt;
                        </button>
                        <div className="absolute bottom-full mb-2 left-1/2 -translate-x-1/2 hidden group-hover:block bg-black text-white text-xs rounded py-1 px-2 whitespace-nowrap shadow-lg">
                            Hands-On
                        </div>
                    </div>
                )}
                {props.isTimerEnabled && (
                    <div className={`text-sm text-gray-300 bg-slate-800 px-4 py-2 rounded-md border border-slate-700 transition-colors ${props.isTimeUp ? 'border-red-500/50' : ''}`}>
                        <span className="text-gray-400">Time Left: </span>
                        <span className={`font-mono font-semibold tracking-wider ${props.isTimeUp ? 'text-red-400 animate-pulse' : 'text-white'}`}>{props.formatTime(props.timeLeft)}</span>
                    </div>
                )}
            </div>
        </header>
    );
};

export default InterviewHeader;
