import React from 'react';

interface TranscriptItem {
    speaker: string;
    text: string;
    id: number;
}

const TranscriptItemView: React.FC<{ item: TranscriptItem }> = ({ item }) => {
    const { speaker, text } = item;
    return (
        <div className={`flex flex-col group ${speaker === 'You' ? 'items-end' : 'items-start'}`}>
            <div className={`rounded-lg px-3 py-2 max-w-[90%] ${speaker === 'You' ? 'bg-primary text-white' : 'bg-slate-700'}`}>
                <p className="text-xs font-bold mb-1">{speaker}</p>
                <p className="text-sm break-words">{text}</p>
            </div>
        </div>
    );
};

export default React.memo(TranscriptItemView);
