import React from 'react';

interface TranscriptItem {
    speaker: string;
    text: string;
    id: number;
    status: 'interim' | 'finalized';
}

const TranscriptItemView: React.FC<{ item: TranscriptItem }> = ({ item }) => {
    const { speaker, text, status } = item;
    const isInterim = status === 'interim';

    return (
        <div className={`flex flex-col group ${speaker === 'You' ? 'items-end' : 'items-start'}`}>
            <div className={`inline-block rounded-lg px-3 py-2 max-w-[90%] transition-colors duration-300 ${
                speaker === 'You' ? 'bg-primary' : 'bg-slate-700'
            }`}>
                <p className={`text-sm break-words text-left ${isInterim ? 'text-gray-300' : 'text-white'}`}>
                    <span className="block text-xs font-bold mb-1 text-white">{speaker}</span>
                    {text}
                </p>
            </div>
        </div>
    );
};

export default React.memo(TranscriptItemView);