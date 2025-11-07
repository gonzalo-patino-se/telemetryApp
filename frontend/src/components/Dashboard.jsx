import React, { useState } from 'react';
import api from '../services/api';

const Dashboard = () => {
    const [serial, setSerial] = useState('');
    const [result, setResult] = useState(null);
    const [error, setError] = useState('');

    const handleSearch = async () => {
    setError('');
    setResult(null);
    try {
        const response = await api.post('/search_serial/', { serial });
        setResult(response.data);
    } catch (err) {
        if (err.response && err.response.status === 404) {
        setError('Serial number not found.');
        } else if (err.response && err.response.status === 401) {
        setError('Unauthorized. Please log in.');
        } else {
        setError('Error searching serial.');
        }
        console.error('Search error:', err);
    }
    };

    return (
    <div className="flex flex-col items-center justify-center h-screen bg-gray-100 space-y-4">
        <h1 className="text-3xl font-bold text-blue-600">Dashboard</h1>
        <div className="flex space-x-2">
        <input
            type="text"
            placeholder="Enter serial number"
            value={serial}
            onChange={(e) => setSerial(e.target.value)}
            className="border p-2 rounded"
        />
        <button
            onClick={handleSearch}
            className="bg-blue-500 text-white px-4 py-2 rounded"
        >
            Search
        </button>
        </div>
        {error && <p className="text-red-500">{error}</p>}
        {result && (
        <div className="bg-white shadow rounded p-4 w-96">
            <h2 className="font-bold">Search Result:</h2>
            <pre className="text-sm">{JSON.stringify(result, null, 2)}</pre>
        </div>
        )}
    </div>
    );
};

export default Dashboard;

