// src/context/SerialContext.tsx
// Context for managing device serial number and related data fetching
// All cards depend on this - no serial = no data displayed

import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import api from '../services/api';

// Types for telemetry data from Azure ADX
export interface TelemetryData {
  serial: string;
  timestamp: string;
  // Add specific fields as needed when KQL queries are provided
  [key: string]: unknown;
}

export interface DeviceInfo {
  serial: string;
  deviceType?: string;
  firmwareVersion?: string;
  lastSeen?: string;
  status?: 'online' | 'offline' | 'unknown';
}

export interface WifiData {
  rssi?: number;
  signalStrength?: 'excellent' | 'good' | 'fair' | 'poor';
  timestamp?: string;
}

export interface VoltageData {
  pv1Voltage?: number;
  gridVoltage?: number;
  timestamp?: string;
}

interface SerialContextState {
  // Current serial number
  serial: string | null;
  
  // Computed: whether we have a valid serial
  hasSerial: boolean;
  
  // Loading states
  isSearching: boolean;
  isLoadingTelemetry: boolean;
  
  // Error state
  error: string | null;
  
  // Data states (null when no serial or not fetched)
  deviceInfo: DeviceInfo | null;
  wifiData: WifiData | null;
  voltageData: VoltageData | null;
  
  // Timestamps for data freshness
  lastFetch: Date | null;
}

interface SerialContextActions {
  // Set the serial number and trigger data fetch
  setSerial: (serial: string) => Promise<void>;
  
  // Set serial directly without API validation (use when already validated)
  setSerialDirect: (serial: string) => void;
  
  // Clear the serial and all data
  clearSerial: () => void;
  
  // Refresh data for current serial
  refreshData: () => Promise<void>;
  
  // Individual data fetchers (can be called manually)
  fetchDeviceInfo: () => Promise<void>;
  fetchWifiData: () => Promise<void>;
  fetchVoltageData: () => Promise<void>;
}

type SerialContextType = SerialContextState & SerialContextActions;

const initialState: SerialContextState = {
  serial: null,
  hasSerial: false,
  isSearching: false,
  isLoadingTelemetry: false,
  error: null,
  deviceInfo: null,
  wifiData: null,
  voltageData: null,
  lastFetch: null,
};

const SerialContext = createContext<SerialContextType | undefined>(undefined);

export const SerialProvider: React.FC<{ children: ReactNode }> = ({ children }) => {
  const [state, setState] = useState<SerialContextState>(initialState);

  // Helper to update state partially
  const updateState = useCallback((updates: Partial<SerialContextState>) => {
    setState(prev => ({ ...prev, ...updates }));
  }, []);

  // Search for serial and validate it exists
  const setSerial = useCallback(async (serial: string) => {
    if (!serial.trim()) {
      updateState({ error: 'Please enter a serial number' });
      return;
    }

    updateState({ 
      isSearching: true, 
      error: null,
      // Clear previous data while searching
      deviceInfo: null,
      wifiData: null,
      voltageData: null,
    });

    try {
      // Validate serial exists via API
      const response = await api.post('/search_serial/', { serial: serial.trim() });
      
      // Serial is valid - update state
      updateState({
        serial: serial.trim(),
        isSearching: false,
        deviceInfo: response.data || null,
        lastFetch: new Date(),
      });

      // Note: Additional data will be fetched by individual widgets
      // when they detect the serial has changed
      
    } catch (err: unknown) {
      const error = err as { response?: { status: number } };
      if (error.response?.status === 404) {
        updateState({ 
          isSearching: false, 
          error: 'Serial number not found',
          serial: null,
        });
      } else if (error.response?.status === 401) {
        updateState({ 
          isSearching: false, 
          error: 'Unauthorized. Please log in again.',
          serial: null,
        });
      } else {
        updateState({ 
          isSearching: false, 
          error: 'Error searching for device',
          serial: null,
        });
      }
    }
  }, [updateState]);

  // Set serial directly without API validation (use when already validated)
  const setSerialDirect = useCallback((serial: string) => {
    if (!serial.trim()) return;
    updateState({
      serial: serial.trim(),
      isSearching: false,
      error: null,
      lastFetch: new Date(),
    });
  }, [updateState]);

  // Clear all data
  const clearSerial = useCallback(() => {
    setState(initialState);
  }, []);

  // Refresh all data for current serial
  const refreshData = useCallback(async () => {
    if (!state.serial) return;
    
    updateState({ isLoadingTelemetry: true, error: null });
    
    try {
      // Fetch all data in parallel
      // These endpoints will be connected to Azure ADX via KQL queries
      // For now, we just refresh the device info
      const response = await api.post('/search_serial/', { serial: state.serial });
      
      updateState({
        isLoadingTelemetry: false,
        deviceInfo: response.data || null,
        lastFetch: new Date(),
      });
    } catch (err) {
      updateState({ 
        isLoadingTelemetry: false, 
        error: 'Error refreshing data' 
      });
    }
  }, [state.serial, updateState]);

  // Individual data fetchers - these will be called by specific widgets
  // Each will use its own KQL query endpoint
  const fetchDeviceInfo = useCallback(async () => {
    if (!state.serial) return;
    
    try {
      const response = await api.post('/search_serial/', { serial: state.serial });
      updateState({ deviceInfo: response.data || null });
    } catch (err) {
      console.error('Error fetching device info:', err);
    }
  }, [state.serial, updateState]);

  const fetchWifiData = useCallback(async () => {
    if (!state.serial) return;
    
    // TODO: Replace with actual KQL query endpoint
    // const response = await api.post('/adx/wifi/', { serial: state.serial });
    // updateState({ wifiData: response.data || null });
    
    // For now, just mark as null until API is connected
    updateState({ wifiData: null });
  }, [state.serial, updateState]);

  const fetchVoltageData = useCallback(async () => {
    if (!state.serial) return;
    
    // TODO: Replace with actual KQL query endpoint
    // const response = await api.post('/adx/voltage/', { serial: state.serial });
    // updateState({ voltageData: response.data || null });
    
    // For now, just mark as null until API is connected
    updateState({ voltageData: null });
  }, [state.serial, updateState]);

  // Compute hasSerial for convenience
  const hasSerial = state.serial !== null && state.serial !== '';

  const value: SerialContextType = {
    ...state,
    setSerial,
    setSerialDirect,
    clearSerial,
    refreshData,
    fetchDeviceInfo,
    fetchWifiData,
    fetchVoltageData,
    hasSerial,
  };

  return (
    <SerialContext.Provider value={value}>
      {children}
    </SerialContext.Provider>
  );
};

// Custom hook for using the serial context
export const useSerial = (): SerialContextType => {
  const context = useContext(SerialContext);
  if (context === undefined) {
    throw new Error('useSerial must be used within a SerialProvider');
  }
  return context;
};

// Helper hook to check if data should be displayed
export const useHasSerialData = (): boolean => {
  const { serial } = useSerial();
  return serial !== null;
};

export default SerialContext;
