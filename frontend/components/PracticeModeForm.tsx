import React, { useState } from 'react';

type PracticeOption = 'topic' | 'list' | 'confidence';

const FormInput: React.FC<{ label: string; type: string; placeholder: string; name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void }> = ({ label, type, placeholder, name, value, onChange }) => (
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
        />
    </div>
);

const FormTextarea: React.FC<{ label: string; placeholder: string; name: string, rows?: number, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void }> = ({ label, placeholder, name, rows = 4, value, onChange }) => (
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
        ></textarea>
    </div>
);

const FormSelect: React.FC<{ label: string; name: string; children: React.ReactNode; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; }> = ({ label, name, children, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-base font-medium text-gray-300">{label}</label>
        <select
            id={name}
            name={name}
            value={value}
            onChange={onChange}
            className="bg-slate-800 border border-slate-700 text-white text-base rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
        >
            {children}
        </select>
    </div>
);

const confidenceQuestions = [
    "What technical areas or skills do you feel least confident about right now?",
    "Describe a recent interview experience where you felt you could have performed better. What would you change?",
    "What types of behavioral questions do you find most challenging to answer?",
    "What are your specific goals for this practice session? What do you hope to achieve?",
];

interface PracticeModeFormProps {
    initialData?: any;
    onSubmit: (data: any) => void;
}

const PracticeModeForm: React.FC<PracticeModeFormProps> = ({ initialData, onSubmit }) => {
    const getInitialOption = (): PracticeOption => {
        if (!initialData) return 'topic';
        if (initialData.practiceType === 'By Topic Name') return 'topic';
        if (initialData.practiceType === 'By List of Questions') return 'list';
        if (initialData.practiceType === 'Build Confidence') return 'confidence';
        return 'topic';
    };

    const getInitialConfidenceAnswers = (): Record<number, string> => {
        const defaultAnswers = { 0: '', 1: '', 2: '', 3: '' };
        if (initialData?.practiceType !== 'Build Confidence') {
            return defaultAnswers;
        }
        const answers: Record<number, string> = {};
        initialData.confidenceAnswers.forEach((item: { question: string, answer: string }, index: number) => {
            answers[index] = item.answer;
        });
        return { ...defaultAnswers, ...answers };
    };

    const [practiceOption, setPracticeOption] = useState<PracticeOption>(getInitialOption());
    const [interviewType, setInterviewType] = useState(initialData?.interviewType || 'Technical');
    const [topicName, setTopicName] = useState(initialData?.practiceType === 'By Topic Name' ? initialData.topicName : '');
    const [questionList, setQuestionList] = useState(initialData?.practiceType === 'By List of Questions' ? initialData.questionList : '');
    const [confidenceAnswers, setConfidenceAnswers] = useState<Record<number, string>>(getInitialConfidenceAnswers());

    const handleConfidenceChange = (index: number, value: string) => {
        setConfidenceAnswers(prev => ({...prev, [index]: value}));
    };

    const isButtonDisabled = () => {
        switch (practiceOption) {
            case 'topic':
                return !topicName.trim();
            case 'list':
                return !questionList.trim();
            case 'confidence':
                // Fix: Explicitly type 'answer' as a string to resolve TypeScript inference issue.
                return Object.values(confidenceAnswers).some((answer: string) => !answer.trim());
            default:
                return true;
        }
    };
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        const baseData = {
            type: 'Practice Mode',
            interviewType,
            practiceType: practiceOption === 'topic' ? 'By Topic Name' : practiceOption === 'list' ? 'By List of Questions' : 'Build Confidence',
        };

        let practiceData = {};

        switch (practiceOption) {
            case 'topic':
                practiceData = { topicName };
                break;
            case 'list':
                practiceData = { questionList };
                break;
            case 'confidence':
                practiceData = { confidenceAnswers: Object.entries(confidenceAnswers).map(([key, value]) => ({ question: confidenceQuestions[parseInt(key)], answer: value }))};
                break;
        }
        
        onSubmit({ ...baseData, ...practiceData });
    };

    const OptionButton: React.FC<{ option: PracticeOption; label: string }> = ({ option, label }) => (
        <button
            type="button"
            onClick={() => setPracticeOption(option)}
            className={`flex-1 px-4 py-3 text-base font-semibold text-center transition-all duration-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${
                practiceOption === option
                    ? 'bg-primary text-white shadow-md'
                    : 'text-gray-300 hover:bg-slate-800/50 hover:text-white'
            }`}
        >
            {label}
        </button>
    );

    const renderFormContent = () => {
        switch (practiceOption) {
            case 'topic':
                return (
                    <FormInput
                        label="Topic Name(s)"
                        name="topicName"
                        type="text"
                        placeholder="e.g., React Hooks, JavaScript Promises, System Design..."
                        value={topicName}
                        onChange={(e) => setTopicName(e.target.value)}
                    />
                );
            case 'list':
                return (
                    <FormTextarea
                        label="List of Questions"
                        name="questionList"
                        rows={8}
                        placeholder="Paste your questions here, one per line."
                        value={questionList}
                        onChange={(e) => setQuestionList(e.target.value)}
                    />
                );
            case 'confidence':
                return (
                    <div className="space-y-6">
                        {confidenceQuestions.map((q, index) => (
                             <FormTextarea
                                key={index}
                                label={`Question ${index + 1}: ${q}`}
                                name={`confidence-${index}`}
                                rows={3}
                                placeholder="Your thoughts here..."
                                value={confidenceAnswers[index]}
                                onChange={(e) => handleConfidenceChange(index, e.target.value)}
                            />
                        ))}
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <FormSelect 
                    label="Interview Type" 
                    name="interviewType" 
                    value={interviewType} 
                    onChange={(e) => setInterviewType(e.target.value)}
                >
                    <option>Technical</option>
                    <option>Behavioral/Managerial</option>
                    <option>HR</option>
                    <option>Combined</option>
                </FormSelect>
                <div>
                    <label className="block mb-3 text-base font-medium text-gray-300">Choose Practice Type</label>
                    <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 bg-slate-900/50 p-1.5 rounded-xl">
                        <OptionButton option="topic" label="By Topic Name" />
                        <OptionButton option="list" label="By List of Questions" />
                        <OptionButton option="confidence" label="Build Confidence" />
                    </div>
                </div>

                <div className="pt-2">
                    {renderFormContent()}
                </div>

                <div className="pt-4">
                    <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-500 transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed" disabled={isButtonDisabled()}>
                        Start Practice
                    </button>
                </div>
            </form>
        </div>
    );
};

export default PracticeModeForm;