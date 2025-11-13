import React, { useRef } from 'react';
import { TranscriptItem } from '../../hooks/useLiveSessionManager';
import TranscriptPanel from './TranscriptPanel';
import VideoGrid from './VideoGrid';
import ControlBar from './ControlBar';

interface CallViewProps {
    isCombinedMode: boolean;
    videoRef: React.RefObject<HTMLVideoElement>;
    isCameraOn: boolean;
    isUserSpeaking: boolean;
    isAiSpeaking: boolean;
    activeInterviewerName: string | null;
    setupData: any;
    interviewersDetails: any[];
    transcript: TranscriptItem[];
    sessionStatus: 'IDLE' | 'CONNECTING' | 'CONNECTED' | 'ERROR';
    isReconnecting: boolean;
    isTranscriptVisible: boolean;
    toggleTranscript: () => void;
    toggleCamera: () => void;
    toggleMic: () => void;
    isMicOn: boolean;
    onLeave: () => void;
    handleAskQuestion: (type: 'technical' | 'behavioral' | 'hr') => void;
}

const CallView: React.FC<CallViewProps> = (props) => {
    const transcriptEndRef = useRef<HTMLDivElement>(null);

    React.useEffect(() => {
        transcriptEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, [props.transcript]);
    
    return (
        <div className="flex flex-1 animate-fade-in-up" style={{ animationDuration: '0.5s' }}>
            <div className="flex-1 flex flex-col p-4 gap-4">
                <VideoGrid
                    isCombinedMode={props.isCombinedMode}
                    videoRef={props.videoRef}
                    isCameraOn={props.isCameraOn}
                    isUserSpeaking={props.isUserSpeaking}
                    isAiSpeaking={props.isAiSpeaking}
                    activeInterviewerName={props.activeInterviewerName}
                    setupData={props.setupData}
                    interviewersDetails={props.interviewersDetails}
                />
                <ControlBar
                    isCombinedMode={props.isCombinedMode}
                    toggleCamera={props.toggleCamera}
                    isCameraOn={props.isCameraOn}
                    toggleMic={props.toggleMic}
                    isMicOn={props.isMicOn}
                    onLeave={props.onLeave}
                    isAiSpeaking={props.isAiSpeaking}
                    handleAskQuestion={props.handleAskQuestion}
                    isTranscriptVisible={props.isTranscriptVisible}
                    toggleTranscript={props.toggleTranscript}
                />
            </div>
            {props.isTranscriptVisible && (
                <TranscriptPanel
                    transcript={props.transcript}
                    sessionStatus={props.sessionStatus}
                    isReconnecting={props.isReconnecting}
                    transcriptEndRef={transcriptEndRef}
                />
            )}
        </div>
    );
};

export default CallView;
