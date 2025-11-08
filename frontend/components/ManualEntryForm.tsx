import React, { useState } from 'react';

const FormInput: React.FC<{ label: string; type: string; placeholder: string; name: string; defaultValue?: string }> = ({ label, type, placeholder, name, defaultValue }) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-300">{label}</label>
        <input
            type={type}
            name={name}
            id={name}
            defaultValue={defaultValue || ''}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition"
            placeholder={placeholder}
            required
        />
    </div>
);

const FormSelect: React.FC<{ label: string; name: string; children: React.ReactNode; defaultValue?: string; value?: string; onChange?: (e: React.ChangeEvent<HTMLSelectElement>) => void }> = ({ label, name, children, defaultValue, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-sm font-medium text-gray-300">{label}</label>
        <select
            id={name}
            name={name}
            defaultValue={defaultValue}
            value={value}
            onChange={onChange}
            className="bg-slate-800 border border-slate-700 text-white text-sm rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5"
        >
            {children}
        </select>
    </div>
);

interface ManualEntryFormProps {
    initialData?: any;
    onSubmit: (data: any) => void;
}

const ManualEntryForm: React.FC<ManualEntryFormProps> = ({ initialData, onSubmit }) => {
    const [interviewType, setInterviewType] = useState(initialData?.interviewType || 'Technical');

    const languages = [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "SQL"
    ];

    const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const formData = new FormData(e.currentTarget);
        const data = Object.fromEntries(formData.entries());
        data.type = 'Manual Entry';
        onSubmit(data);
    };

    return (
        <div className="p-8 bg-slate-800/50 rounded-b-lg rounded-r-lg border border-slate-700 border-t-0">
            <form onSubmit={handleSubmit} className="space-y-6">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="Candidate Name" name="candidateName" type="text" placeholder="e.g., Jane Doe" defaultValue={initialData?.candidateName} />
                    <FormInput label="Years of Experience" name="experience" type="number" placeholder="e.g., 5" defaultValue={initialData?.experience} />
                </div>
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormInput label="Role / Job Title" name="role" type="text" placeholder="e.g., Senior Software Engineer" defaultValue={initialData?.role} />
                    <FormSelect label="Duration" name="duration" defaultValue={initialData?.duration}>
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
                    <FormSelect label="Interviewer Persona / Style" name="persona" defaultValue={initialData?.persona}>
                        <option>Friendly</option>
                        <option>Strict</option>
                        <option>Mentor</option>
                        <option>HR-style</option>
                    </FormSelect>
                </div>
                
                {(interviewType === 'Technical' || interviewType === 'Combined') && (
                    <>
                        <FormSelect label="Difficulty Level" name="difficulty" defaultValue={initialData?.difficulty}>
                            <option>Junior</option>
                            <option>Mid-level</option>
                            <option>Senior</option>
                        </FormSelect>
                        <FormInput label="Main Topics to Focus On" name="topics" type="text" placeholder="e.g., DSA, System Design, Behavioral" defaultValue={initialData?.topics} />
                        <FormSelect label="Coding Language Preference" name="language" defaultValue={initialData?.language}>
                            <option value="">Select a language</option>
                            {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            <option value="Not Applicable">Not applicable</option>
                            <option value="Other">Other</option>
                        </FormSelect>
                    </>
                )}

                <FormInput label="Target Company / Interview Style" name="targetCompany" type="text" placeholder="e.g., FAANG, Startup, Service-based" defaultValue={initialData?.targetCompany}/>

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