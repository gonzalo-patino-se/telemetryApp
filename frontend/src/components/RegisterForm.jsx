import React, { useState } from 'react';
import api from '../services/api';
import { useNavigate, Link } from 'react-router-dom';
import { colors, borderRadius, spacing, transitions } from '../styles/tokens';
import { glassCardStyles, formStyles, buttonStyles } from '../styles/components';
import Logo from './common/Logo';

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

    return (
        <div style={{ 
            minHeight: '100vh', 
            display: 'flex', 
            alignItems: 'center', 
            justifyContent: 'center', 
            background: 'linear-gradient(135deg, #0f172a 0%, #1e293b 100%)', 
            padding: spacing.md 
        }}>
            <div style={{ width: '100%', maxWidth: '400px' }}>
                <div style={glassCardStyles.container}>
                    <div style={{ textAlign: 'center', marginBottom: spacing.xl }}>
                        <div style={{ display: 'flex', justifyContent: 'center', marginBottom: spacing.md }}>
                            <Logo size="md" showText={false} />
                        </div>
                        <h1 style={{ 
                            fontSize: '24px', 
                            fontWeight: '700', 
                            color: colors.textPrimary, 
                            margin: `0 0 ${spacing.sm}`, 
                            letterSpacing: '-0.025em' 
                        }}>Create account</h1>
                        <p style={{ fontSize: '14px', color: colors.textTertiary, margin: '0' }}>Get started with your free account</p>
                    </div>

                    <form onSubmit={handleRegister}>
                        {message && (
                            <div style={{ 
                                padding: `${spacing.sm} ${spacing.md}`, 
                                background: isSuccess ? 'rgba(16, 185, 129, 0.1)' : 'rgba(239, 68, 68, 0.1)', 
                                border: isSuccess ? '1px solid rgba(16, 185, 129, 0.2)' : '1px solid rgba(239, 68, 68, 0.2)',
                                borderRadius: borderRadius.md,
                                marginBottom: spacing.lg
                            }}>
                                <p style={{ fontSize: '13px', color: isSuccess ? colors.statusHealthy : colors.statusCritical, margin: '0' }}>{message}</p>
                            </div>
                        )}

                        <div style={{ marginBottom: spacing.lg }}>
                            <label style={formStyles.label}>Username</label>
                            <input
                                type="text"
                                value={username}
                                onChange={(e) => setUsername(e.target.value)}
                                placeholder="Choose a username"
                                required
                                style={formStyles.input}
                            />
                        </div>

                        <div style={{ marginBottom: spacing.xl }}>
                            <label style={formStyles.label}>Password</label>
                            <input
                                type="password"
                                value={password}
                                onChange={(e) => setPassword(e.target.value)}
                                placeholder="Create a password"
                                required
                                style={formStyles.input}
                            />
                        </div>

                        <button
                            type="submit"
                            disabled={loading}
                            style={{
                                ...buttonStyles.primary,
                                cursor: loading ? 'not-allowed' : 'pointer',
                                opacity: loading ? 0.7 : 1,
                            }}
                        >
                            {loading ? 'Creating account...' : 'Create account'}
                        </button>
                    </form>

                    <div style={{ 
                        marginTop: spacing.xl, 
                        paddingTop: spacing.xl, 
                        borderTop: `1px solid ${colors.borderSubtle}`, 
                        textAlign: 'center' 
                    }}>
                        <p style={{ fontSize: '13px', color: colors.textTertiary, margin: '0' }}>
                            Already have an account?{' '}
                            <Link to="/login" style={{ color: colors.accentPrimary, textDecoration: 'none', fontWeight: '500' }}>Sign in</Link>
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
};

export default RegisterForm;
