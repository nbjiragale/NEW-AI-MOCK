import React, { useState } from 'react';

const faqData = [
  {
    question: 'How does the AI evaluate my answers?',
    answer: 'Our AI uses advanced Natural Language Processing (NLP) models to analyze the content of your answers, your word choice, speech patterns, and even vocal tone. It compares them against ideal responses for your specific role to provide targeted feedback.'
  },
  {
    question: 'Is my interview data kept private?',
    answer: 'Absolutely. We prioritize your privacy. All interview sessions are encrypted and stored securely. You have full control over your data and can delete your history at any time. We do not share your data with any third parties.'
  },
  {
    question: 'What kind of roles can I practice for?',
    answer: 'We have a comprehensive library of roles across various industries, including software engineering, product management, marketing, sales, finance, and UX/UI design. We are constantly adding new roles and question sets.'
  },
  {
    question: 'Can I use this on my mobile device?',
    answer: 'Yes, InterviewAI is fully responsive and works on all modern browsers across desktops, tablets, and mobile phones. You can practice on the go, whenever you have a spare moment.'
  }
];

interface FAQItemProps {
    question: string;
    answer: string;
    isOpen: boolean;
    onClick: () => void;
}

const FAQItem: React.FC<FAQItemProps> = ({ question, answer, isOpen, onClick }) => {
  return (
    <div className="border-b border-slate-700">
      <button onClick={onClick} className="w-full text-left py-6 flex justify-between items-center">
        <span className="text-lg font-semibold text-white">{question}</span>
        <span className={`transform transition-transform duration-300 ${isOpen ? 'rotate-45' : 'rotate-0'}`}>
          <svg xmlns="http://www.w3.org/2000/svg" className="h-6 w-6 text-primary" fill="none" viewBox="0 0 24 24" stroke="currentColor">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
          </svg>
        </span>
      </button>
      <div className={`overflow-hidden transition-all duration-300 ease-in-out ${isOpen ? 'max-h-96' : 'max-h-0'}`}>
        <p className="pb-6 text-gray-400">{answer}</p>
      </div>
    </div>
  );
};

const FaqSection: React.FC = () => {
  const [openIndex, setOpenIndex] = useState<number | null>(0);

  const handleToggle = (index: number) => {
    setOpenIndex(openIndex === index ? null : index);
  };

  return (
    <section id="faq" className="py-20 md:py-32 bg-dark">
      <div className="container mx-auto px-6">
        <div className="text-center max-w-3xl mx-auto mb-16">
          <h2 className="text-3xl md:text-4xl font-extrabold text-white">Frequently Asked Questions</h2>
          <p className="mt-4 text-lg text-gray-400">
            Have questions? We have answers. If you can't find what you're looking for, feel free to contact us.
          </p>
        </div>
        <div className="max-w-3xl mx-auto">
          {faqData.map((faq, index) => (
            <FAQItem
              key={index}
              question={faq.question}
              answer={faq.answer}
              isOpen={openIndex === index}
              onClick={() => handleToggle(index)}
            />
          ))}
        </div>
      </div>
    </section>
  );
};

export default FaqSection;