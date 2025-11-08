import React, { useEffect, useState } from 'react';
import { useAdxQuery } from '../hooks/useAdxQuery';

const DevicePV1Widget = ({ serial }) => {
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
                const kqlTemplate = "Telemetry | where comms_serial contains '{serial}' | where name contains '/INV/DCPORT/STAT/PV1/V' | limit 1";
                const kql = kqlTemplate.replace('{serial}', serial);
                const result = await runQuery(kql);
                console.log('DevicePV1Widget Query Result:', result);
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
            <h2 className="text-lg font-bold mb-2">PV1 Voltage</h2>
            {loading && <p>Loading...</p>}
            {error && <p className="text-red-500">{error}</p>}
            {data && data.data && data.data.length > 0 ? (
                <>
                    <p><strong>Local Time:</strong> {new Date(data.data[0].localtime).toLocaleString()}</p>
                    <p><strong>Name:</strong> {data.data[0].name}</p>
                    <p><strong>Value:</strong> {data.data[0].value_double}</p>
                </>
            ) : (
                !loading && <p>No data available.</p>
            )}
        </div>
    );
};

export default DevicePV1Widget;