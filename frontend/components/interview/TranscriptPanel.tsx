import React from 'react';
import TranscriptItemView from '../TranscriptView';
import { TranscriptItem } from '../../hooks/useLiveSessionManager';

interface TranscriptPanelProps {
    transcript: TranscriptItem[];
    sessionStatus: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
    isReconnecting: boolean;
    transcriptEndRef: React.RefObject<HTMLDivElement>;
}

const TranscriptPanel: React.FC<TranscriptPanelProps> = ({ transcript, sessionStatus, isReconnecting, transcriptEndRef }) => {
    
    const getStatusMessage = () => {
        if (isReconnecting) return null; // Status is shown in the header
        switch(sessionStatus) {
            case 'CONNECTING':
                return 'Connecting to interview panel...';
            case 'CONNECTED':
                if(transcript.length === 0) return 'Interviewer is ready. The session will begin shortly.';
                return null;
            case 'ERROR':
                return 'Connection failed. Please try leaving and starting a new session.';
            default:
                return 'Initializing...';
        }
    }
    const statusMessage = getStatusMessage();

    return (
        <aside className="w-[350px] bg-slate-800/50 flex flex-col border-l border-slate-700 animate-slide-in-right">
            <div className="p-4 border-b border-slate-700 flex-shrink-0">
                <h2 className="text-lg font-semibold">Live Transcript</h2>
            </div>
            <div className="flex-1 p-4 overflow-y-auto space-y-4">
                {statusMessage && (
                    <div className="flex justify-center items-center h-full">
                        <p className="text-gray-400 text-center">{statusMessage}</p>
                    </div>
                )}
                {transcript.map((item) => (
                    <TranscriptItemView key={item.id} item={item} />
                ))}
                <div ref={transcriptEndRef} />
            </div>
        </aside>
    );
};

export default TranscriptPanel;
