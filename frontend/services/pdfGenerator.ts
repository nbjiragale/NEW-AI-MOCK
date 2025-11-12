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

    // Color palette
    const colors = {
        primary: [41, 128, 185],      // Professional blue
        secondary: [52, 152, 219],    // Lighter blue
        success: [46, 204, 113],      // Green
        warning: [241, 196, 15],      // Yellow
        danger: [231, 76, 60],        // Red
        dark: [44, 62, 80],           // Dark gray
        light: [236, 240, 241],       // Light gray
        text: [52, 73, 94]            // Text gray
    };

    // Helper function to get score color
    const getScoreColor = (score: number): number[] => {
        if (score >= 80) return colors.success;
        if (score >= 60) return colors.warning;
        return colors.danger;
    };

    // Helper function to draw a colored rectangle
    const drawRect = (x: number, y: number, width: number, height: number, color: number[], opacity: number = 1) => {
        doc.setFillColor(...color);
        doc.setDrawColor(...color);
        if (opacity < 1) {
            doc.setGState(new doc.GState({ opacity }));
        }
        doc.rect(x, y, width, height, 'F');
        if (opacity < 1) {
            doc.setGState(new doc.GState({ opacity: 1 }));
        }
    };

    // Helper function to add text and handle page breaks automatically
    const addWrappedText = (text: string, x: number, currentY: number, options: any = {}) => {
        const splitText = doc.splitTextToSize(text, pageWidth - margin * 2);
        const textHeight = doc.getTextDimensions(splitText).h;

        if (currentY + textHeight > pageHeight - margin) {
            doc.addPage();
            addPageNumber();
            currentY = margin;
        }
        doc.text(splitText, x, currentY, options);
        return currentY + textHeight;
    };

    // Helper function to add page numbers
    let pageNumber = 1;
    const addPageNumber = () => {
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(9);
        doc.setTextColor(...colors.text);
        doc.text(`Page ${pageNumber}`, pageWidth - margin, pageHeight - 20);
        pageNumber++;
    };
    
    // --- Header with colored background ---
    drawRect(0, 0, pageWidth, 100, colors.primary);
    
    doc.setTextColor(255, 255, 255);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(26);
    doc.text('Interview Performance Report', pageWidth / 2, 45, { align: 'center' });
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(12);
    doc.text(`${setupData?.candidateName || 'N/A'} • ${setupData?.role || 'N/A'}`, pageWidth / 2, 70, { align: 'center' });
    
    y = 130;

    // --- Overall Score Section ---
    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Overall Performance', margin, y);
    y += 5;

    // Underline
    drawRect(margin, y, 150, 2, colors.primary);
    y += 25;

    // Score box with colored background
    const scoreColor = getScoreColor(report.overallScore);
    const boxWidth = 120;
    const boxHeight = 80;
    
    drawRect(margin, y, boxWidth, boxHeight, scoreColor, 0.15);
    doc.setDrawColor(...scoreColor);
    doc.setLineWidth(3);
    doc.rect(margin, y, boxWidth, boxHeight);
    
    doc.setTextColor(...scoreColor);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(42);
    doc.text(`${report.overallScore}`, margin + boxWidth / 2, y + 45, { align: 'center' });
    
    doc.setFontSize(14);
    doc.text('/ 100', margin + boxWidth / 2, y + 65, { align: 'center' });

    // Score interpretation
    doc.setTextColor(...colors.text);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(14);
    const interpretation = report.overallScore >= 80 ? 'Excellent' : 
                          report.overallScore >= 60 ? 'Good' : 'Needs Improvement';
    doc.text(interpretation, margin + boxWidth + 20, y + 40);
    
    y += boxHeight + 25;

    // Overall feedback
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(11);
    doc.setTextColor(...colors.text);
    y = addWrappedText(report.overallFeedback, margin, y, {});
    y += 35;
    
    // --- Performance Breakdown ---
    if (y > pageHeight - 150) {
        doc.addPage();
        addPageNumber();
        y = margin;
    }

    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Performance Breakdown', margin, y);
    y += 5;
    drawRect(margin, y, 180, 2, colors.secondary);
    y += 25;

    report.performanceBreakdown.forEach((item, index) => {
        if (y > pageHeight - 120) {
            doc.addPage();
            addPageNumber();
            y = margin;
        }

        const categoryColor = getScoreColor(item.score);
        
        // Category header with colored accent
        drawRect(margin - 5, y - 12, 4, 20, categoryColor);
        
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(13);
        doc.setTextColor(...colors.dark);
        doc.text(item.category, margin + 5, y);
        
        // Score badge
        const badgeX = pageWidth - margin - 60;
        drawRect(badgeX, y - 15, 55, 22, categoryColor, 0.2);
        doc.setTextColor(...categoryColor);
        doc.setFontSize(12);
        doc.text(`${item.score}/100`, badgeX + 27, y, { align: 'center' });
        
        y += 22;
        
        // Feedback
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...colors.text);
        y = addWrappedText(item.feedback, margin + 5, y, {});
        y += 30;

        // Separator line (except for last item)
        if (index < report.performanceBreakdown.length - 1) {
            drawRect(margin, y - 15, pageWidth - margin * 2, 1, colors.light);
        }
    });

    // --- Actionable Suggestions ---
    if (y > pageHeight - 100) {
        doc.addPage();
        addPageNumber();
        y = margin;
    }

    doc.setTextColor(...colors.dark);
    doc.setFont('helvetica', 'bold');
    doc.setFontSize(18);
    doc.text('Actionable Suggestions', margin, y);
    y += 5;
    drawRect(margin, y, 180, 2, colors.success);
    y += 25;

    // Suggestions box with background
    const suggestionsStartY = y;
    
    doc.setFont('helvetica', 'normal');
    doc.setFontSize(10);
    doc.setTextColor(...colors.text);
    
    report.actionableSuggestions.forEach((item, index) => {
        const itemHeight = doc.getTextDimensions(doc.splitTextToSize(`${index + 1}. ${item}`, pageWidth - (margin + 25) * 2)).h + 15;
        
        if (y + itemHeight > pageHeight - margin) {
            doc.addPage();
            addPageNumber();
            y = margin;
        }

        // Numbered circle
        doc.setFillColor(...colors.success);
        doc.circle(margin + 8, y + 5, 8, 'F');
        doc.setTextColor(255, 255, 255);
        doc.setFont('helvetica', 'bold');
        doc.setFontSize(9);
        doc.text(`${index + 1}`, margin + 8, y + 8, { align: 'center' });
        
        // Suggestion text
        doc.setFont('helvetica', 'normal');
        doc.setFontSize(10);
        doc.setTextColor(...colors.text);
        y = addWrappedText(item, margin + 25, y + 5, {});
        y += 15;
    });

    // --- Footer ---
    addPageNumber();
    const footerY = pageHeight - 30;
    drawRect(0, footerY, pageWidth, 30, colors.light);
    doc.setTextColor(...colors.text);
    doc.setFontSize(9);
    doc.setFont('helvetica', 'italic');
    const date = new Date().toLocaleDateString('en-US', { year: 'numeric', month: 'long', day: 'numeric' });
    doc.text(`Generated on ${date}`, pageWidth / 2, footerY + 18, { align: 'center' });

    // --- Save the PDF ---
    const candidateName = setupData?.candidateName || "Interview";
    const fileName = `${candidateName.replace(/\s/g, '_')}_Report.pdf`;
    doc.save(fileName);
};