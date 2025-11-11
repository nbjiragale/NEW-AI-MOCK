import React from 'react';

// FIX: Changed props type from React.SVGProps<SVGSVGElement> to React.HTMLAttributes<HTMLDivElement>
// because the component returns a div, not an svg. This resolves the type mismatch for props like `ref`.
export const GeminiSpinnerIcon: React.FC<React.HTMLAttributes<HTMLDivElement>> = (props) => (
  <div className="flex items-center justify-center gap-1 h-5 w-5" {...props}>
    <div className="gemini-spinner-dot h-1.5 w-1.5 bg-primary rounded-full"></div>
    <div className="gemini-spinner-dot h-1.5 w-1.5 bg-primary rounded-full"></div>
    <div className="gemini-spinner-dot h-1.5 w-1.5 bg-primary rounded-full"></div>
  </div>
);