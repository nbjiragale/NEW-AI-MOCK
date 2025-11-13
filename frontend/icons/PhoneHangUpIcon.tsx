import React from 'react';

export const PhoneHangUpIcon: React.FC<React.SVGProps<SVGSVGElement>> = (props) => (
    <svg {...props} xmlns="http://www.w3.org/2000/svg" className="h-6 w-6" fill="none" viewBox="0 0 24 24" stroke="currentColor">
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 3H8C6.34315 3 5 4.34315 5 6V18C5 19.6569 6.34315 21 8 21H16C17.6569 21 19 19.6569 19 18V6C19 4.34315 17.6569 3 16 3Z" transform="rotate(135 12 12)" />
        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M14.5 9.5L9.5 14.5M9.5 9.5L14.5 14.5" transform="rotate(135 12 12)" />
    </svg>
);
