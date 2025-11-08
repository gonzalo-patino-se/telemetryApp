import React, { useEffect, useState } from 'react';
import { useAdxQuery } from '../hooks/useAdxQuery';

const DeviceInfoWidget = ({ serial }) => {
    const { runQuery } = useAdxQuery();
    const [data, setData] = useState(null);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState('');

    useEffect(() => {
        if (!serial) return;
        const fetchData = async () => {
            setLoading(true);
            setError('');
            try {
                const kqlTemplate = "DevInfo | where comms_serial contains '{serial}' | limit 1";
                const kql = kqlTemplate.replace('{serial}', serial);
                const result = await runQuery(kql);
                console.log('DeviceInfoWidget Query Result:', result);
                setData(result);
            } catch (err) {
                setError('Failed to load device info.');
                console.error(err);
            } finally {
                setLoading(false);
            }
        };
        fetchData();
    }, [serial]);

    return (
        <div className="bg-white shadow rounded p-4">
            <h2 className="text-lg font-bold mb-2">Device Info</h2>
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {data && data.data && data.data.length > 0 ? (
                <>
                    <p><strong>Serial:</strong> {data.data[0].device_serial}</p>
                    <p><strong>MAC:</strong> {data.data[0].mac_address}</p>
                    <p><strong>Firmware:</strong> {data.data[0].firmware_version}</p>
                    <p><strong>Local Time:</strong> {new Date(data.data[0].localtime).toLocaleString()}</p>
                </>
            ) : (
                !loading && <p>No data available.</p>
            )}
        </div>
    );
};

export default DeviceInfoWidget;