import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';

const RegisterForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [message, setMessage] = useState('');
    const [isSuccess, setIsSuccess] = useState(false);
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleRegister = async (e) => {
        e.preventDefault();
        setMessage('');
        setIsSuccess(false);
        setLoading(true);
        try {
            const response = await api.post('/register/', { username, password });
            setIsSuccess(true);
            setMessage('Account created successfully! Redirecting...');
            setTimeout(() => navigate('/login'), 1500);
        } catch (err) {
            if (err.response && err.response.data) {
                setMessage(Object.values(err.response.data).flat().join(' '));
            } else {
                setMessage('Registration failed. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    const msgClass = isSuccess ? 'bg-green-500/10 border-green-500/20' : 'bg-red-500/10 border-red-500/20';
    const textClass = isSuccess ? 'text-green-400' : 'text-red-400';

    return (
        <div className="min-h-screen bg-[var(--bg-primary)] flex items-center justify-center p-4">
            <div className="w-full max-w-sm">
                <div className="text-center mb-8">
                    <div className="w-10 h-10 bg-[var(--accent-primary)] rounded-lg flex items-center justify-center mx-auto mb-3">
                        <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M18 9v3m0 0v3m0-3h3m-3 0h-3m-2-5a4 4 0 11-8 0 4 4 0 018 0zM3 20a6 6 0 0112 0v1H3v-1z" />
                        </svg>
                    </div>
                    <h1 className="text-xl font-semibold text-[var(--text-primary)]">Create account</h1>
                    <p className="text-sm text-[var(--text-secondary)] mt-1">Get started with your free account</p>
                </div>
                <div className="bg-[var(--bg-surface)] border border-[var(--border-primary)] rounded-xl p-6">
                    <form onSubmit={handleRegister} className="space-y-4">
                        {message && (
                            <div className={`p-3 rounded-lg border ${msgClass}`}>
                                <p className={`text-sm ${textClass}`}>{message}</p>
                            </div>
                        )}
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Username</label>
                            <input type="text" value={username} onChange={(e) => setUsername(e.target.value)} className="w-full px-3 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all" placeholder="Choose a username" required />
                        </div>
                        <div>
                            <label className="block text-sm font-medium text-[var(--text-secondary)] mb-1.5">Password</label>
                            <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} className="w-full px-3 py-2.5 bg-[var(--bg-primary)] border border-[var(--border-primary)] rounded-lg text-[var(--text-primary)] placeholder-[var(--text-muted)] focus:outline-none focus:ring-2 focus:ring-[var(--accent-primary)] focus:border-transparent transition-all" placeholder="Create a password" required />
                        </div>
                        <button type="submit" disabled={loading} className="w-full py-2.5 bg-[var(--accent-primary)] hover:bg-[var(--accent-primary-hover)] text-white font-medium rounded-lg transition-colors disabled:opacity-50 disabled:cursor-not-allowed">
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>
                    <div className="mt-4 pt-4 border-t border-[var(--border-primary)] text-center">
                        <p className="text-sm text-[var(--text-secondary)]">
                            Already have an account? <Link to="/login" className="text-[var(--accent-primary)] hover:underline font-medium">Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;
