import React, { useState } from 'react';
import axios from 'axios';

export default function SearchBar({ onSearch }) {
    const [serial, setSerial] = useState('');

    const handleSearch = async () => {
        try {
            const token = localStorage.getItem('access'); // JWT
            const res = await axios.post('/api/search_serial/', { serial }, {
                headers: {
                    Authorization: `Bearer ${token}` }
            });
            onSearch(res.data);
        } catch (error) {
            alert(
                error.response?.data?.error || 
                error.response?.data?.message ||
                error.response?.data?.detail ||
                'Error searching serial number'
            
            );
        }
    };




    return (
        <div className="flex gap-2">
            <input
                type="text"
                placeholder="Enter Serial Number"
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
    );

}