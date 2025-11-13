import React, { useState } from 'react';
import ManualEntryForm from '../components/ManualEntryForm';
import ResumeUploadForm from '../components/ResumeUploadForm';
import PracticeModeForm from '../components/PracticeModeForm';
import { useInterview } from '../contexts/InterviewContext';
import { PencilIcon } from '../icons/PencilIcon';
import { UploadIcon } from '../icons/UploadIcon';
import { TargetIcon } from '../icons/TargetIcon';
import { SettingsIcon } from '../icons/SettingsIcon';

type Tab = 'manual' | 'resume' | 'practice';

const SetupPage: React.FC = () => {
  const { setupData: initialData, goToVerification } = useInterview();

  const getInitialTab = (): Tab => {
    if (!initialData) return 'manual';
    switch (initialData.type) {
      case 'Manual Entry': return 'manual';
      case 'By Resume': return 'resume';
      case 'Practice Mode': return 'practice';
      default: return 'manual';
    }
  };

  const [activeTab, setActiveTab] = useState<Tab>(getInitialTab());

  const renderTabContent = () => {
    const content = {
      manual: <ManualEntryForm initialData={initialData?.type === 'Manual Entry' ? initialData : undefined} onSubmit={goToVerification} />,
      resume: <ResumeUploadForm initialData={initialData?.type === 'By Resume' ? initialData : undefined} onSubmit={goToVerification} />,
      practice: <PracticeModeForm initialData={initialData?.type === 'Practice Mode' ? initialData : undefined} onSubmit={goToVerification} />,
    };
    return (
      <div key={activeTab} className="animate-fade-in-up" style={{ animationDuration: '0.5s' }}>
        {content[activeTab]}
      </div>
    );
  };
  
  const TabButton: React.FC<{ tabName: Tab; label: string; icon: React.ReactNode }> = ({ tabName, label, icon }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`flex-1 flex items-center justify-center gap-2 px-4 py-3 font-semibold rounded-lg transition-all duration-300 focus:outline-none focus:ring-2 focus:ring-primary/50 focus:ring-offset-2 focus:ring-offset-slate-900 ${
        activeTab === tabName
          ? 'bg-slate-700 text-white shadow-md'
          : 'text-gray-400 hover:bg-slate-800/50 hover:text-white'
      }`}
    >
      {icon}
      <span>{label}</span>
    </button>
  );

  return (
    <section className="min-h-screen py-16 md:py-24 bg-dark relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-slate-800/[0.1] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
        <div className="container mx-auto px-6 relative z-10">
            <div className="max-w-5xl mx-auto">
                <div className="text-center mb-12">
                    <div className="flex justify-center items-center gap-3">
                        <SettingsIcon className="h-8 w-8 text-primary" />
                        <h1 className="text-4xl md:text-5xl font-extrabold text-white">Interview Setup</h1>
                    </div>
                    <p className="mt-4 text-lg text-gray-400 max-w-2xl mx-auto">Configure your mock interview session. Your settings are not saved after you leave.</p>
                </div>

                <div className="bg-slate-900 border border-slate-700 rounded-xl shadow-2xl shadow-black/20 backdrop-blur-lg">
                    <div className="p-2">
                        <div className="flex flex-col sm:flex-row space-y-2 sm:space-y-0 sm:space-x-2 bg-slate-800/60 p-1.5 rounded-xl">
                            <TabButton tabName="manual" label="Manual Entry" icon={<PencilIcon className="h-5 w-5" />} />
                            <TabButton tabName="resume" label="By Resume" icon={<UploadIcon className="h-5 w-5" />} />
                            <TabButton tabName="practice" label="Practice Mode" icon={<TargetIcon className="h-5 w-5" />} />
                        </div>
                    </div>
                    <div className="p-4 md:p-8">
                        {renderTabContent()}
                    </div>
                </div>
            </div>
        </div>
    </section>
  );
};

export default SetupPage;
