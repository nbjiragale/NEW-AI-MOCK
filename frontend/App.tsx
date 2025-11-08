import React, { useState } from 'react';
import Header from './components/Header';
import HeroSection from './components/HeroSection';
import FeaturesSection from './components/FeaturesSection';
import HowItWorksSection from './components/HowItWorksSection';
import TestimonialsSection from './components/TestimonialsSection';
import FaqSection from './components/FaqSection';
import CtaSection from './components/CtaSection';
import Footer from './components/Footer';
import SetupPage from './pages/SetupPage';
import VerificationPage from './pages/VerificationPage';
import InterviewPage from './pages/InterviewPage';

const App: React.FC = () => {
  const [page, setPage] = useState('landing');
  const [setupData, setSetupData] = useState<any>(null);

  const goToSetup = () => {
    setSetupData(null); // Clear data for a fresh start
    setPage('setup');
  };
  
  const goToVerification = (data: any) => {
    setSetupData(data);
    setPage('verification');
  };

  const backToSetup = () => {
    setPage('setup');
  };

  const startInterview = () => {
    setPage('interview');
  }

  const endInterview = () => {
    setPage('landing');
    setSetupData(null);
  }

  if (page === 'setup') {
    return (
      <div className="bg-dark min-h-screen overflow-x-hidden">
        <main>
          <SetupPage initialData={setupData} onStart={goToVerification} />
        </main>
      </div>
    );
  }
  
  if (page === 'verification') {
    return (
      <div className="bg-dark min-h-screen overflow-x-hidden">
        <main>
          <VerificationPage setupData={setupData} onEdit={backToSetup} onConfirm={startInterview} />
        </main>
      </div>
    );
  }

  if (page === 'interview') {
    return (
        <InterviewPage setupData={setupData} onLeave={endInterview} />
    );
  }

  return (
    <div className="bg-dark min-h-screen overflow-x-hidden">
      <Header onGetStarted={goToSetup} />
      <main>
        <HeroSection onGetStarted={goToSetup} />
        <FeaturesSection />
        <HowItWorksSection />
        <TestimonialsSection />
        <FaqSection />
        <CtaSection onGetStarted={goToSetup} />
      </main>
      <Footer />
    </div>
  );
};

export default App;