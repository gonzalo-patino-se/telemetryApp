import React, { useState } from 'react';
import api from '../services/api';
import { useAuth } from '../context/AuthContext';

const LoginForm = () => {
    const { login } = useAuth();
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [error, setError] = useState('');

    const handleLogin = async (e) => {
    e.preventDefault();
    setError('');
    try {
        const response = await api.post('/login/', { username, password });
        const { access, refresh } = response.data;
        login(access, refresh);
    } catch (err) {
        setError('Invalid credentials');
        console.error('Login error:', err);
    }
    };

    return (
    <form onSubmit={handleLogin} className="flex flex-col space-y-4 p-4 bg-white shadow rounded">
        <input
        type="text"
        placeholder="Username"
        value={username}
        onChange={(e) => setUsername(e.target.value)}
        className="border p-2 rounded"
        />
        <input
        type="password"
        placeholder="Password"
        value={password}
        onChange={(e) => setPassword(e.target.value)}
        className="border p-2 rounded"
        />
        <button type="submit" className="bg-blue-500 text-white px-4 py-2 rounded">
        Login
        </button>
        {error && <p className="text-red-500">{error}</p>}
    </form>
    );
    };

export default LoginForm;