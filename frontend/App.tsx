import React from 'react';
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
import { InterviewProvider, useInterview } from './contexts/InterviewContext';

const PageRenderer: React.FC = () => {
    const { page, goToSetup } = useInterview();

    React.useEffect(() => {
        window.scrollTo(0, 0);
    }, [page]);

    if (page === 'setup') {
        return <SetupPage />;
    }
    
    if (page === 'verification') {
        return <VerificationPage />;
    }

    if (page === 'before_interview') {
        return <BeforeInterviewPage />;
    }

    if (page === 'interview') {
        return <InterviewPage />;
    }
    
    if (page === 'summary') {
        return <InterviewSummaryPage />;
    }

    return (
        <>
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
        </>
    );
};


const App: React.FC = () => {
  return (
    <InterviewProvider>
        <div className="bg-dark min-h-screen overflow-x-hidden">
            <main>
                <PageRenderer />
            </main>
        </div>
    </InterviewProvider>
  );
};

export default App;
