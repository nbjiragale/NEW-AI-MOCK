import React from 'react';
import { PaceIcon } from '../icons/PaceIcon';
import { EyeIcon } from '../icons/EyeIcon';

interface RealtimeFeedbackProps {
    paceStatus: 'normal' | 'fast';
    eyeContactStatus: 'good' | 'poor';
}

const FeedbackIndicator: React.FC<{
    isActive: boolean;
    children: React.ReactNode;
    text: string;
    isPulsing?: boolean;
}> = ({ isActive, children, text, isPulsing = false }) => (
    <div className={`
        flex items-center gap-2 bg-slate-900/80 backdrop-blur-sm border border-slate-700 rounded-full pl-2 pr-3 py-1.5
        transition-all duration-500
        ${isActive ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-2 pointer-events-none'}
    `}>
        <div className={`
            ${isPulsing && isActive ? 'animate-pulse-subtle text-yellow-300' : 'text-yellow-400'}
        `}>
            {children}
        </div>
        <span className="text-xs font-semibold text-yellow-300">{text}</span>
    </div>
);

const RealtimeFeedback: React.FC<RealtimeFeedbackProps> = ({ paceStatus, eyeContactStatus }) => {
    return (
        <div className="absolute top-4 right-4 flex flex-col items-end gap-2 z-20">
            <FeedbackIndicator
                isActive={paceStatus === 'fast'}
                text="Speaking fast"
                isPulsing={true}
            >
                <PaceIcon className="h-5 w-5" />
            </FeedbackIndicator>

            <FeedbackIndicator
                isActive={eyeContactStatus === 'poor'}
                text="Look at camera"
            >
                <EyeIcon className="h-5 w-5" />
            </FeedbackIndicator>
        </div>
    );
};

export default RealtimeFeedback;