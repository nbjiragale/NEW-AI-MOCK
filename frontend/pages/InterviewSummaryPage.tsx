import React, { useState, useEffect, useRef } from 'react';
import { generateInterviewReport } from '../services/geminiForReportGeneration';

// TypeScript declarations for CDN libraries
declare var html2canvas: any;
declare var jspdf: any;

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

interface ReportData {
    strengths: string[];
    weaknesses: string[];
    improvements: string[];
    overallFeedback: string;
}

interface TranscriptItem {
    speaker: string;
    text: string;
}

interface InterviewSummaryPageProps {
    setupData: any;
    transcript: TranscriptItem[] | null;
    onStartNew: () => void;
}

const InterviewSummaryPage: React.FC<InterviewSummaryPageProps> = ({ setupData, transcript, onStartNew }) => {
    const [report, setReport] = useState<ReportData | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    const reportRef = useRef<HTMLDivElement>(null);
    
    useEffect(() => {
        const fetchReport = async () => {
            if (!transcript) {
                setError("No interview data available to generate a report.");
                setIsLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                setError(null);
                const generatedReport = await generateInterviewReport(setupData, transcript);
                setReport(generatedReport);
            } catch (e) {
                setError("Sorry, we couldn't generate your report at this time. Please try again later.");
                console.error(e);
            } finally {
                setIsLoading(false);
            }
        };

        fetchReport();
    }, [setupData, transcript]);
    
    const handleDownload = () => {
        if (!reportRef.current || !report) {
            alert("Report content is not available for download.");
            return;
        }

        const reportElement = reportRef.current;
        const candidateName = setupData?.candidateName || "Interview";
        const fileName = `${candidateName.replace(/\s/g, '_')}_Report.pdf`;

        html2canvas(reportElement, {
            backgroundColor: '#0A0A0A', // dark bg
            scale: 2, // higher resolution
            useCORS: true, 
        }).then((canvas: any) => {
            const imgData = canvas.toDataURL('image/png');
            const { jsPDF } = jspdf;
            const pdf = new jsPDF({
                orientation: 'portrait',
                unit: 'px',
                format: [canvas.width, canvas.height]
            });
            pdf.addImage(imgData, 'PNG', 0, 0, canvas.width, canvas.height);
            pdf.save(fileName);
        }).catch((err: any) => {
             console.error("Error generating PDF:", err);
             alert("Could not generate PDF. Please try again.");
        });
    };
    
    const renderContent = () => {
        if (isLoading) {
            return (
                <div className="text-center py-20">
                    <svg className="animate-spin h-12 w-12 text-primary mx-auto mb-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <h2 className="text-2xl font-bold text-white">Generating Your Report...</h2>
                    <p className="text-gray-400">Our AI is analyzing your performance.</p>
                </div>
            );
        }

        if (error) {
             return (
                <div className="text-center py-20 bg-red-900/20 border border-red-500/50 rounded-lg">
                    <h2 className="text-2xl font-bold text-red-400">Error</h2>
                    <p className="text-gray-300">{error}</p>
                </div>
            );
        }

        if (!report) {
             return (
                <div className="text-center py-20">
                     <p className="text-gray-400">No report data available.</p>
                </div>
            );
        }

        return (
            <div ref={reportRef} className="p-4 md:p-8 bg-dark">
                 <div className="space-y-8">
                    <div className="text-center">
                        <h2 className="text-3xl font-bold text-white">Performance Summary</h2>
                        <p className="text-gray-400 mt-2 max-w-2xl mx-auto">{report.overallFeedback}</p>
                    </div>

                    <ReportSection icon={<ThumbsUpIcon />} title="Strengths">
                        <ul className="list-disc list-inside space-y-2">
                           {report.strengths.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </ReportSection>

                    <ReportSection icon={<ThumbsDownIcon />} title="Areas for Improvement">
                         <ul className="list-disc list-inside space-y-2">
                             {report.weaknesses.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </ReportSection>

                    <ReportSection icon={<LightbulbIcon />} title="Actionable Suggestions">
                        <ul className="list-disc list-inside space-y-2">
                           {report.improvements.map((item, index) => <li key={index}>{item}</li>)}
                        </ul>
                    </ReportSection>
                </div>
            </div>
        );
    }

    return (
        <section className="py-16 md:py-24 animate-fade-in-up">
            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white">Interview Report</h1>
                        <p className="mt-4 text-lg text-gray-400">Here's a summary of your performance.</p>
                    </div>
                    
                    {renderContent()}

                    {!isLoading && (
                        <div className="mt-12 flex flex-col sm:flex-row justify-center gap-4">
                            <button 
                                onClick={handleDownload}
                                disabled={!report || !!error}
                                className="flex items-center justify-center w-full sm:w-auto bg-slate-700 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-slate-600 transition-transform transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
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
                    )}
                </div>
            </div>
        </section>
    );
};

export default InterviewSummaryPage;