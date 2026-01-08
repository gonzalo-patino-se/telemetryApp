// src/components/LoginForm.jsx
import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom';
import Logo from './common/Logo';
import { colors, spacing, borderRadius, typography } from '../styles/tokens';
import { glassCardStyles, formStyles, buttonStyles } from '../styles/components';

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

    const styles = {
        page: {
            minHeight: '100vh',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            background: colors.gradients.background,
            padding: spacing.lg,
        },
        card: {
            ...glassCardStyles.container,
            width: '100%',
            maxWidth: '400px',
            padding: '40px 32px',
        },
        header: {
            textAlign: 'center',
            marginBottom: '32px',
        },
        title: {
            fontSize: typography.fontSize.xxl,
            fontWeight: typography.fontWeight.bold,
            color: colors.textPrimary,
            margin: '16px 0 8px',
            letterSpacing: '-0.025em',
        },
        subtitle: {
            fontSize: typography.fontSize.base,
            color: colors.textTertiary,
            margin: 0,
        },
        errorBox: {
            padding: '12px 16px',
            background: 'rgba(239, 68, 68, 0.1)',
            border: '1px solid rgba(239, 68, 68, 0.2)',
            borderRadius: borderRadius.lg,
            marginBottom: '20px',
        },
        errorText: {
            fontSize: typography.fontSize.sm,
            color: '#f87171',
            margin: 0,
        },
        inputGroup: {
            marginBottom: '20px',
        },
        input: {
            ...formStyles.input,
            padding: '14px 16px',
        },
        submitButton: {
            ...buttonStyles.base,
            ...buttonStyles.primary,
            width: '100%',
            padding: '14px 20px',
            fontSize: typography.fontSize.base,
            fontWeight: typography.fontWeight.semibold,
        },
        footer: {
            textAlign: 'center',
            marginTop: '24px',
        },
        footerText: {
            fontSize: typography.fontSize.sm,
            color: colors.textTertiary,
        },
        link: {
            color: colors.accentPrimary,
            textDecoration: 'none',
            fontWeight: typography.fontWeight.medium,
        },
    };

    return (
        <div style={styles.page}>
            <div style={styles.card}>
                <div style={styles.header}>
                    <Logo size="lg" showText={false} />
                    <h1 style={styles.title}>Welcome back</h1>
                    <p style={styles.subtitle}>Sign in to your dashboard</p>
                </div>

                <form onSubmit={handleLogin}>
                    {error && (
                        <div style={styles.errorBox}>
                            <p style={styles.errorText}>{error}</p>
                        </div>
                    )}

                    <div style={styles.inputGroup}>
                        <label style={formStyles.label}>Username</label>
                        <input
                            type="text"
                            value={username}
                            onChange={(e) => setUsername(e.target.value)}
                            placeholder="Enter your username"
                            required
                            style={styles.input}
                        />
                    </div>

                    <div style={styles.inputGroup}>
                        <label style={formStyles.label}>Password</label>
                        <input
                            type="password"
                            value={password}
                            onChange={(e) => setPassword(e.target.value)}
                            placeholder="Enter your password"
                            required
                            style={styles.input}
                        />
                    </div>

                    <button type="submit" disabled={loading} style={{...styles.submitButton, opacity: loading ? 0.7 : 1, cursor: loading ? 'not-allowed' : 'pointer'}}>
                        {loading ? 'Signing in...' : 'Sign in'}
                    </button>
                </form>

                <div style={styles.footer}>
                    <p style={styles.footerText}>
                        Do not have an account?{' '}
                        <Link to="/register" style={styles.link}>Create one</Link>
                    </p>
                </div>
            </div>
        </div>
    );
};

export default LoginForm;
