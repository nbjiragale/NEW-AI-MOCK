import React from 'react';

const FormTextarea: React.FC<{ label: string; placeholder: string; name: string, rows?: number, value: string, onChange: (e: React.ChangeEvent<HTMLTextAreaElement>) => void, required?: boolean }> = ({ label, placeholder, name, rows = 4, value, onChange, required = false }) => (
    <div>
        <label htmlFor={name} className="block mb-2 text-base font-medium text-gray-300">{label}</label>
        <textarea
            name={name}
            id={name}
            rows={rows}
            value={value}
            onChange={onChange}
            className="bg-slate-800 border border-slate-700 text-white text-base rounded-lg focus:ring-primary focus:border-primary block w-full p-2.5 transition"
            placeholder={placeholder}
            required={required}
        ></textarea>
    </div>
);


interface NotesPracticeProps {
    value: string;
    onChange: (value: string) => void;
}

const NotesPractice: React.FC<NotesPracticeProps> = ({ value, onChange }) => {
    return (
        <FormTextarea
            label="Your Notes"
            name="notesContent"
            placeholder="Paste your notes here. The AI will generate questions based on this content."
            rows={8}
            value={value}
            onChange={(e) => onChange(e.target.value)}
            required
        />
    );
};

export default NotesPractice;
