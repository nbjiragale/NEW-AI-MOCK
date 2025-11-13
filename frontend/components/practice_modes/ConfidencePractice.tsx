import React, { useState } from 'react';

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

const confidenceQuestions = [
    "What technical areas or skills do you feel least confident about right now?",
    "Describe a recent interview experience where you felt you could have performed better. What would you change?",
    "What types of behavioral questions do you find most challenging to answer?",
    "What are your specific goals for this practice session? What do you hope to achieve?",
];

interface ConfidencePracticeProps {
    initialValues: Record<number, string>;
    onChange: (answers: Record<number, string>) => void;
}

const ConfidencePractice: React.FC<ConfidencePracticeProps> = ({ initialValues, onChange }) => {
    const [answers, setAnswers] = useState<Record<number, string>>(initialValues);

    const handleChange = (index: number, value: string) => {
        const newAnswers = { ...answers, [index]: value };
        setAnswers(newAnswers);
        onChange(newAnswers);
    };

    return (
        <div className="space-y-6">
            <p className="text-gray-300">Answer these questions honestly to help the AI tailor the session to build your confidence.</p>
            {confidenceQuestions.map((q, index) => (
                <FormTextarea
                    key={index}
                    label={q}
                    name={`confidence-answer-${index}`}
                    placeholder="Your reflection here..."
                    value={answers[index] || ''}
                    onChange={(e) => handleChange(index, e.target.value)}
                    required
                />
            ))}
        </div>
    );
};

export default ConfidencePractice;
