import React, { useState, useRef, useEffect } from 'react';

const FormInput: React.FC<{ label: string; type: string; placeholder: string; name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean }> = ({ label, type, placeholder, name, value, onChange, required = false }) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-base font-medium text-gray-300">{label}</label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            className="bg-slate-800 border border-slate-700 text-white text-base rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition"
            placeholder={placeholder}
            required={required}
        />
    </div>
);

const FormTextarea: React.FC<{ label: string; placeholder: string; name: string, rows?: number, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, required?: boolean }> = ({ label, placeholder, name, rows = 4, value, onChange, required = false }) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-base font-medium text-gray-300">{label}</label>
        <textarea
            name={name}
            id={name}
            rows={rows}
            value={value}
            onChange={onChange}
            className="bg-slate-800 border border-slate-700 text-white text-base rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition"
            placeholder={placeholder}
            required={required}
        ></textarea>
    </div>
);

interface QAPair {
    id: number;
    question: string;
    answer: string;
}

interface FluencyPracticeProps {
    initialPairs: QAPair[];
    onChange: (pairs: QAPair[]) => void;
}

const FluencyPractice: React.FC<FluencyPracticeProps> = ({ initialPairs, onChange }) => {
    const [qaPairs, setQaPairs] = useState(initialPairs.length > 0 ? initialPairs : [{ id: 1, question: '', answer: '' }]);
    const nextId = useRef(Math.max(...qaPairs.map(p => p.id), 0) + 1);

    useEffect(() => {
        onChange(qaPairs);
    }, [qaPairs, onChange]);

    const handleAddQaPair = () => {
        setQaPairs(prev => [...prev, { id: nextId.current++, question: '', answer: '' }]);
    };

    const handleRemoveQaPair = (id: number) => {
        setQaPairs(prev => prev.filter(pair => pair.id !== id));
    };

    const handleQaChange = (id: number, field: 'question' | 'answer', value: string) => {
        setQaPairs(prev => prev.map(pair => pair.id === id ? { ...pair, [field]: value } : pair));
    };

    return (
        <div className="space-y-6">
            <p className="text-gray-300">Enter the questions and your ideal answers. The AI will coach you on delivering them fluently.</p>
            {qaPairs.map((pair, index) => (
                <div key={pair.id} className="p-4 bg-slate-800/60 border border-slate-700 rounded-lg space-y-4 relative">
                    <FormInput 
                        label={`Question ${index + 1}`} 
                        name={`question-${pair.id}`} 
                        type="text" 
                        placeholder="e.g., Tell me about yourself."
                        value={pair.question}
                        onChange={(e) => handleQaChange(pair.id, 'question', e.target.value)}
                        required
                    />
                    <FormTextarea 
                        label="Your Ideal Answer" 
                        name={`answer-${pair.id}`} 
                        placeholder="Write the key points you want to cover."
                        rows={3}
                        value={pair.answer}
                        onChange={(e) => handleQaChange(pair.id, 'answer', e.target.value)}
                        required
                    />
                    {qaPairs.length > 1 && (
                        <button
                            type="button"
                            onClick={() => handleRemoveQaPair(pair.id)}
                            className="absolute top-2 right-2 text-gray-500 hover:text-red-400"
                            aria-label="Remove question and answer pair"
                        >
                            <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                            </svg>
                        </button>
                    )}
                </div>
            ))}
            <button
                type="button"
                onClick={handleAddQaPair}
                className="w-full text-center py-2 text-primary font-semibold border-2 border-dashed border-slate-600 rounded-lg hover:bg-slate-800 hover:border-primary transition-colors"
            >
                + Add Another Q&A
            </button>
        </div>
    );
};

export default FluencyPractice;
