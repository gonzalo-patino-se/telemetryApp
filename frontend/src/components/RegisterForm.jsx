import React, { useState } from 'react';
import api from '../services/api';

const RegisterForm = () => {
    const [username, setUsername] = useState('');
    const [password, setPassword] = useState('');
    const [email, setEmail] = useState('');
    const [message, setMessage] = useState('');

    const handleRegister = async (e) => {
    e.preventDefault();
    setMessage('');
    try {
        const response = await api.post('/register/', {
        username,
        password,
        });
        setMessage('Registration successful! You can now log in.');
    } 
    catch (err) {
        if (err.response && err.response.data) {
            console.error('Validation errors:', err.response.data);
            setMessage(` ${Object.values(err.response.data).flat().join(' ')}`);
        } else {
            setMessage('Registration failed. Please try again.');
        }   
    };
};

    return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100">
        <form onSubmit={handleRegister} className="flex flex-col space-y-4 p-6 bg-white shadow rounded w-80">
        <h2 className="text-xl font-bold text-center">Register</h2>
        <input
            type="text"
            placeholder="Username"
            value={username}
            onChange={(e) => setUsername(e.target.value)}
            className="border p-2 rounded"
        />
        <input
            type="email"
            placeholder="Email"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            className="border p-2 rounded"
        />
        <input
            type="password"
            placeholder="Password"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            className="border p-2 rounded"
        />
        <button type="submit" className="bg-green-500 text-white px-4 py-2 rounded">
            Register
        </button>
        {message && <p className="text-blue-500 text-center">{message}</p>}
        </form>
    </div>
    );
};

export default RegisterForm;