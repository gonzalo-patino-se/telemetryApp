import React, { useState } from 'react';
import api from '../services/api';
import LogoutButton from './LogoutButton';
import DeviceInfoWidget from './DeviceInfoWidget';

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
        <div className="flex flex-col items-center justify-center min-h-screen bg-gray-100 space-y-6 p-6">
            <h1 className="text-3xl font-bold text-blue-600">Dashboard</h1>

            {/* Search Bar */}
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
                    className="bg-blue-500 text-white px-4 py-2 rounded hover:bg-blue-600"
                >
                    Search
                </button>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <DeviceInfoWidget serial={serial} />
            </div>

            {/* Error Message */}
            {error && <p className="text-red-500">{error}</p>}

            {/* Result Widgets */}
            {result && result.data && (
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 w-full max-w-4xl">
                    {result.data.map((device, index) => (
                        <div key={index} className="bg-white shadow rounded p-4">
                            <h2 className="text-lg font-bold mb-2">{device.name} ({device.deviceType})</h2>
                            <p><strong>Serial:</strong> {device.device_serial}</p>
                            <p><strong>MAC:</strong> {device.mac_address}</p>
                            <p><strong>Firmware:</strong> {device.firmware_version}</p>
                            <p><strong>Local Time:</strong> {new Date(device.localtime).toLocaleString()}</p>
                            <p><strong>Status:</strong> {device.status || 'Unknown'}</p>
                        </div>
                    ))}
                </div>
                
            )}

            {/* Logout Button */}
            <LogoutButton />
        </div>
    );
};

export default Dashboard;