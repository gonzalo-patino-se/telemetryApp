import React from 'react';

const DeviceCard = ({ device }) => {
    return (
        <div className="border rounded shadow p-4 bg-white">
            <h2 className="text-lg font-bold mb-2">{device.name} ({device.deviceType})</h2>
            <p><strong>Serial:</strong> {device.device_serial}</p>
            <p><strong>MAC:</strong> {device.mac_address}</p>
            <p><strong>Firmware:</strong> {device.firmware_version}</p>
            <p><strong>Local Time:</strong> {new Date(device.localtime).toLocaleString()}</p>
        </div>
    );
};

export default DeviceCard;