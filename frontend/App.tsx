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
import ProfilePage from './pages/ProfilePage';

const App: React.FC = () => {
  const [page, setPage] = useState('landing');
  const [setupData, setSetupData] = useState<any>(null);
  const [interviewQuestions, setInterviewQuestions] = useState<any>(null);
  const [interviewerDetails, setInterviewerDetails] = useState<any>(null);
  const [interviewTranscript, setInterviewTranscript] = useState<any[] | null>(null);
  const [interviewDuration, setInterviewDuration] = useState<number | null>(null);
  const [interviewVideoFrames, setInterviewVideoFrames] = useState<string[] | null>(null);
  const [profileData, setProfileData] = useState<any>(null);

  useEffect(() => {
    window.scrollTo(0, 0);
  }, [page]);

  useEffect(() => {
    // Load profile data on initial mount
    const savedProfile = localStorage.getItem('userProfile');
    if (savedProfile) {
      setProfileData(JSON.parse(savedProfile));
    }
  }, []);

  const goToSetup = () => {
    setSetupData(null); 
    setInterviewQuestions(null);
    setInterviewerDetails(null);
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

  const goToSummary = (transcript: any[], duration: number, frames: string[]) => {
    setInterviewTranscript(transcript);
    setInterviewDuration(duration);
    setInterviewVideoFrames(frames);
    setPage('summary');
  }

  const startNewInterview = () => {
    setPage('landing');
    setSetupData(null);
    setInterviewQuestions(null);
    setInterviewerDetails(null);
    setInterviewTranscript(null);
    setInterviewDuration(null);
    setInterviewVideoFrames(null);
  };

  const goToProfile = () => {
    setPage('profile');
  };

  const saveProfile = (data: any) => {
    setProfileData(data);
    localStorage.setItem('userProfile', JSON.stringify(data));
    alert('Profile saved successfully!');
    setPage('landing');
  };
  
  const backToLanding = () => {
    setPage('landing');
  };

  if (page === 'setup') {
    return (
      <div className="bg-dark min-h-screen overflow-x-hidden">
        <main>
          <SetupPage 
            initialData={setupData} 
            onStart={goToVerification} 
            profileData={profileData}
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
          onLeave={(transcript, duration, frames) => goToSummary(transcript, duration, frames)} 
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
            videoFrames={interviewVideoFrames}
            onStartNew={startNewInterview} 
          />
        </main>
      </div>
    )
  }

  if (page === 'profile') {
    return (
      <div className="bg-dark min-h-screen overflow-x-hidden">
        <main>
          <ProfilePage 
            initialData={profileData}
            onSave={saveProfile}
            onBack={backToLanding}
          />
        </main>
      </div>
    );
  }

  return (
    <div className="bg-dark min-h-screen overflow-x-hidden">
      <Header onGetStarted={goToSetup} onGoToProfile={goToProfile} />
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