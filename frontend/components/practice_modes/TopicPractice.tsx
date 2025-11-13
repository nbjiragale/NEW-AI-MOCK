import React from 'react';

const FormInput: React.FC<{ label: string; type: string; placeholder: string; name: string, value: string, onChange: (e: React.ChangeEvent<HTMLInputElement>) => void, required?: boolean }> = ({ label, type, placeholder, name, value, onChange, required = false }) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-base font-medium text-gray-300">{label}</label>
        <input
            type={type}
            name={name}
            id={name}
            value={value}
            onChange={onChange}
            className="bg-slate-800 border border-slate-700 text-white text-base rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition"
            placeholder={placeholder}
            required={required}
        />
    </div>
);


interface TopicPracticeProps {
    value: string;
    onChange: (value: string) => void;
}

const TopicPractice: React.FC<TopicPracticeProps> = ({ value, onChange }) => {
    return (
        <FormInput
            label="Topic Name"
            name="topicName"
            type="text"
            placeholder="e.g., React Hooks, SQL Joins"
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required
        />
    );
};

export default TopicPractice;
