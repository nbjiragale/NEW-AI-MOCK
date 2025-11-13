import React from 'react';

const ModalWrapper: React.FC<{ isOpen: boolean; onClose?: () => void; children: React.ReactNode }> = ({ isOpen, onClose, children }) => {
    if (!isOpen) return null;
    return (
        <div 
            className="fixed inset-0 bg-black/60 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up" 
            style={{ animationDuration: '0.3s' }}
            onClick={onClose}
        >
            <div 
                className="bg-slate-800 rounded-lg shadow-xl p-8 max-w-md w-full border border-slate-700 text-center"
                onClick={(e) => e.stopPropagation()}
            >
                {children}
            </div>
        </div>
    );
};

export const TimeUpModal: React.FC<{ isOpen: boolean; onAskQuestions: () => void; onEndInterview: () => void }> = ({ isOpen, onAskQuestions, onEndInterview }) => (
    <ModalWrapper isOpen={isOpen}>
        <h3 className="text-2xl font-bold text-white mb-4">Time's Up!</h3>
        <p className="text-gray-300 mb-8">The main part of your interview is complete. You can now end the session or ask any questions you may have for the interviewer.</p>
        <div className="flex flex-col gap-4">
            <button onClick={onAskQuestions} className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-500 transition-transform transform hover:scale-105">
                I have questions
            </button>
            <button onClick={onEndInterview} className="w-full bg-slate-700 text-white font-semibold py-3 px-6 rounded-md hover:bg-slate-600 transition">
                End Interview
            </button>
        </div>
    </ModalWrapper>
);

export const LeaveConfirmModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void }> = ({ isOpen, onClose, onConfirm }) => (
    <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <h3 className="text-xl font-semibold text-white mb-4">Leave Interview?</h3>
        <p className="text-gray-300 mb-8">
            Are you sure you want to end the interview session? Your progress will be saved and you will be taken to the summary page.
        </p>
        <div className="flex justify-center gap-4">
            <button onClick={onClose} className="px-6 py-2 font-semibold bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors">
                Cancel
            </button>
            <button onClick={() => { onClose(); onConfirm(); }} className="px-6 py-2 font-semibold bg-red-600 text-white rounded-md hover:bg-red-500 transition-colors">
                Leave
            </button>
        </div>
    </ModalWrapper>
);

export const LeetcodeModal: React.FC<{ isOpen: boolean; onClose: () => void; onConfirm: () => void }> = ({ isOpen, onClose, onConfirm }) => (
     <ModalWrapper isOpen={isOpen} onClose={onClose}>
        <button onClick={onClose} className="absolute top-4 right-4 text-gray-400 hover:text-white transition-colors" aria-label="Close">
            <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
            </svg>
        </button>
        <h3 className="text-xl font-semibold text-white mb-4">Ready to Solve on Leetcode?</h3>
        <p className="text-gray-300 mb-8">
            Solve and come back and paste your code here.
        </p>
        <button onClick={onConfirm} className="w-full bg-primary text-white font-bold py-3 px-6 rounded-lg hover:bg-blue-500 transition transform hover:scale-105">
            Proceed
        </button>
    </ModalWrapper>
);
