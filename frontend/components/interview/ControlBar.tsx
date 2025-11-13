import React from 'react';
import { CameraOn } from '../../icons/cameraOn';
import { CameraOff } from '../../icons/CameraOff';
import { MicOn } from '../../icons/MicOn';
import { MicOff } from '../../icons/MicOff';
import { PhoneHangUpIcon } from '../../icons/PhoneHangUpIcon';
import { TranscriptIcon } from '../../icons/TranscriptIcon';

const ControlButton: React.FC<{
  onClick: () => void;
  children: React.ReactNode;
  ariaLabel: string;
  className?: string;
  disabled?: boolean;
}> = ({ onClick, children, ariaLabel, className = '', disabled }) => (
  <button
    onClick={onClick}
    aria-label={ariaLabel}
    disabled={disabled}
    className={`w-14 h-14 flex items-center justify-center rounded-full transition-colors duration-300 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-offset-black/50 focus:ring-primary text-white ${className} ${disabled ? 'opacity-50 cursor-not-allowed' : ''}`}
  >
    {children}
  </button>
);

interface ControlBarProps {
    isCombinedMode: boolean;
    toggleCamera: () => void;
    isCameraOn: boolean;
    toggleMic: () => void;
    isMicOn: boolean;
    onLeave?: () => void;
    isAiSpeaking: boolean;
    handleAskQuestion?: (type: 'technical' | 'behavioral' | 'hr') => void;
    isTranscriptVisible?: boolean;
    toggleTranscript?: () => void;
}

const ControlBar: React.FC<ControlBarProps> = (props) => {
    return (
        <div className="flex-shrink-0 p-3 bg-dark/50 flex justify-center items-center gap-4">
            {props.isCombinedMode && props.handleAskQuestion && (
                <>
                    <button onClick={() => props.handleAskQuestion!('technical')} disabled={props.isAiSpeaking} className="px-4 py-2 text-sm font-semibold bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Ask Technical</button>
                    <button onClick={() => props.handleAskQuestion!('behavioral')} disabled={props.isAiSpeaking} className="px-4 py-2 text-sm font-semibold bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Ask Behavioral</button>
                    <button onClick={() => props.handleAskQuestion!('hr')} disabled={props.isAiSpeaking} className="px-4 py-2 text-sm font-semibold bg-slate-700 text-white rounded-lg hover:bg-slate-600 transition-colors disabled:opacity-50 disabled:cursor-not-allowed">Ask HR</button>
                    <div className="w-px h-8 bg-slate-700 mx-2"></div>
                </>
            )}

            <ControlButton onClick={props.toggleMic} ariaLabel={props.isMicOn ? 'Mute microphone' : 'Unmute microphone'} className={props.isMicOn ? 'bg-slate-700/80 hover:bg-slate-600/80' : 'bg-red-600/80 hover:bg-red-500/80'}>
                {props.isMicOn ? <MicOn className="h-6 w-6" /> : <MicOff className="h-6 w-6" />}
            </ControlButton>
            <ControlButton onClick={props.toggleCamera} ariaLabel={props.isCameraOn ? 'Turn off camera' : 'Turn on camera'} className={props.isCameraOn ? 'bg-slate-700/80 hover:bg-slate-600/80' : 'bg-red-600/80 hover:bg-red-500/80'}>
                {props.isCameraOn ? <CameraOn className="h-6 w-6" /> : <CameraOff className="h-6 w-6" />}
            </ControlButton>

            {props.toggleTranscript && (
                 <ControlButton
                    onClick={props.toggleTranscript}
                    ariaLabel={props.isTranscriptVisible ? 'Hide Transcript' : 'Show Transcript'}
                    className={props.isTranscriptVisible ? 'bg-slate-700/80 hover:bg-slate-600/80' : 'bg-primary/80 hover:bg-primary'}
                >
                    <TranscriptIcon className="h-6 w-6" />
                </ControlButton>
            )}

            {props.onLeave && (
                <>
                    <div className="w-px h-8 bg-slate-700 mx-2"></div>
                    <ControlButton onClick={props.onLeave} ariaLabel="Leave call" className="bg-red-600 hover:bg-red-500">
                        <PhoneHangUpIcon />
                    </ControlButton>
                </>
            )}
        </div>
    );
};

export default ControlBar;
