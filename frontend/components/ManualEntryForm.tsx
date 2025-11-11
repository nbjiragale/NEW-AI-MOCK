import React, { useState } from 'react';
import { generateTopicsForRole } from '../services/geminiStartInterview';
import { SparkleIcon } from '../icons/SparkleIcon';

const SpinnerIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin text-white ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);


const FormInput: React.FC<{ 
    label: string; 
    type: string; 
    placeholder: string; 
    name: string; 
    value: string; 
    onChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
    required?: boolean;
}> = ({ label, type, placeholder, name, value, onChange, required = false }) => (
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

const FormSelect: React.FC<{ label: string; name: string; children: React.ReactNode; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, name, children, value, onChange }) => (
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

interface ManualEntryFormProps {
    initialData?: any;
    onSubmit: (data: any) => void;
    profileData?: any;
}

const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ initialData, onSubmit, profileData }) => {
    const [candidateName, setCandidateName] = useState(initialData?.candidateName || '');
    const [experience, setExperience] = useState(initialData?.experience || '');
    const [role, setRole] = useState(initialData?.role || '');
    const [duration, setDuration] = useState(initialData?.duration || '15 Minutes');
    const [interviewType, setInterviewType] = useState(initialData?.interviewType || 'Technical');
    const [persona, setPersona] = useState(initialData?.persona || 'Friendly');
    const [difficulty, setDifficulty] = useState(initialData?.difficulty || 'Junior');
    const [topics, setTopics] = useState(initialData?.topics || '');
    const [language, setLanguage] = useState(initialData?.language || '');
    const [targetCompany, setTargetCompany] = useState(initialData?.targetCompany || '');
    const [isGenerating, setIsGenerating] = useState(false);

    const languages = [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "SQL"
    ];

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const data = {
            type: 'Manual Entry',
            candidateName,
            experience,
            role,
            duration,
            interviewType,
            persona,
            difficulty,
            topics,
            language,
            targetCompany,
        };
        onSubmit(data);
    };

    const handleAutofill = () => {
      if (profileData) {
        setCandidateName(profileData.candidateName || candidateName);
        setExperience(profileData.experience || experience);
        setRole(profileData.role || role);
        setTopics(profileData.topics || topics);
        setLanguage(profileData.language || language);
        setTargetCompany(profileData.targetCompany || targetCompany);
      }
    };
    
    const handleGenerateTopics = async () => {
        if (!role.trim()) {
            alert('Please enter a Role / Job Title first to generate topics.');
            return;
        }
        setIsGenerating(true);
        try {
            const generatedTopics = await generateTopicsForRole(role, experience);
            setTopics(generatedTopics);
        } catch (error) {
            console.error('Failed to generate topics:', error);
            alert('Could not generate topics. Please try again or enter them manually.');
        } finally {
            setIsGenerating(false);
        }
    };

    return (
        <div className="p-6 md:p-8">
            <div className="mb-6 text-right">
                <button
                    type="button"
                    onClick={handleAutofill}
                    disabled={!profileData}
                    className="flex items-center gap-2 text-sm text-primary/90 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed group ml-auto"
                >
                    <SparkleIcon className="h-4 w-4 transition-transform group-hover:scale-110" />
                    <span>Autofill from Profile</span>
                </button>
            </div>
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="Candidate Name" name="candidateName" type="text" placeholder="e.g., Jane Doe" value={candidateName} onChange={(e) => setCandidateName(e.target.value)} required />
                    <FormInput label="Years of Experience" name="experience" type="number" placeholder="e.g., 5" value={experience} onChange={(e) => setExperience(e.target.value)} required />
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="Role / Job Title" name="role" type="text" placeholder="e.g., Senior Software Engineer" value={role} onChange={(e) => setRole(e.target.value)} required />
                    <FormSelect label="Duration" name="duration" value={duration} onChange={(e) => setDuration(e.target.value)}>
                        <option>15 Minutes</option>
                        <option>30 Minutes</option>
                        <option>45 Minutes</option>
                        <option>60 Minutes</option>
                    </FormSelect>
                </div>

                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
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
                    <FormSelect label="Interviewer Persona / Style" name="persona" value={persona} onChange={(e) => setPersona(e.target.value)}>
                        <option>Friendly</option>
                        <option>Strict</option>
                        <option>Mentor</option>
                        <option>HR-style</option>
                    </FormSelect>
                </div>
                
                {(interviewType === 'Technical' || interviewType === 'Combined') && (
                    <>
                        <FormSelect label="Difficulty Level" name="difficulty" value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
                            <option>Junior</option>
                            <option>Mid-level</option>
                            <option>Senior</option>
                        </FormSelect>
                        
                        <div>
                            <div className="flex justify-between items-center mb-2">
                                <label htmlFor="topics" className="block text-base font-medium text-gray-300">Main Topics to Focus On</label>
                                <button
                                    type="button"
                                    onClick={handleGenerateTopics}
                                    disabled={isGenerating || !role.trim()}
                                    className="flex items-center gap-1.5 text-sm text-primary/90 hover:text-primary transition-colors disabled:opacity-50 disabled:cursor-not-allowed group"
                                    aria-label="Generate topics based on role"
                                >
                                    {isGenerating ? <SpinnerIcon className="h-4 w-4" /> : <SparkleIcon className="h-4 w-4 transition-transform group-hover:scale-110" />}
                                    <span>autogenerate</span>
                                </button>
                            </div>
                            <textarea
                                name="topics"
                                id="topics"
                                value={topics}
                                onChange={(e) => setTopics(e.target.value)}
                                rows={4}
                                className="bg-slate-800 border border-slate-700 text-white text-base rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition"
                                placeholder="e.g., React Hooks, TypeScript, System Design..."
                                required
                            />
                        </div>
                        
                        <FormSelect label="Coding Language Preference" name="language" value={language} onChange={(e) => setLanguage(e.target.value)}>
                            <option value="">Select a language</option>
                            {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            <option value="Not Applicable">Not applicable</option>
                            <option value="Other">Other</option>
                        </FormSelect>
                    </>
                )}

                <FormInput label="Target Company" name="targetCompany" type="text" placeholder="e.g., TCS, KPMG, Google" value={targetCompany} onChange={(e) => setTargetCompany(e.target.value)} required/>

                <div className="pt-4">
                    <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-500 transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-primary/20">
                        Start Interview
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ManualEntryForm;