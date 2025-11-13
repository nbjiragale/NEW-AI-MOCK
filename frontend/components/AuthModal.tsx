import React, { useState } from 'react';
import { useAuth } from '../contexts/AuthContext';

const SpinnerIcon: React.FC<{ className?: string }> = ({ className = "h-5 w-5" }) => (
    <svg className={`animate-spin text-white ${className}`} xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
    </svg>
);

interface AuthModalProps {
    isOpen: boolean;
    onClose: () => void;
}

const AuthModal: React.FC<AuthModalProps> = ({ isOpen, onClose }) => {
    const [email, setEmail] = useState('');
    const [loading, setLoading] = useState(false);
    const [message, setMessage] = useState('');
    const [error, setError] = useState('');
    const { signInWithEmail } = useAuth();

    const handleLogin = async (e: React.FormEvent) => {
        e.preventDefault();
        setError('');
        setMessage('');
        setLoading(true);
        const { error } = await signInWithEmail(email);
        if (error) {
            setError(error.message);
        } else {
            setMessage('Check your email for the magic link!');
        }
        setLoading(false);
    };

    if (!isOpen) return null;

    return (
        <div 
            className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 animate-fade-in-up" 
            style={{ animationDuration: '0.3s' }}
            onClick={onClose}
        >
            <div 
                className="bg-slate-900 rounded-xl shadow-2xl border border-slate-700 w-full max-w-md m-4"
                onClick={(e) => e.stopPropagation()}
            >
                <div className="p-8 space-y-6">
                    <div className="text-center">
                        <h2 className="text-2xl font-bold text-white">Join InterviewAI</h2>
                        <p className="text-gray-400 mt-2">Enter your email to receive a secure magic link to sign in.</p>
                    </div>

                    <form onSubmit={handleLogin} className="space-y-4">
                        <div>
                            <label htmlFor="email" className="sr-only">Email address</label>
                            <input
                                id="email"
                                name="email"
                                type="email"
                                autoComplete="email"
                                required
                                value={email}
                                onChange={(e) => setEmail(e.target.value)}
                                className="bg-slate-800 border border-slate-700 text-white text-base rounded-lg focus:ring-primary focus:border-primary block w-full p-3 transition"
                                placeholder="you@example.com"
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading || !!message}
                            className="w-full flex justify-center items-center gap-2 bg-primary text-white font-bold py-3 px-8 rounded-lg text-lg hover:bg-blue-500 transition-transform transform hover:scale-105 duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
                        >
                            {loading && <SpinnerIcon />}
                            <span>Send Magic Link</span>
                        </button>
                    </form>
                    
                    {message && <p className="text-center text-green-400">{message}</p>}
                    {error && <p className="text-center text-red-400">{error}</p>}

                </div>
                 <div className="bg-slate-800/50 p-4 text-center text-xs text-gray-500 rounded-b-xl">
                    We respect your privacy. No password required.
                </div>
            </div>
        </div>
    );
};

export default AuthModal;