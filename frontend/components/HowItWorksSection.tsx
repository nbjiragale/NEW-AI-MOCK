import React from 'react';

const steps = [
    {
        number: '01',
        title: 'Select Your Role',
        description: 'Choose from a wide range of job roles and industries to get questions that are relevant to your career path.'
    },
    {
        number: '02',
        title: 'Start the AI Interview',
        description: 'Engage in a realistic conversation with our advanced AI. It listens, understands, and asks follow-up questions just like a real interviewer.'
    },
    {
        number: '03',
        title: 'Receive Your Analysis',
        description: 'Get an instant, comprehensive report on your performance. Review your answers, analyze your speech patterns, and get actionable tips.'
    }
];

const HowItWorksSection: React.FC = () => {
    return (
        <section id="how-it-works" className="py-20 md:py-32 bg-dark/95 bg-no-repeat bg-center" style={{backgroundImage: "url('https://picsum.photos/seed/bg/1600/900')"}}>
             <div className="absolute inset-0 bg-dark/90"></div>
            <div className="container mx-auto px-6 relative z-10">
                <div className="text-center max-w-3xl mx-auto mb-16">
                    <h2 className="text-3xl md:text-4xl font-extrabold text-white">Get Started in 3 Simple Steps</h2>
                    <p className="mt-4 text-lg text-gray-400">
                        Our process is designed to be straightforward and effective, getting you from practice to perfect in no time.
                    </p>
                </div>

                <div className="relative">
                    <div className="hidden md:block absolute top-1/2 left-0 w-full h-0.5 bg-slate-700 -translate-y-1/2"></div>
                    <div className="hidden md:block absolute top-1/2 left-0 w-1/3 h-0.5 bg-primary -translate-y-1/2"></div>
                    <div className="hidden md:block absolute top-1/2 left-1/2 w-1/3 h-0.5 bg-primary -translate-y-1/2"></div>
                    <div className="grid md:grid-cols-3 gap-12">
                        {steps.map((step, index) => (
                            <div key={index} className="text-center md:text-left">
                                <div className="flex justify-center md:justify-start items-center gap-4 mb-4">
                                    <span className="flex items-center justify-center text-2xl font-bold text-primary border-2 border-primary rounded-full h-12 w-12 bg-primary/10">
                                        {step.number}
                                    </span>
                                    <h3 className="text-2xl font-bold text-white">{step.title}</h3>
                                </div>
                                <p className="text-gray-400">{step.description}</p>
                            </div>
                        ))}
                    </div>
                </div>
            </div>
        </section>
    );
}

export default HowItWorksSection;