import React, { useState } from 'react';
import { UserIcon } from '../icons/UserIcon';

interface ProfilePageProps {
  initialData?: any;
  onSave: (data: any) => void;
  onBack: () => void;
}

const ProfilePage: React.FC<ProfilePageProps> = ({ initialData, onSave, onBack }) => {
  const [formData, setFormData] = useState({
    candidateName: initialData?.candidateName || '',
    experience: initialData?.experience || '',
    role: initialData?.role || '',
    topics: initialData?.topics || '',
    language: initialData?.language || '',
    targetCompany: initialData?.targetCompany || '',
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement | HTMLTextAreaElement>) => {
    const { name, value } = e.target;
    setFormData(prev => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    onSave(formData);
  };
  
  const languages = ["Python", "JavaScript", "TypeScript", "Java", "C++", "C#", "Go", "Rust", "PHP", "Ruby", "Swift", "Kotlin", "SQL"];

  return (
    <section className="min-h-screen py-16 md:py-24 bg-dark relative overflow-hidden">
      <div className="absolute inset-0 bg-grid-slate-800/[0.1] bg-center [mask-image:linear-gradient(180deg,white,rgba(255,255,255,0))]"></div>
      <div className="container mx-auto px-6 relative z-10">
        <div className="max-w-3xl mx-auto">
          <div className="text-center mb-12">
            <div className="flex justify-center items-center gap-3">
              <UserIcon className="h-8 w-8 text-primary" />
              <h1 className="text-4xl md:text-5xl font-extrabold text-white">Your Profile</h1>
            </div>
            <p className="mt-4 text-lg text-gray-400">Save your details here to quickly set up future mock interviews.</p>
          </div>

          <div className="bg-slate-900/50 border border-slate-700 rounded-xl shadow-2xl p-6 md:p-8">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                <FormInput label="Full Name" name="candidateName" type="text" placeholder="e.g., Jane Doe" value={formData.candidateName} onChange={handleChange} required />
                <FormInput label="Years of Experience" name="experience" type="number" placeholder="e.g., 5" value={formData.experience} onChange={handleChange} required />
              </div>
              
              <FormInput label="Default Role / Job Title" name="role" type="text" placeholder="e.g., Senior Software Engineer" value={formData.role} onChange={handleChange} required />
              
              <FormTextarea label="Common Topics" name="topics" placeholder="e.g., React Hooks, TypeScript, System Design..." value={formData.topics} onChange={handleChange} />

              <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
                 <FormSelect label="Preferred Language" name="language" value={formData.language} onChange={handleChange}>
                   <option value="">Select a language</option>
                   {languages.map(lang => <option key={lang} value={lang}>{lang}</option>)}
                   <option value="Not Applicable">Not applicable</option>
                   <option value="Other">Other</option>
                 </FormSelect>
                <FormInput label="Default Target Company" name="targetCompany" type="text" placeholder="e.g., Google" value={formData.targetCompany} onChange={handleChange} />
              </div>

              <div className="pt-4 flex flex-col sm:flex-row gap-4">
                <button type="button" onClick={onBack} className="w-full sm:w-auto flex-1 bg-slate-700 text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-slate-600 transition-colors duration-300">
                    Cancel
                </button>
                <button type="submit" className="w-full sm:w-auto flex-1 bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-500 transition-transform transform hover:scale-105 duration-300 shadow-lg shadow-primary/20">
                    Save Profile
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

// Reusable form components
const FormInput: React.FC<{ label: string; type: string; placeholder: string; name: string; value: string; onChange: (e: React.ChangeEvent<HTMLInputElement>) => void; required?: boolean; }> = ({ label, type, placeholder, name, value, onChange, required = false }) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-base font-medium text-gray-300">{label}</label>
        <input type={type} name={name} id={name} value={value} onChange={onChange} className="bg-slate-800 border border-slate-700 text-white text-base rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition" placeholder={placeholder} required={required} />
    </div>
);

const FormSelect: React.FC<{ label: string; name: string; children: React.ReactNode; value: string; onChange: (e: React.ChangeEvent<HTMLSelectElement>) => void; }> = ({ label, name, children, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-base font-medium text-gray-300">{label}</label>
        <select id={name} name={name} value={value} onChange={onChange} className="bg-slate-800 border border-slate-700 text-white text-base rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5">
            {children}
        </select>
    </div>
);

const FormTextarea: React.FC<{ label: string; name: string; placeholder: string; value: string; onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void; }> = ({ label, name, placeholder, value, onChange }) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-base font-medium text-gray-300">{label}</label>
        <textarea name={name} id={name} rows={3} value={value} onChange={onChange} className="bg-slate-800 border border-slate-700 text-white text-base rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition" placeholder={placeholder}></textarea>
    </div>
);


export default ProfilePage;
