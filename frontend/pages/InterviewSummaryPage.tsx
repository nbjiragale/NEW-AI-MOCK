import React from 'react';

const ThumbsUpIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-green-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14 10h4.764a2 2 0 011.789 2.894l-3.5 7A2 2 0 0115.263 21h-4.017c-.163 0-.326-.02-.485-.06L7 18.236V6.764a2 2 0 012-2h4a2 2 0 012 2v4z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 21V9.236" />
    </svg>
);

const ThumbsDownIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-yellow-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 14H5.236a2 2 0 01-1.789-2.894l3.5-7A2 2 0 018.738 3h4.017c.163 0 .326.02.485.06L17 5.764V17.236a2 2 0 01-2 2h-4a2 2 0 01-2-2v-4z" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 3v11.764" />
    </svg>
);

const LightbulbIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-8 w-8 text-blue-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9.663 17h4.673M12 3v1m6.364 1.636l-.707.707M21 12h-1M4 12H3m3.343-5.657l-.707-.707m2.828 9.9a5 5 0 117.072 0l-.548.547A3.374 3.374 0 0014 18.469V19a2 2 0 11-4 0v-.531c0-.895-.356-1.754-.988-2.386l-.548-.547z" />
    </svg>
);

const DownloadIcon = () => (
    <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
    </svg>
);

const RestartIcon = () => (
     <svg xmlns="http://www.w3.org/2000/svg" className="h-5 w-5 mr-2" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 15l-2 5L9 9l-5 5L2 1h14l-2 14z" transform="rotate(-45 12 12)" />
    </svg>
);


const ReportSection: React.FC<{ icon: React.ReactNode; title: string; children: React.ReactNode; }> = ({ icon, title, children }) => (
    <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
        <div className="flex items-center gap-4 mb-4">
            {icon}
            <h3 className="text-xl font-bold text-white">{title}</h3>
        </div>
        <div className="text-gray-300 space-y-2">
            {children}
        </div>
    </div>
);

interface InterviewSummaryPageProps {
    onStartNew: () => void;
}

const InterviewSummaryPage: React.FC<InterviewSummaryPageProps> = ({ onStartNew }) => {
    
    // Placeholder function for downloading PDF
    const handleDownload = () => {
        alert("PDF download functionality is not implemented yet.");
    };

    return (
        <section className="py-16 md:py-24 animate-fade-in-up">
            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white">Interview Report</h1>
                        <p className="mt-4 text-lg text-gray-400">Here's a summary of your performance.</p>
                    </div>

                    <div className="space-y-8">
                        <ReportSection icon={<ThumbsUpIcon />} title="Strengths">
                            <ul className="list-disc list-inside space-y-2">
                                <li><strong>Clear Communication:</strong> You articulated your thoughts clearly and concisely, especially when describing your past projects.</li>
                                <li><strong>Strong Technical Foundation:</strong> Demonstrated a solid understanding of core concepts in data structures and algorithms.</li>
                                <li><strong>Positive Attitude:</strong> Maintained a professional and enthusiastic demeanor throughout the interview.</li>
                            </ul>
                        </ReportSection>

                        <ReportSection icon={<ThumbsDownIcon />} title="Weaknesses">
                             <ul className="list-disc list-inside space-y-2">
                                <li><strong>Answer Structure:</strong> Some behavioral answers could benefit from a more structured approach, like the STAR method, to better highlight outcomes.</li>
                                <li><strong>Pacing:</strong> At times, you spoke a bit too quickly. Taking a brief pause to structure your thoughts can be beneficial.</li>
                            </ul>
                        </ReportSection>

                        <ReportSection icon={<LightbulbIcon />} title="Improvements Needed">
                            <ul className="list-disc list-inside space-y-2">
                                <li>Practice framing your experiences using the STAR method to create more impactful stories.</li>
                                <li>When faced with a complex question, take a moment to think and even verbalize your thought process.</li>
                                <li>Prepare specific examples that showcase your problem-solving skills in more detail.</li>
                            </ul>
                        </ReportSection>
                    </div>

                    <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
                        <button 
                            onClick={handleDownload}
                            className="flex items-center justify-center w-full sm:w-auto bg-slate-700 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-slate-600 transition-transform transform hover:scale-105 duration-300"
                        >
                           <DownloadIcon />
                           Download PDF
                        </button>
                         <button 
                            onClick={onStartNew}
                            className="flex items-center justify-center w-full sm:w-auto bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-500 transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-primary/20"
                        >
                            <RestartIcon />
                            Start New Interview
                        </button>
                    </div>
                </div>
            </div>
        </section>
    );
};

export default InterviewSummaryPage;
