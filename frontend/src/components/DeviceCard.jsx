import React from 'react';

const DeviceCard = ({ device }) => {
    return (
        <div className="border border-border-default rounded-lg p-4 bg-bg-surface">
            <h2 className="text-lg font-semibold text-text-primary mb-3">{device.name} ({device.deviceType})</h2>
            <div className="space-y-2">
                <div className="flex justify-between py-2 border-b border-border-subtle">
                    <span className="text-text-secondary text-sm">Serial</span>
                    <span className="text-text-primary font-mono text-sm">{device.device_serial}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-subtle">
                    <span className="text-text-secondary text-sm">MAC</span>
                    <span className="text-text-primary font-mono text-sm">{device.mac_address}</span>
                </div>
                <div className="flex justify-between py-2 border-b border-border-subtle">
                    <span className="text-text-secondary text-sm">Firmware</span>
                    <span className="text-text-primary text-sm">{device.firmware_version}</span>
                </div>
                <div className="flex justify-between py-2">
                    <span className="text-text-secondary text-sm">Local Time</span>
                    <span className="text-text-primary font-mono text-sm">{new Date(device.localtime).toLocaleString()}</span>
                </div>
            </div>
        </div>
    );
};

export default DeviceCard;