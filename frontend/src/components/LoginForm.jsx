import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';

const LoginForm = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');
    const [loading, setLoading] = useState(false);
    const navigate = useNavigate();

    const handleLogin = async (e) => {
        e.preventDefault();
        setError('');
        setLoading(true);
        try {
            const response = await api.post('/login/', { username, password });
            const { access, refresh } = response.data;
            login(access, refresh);
            navigate('/dashboard');
        } catch (err) {
            if (err.response && err.response.status === 401) {
                setError('Invalid username or password.');
            } else {
                setError('An error occurred. Please try again.');
            }
        } finally {
            setLoading(false);
        }
    };

    return (
        <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', padding: '16px' }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
                {/* Glass card */}
                <div style={{ 
                    background: 'rgba(30, 41, 59, 0.8)', 
                    backdropFilter: 'blur(20px)',
                    borderRadius: '24px', 
                    border: '1px solid rgba(148, 163, 184, 0.1)',
                    padding: '40px 32px',
                    boxShadow: '0 25px 50px -12px rgba(0, 0, 0, 0.5)'
                }}>
                    {/* Logo */}
                    <div style={{ textAlign: 'center', marginBottom: '32px' }}>
                        <div style={{ 
                            width: '56px', 
                            height: '56px', 
                            background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                            borderRadius: '16px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            margin: '0 auto 16px',
                            boxShadow: '0 10px 40px -10px rgba(59, 130, 246, 0.5)'
                        }}>
                            <svg style={{ width: '28px', height: '28px', color: 'white' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                            </svg>
                        </div>
                        <h1 style={{ fontSize: '24px', fontWeight: '700', color: '#f1f5f9', margin: '0 0 8px', letterSpacing: '-0.025em' }}>Welcome back</h1>
                        <p style={{ fontSize: '14px', color: '#94a3b8', margin: '0' }}>Sign in to your dashboard</p>
                    </div>

                    <form onSubmit={handleLogin}>
                        {error && (
                            <div style={{ 
                                padding: '12px 16px', 
                                background: 'rgba(239, 68, 68, 0.1)', 
                                border: '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: '12px',
                                marginBottom: '20px'
                            }}>
                                <p style={{ fontSize: '13px', color: '#f87171', margin: '0' }}>{error}</p>
                            </div>
                        )}

                        <div style={{ marginBottom: '20px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Enter your username"
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    fontSize: '14px',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                    borderRadius: '12px',
                                    color: '#f1f5f9',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <div style={{ marginBottom: '24px' }}>
                            <label style={{ display: 'block', fontSize: '13px', fontWeight: '500', color: '#cbd5e1', marginBottom: '8px' }}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Enter your password"
                                required
                                style={{
                                    width: '100%',
                                    padding: '14px 16px',
                                    fontSize: '14px',
                                    background: 'rgba(15, 23, 42, 0.6)',
                                    border: '1px solid rgba(148, 163, 184, 0.2)',
                                    borderRadius: '12px',
                                    color: '#f1f5f9',
                                    outline: 'none',
                                    transition: 'all 0.2s',
                                    boxSizing: 'border-box'
                                }}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                width: '100%',
                                padding: '14px',
                                fontSize: '14px',
                                fontWeight: '600',
                                background: 'linear-gradient(135deg, #3b82f6 0%, #8b5cf6 100%)',
                                border: 'none',
                                borderRadius: '12px',
                                color: 'white',
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                                transition: 'all 0.2s',
                                boxShadow: '0 10px 40px -10px rgba(59, 130, 246, 0.5)'
                            }}
                        >
                            {loading ? 'Signing in...' : 'Sign in'}
                        </button>
                    </form>

                    <div style={{ marginTop: '24px', paddingTop: '24px', borderTop: '1px solid rgba(148, 163, 184, 0.1)', textAlign: 'center' }}>
                        <p style={{ fontSize: '13px', color: '#94a3b8', margin: '0' }}>
                            Do not have an account?{' '}
                            <Link to="/register" style={{ color: '#60a5fa', textDecoration: 'none', fontWeight: '500' }}>Create one</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
