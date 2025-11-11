import React, { useState, useEffect } from 'react';
import { generateInterviewReport } from '../services/geminiForReportGeneration';
import { downloadReportAsPdf } from '../services/pdfGenerator';
import { generateHolisticAnalysis } from '../services/geminiForHolisticAnalysis';
import { EyeIcon } from '../icons/EyeIcon';
import { SoundWaveIcon } from '../icons/SoundWaveIcon';

// TypeScript declarations for CDN libraries
declare var jspdf: any;

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

const ScoreBar: React.FC<{ score: number }> = ({ score }) => {
    const getColor = (s: number) => {
        if (s >= 80) return 'bg-green-500';
        if (s >= 60) return 'bg-yellow-500';
        return 'bg-red-500';
    };

    return (
        <div className="w-full bg-slate-700 rounded-full h-2.5">
            <div
                className={`transition-all duration-1000 ease-out ${getColor(score)} h-2.5 rounded-full`}
                style={{ width: `${score}%` }}
            ></div>
        </div>
    );
};


interface ReportData {
    overallScore: number;
    overallFeedback: string;
    performanceBreakdown: {
        category: string;
        score: number;
        feedback: string;
    }[];
    actionableSuggestions: string[];
}

interface HolisticReport {
    vocalDelivery: { score: number; feedback: string; };
    nonVerbalCues: { score: number; feedback: string; };
}


interface TranscriptItem {
    speaker: string;
    text: string;
}

interface InterviewSummaryPageProps {
    setupData: any;
    transcript: TranscriptItem[] | null;
    interviewDuration: number | null;
    videoFrames: string[] | null;
    onStartNew: () => void;
}

const InterviewSummaryPage: React.FC<InterviewSummaryPageProps> = ({ setupData, transcript, interviewDuration, videoFrames, onStartNew }) => {
    const [report, setReport] = useState<ReportData | null>(null);
    const [holisticReport, setHolisticReport] = useState<HolisticReport | null>(null);
    const [isLoading, setIsLoading] = useState(true);
    const [isHolisticLoading, setIsHolisticLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);
    
    useEffect(() => {
        const fetchReports = async () => {
            if (interviewDuration !== null && interviewDuration < 60) {
                setError("The interview was too short (less than 1 minute) to generate a meaningful performance report. Please try again with a longer session.");
                setIsLoading(false);
                setIsHolisticLoading(false);
                setReport(null);
                return;
            }

            if (!transcript || transcript.length < 2) {
                setError("Not enough conversation data was recorded to generate a report.");
                setIsLoading(false);
                setIsHolisticLoading(false);
                return;
            }
            try {
                setIsLoading(true);
                setIsHolisticLoading(true);
                setError(null);
                
                const reportPromise = generateInterviewReport(setupData, transcript);
                const holisticPromise = (videoFrames && videoFrames.length > 0) 
                    ? generateHolisticAnalysis(transcript, videoFrames) 
                    : Promise.resolve(null);

                const [generatedReport, generatedHolisticReport] = await Promise.all([reportPromise, holisticPromise]);
                
                setReport(generatedReport);
                setIsLoading(false);

                if (generatedHolisticReport) {
                    setHolisticReport(generatedHolisticReport);
                }
            } catch (e) {
                setError("Sorry, we couldn't generate your report at this time. Our AI may be experiencing high demand. Please try again later.");
                console.error(e);
            } finally {
                // Final loading state update
                setIsLoading(false);
                setIsHolisticLoading(false);
            }
        };

        fetchReports();
    }, [setupData, transcript, interviewDuration, videoFrames]);
    
    const handleDownload = () => {
        if (!report) {
            alert("Report content is not available for download.");
            return;
        }
        try {
             downloadReportAsPdf(report, holisticReport, setupData);
        } catch (err) {
            console.error("Error generating PDF:", err);
            alert("Could not generate PDF. Please try again.");
        }
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
                <div className="text-center py-10 px-6 bg-red-900/20 border border-red-500/50 rounded-lg">
                    <h2 className="text-2xl font-bold text-red-400 mb-2">Report Not Generated</h2>
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
            <div className="space-y-8">
                <div className="text-center p-6 bg-slate-800/50 rounded-xl border border-slate-700">
                    <h3 className="text-lg font-semibold text-gray-400">Overall Score</h3>
                    <p className="text-6xl font-bold text-primary my-2">{report.overallScore}<span className="text-3xl text-gray-400">/100</span></p>
                    <p className="text-gray-300 max-w-2xl mx-auto">{report.overallFeedback}</p>
                </div>

                {report.performanceBreakdown.map((item, index) => (
                    <div key={index} className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                        <div className="flex justify-between items-center mb-3">
                            <h4 className="text-xl font-bold text-white">{item.category}</h4>
                            <span className="text-xl font-semibold text-white">{item.score}/100</span>
                        </div>
                        <ScoreBar score={item.score} />
                        <p className="text-gray-300 mt-4">{item.feedback}</p>
                    </div>
                ))}
                
                {isHolisticLoading ? (
                    <div className="text-center py-10">
                        <svg className="animate-spin h-8 w-8 text-primary mx-auto mb-3" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                            <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                            <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                        </svg>
                        <p className="text-gray-400">Analyzing Body Language & Vocal Tone...</p>
                    </div>
                ) : holisticReport && (
                    <>
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                            <div className="flex justify-between items-center mb-3">
                                <div className="flex items-center gap-4">
                                    <SoundWaveIcon className="h-8 w-8 text-blue-400" />
                                    <h4 className="text-xl font-bold text-white">Vocal Delivery</h4>
                                </div>
                                <span className="text-xl font-semibold text-white">{holisticReport.vocalDelivery.score}/100</span>
                            </div>
                            <ScoreBar score={holisticReport.vocalDelivery.score} />
                            <p className="text-gray-300 mt-4">{holisticReport.vocalDelivery.feedback}</p>
                        </div>
                        <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700">
                            <div className="flex justify-between items-center mb-3">
                                 <div className="flex items-center gap-4">
                                    <EyeIcon className="h-8 w-8 text-blue-400" />
                                    <h4 className="text-xl font-bold text-white">Non-Verbal Cues</h4>
                                </div>
                                <span className="text-xl font-semibold text-white">{holisticReport.nonVerbalCues.score}/100</span>
                            </div>
                            <ScoreBar score={holisticReport.nonVerbalCues.score} />
                            <p className="text-gray-300 mt-4">{holisticReport.nonVerbalCues.feedback}</p>
                        </div>
                    </>
                )}
                
                <ReportSection icon={<LightbulbIcon />} title="Actionable Suggestions">
                    <ul className="list-disc list-inside space-y-2">
                        {report.actionableSuggestions.map((item, index) => <li key={index}>{item}</li>)}
                    </ul>
                </ReportSection>
            </div>
        );
    }

    return (
        <section className="py-16 md:py-24 animate-fade-in-up">
            <div className="container mx-auto px-6">
                <div className="max-w-4xl mx-auto">
                    <div className="text-center mb-12">
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white">Interview Report</h1>
                        <p className="mt-4 text-lg text-gray-400">Here's a detailed summary of your performance.</p>
                    </div>
                    
                    <div className="bg-slate-900/50 border border-slate-700 rounded-xl shadow-2xl p-6 md:p-8">
                        {renderContent()}
                    </div>

                    {!(isLoading || isHolisticLoading) && (
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