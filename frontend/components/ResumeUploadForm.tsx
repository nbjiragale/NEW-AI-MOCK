import React, { useState, useRef } from 'react';
import { analyzeResume } from '../services/geminiForResumeAnalysis';

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
        />
    </div>
);

interface ResumeUploadFormProps {
    initialData?: any;
    onSubmit: (data: any) => void;
}

const ResumeUploadForm: React.FC<ResumeUploadFormProps> = ({ initialData, onSubmit }) => {
    const [file, setFile] = useState<File | null>(null);
    const [isDragging, setIsDragging] = useState(false);
    const fileInputRef = useRef<HTMLInputElement>(null);
    const [initialFile, setInitialFile] = useState(initialData ? { name: initialData.fileName, size: initialData.fileSize } : null);
    const [interviewType, setInterviewType] = useState(initialData?.interviewType || 'Technical');
    const [isLoading, setIsLoading] = useState(false);

    const languages = [
        "Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "SQL"
    ];

    const handleFileChange = (e: React.ChangeEvent<HTMLInputElement>) => {
        if (e.target.files && e.target.files[0]) {
            setFile(e.target.files[0]);
            setInitialFile(null); // A new file was selected, clear the old one
        }
    };

    const handleDragOver = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(true);
    };

    const handleDragLeave = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
    };

    const handleDrop = (e: React.DragEvent<HTMLDivElement>) => {
        e.preventDefault();
        setIsDragging(false);
        if (e.dataTransfer.files && e.dataTransfer.files[0]) {
            setFile(e.dataTransfer.files[0]);
            setInitialFile(null); // A new file was dropped, clear the old one
        }
    };

    const triggerFileSelect = () => {
        fileInputRef.current?.click();
    };
    
    const removeFile = () => {
        setFile(null);
        setInitialFile(null);
        if(fileInputRef.current) {
            fileInputRef.current.value = "";
        }
    }

    const handleSubmit = async (e: React.FormEvent<HTMLFormElement>) => {
        e.preventDefault();
        const form = e.currentTarget; // Store the form element before any async calls

        if (!file) {
            alert("Please upload a resume file to analyze.");
            return;
        };

        setIsLoading(true);

        try {
            const analysisResult = await analyzeResume(file);
            
            const formData = new FormData(form); // Use the stored form element
            const otherData = Object.fromEntries(formData.entries());
            
            const userTopics = otherData.topics as string;
            const aiTopics = analysisResult.skills.join(', ');

            const combinedData = {
                type: 'By Resume',
                fileName: file.name,
                fileSize: `${(file.size / 1024).toFixed(2)} KB`,
                // Form selections
                ...otherData,
                // AI Extracted details, which will override any form fields with the same name if they existed
                candidateName: analysisResult.candidateName,
                experience: analysisResult.yearsOfExperience,
                role: analysisResult.role,
                topics: userTopics && userTopics.trim() ? userTopics : aiTopics,
            };

            onSubmit(combinedData);

        } catch (error) {
            console.error("Error analyzing resume:", error);
            alert("Sorry, we couldn't analyze your resume. Please check the file format (PDF, DOCX, TXT) or try again.");
        } finally {
            setIsLoading(false);
        }
    };

    const displayFile = file || initialFile;
    const canSubmit = !!file; // Can only submit if a new file is staged for upload.

    return (
        <div className="relative p-6 md:p-8">
            {isLoading && (
                <div className="absolute inset-0 bg-dark/80 backdrop-blur-sm flex flex-col items-center justify-center z-10 rounded-lg">
                    <svg className="animate-spin h-8 w-8 text-primary mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <p className="text-white text-lg font-semibold">Analyzing Resume...</p>
                    <p className="text-gray-400">Please wait, we are extracting the details.</p>
                </div>
            )}
            <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                    <label className="block mb-2 text-sm font-medium text-gray-300">Upload Resume</label>
                    <div
                        onDragOver={handleDragOver}
                        onDragLeave={handleDragLeave}
                        onDrop={handleDrop}
                        onClick={triggerFileSelect}
                        className={`flex justify-center items-center w-full h-48 px-6 transition bg-slate-800 border-2 border-slate-700 border-dashed rounded-lg cursor-pointer hover:border-primary ${isDragging ? 'border-primary' : ''}`}
                    >
                        <input
                            ref={fileInputRef}
                            type="file"
                            className="hidden"
                            accept=".pdf,.doc,.docx,.txt"
                            onChange={handleFileChange}
                            disabled={isLoading}
                        />
                        {displayFile ? (
                             <div className="text-center">
                                 <svg xmlns="http://www.w3.org/2000/svg" className={`mx-auto h-10 w-10 ${file ? 'text-green-500' : 'text-primary'}`} fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                     <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
                                 </svg>
                                 <p className="mt-2 text-sm text-white">{displayFile.name}</p>
                                 <p className="text-xs text-gray-400">({typeof displayFile.size === 'number' ? (displayFile.size / 1024).toFixed(2) + ' KB' : displayFile.size})</p>
                                 {initialFile && !file && <p className="text-xs text-yellow-400 mt-2">Please re-upload this file to continue.</p>}
                                 <button
                                     type="button"
                                     onClick={(e) => { e.stopPropagation(); removeFile(); }}
                                     className="mt-2 text-xs text-red-500 hover:text-red-400"
                                     disabled={isLoading}
                                 >
                                     Remove file
                                 </button>
                             </div>
                        ) : (
                            <div className="text-center">
                                <svg xmlns="http://www.w3.org/2000/svg" className="mx-auto h-12 w-12 text-gray-500" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                                </svg>
                                <p className="mt-2 text-sm text-gray-400"><span className="font-semibold text-primary">Click to upload</span> or drag and drop</p>
                                <p className="text-xs text-gray-500">PDF, DOC, DOCX, or TXT</p>
                            </div>
                        )}
                    </div>
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
                
                 <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                    <FormSelect label="Duration" name="duration" defaultValue={initialData?.duration}>
                        <option>15 Minutes</option>
                        <option>30 Minutes</option>
                        <option>45 Minutes</option>
                        <option>60 Minutes</option>
                    </FormSelect>
                    {(interviewType === 'Technical' || interviewType === 'Combined') && (
                        <FormSelect label="Difficulty Level" name="difficulty" defaultValue={initialData?.difficulty}>
                            <option>Junior</option>
                            <option>Mid-level</option>
                            <option>Senior</option>
                        </FormSelect>
                    )}
                </div>
                
                {(interviewType === 'Technical' || interviewType === 'Combined') && (
                    <>
                         <FormInput label="Main Topics to Focus On (Optional, AI will suggest from resume)" name="topics" type="text" placeholder="e.g., System Design, Behavioral" defaultValue={initialData?.topics}/>
                         <FormSelect label="Coding Language Preference" name="language" defaultValue={initialData?.language}>
                            <option value="">Select a language</option>
                            {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                            <option value="Not Applicable">Not applicable</option>
                            <option value="Other">Other</option>
                        </FormSelect>
                    </>
                )}
                
                <FormInput label="Target Company(Optional)" name="targetCompany" type="text" placeholder="e.g., TCS, Google, KPMG" defaultValue={initialData?.targetCompany}/>

                <div className="pt-4">
                    <button type="submit" className="w-full bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-500 transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-primary/20 disabled:opacity-50 disabled:cursor-not-allowed" disabled={!canSubmit || isLoading}>
                        {isLoading ? 'Analyzing...' : 'Analyze & Start Interview'}
                    </button>
                </div>
            </form>
        </div>
    );
};

export default ResumeUploadForm;
