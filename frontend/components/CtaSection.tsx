import React from 'react';

const CtaSection: React.FC<{ onGetStarted: () => void }> = ({ onGetStarted }) => {
  return (
    <section className="py-20 md:py-32 bg-dark">
      <div className="container mx-auto px-6">
        <div className="bg-gradient-to-r from-primary to-blue-600 rounded-xl p-10 md:p-16 text-center shadow-lg shadow-primary/20">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white mb-4">
            Ready to Nail Your Next Interview?
          </h2>
          <p className="text-lg text-light max-w-2xl mx-auto mb-8">
            Stop guessing and start improving. Join thousands of users who have built confidence and landed their dream jobs with our AI-powered platform.
          </p>
          <button onClick={onGetStarted} className="bg-white text-primary font-bold py-3 px-8 rounded-lg text-lg hover:bg-gray-200 transition-transform transform hover:scale-105 duration-300 shadow-lg">
            Start Your Free Trial Today
          </button>
          <p className="text-sm text-light mt-4">No credit card required.</p>
        </div>
      </div>
    </section>
  );
};

export default CtaSection;
