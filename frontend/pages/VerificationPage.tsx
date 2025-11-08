import React from 'react';

interface VerificationPageProps {
    setupData: any;
    onEdit: () => void;
    onConfirm: () => void;
}

const DetailItem: React.FC<{ label: string; value?: string | number }> = ({ label, value }) => (
    <div className="py-3 sm:grid sm:grid-cols-3 sm:gap-4">
        <dt className="text-sm font-medium text-gray-400">{label}</dt>
        <dd className="mt-1 text-sm text-white sm:mt-0 sm:col-span-2">{value || '-'}</dd>
    </div>
);

const capitalize = (s: string) => s.charAt(0).toUpperCase() + s.slice(1);

const VerificationPage: React.FC<VerificationPageProps> = ({ setupData, onEdit, onConfirm }) => {

    if (!setupData) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <p className="text-white">Loading verification details...</p>
            </div>
        );
    }
    
    const { type, ...details } = setupData;

    const handleConfirm = () => {
        onConfirm();
    };

    const renderDetails = () => {
        if (type === 'Practice Mode') {
             if (details.practiceType === 'By List of Questions') {
                return (
                     <>
                        <DetailItem label="Practice Type" value={details.practiceType} />
                        <div className="py-3">
                             <dt className="text-sm font-medium text-gray-400">Questions</dt>
                             <dd className="mt-1 text-sm text-white whitespace-pre-wrap bg-slate-900/50 p-3 rounded-md">{details.questionList}</dd>
                        </div>
                     </>
                )
             }
             if (details.practiceType === 'Build Confidence') {
                 return (
                    <>
                        <DetailItem label="Practice Type" value={details.practiceType} />
                         <div className="py-3 space-y-4">
                            <dt className="text-sm font-medium text-gray-400">Your Reflections</dt>
                            {details.confidenceAnswers.map((item: {question: string, answer: string}, index: number) => (
                                <div key={index}>
                                    <p className="font-semibold text-gray-300">{item.question}</p>
                                    <dd className="mt-1 text-sm text-white whitespace-pre-wrap bg-slate-900/50 p-3 rounded-md">{item.answer}</dd>
                                </div>
                            ))}
                        </div>
                    </>
                 )
             }
             return <DetailItem label="Topic Name" value={details.topicName} />
        }

        // For Manual Entry and By Resume
        return Object.entries(details).map(([key, value]) => (
            <DetailItem key={key} label={key.split(/(?=[A-Z])/).map(capitalize).join(' ')} value={value as string} />
        ));
    };

    return (
        <section className="py-16 md:py-24">
            <div className="container mx-auto px-6">
                <div className="max-w-2xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white">Please Verify</h1>
                        <p className="mt-4 text-lg text-gray-400">Confirm your session details before starting.</p>
                    </div>

                    <div className="bg-slate-800/50 rounded-lg border border-slate-700 shadow-lg">
                        <div className="px-4 py-5 sm:px-6">
                            <h3 className="text-lg leading-6 font-medium text-white">
                                {type} Configuration
                            </h3>
                            <p className="mt-1 max-w-2xl text-sm text-gray-400">
                                Review your selected options below.
                            </p>
                        </div>
                        <div className="border-t border-slate-700 px-4 py-5 sm:p-0">
                            <dl className="sm:divide-y sm:divide-slate-700 px-6">
                                {renderDetails()}
                            </dl>
                        </div>
                    </div>

                    <div className="mt-8 flex justify-between gap-4">
                        <button 
                            onClick={onEdit}
                            className="w-full bg-slate-700 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-slate-600 transition-transform transform hover:scale-105 duration-300"
                        >
                           Edit
                        </button>
                         <button 
                            onClick={handleConfirm}
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