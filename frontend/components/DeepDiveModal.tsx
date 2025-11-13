import React, { useState } from 'react';
import { getDeepDiveFeedback } from '../services/geminiForDeepDive';
import { GeminiSpinnerIcon } from '../icons/GeminiSpinnerIcon';
import { SparkleIcon } from '../icons/SparkleIcon';

interface DeepDiveModalProps {
    isOpen: boolean;
    onClose: () => void;
    question: string;
    answer: string;
}

const formatFeedback = (text: string): string => {
    const lines = text.split('\n');
    let htmlLines: string[] = [];
    let inList = false;

    lines.forEach(line => {
        // Handle bold within any line
        let processedLine = line.replace(/\*\*\*\*(.*?)\*\*\*\*/g, '<strong class="font-bold text-white">$1</strong>');

        // Handle headings
        if (processedLine.startsWith('### ')) {
            if (inList) {
                htmlLines.push('</ul>');
                inList = false;
            }
            htmlLines.push(`<h4 class="text-md font-semibold text-primary mt-4 mb-2">${processedLine.substring(4)}</h4>`);
            return;
        }

        // Handle bullet points
        if (processedLine.trim().startsWith('* ')) {
            if (!inList) {
                htmlLines.push('<ul class="list-disc list-inside space-y-1 my-2 text-gray-300">');
                inList = true;
            }
            htmlLines.push(`<li>${processedLine.trim().substring(2)}</li>`);
        } else {
            // If we were in a list and this line is not a list item, end the list
            if (inList) {
                htmlLines.push('</ul>');
                inList = false;
            }
            
            // Handle paragraphs
            if (processedLine.trim().length > 0) {
                htmlLines.push(`<p class="my-2 text-gray-300">${processedLine}</p>`);
            }
        }
    });

    // Close list if it's the last thing in the feedback
    if (inList) {
        htmlLines.push('</ul>');
    }

    return htmlLines.join('');
};

const DeepDiveModal: React.FC<DeepDiveModalProps> = ({ isOpen, onClose, question, answer }) => {
    const [query, setQuery] = useState('');
    const [feedback, setFeedback] = useState<string | null>(null);
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const presetQueries = [
        "How could I have structured this answer better?",
        "Was this answer too long or too short?",
        "Suggest a more concise way to phrase this.",
        "Did I effectively use the STAR method here?"
    ];

    const handleGetFeedback = async () => {
        if (!query.trim()) {
            setError("Please enter a question to get feedback.");
            return;
        }
        setIsLoading(true);
        setError(null);
        setFeedback(null);
        try {
            const result = await getDeepDiveFeedback(question, answer, query);
            setFeedback(result);
        } catch (e) {
            setError(e instanceof Error ? e.message : "An unknown error occurred.");
        } finally {
            setIsLoading(false);
        }
    };

    const handleClose = () => {
        setQuery('');
        setFeedback(null);
        setError(null);
        setIsLoading(false);
        onClose();
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up" 
            style={{ animationDuration: '0.3s' }}
            onClick={handleClose}
        >
            <div 
                className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-3xl max-h-[90vh] flex flex-col"
                onClick={(e) => e.stopPropagation()}
            >
                <header className="p-4 border-b border-slate-700 flex justify-between items-center flex-shrink-0">
                    <div className="flex items-center gap-3">
                        <SparkleIcon className="h-6 w-6 text-primary" />
                        <h2 className="text-xl font-bold text-white">Answer Deep Dive</h2>
                    </div>
                    <button onClick={handleClose} className="text-gray-400 hover:text-white text-3xl leading-none">&times;</button>
                </header>
                
                <main className="p-6 overflow-y-auto space-y-6">
                    <div>
                        <p className="text-sm font-semibold text-gray-400 mb-1">The interviewer asked:</p>
                        <p className="text-gray-200 italic">"{question}"</p>
                    </div>
                    
                    <div className="p-4 bg-slate-800/50 rounded-lg border border-slate-700">
                        <p className="text-sm font-semibold text-primary mb-1">Your answer:</p>
                        <p className="text-gray-300 whitespace-pre-wrap">{answer}</p>
                    </div>

                    <div>
                        <label htmlFor="deep-dive-query" className="block text-base font-medium text-gray-300 mb-2">
                            What would you like to improve about this answer?
                        </label>
                        <textarea
                            id="deep-dive-query"
                            rows={3}
                            value={query}
                            onChange={(e) => setQuery(e.target.value)}
                            className="bg-slate-800 border border-slate-700 text-white text-base rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition"
                            placeholder="e.g., How can I make this more impactful?"
                        />
                        <div className="flex flex-wrap gap-2 mt-2">
                            {presetQueries.map(q => (
                                <button key={q} onClick={() => setQuery(q)} className="text-xs bg-slate-700 text-gray-300 px-2 py-1 rounded-md hover:bg-slate-600 transition-colors">
                                    {q}
                                </button>
                            ))}
                        </div>
                    </div>
                    
                    {(isLoading || feedback || error) && (
                        <div className="pt-4 border-t border-slate-800">
                            {isLoading && (
                                <div className="flex items-center gap-3 text-gray-400">
                                    <GeminiSpinnerIcon />
                                    <span>Analyzing your answer...</span>
                                </div>
                            )}
                            {error && <p className="text-red-400">{error}</p>}
                            {feedback && (
                                <div>
                                    <h4 className="font-semibold text-primary">Coaching Feedback:</h4>
                                    <div className="text-sm" dangerouslySetInnerHTML={{ __html: formatFeedback(feedback) }} />
                                </div>
                            )}
                        </div>
                    )}

                </main>
                
                <footer className="p-4 border-t border-slate-700 flex justify-end gap-4 flex-shrink-0">
                    <button onClick={handleClose} className="px-5 py-2 font-semibold bg-slate-700 text-white rounded-md hover:bg-slate-600 transition-colors">
                        Close
                    </button>
                    <button 
                        onClick={handleGetFeedback}
                        disabled={isLoading}
                        className="px-5 py-2 font-semibold bg-primary text-white rounded-md hover:bg-blue-500 transition-colors disabled:opacity-50 flex items-center gap-2"
                    >
                        {isLoading ? <GeminiSpinnerIcon /> : <SparkleIcon className="h-5 w-5" />}
                        <span>Get Feedback</span>
                    </button>
                </footer>
            </div>
        </div>
    );
};

export default DeepDiveModal;
