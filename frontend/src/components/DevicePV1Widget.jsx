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
        <div className="bg-bg-surface border border-border-default rounded-lg p-4">
            <h2 className="text-lg font-semibold text-text-primary mb-3">PV1 Voltage</h2>
            {loading && (
                <div className="flex items-center gap-2 text-text-secondary">
                    <svg className="animate-spin h-4 w-4" fill="none" viewBox="0 0 24 24">
                        <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                        <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                    </svg>
                    <span>Loading...</span>
                </div>
            )}
            {error && <p className="text-status-critical text-sm">{error}</p>}
            {data && data.data && data.data.length > 0 ? (
                <div className="space-y-2">
                    <div className="flex justify-between py-2 border-b border-border-subtle">
                        <span className="text-text-secondary text-sm">Local Time</span>
                        <span className="text-text-primary font-mono text-sm">{new Date(data.data[0].localtime).toLocaleString()}</span>
                    </div>
                    <div className="flex justify-between py-2 border-b border-border-subtle">
                        <span className="text-text-secondary text-sm">Name</span>
                        <span className="text-text-primary font-mono text-sm">{data.data[0].name}</span>
                    </div>
                    <div className="flex justify-between py-2">
                        <span className="text-text-secondary text-sm">Value</span>
                        <span className="text-accent-primary font-semibold">{data.data[0].value_double}</span>
                    </div>
                </div>
            ) : (
                !loading && <p className="text-text-tertiary text-sm">No data available.</p>
            )}
        </div>
    );
};

export default DevicePV1Widget;