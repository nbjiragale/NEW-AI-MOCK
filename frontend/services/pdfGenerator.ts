// This service uses the jsPDF library, which is loaded via a CDN in index.html.
// The `jspdf` global variable is available in the window scope.
declare var jspdf: any;

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

export const downloadReportAsPdf = (report: ReportData, setupData: any) => {
    const { jsPDF } = jspdf;
    const doc = new jsPDF({
        orientation: 'p',
        unit: 'px',
        format: 'a4'
    });

    const pageHeight = doc.internal.pageSize.getHeight();
    const pageWidth = doc.internal.pageSize.getWidth();
    const margin = 40;
    let y = margin;

    // Helper function to add text and handle page breaks automatically
    const addWrappedText = (text: string, x: number, currentY: number, options: any = {}) => {
        const splitText = doc.splitTextToSize(text, pageWidth - margin * 2);
        const textHeight = doc.getTextDimensions(splitText).h;

        if (currentY + textHeight > pageHeight - margin) {
            doc.addPage();
            currentY = margin;
        }
        doc.text(splitText, x, currentY, options);
        return currentY + textHeight;
    };
    
    // --- Header ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(22);
    doc.text('Interview Performance Report', pageWidth / 2, y, { align: 'center' });
    y += 30;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.text(`Candidate: ${setupData?.candidateName || 'N/A'}`, margin, y);
    doc.text(`Role: ${setupData?.role || 'N/A'}`, margin, y + 15);
    y += 40;

    // --- Overall Score & Feedback ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Overall Performance', margin, y);
    y += 20;

    doc.setFontSize(32);
    doc.text(`${report.overallScore}/100`, margin, y);
    y += 25;

    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    y = addWrappedText(report.overallFeedback, margin, y, {});
    y += 30;
    
    // --- Performance Breakdown ---
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Performance Breakdown', margin, y);
    y += 20;

    report.performanceBreakdown.forEach(item => {
        if (y > pageHeight - 80) { // Check before adding a new section
             doc.addPage();
             y = margin;
        }
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(12);
        doc.text(`${item.category}: ${item.score}/100`, margin, y);
        y += 18;
        
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        y = addWrappedText(item.feedback, margin, y, {});
        y += 25;
    });

    // --- Actionable Suggestions ---
    if (y > pageHeight - 80) {
        doc.addPage();
        y = margin;
    }
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(16);
    doc.text('Actionable Suggestions', margin, y);
    y += 20;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    report.actionableSuggestions.forEach(item => {
        // Add a small buffer for list items to avoid crowding
        const itemHeight = doc.getTextDimensions(doc.splitTextToSize(`• ${item}`, pageWidth - (margin + 10) * 2)).h + 10;
        if (y + itemHeight > pageHeight - margin) {
            doc.addPage();
            y = margin;
        }
        y = addWrappedText(`• ${item}`, margin + 10, y, {});
        y += 10;
    });

    // --- Save the PDF ---
    const candidateName = setupData?.candidateName || "Interview";
    const fileName = `${candidateName.replace(/\s/g, '_')}_Report.pdf`;
    doc.save(fileName);
};
