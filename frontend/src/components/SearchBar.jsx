import React, { useState } from 'react';
import axios from 'axios';
import { useAuth } from '../context/AuthContext';

export default function SearchBar({ onSearch }) {
    const [serial, setSerial] = useState('');
    const { accessToken, logout } = useAuth();

    const handleSearch = async () => {
        try {
            const res = await axios.post('/api/search_serial/', { serial }, {
                headers: {
                    Authorization: `Bearer ${token}` 
                }
            });
            onSearch(res.data);
        } catch (error) {
            if (error.response?.status === 401) {
                await logout(); //Auto-logout if token invalid
            }
                
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
                className="border border-border-default bg-bg-input text-text-primary p-2 rounded-md focus:ring-2 focus:ring-accent-primary focus:border-transparent placeholder:text-text-tertiary"
                />
            <button
                onClick={handleSearch}
                className="bg-accent-primary text-white px-4 py-2 rounded-md hover:bg-accent-hover transition-colors font-medium"
                >
                    Search
            </button>
        </div>
    );

}