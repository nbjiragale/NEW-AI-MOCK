import React, { useState, useEffect } from 'react';
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
import BeforeInterviewPage from './pages/BeforeInterviewPage';
import InterviewPage from './pages/InterviewPage';
import InterviewSummaryPage from './pages/InterviewSummaryPage';

const App: React.FC = () => {
  const [page, setPage] = useState('landing');

  const [setupData, setSetupData] = useState<any>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<any>(null);
  const [interviewerDetails, setInterviewerDetails] = useState<any>(null);
  const [interviewTranscript, setInterviewTranscript] = useState<any[] | null>(null);
  const [interviewDuration, setInterviewDuration] = useState<number | null>(null);


  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);
  
  const resetInterviewState = () => {
      setSetupData(null);
      setInterviewQuestions(null);
      setInterviewerDetails(null);
      setInterviewTranscript(null);
      setInterviewDuration(null);
  }

  const goToSetup = () => {
    resetInterviewState();
    setPage('setup');
  };
  
  const goToVerification = (data: any) => {
    setSetupData(data);
    setInterviewQuestions(null);
    setInterviewerDetails(null);
    setPage('verification');
  };

  const goToBeforeInterview = () => {
    setPage('before_interview');
  };

  const backToSetup = () => {
    setPage('setup');
  };

  const startInterview = (questions: any, details: any) => {
    setInterviewQuestions(questions);
    setInterviewerDetails(details);
    setPage('interview');
  }

  const goToSummary = (transcript: any[], duration: number) => {
    setInterviewTranscript(transcript);
    setInterviewDuration(duration);
    setPage('summary');
  }

  const startNewInterview = () => {
    resetInterviewState();
    setPage('landing');
  };

  if (page === 'setup') {
    return (
      <div className="bg-dark min-h-screen overflow-x-hidden">
        <main>
          <SetupPage 
            initialData={setupData} 
            onStart={goToVerification} 
          />
        </main>
      </div>
    );
  }
  
  if (page === 'verification') {
    return (
      <div className="bg-dark min-h-screen overflow-x-hidden">
        <main>
          <VerificationPage setupData={setupData} onEdit={backToSetup} onConfirm={goToBeforeInterview} />
        </main>
      </div>
    );
  }

  if (page === 'before_interview') {
    return (
      <div className="bg-dark min-h-screen overflow-x-hidden">
        <main>
          <BeforeInterviewPage 
            setupData={setupData} 
            onEdit={backToSetup} 
            onStartInterview={startInterview} 
          />
        </main>
      </div>
    );
  }

  if (page === 'interview') {
    return (
        <InterviewPage 
          setupData={setupData} 
          interviewQuestions={interviewQuestions} 
          interviewerDetails={interviewerDetails}
          onLeave={(transcript, duration) => goToSummary(transcript, duration)} 
        />
    );
  }

  if (page === 'summary') {
    return (
       <div className="bg-dark min-h-screen overflow-x-hidden">
        <main>
          <InterviewSummaryPage 
            setupData={setupData}
            transcript={interviewTranscript}
            interviewDuration={interviewDuration}
            onStartNew={startNewInterview}
          />
        </main>
      </div>
    )
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