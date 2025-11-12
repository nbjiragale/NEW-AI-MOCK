import React, { useState, useRef } from 'react';
import { TagIcon } from '../icons/TagIcon';
import { ListIcon } from '../icons/ListIcon';
import { ShieldIcon } from '../icons/ShieldIcon';
import { SpeechBubbleIcon } from '../icons/SpeechBubbleIcon';

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
    const [recordSession, setRecordSession] = useState(initialData?.recordSession ?? true);
    
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
            recordSession,
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

    const practiceOptionsConfig = [
        { id: 'topic', icon: <TagIcon className="h-6 w-6" />, title: "By Topic", description: "Focus on a specific subject like 'React Hooks'." },
        { id: 'list', icon: <ListIcon className="h-6 w-6" />, title: "By Questions", description: "Paste your own list of questions to practice." },
        { id: 'confidence', icon: <ShieldIcon className="h-6 w-6" />, title: "Build Confidence", description: "AI coach asks questions based on your weak areas." },
        { id: 'fluency', icon: <SpeechBubbleIcon className="h-6 w-6" />, title: "Fluency Practice", description: "Practice delivering your pre-written answers." },
    ];

    const OptionCard: React.FC<{
        option: PracticeOption;
        icon: React.ReactNode;
        title: string;
        description: string;
    }> = ({ option, icon, title, description }) => (
        <label
            htmlFor={`practice-option-${option}`}
            className={`
                p-4 border-2 rounded-lg cursor-pointer transition-all duration-300
                flex items-center gap-4
                ${practiceOption === option
                    ? 'bg-slate-700/50 border-primary shadow-lg shadow-primary/10'
                    : 'bg-slate-800/50 border-slate-700 hover:border-slate-500'
                }
            `}
        >
            <input
                type="radio"
                id={`practice-option-${option}`}
                name="practiceOption"
                value={option}
                checked={practiceOption === option}
                onChange={() => setPracticeOption(option)}
                className="sr-only peer"
            />
            <div className="text-primary">{icon}</div>
            <div>
                <h4 className="font-semibold text-white">{title}</h4>
                <p className="text-sm text-gray-400">{description}</p>
            </div>
        </label>
    );

    const renderContent = () => {
        switch (practiceOption) {
            case 'topic':
                return (
                    <FormInput
                        label="Topic Name"
                        name="topicName"
                        type="text"
                        placeholder="e.g., React Hooks, SQL Joins"
                        value={topicName}
                        onChange={(e) => setTopicName(e.target.value)}
                        required
                    />
                );
            case 'list':
                return (
                    <FormTextarea
                        label="Your Question List"
                        name="questionList"
                        placeholder="Paste one question per line..."
                        rows={6}
                        value={questionList}
                        onChange={(e) => setQuestionList(e.target.value)}
                        required
                    />
                );
            case 'confidence':
                return (
                    <div className="space-y-6">
                        <p className="text-gray-300">Answer these questions honestly to help the AI tailor the session to build your confidence.</p>
                        {confidenceQuestions.map((q, index) => (
                            <FormTextarea
                                key={index}
                                label={q}
                                name={`confidence-answer-${index}`}
                                placeholder="Your reflection here..."
                                value={confidenceAnswers[index] || ''}
                                onChange={(e) => handleConfidenceChange(index, e.target.value)}
                                required
                            />
                        ))}
                    </div>
                );
            case 'fluency':
                 return (
                    <div className="space-y-6">
                        <p className="text-gray-300">Enter the questions and your ideal answers. The AI will coach you on delivering them fluently.</p>
                        {qaPairs.map((pair, index) => (
                            <div key={pair.id} className="p-4 bg-slate-800/50 rounded-lg border border-slate-700 relative">
                                {qaPairs.length > 1 && (
                                    <button
                                        type="button"
                                        onClick={() => handleRemoveQaPair(pair.id)}
                                        className="absolute top-2 right-2 text-gray-500 hover:text-red-400"
                                        aria-label="Remove Q&A pair"
                                    >
                                        &times;
                                    </button>
                                )}
                                <div className="space-y-4">
                                    <FormInput
                                        label={`Question ${index + 1}`}
                                        name={`q-${pair.id}`}
                                        type="text"
                                        placeholder="Enter the question"
                                        value={pair.question}
                                        onChange={(e) => handleQaChange(pair.id, 'question', e.target.value)}
                                        required
                                    />
                                    <FormTextarea
                                        label={`Your Ideal Answer ${index + 1}`}
                                        name={`a-${pair.id}`}
                                        placeholder="Write the answer you want to practice"
                                        value={pair.answer}
                                        onChange={(e) => handleQaChange(pair.id, 'answer', e.target.value)}
                                        required
                                    />
                                </div>
                            </div>
                        ))}
                        <button
                            type="button"
                            onClick={handleAddQaPair}
                            className="w-full text-center py-2 border-2 border-dashed border-slate-600 rounded-lg text-gray-400 hover:border-primary hover:text-primary transition"
                        >
                            + Add Another Q&A Pair
                        </button>
                    </div>
                );
            default:
                return null;
        }
    };
    return (
        <form onSubmit={handleSubmit} className="space-y-10">
            <div>
                <FormInput
                    label="Your Name"
                    name="candidateName"
                    type="text"
                    placeholder="e.g., John Smith"
                    value={candidateName}
                    onChange={(e) => setCandidateName(e.target.value)}
                    required
                />
            </div>

            <div>
                <label className="block mb-4 text-base font-medium text-gray-300">Choose Your Practice Mode</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    {practiceOptionsConfig.map(opt => (
                        <OptionCard
                            key={opt.id}
                            option={opt.id as PracticeOption}
                            icon={opt.icon}
                            title={opt.title}
                            description={opt.description}
                        />
                    ))}
                </div>
            </div>
            
            <div key={practiceOption} className="animate-fade-in-up" style={{ animationDuration: '0.5s' }}>
                {renderContent()}
            </div>
            
             <div>
                 <FormSelect label="Focus Area" name="interviewType" value={interviewType} onChange={(e) => setInterviewType(e.target.value)}>
                    <option>Technical</option>
                    <option>Behavioral/Managerial</option>
                    <option>HR</option>
                </FormSelect>
             </div>

            <div className="space-y-6">
                <h3 className="text-lg font-semibold text-primary border-b border-slate-700 pb-3 mb-6">Preferences</h3>
                <div className="space-y-4">
                    <FormToggle
                        label="Generate Performance Report"
                        description="Receive a detailed feedback report after your interview."
                        name="needsReport"
                        checked={needsReport}
                        onChange={(e) => setNeedsReport(e.target.checked)}
                    />
                    <FormToggle
                        label="Record Interview Session"
                        description="Enable camera recording for feedback on body language and non-verbal cues."
                        name="recordSession"
                        checked={recordSession}
                        onChange={(e) => setRecordSession(e.target.checked)}
                    />
                </div>
            </div>

            <div className="pt-4">
                <button type="submit" disabled={isButtonDisabled()} className="w-full bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-500 transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed">
                    Confirm & Proceed
                </button>
            </div>
        </form>
    );
};

export default PracticeModeForm;
