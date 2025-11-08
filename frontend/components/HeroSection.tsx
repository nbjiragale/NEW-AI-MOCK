import React from 'react';

const HeroSection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  
  const handleLearnMoreClick = (e: React.MouseEvent<HTMLAnchorElement>) => {
    e.preventDefault();
    const targetElement = document.getElementById('how-it-works');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth' });
    }
  };

  return (
    <section id="home" className="relative pt-32 pb-20 md:pt-48 md:pb-32 text-center bg-dark overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-800/[0.2] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-4xl mx-auto">
          <span className="inline-block px-4 py-1 text-sm font-semibold text-primary bg-primary/10 rounded-full mb-4 animate-fade-in-up" style={{ animationDelay: '0.2s' }}>
            Land Your Dream Job Faster
          </span>
          <h1 className="text-4xl md:text-6xl font-extrabold text-white leading-tight mb-6 animate-fade-in-up" style={{ animationDelay: '0.4s' }}>
            Ace Your Next Interview with <span className="text-primary">AI-Powered</span> Practice
          </h1>
          <p className="text-lg md:text-xl text-gray-400 max-w-2xl mx-auto mb-10 animate-fade-in-up" style={{ animationDelay: '0.6s' }}>
            Get instant, personalized feedback on your answers, body language, and communication skills. Our AI interviewer is available 24/7 to help you build confidence and master any interview.
          </p>
          <div className="flex justify-center gap-4 animate-fade-in-up" style={{ animationDelay: '0.8s' }}>
            <button onClick={onGetStarted} className="bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-500 transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-primary/20">
              Start Practicing Now
            </button>
            <a href="#how-it-works" onClick={handleLearnMoreClick} className="bg-slate-800 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-slate-700 transition-transform transform hover:scale-105 duration-300">
              Learn More
            </a>
          </div>
        </div>
      </div>
    </section>
  );
};

export default HeroSection;