import React from 'react';
import { UserIcon } from '../icons/UserIcon';
import { BriefcaseIcon } from '../icons/BriefcaseIcon';
import { ClockIcon } from '../icons/ClockIcon';
import { FileTextIcon } from '../icons/FileTextIcon';
import { BuildingIcon } from '../icons/BuildingIcon';
import { BarChartIcon } from '../icons/BarChartIcon';
import { UsersIcon } from '../icons/UsersIcon';
import { ClipboardListIcon } from '../icons/ClipboardListIcon';
import { CodeIcon } from '../icons/CodeIcon';
import { CheckCircleIcon } from '../icons/CheckCircleIcon';
import { XCircleIcon } from '../icons/XCircleIcon';

interface VerificationPageProps {
    setupData: any;
    onEdit: () => void;
    onConfirm: () => void;
}

// A more visually appealing component for displaying individual details.
const DetailItem: React.FC<{ icon: React.ReactNode; label: string; value?: string | number | null }> = ({ icon, label, value }) => (
    <div className="flex items-start gap-4 p-4 rounded-lg bg-slate-800/50">
        <div className="flex-shrink-0 text-primary w-6 h-6">{icon}</div>
        <div>
            <p className="text-sm font-medium text-gray-400">{label}</p>
            <p className="text-base font-semibold text-white break-words">{value || 'Not specified'}</p>
        </div>
    </div>
);

// A card component to group related details together.
const InfoCard: React.FC<{ title: string; children: React.ReactNode }> = ({ title, children }) => (
    <div className="mb-8">
        <h4 className="text-lg font-semibold text-primary mb-4">{title}</h4>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {children}
        </div>
    </div>
);

// A component for displaying full-width text content like topics or questions.
const FullWidthInfo: React.FC<{ icon: React.ReactNode; label: string; children: React.ReactNode }> = ({ icon, label, children }) => (
    <div className="mb-6">
        <div className="flex items-center gap-3 text-lg font-semibold text-primary mb-4">
            {icon}
            <h4>{label}</h4>
        </div>
        <div className="p-4 rounded-lg bg-slate-800/50 text-gray-300">
            {children}
        </div>
    </div>
);


const VerificationPage: React.FC<VerificationPageProps> = ({ setupData, onEdit, onConfirm }) => {

    if (!setupData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-white">Loading verification details...</p>
            </div>
        );
    }
    
    const { type, ...details } = setupData;

    const renderStandardDetails = () => (
        <>
            {type === 'By Resume' && details.fileName && (
                <FullWidthInfo icon={<FileTextIcon className="w-6 h-6"/>} label="Uploaded Resume">
                    <p className="font-mono text-white">{details.fileName} ({details.fileSize})</p>
                </FullWidthInfo>
            )}

            <InfoCard title="Candidate Profile">
                <DetailItem icon={<UserIcon />} label="Candidate Name" value={details.candidateName} />
                <DetailItem icon={<BriefcaseIcon />} label="Role / Job Title" value={details.role} />
                <DetailItem icon={<BarChartIcon />} label="Years of Experience" value={details.experience} />
                <DetailItem icon={<BuildingIcon />} label="Target Company" value={details.targetCompany} />
            </InfoCard>

            <InfoCard title="Interview Settings">
                 <DetailItem icon={<ClipboardListIcon />} label="Interview Type" value={details.interviewType} />
                 <DetailItem icon={<ClockIcon />} label="Duration" value={details.duration} />
                 <DetailItem icon={<UsersIcon />} label="Interviewer Persona" value={details.persona} />
                 {(details.interviewType === 'Technical' || details.interviewType === 'Combined') && (
                     <>
                        <DetailItem icon={<BarChartIcon />} label="Difficulty Level" value={details.difficulty} />
                        <DetailItem icon={<CodeIcon />} label="Coding Language" value={details.language} />
                     </>
                 )}
                <DetailItem 
                    icon={details.needsReport ? <CheckCircleIcon className="w-6 h-6" /> : <XCircleIcon className="w-6 h-6" />} 
                    label="Auto-generate Report" 
                    value={details.needsReport ? 'Enabled' : 'Disabled'} 
                />
                 <DetailItem 
                    icon={details.recordSession ? <CheckCircleIcon className="w-6 h-6" /> : <XCircleIcon className="w-6 h-6" />} 
                    label="Record Session" 
                    value={details.recordSession ? 'Enabled' : 'Disabled'} 
                />
            </InfoCard>

            {details.topics && (
                 <FullWidthInfo icon={<FileTextIcon className="w-6 h-6"/>} label="Main Topics to Cover">
                    <p className="text-white">{details.topics}</p>
                 </FullWidthInfo>
            )}
        </>
    );

    const renderPracticeDetails = () => (
        <>
            <InfoCard title="Session Settings">
                <DetailItem icon={<ClipboardListIcon />} label="Interview Type" value={details.interviewType} />
                <DetailItem icon={<ClipboardListIcon />} label="Practice Type" value={details.practiceType} />
                <DetailItem 
                    icon={details.needsReport ? <CheckCircleIcon className="w-6 h-6" /> : <XCircleIcon className="w-6 h-6" />} 
                    label="Auto-generate Report" 
                    value={details.needsReport ? 'Enabled' : 'Disabled'} 
                />
                 <DetailItem 
                    icon={details.recordSession ? <CheckCircleIcon className="w-6 h-6" /> : <XCircleIcon className="w-6 h-6" />} 
                    label="Record Session" 
                    value={details.recordSession ? 'Enabled' : 'Disabled'} 
                />
            </InfoCard>

            {details.practiceType === 'By Topic Name' && (
                 <FullWidthInfo icon={<FileTextIcon className="w-6 h-6"/>} label="Topic(s) for Practice">
                    <p className="text-white">{details.topicName}</p>
                 </FullWidthInfo>
            )}

            {details.practiceType === 'By List of Questions' && (
                <FullWidthInfo icon={<FileTextIcon className="w-6 h-6"/>} label="Your Custom Questions">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{details.questionList}</pre>
                </FullWidthInfo>
            )}

            {details.practiceType === 'By Notes' && (
                <FullWidthInfo icon={<FileTextIcon className="w-6 h-6"/>} label="Your Notes for Analysis">
                    <pre className="whitespace-pre-wrap font-sans text-sm">{details.notesContent}</pre>
                </FullWidthInfo>
            )}

            {details.practiceType === 'Build Confidence' && (
                <FullWidthInfo icon={<FileTextIcon className="w-6 h-6"/>} label="Your Reflections for Confidence Building">
                    <div className="space-y-4">
                        {details.confidenceAnswers.map((item: { question: string; answer: string }, index: number) => (
                            <div key={index} className="border-t border-slate-700 pt-3 first:border-t-0 first:pt-0">
                                <p className="font-semibold text-gray-300">{item.question}</p>
                                <p className="mt-1 text-sm text-white italic pl-2 border-l-2 border-primary/50">"{item.answer}"</p>
                            </div>
                        ))}
                    </div>
                </FullWidthInfo>
            )}

            {details.practiceType === 'Fluency Practice' && (
                <FullWidthInfo icon={<FileTextIcon className="w-6 h-6"/>} label="Your Q&A for Fluency Practice">
                    <div className="space-y-4">
                        {details.qaPairs.map((item: { question: string; answer: string }, index: number) => (
                            <div key={index} className="border-t border-slate-700 pt-3 first:border-t-0 first:pt-0">
                                <p className="font-semibold text-gray-300">{index + 1}. {item.question}</p>
                                <p className="mt-1 text-sm text-white italic pl-2 border-l-2 border-primary/50">"{item.answer}"</p>
                            </div>
                        ))}
                    </div>
                </FullWidthInfo>
            )}
        </>
    );

    return (
        <section className="min-h-screen py-16 md:py-24 bg-dark relative overflow-hidden animate-fade-in-up">
            <div className="absolute inset-0 bg-grid-slate-800/[0.1] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
            <div className="container mx-auto px-6 relative z-10">
                <div className="max-w-5xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white">Final Confirmation</h1>
                        <p className="mt-4 text-lg text-gray-400">Please review your session details below.</p>
                    </div>

                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl shadow-2xl shadow-black/20 backdrop-blur-lg">
                        <div className="p-6 md:p-8">
                            <h3 className="text-xl leading-6 font-bold text-white mb-6">
                                {type} Configuration
                            </h3>
                            {type === 'Practice Mode' ? renderPracticeDetails() : renderStandardDetails()}
                        </div>
                    </div>

                    <div className="mt-8 grid grid-cols-1 sm:grid-cols-2 gap-4">
                        <button 
                            onClick={onEdit}
                            className="w-full bg-slate-700 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-slate-600 transition-transform transform hover:scale-105 duration-300"
                        >
                           Edit Details
                        </button>
                         <button 
                            onClick={onConfirm}
                            className="w-full bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-500 transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-primary/20"
                        >
                            Confirm & Start
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default VerificationPage;