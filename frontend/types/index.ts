export interface ReportData {
    overallScore: number;
    overallFeedback: string;
    performanceBreakdown: {
        category: string;
        score: number;
        feedback: string;
    }[];
    actionableSuggestions: string[];
}
