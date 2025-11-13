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
        setError('Something went wrong. Please try again.');
        }
        console.error('Login error:', err);
    } finally {
        setLoading(false);
    }
    };

    return (
    <div className="flex items-center justify-center min-h-screen bg-gradient-to-br from-blue-50 to-blue-100">
        <form
        onSubmit={handleLogin}
        className="w-full max-w-md bg-white rounded-xl shadow-lg p-8 space-y-6"
        >
        <h2 className="text-3xl font-bold text-center text-gray-800">Welcome Back</h2>
        <p className="text-center text-gray-500">Please login to your account</p>

        <div className="space-y-4">
            <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />

            <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="w-full border border-gray-300 rounded-lg p-3 focus:outline-none focus:ring-2 focus:ring-blue-500"
            />
        </div>

        <button
            type="submit"
            disabled={loading}
            className={`w-full font-semibold py-3 rounded-lg transition duration-200 ${
            loading
                ? 'bg-blue-400 text-white cursor-not-allowed'
                : 'bg-blue-600 text-white hover:bg-blue-700'
            }`}
        >
            {loading ? 'Logging in...' : 'Login'}
        </button>

        <div className="text-center">
            <Link
            to="/register"
            className="text-blue-600 hover:underline text-sm"
            >
            Not registered? Sign up here.
            </Link>
        </div>

        {error && (
            <p className="text-red-500 text-center font-medium">{error}</p>
        )}
        </form>
    </div>
    );
    };

    export default LoginForm;