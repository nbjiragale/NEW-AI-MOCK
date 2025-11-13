import React from 'react';

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

interface VideoGridProps {
    isCombinedMode: boolean;
    videoRef: React.RefObject<HTMLVideoElement>;
    isCameraOn: boolean;
    isUserSpeaking: boolean;
    isAiSpeaking: boolean;
    activeInterviewerName: string | null;
    setupData: any;
    interviewersDetails: any[];
}

const VideoGrid: React.FC<VideoGridProps> = (props) => {
    
    const UserVideo = () => (
        <div className={`w-full h-full bg-black rounded-xl relative overflow-hidden border border-slate-700 shadow-lg flex-shrink-0 transition-all duration-300 min-h-0 ${props.isUserSpeaking ? 'ring-2 ring-primary ring-offset-2 ring-offset-black' : ''}`}>
            {!props.isCameraOn && (
                <div className="absolute inset-0 bg-slate-900 flex items-end justify-start p-3">
                    <p className="font-semibold text-white text-sm">{props.setupData?.candidateName || 'User'}</p>
                </div>
            )}
            <video ref={props.videoRef} autoPlay playsInline muted className={`w-full h-full object-cover transition-opacity ${props.isCameraOn ? 'opacity-100' : 'opacity-0'}`} />
            {props.isCameraOn && (
                <div className="absolute bottom-2 left-2 text-xs bg-black/40 px-2 py-0.5 rounded">
                    <span className="font-semibold text-white">{props.setupData?.candidateName || 'User'}</span>
                </div>
            )}
        </div>
    );

    if (props.isCombinedMode) {
        return (
            <div className="flex-1 grid grid-cols-2 grid-rows-2 gap-4 overflow-hidden">
                <UserVideo />
                {props.interviewersDetails.map((details, index) => (
                    <div key={index}>
                      <VideoPlaceholder name={details.name} role={details.role} isSpeaking={props.isAiSpeaking && props.activeInterviewerName === details.name} />
                    </div>
                ))}
            </div>
        );
    }

    return (
        <>
            <div className={`flex-shrink-0 flex flex-wrap ${props.interviewersDetails.length === 1 ? 'justify-center' : 'justify-center md:justify-around'} gap-4`}>
                {props.interviewersDetails.map((details, index) => (
                    <div key={index} className={`w-full aspect-video ${props.interviewersDetails.length === 1 ? 'max-w-xl' : 'md:w-1/3 max-w-sm'}`}>
                        <VideoPlaceholder name={details.name} role={details.role} isSpeaking={props.isAiSpeaking} />
                    </div>
                ))}
            </div>
            <div className="flex-1 flex items-center justify-center min-h-0 p-4">
                 <div className={`w-full max-w-2xl aspect-video rounded-2xl`}>
                    <UserVideo />
                 </div>
            </div>
        </>
    );
};

export default VideoGrid;
