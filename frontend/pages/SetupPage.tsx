import React, { useState } from 'react';
import ManualEntryForm from '../components/ManualEntryForm';
import ResumeUploadForm from '../components/ResumeUploadForm';
import PracticeModeForm from '../components/PracticeModeForm';

type Tab = 'manual' | 'resume' | 'practice';

interface SetupPageProps {
  initialData?: any;
  onStart: (data: any) => void;
}

const SetupPage: React.FC<SetupPageProps> = ({ initialData, onStart }) => {
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
    switch (activeTab) {
      case 'manual':
        return <ManualEntryForm initialData={initialData?.type === 'Manual Entry' ? initialData : undefined} onSubmit={onStart} />;
      case 'resume':
        return <ResumeUploadForm initialData={initialData?.type === 'By Resume' ? initialData : undefined} onSubmit={onStart} />;
      case 'practice':
         return <PracticeModeForm initialData={initialData?.type === 'Practice Mode' ? initialData : undefined} onSubmit={onStart} />;
      default:
        return null;
    }
  };
  
  const TabButton: React.FC<{tabName: Tab, label: string}> = ({ tabName, label }) => (
    <button
      onClick={() => setActiveTab(tabName)}
      className={`px-6 py-3 font-semibold rounded-t-lg transition-colors duration-300 focus:outline-none ${
        activeTab === tabName
          ? 'bg-slate-800/50 border-b-2 border-primary text-white'
          : 'text-gray-400 hover:text-white'
      }`}
    >
      {label}
    </button>
  );

  return (
    <section className="py-16 md:py-24">
      <div className="container mx-auto px-6">
        <div className="max-w-6xl mx-auto">
          <div className="text-center mb-12">
            <h1 className="text-4xl md:text-5xl font-extrabold text-white">Interview Setup</h1>
            <p className="mt-4 text-lg text-gray-400">Configure your mock interview session.</p>
          </div>

          <div className="border-b border-slate-700 flex space-x-2">
            <TabButton tabName="manual" label="Manual Entry" />
            <TabButton tabName="resume" label="By Resume" />
            <TabButton tabName="practice" label="Practice Mode" />
          </div>

          <div className="mt-8">
            {renderTabContent()}
          </div>
        </div>
      </div>
    </section>
  );
};

export default SetupPage;