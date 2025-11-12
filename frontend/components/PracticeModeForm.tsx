import React, { useState, useRef } from 'react';

type PracticeOption = 'topic' | 'list' | 'confidence' | 'fluency';

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

const FormToggle: React.FC<{ label: string; description: string; name: string; checked: boolean; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; }> = ({ label, description, name, checked, onChange }) => (
    <div className="flex items-center justify-between p-4 rounded-lg bg-slate-800 border border-slate-700">
        <div>
            <label htmlFor={name} className="font-medium text-white">{label}</label>
            <p className="text-sm text-gray-400">{description}</p>
        </div>
        <label className="relative inline-flex items-center cursor-pointer">
            <input type="checkbox" name={name} id={name} checked={checked} onChange={onChange} className="sr-only peer" />
            <div className="w-11 h-6 bg-slate-600 peer-focus:outline-none peer-focus:ring-2 peer-focus:ring-primary/50 rounded-full peer peer-checked:after:translate-x-full after:content-[''] after:absolute after:top-[2px] after:left-[2px] after:bg-white after:border-gray-300 after:border after:rounded-full after:h-5 after:w-5 after:transition-all peer-checked:bg-primary"></div>
        </label>
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
        if (initialData.practiceType === 'Fluency Practice') return 'fluency';
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
    const [candidateName, setCandidateName] = useState(initialData?.candidateName || '');
    const [interviewType, setInterviewType] = useState(initialData?.interviewType || 'Technical');
    const [topicName, setTopicName] = useState(initialData?.practiceType === 'By Topic Name' ? initialData.topicName : '');
    const [questionList, setQuestionList] = useState(initialData?.practiceType === 'By List of Questions' ? initialData.questionList : '');
    const [confidenceAnswers, setConfidenceAnswers] = useState<Record<number, string>>(getInitialConfidenceAnswers());
    const [needsReport, setNeedsReport] = useState(initialData?.needsReport ?? true);
    
    const [qaPairs, setQaPairs] = useState(
        initialData?.practiceType === 'Fluency Practice' ? initialData.qaPairs.map((p: any, i: number) => ({ ...p, id: i + 1 })) : [{ id: 1, question: '', answer: '' }]
    );
    const nextId = useRef(qaPairs.length + 2);

    const handleAddQaPair = () => {
        setQaPairs(prev => [...prev, { id: nextId.current++, question: '', answer: '' }]);
    };

    const handleRemoveQaPair = (id: number) => {
        setQaPairs(prev => prev.filter(pair => pair.id !== id));
    };

    const handleQaChange = (id: number, field: 'question' | 'answer', value: string) => {
        setQaPairs(prev => prev.map(pair => pair.id === id ? { ...pair, [field]: value } : pair));
    };

    const handleConfidenceChange = (index: number, value: string) => {
        setConfidenceAnswers(prev => ({...prev, [index]: value}));
    };

    const isButtonDisabled = () => {
        if (!candidateName.trim()) {
            return true;
        }
        switch (practiceOption) {
            case 'topic':
                return !topicName.trim();
            case 'list':
                return !questionList.trim();
            case 'confidence':
                return Object.values(confidenceAnswers).some((answer: string) => !answer.trim());
            case 'fluency':
                return qaPairs.length === 0 || qaPairs.some(pair => !pair.question.trim() || !pair.answer.trim());
            default:
                return true;
        }
    };
    
    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        
        let practiceTypeLabel = 'Build Confidence';
        switch (practiceOption) {
            case 'topic': practiceTypeLabel = 'By Topic Name'; break;
            case 'list': practiceTypeLabel = 'By List of Questions'; break;
            case 'fluency': practiceTypeLabel = 'Fluency Practice'; break;
        }

        const baseData = {
            candidateName,
            type: 'Practice Mode',
            interviewType,
            practiceType: practiceTypeLabel,
            needsReport,
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
            case 'fluency':
                practiceData = { qaPairs: qaPairs.map(({ question, answer }) => ({ question, answer })) };
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
                        required
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
                        required
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
                                required
                            />
                        ))}
                    </div>
                );
            case 'fluency':
                return (
                    <div className="space-y-6">
                        <p className="text-sm text-gray-400">Add questions and your ideal answers. The AI coach will help you practice delivering them fluently.</p>
                        {qaPairs.map((pair, index) => (
                            <div key={pair.id} className="p-4 bg-slate-900/50 rounded-lg border border-slate-700 relative space-y-4">
                                {qaPairs.length > 1 && (
                                    <button type="button" onClick={() => handleRemoveQaPair(pair.id)} className="absolute -top-2 -right-2 w-7 h-7 bg-red-600 rounded-full text-white hover:bg-red-500 transition-colors flex items-center justify-center z-10">
                                        &times;
                                    </button>
                                )}
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
                                    label={`Your Target Answer ${index + 1}`}
                                    name={`answer-${pair.id}`}
                                    rows={5}
                                    placeholder="Write the key points you want to cover..."
                                    value={pair.answer}
                                    onChange={(e) => handleQaChange(pair.id, 'answer', e.target.value)}
                                    required
                                />
                            </div>
                        ))}
                        <button type="button" onClick={handleAddQaPair} className="w-full text-primary font-semibold py-2 px-4 rounded-lg border-2 border-dashed border-primary/50 hover:bg-primary/10 transition-colors">
                            + Add Another Question
                        </button>
                    </div>
                );
            default:
                return null;
        }
    }

    return (
        <div className="p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
                <FormInput
                    label="Candidate Name"
                    name="candidateName"
                    type="text"
                    placeholder="e.g., Jane Doe"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    required
                />
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
                        <OptionButton option="fluency" label="Fluency Practice" />
                    </div>
                </div>

                <div className="pt-2">
                    {renderFormContent()}
                </div>
                
                <FormToggle
                    label="Auto-generate Report"
                    description="Automatically generate a detailed report after the interview."
                    name="needsReport"
                    checked={needsReport}
                    onChange={(e) => setNeedsReport(e.target.checked)}
                />

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
