// src/hooks/useAutoFetch.ts
// Hook for managing auto-fetch toggle state

import { useState, useCallback } from 'react';

interface UseAutoFetchOptions {
  /** Initial auto-fetch state (default: true) */
  defaultEnabled?: boolean;
  /** Parent-controlled auto-fetch state */
  controlledValue?: boolean;
  /** Callback when auto-fetch changes */
  onChange?: (value: boolean) => void;
}

interface UseAutoFetchReturn {
  /** Current auto-fetch state */
  autoFetch: boolean;
  /** Toggle or set auto-fetch state */
  setAutoFetch: (value: boolean) => void;
  /** Whether the state is controlled by parent */
  isControlled: boolean;
}

/**
 * Hook for managing auto-fetch toggle with support for controlled/uncontrolled modes
 */
export function useAutoFetch(options: UseAutoFetchOptions = {}): UseAutoFetchReturn {
  const { defaultEnabled = true, controlledValue, onChange } = options;
  
  const [internalValue, setInternalValue] = useState(defaultEnabled);
  const isControlled = controlledValue !== undefined;
  const autoFetch = isControlled ? controlledValue : internalValue;

  const setAutoFetch = useCallback((value: boolean) => {
    onChange?.(value);
    if (!isControlled) {
      setInternalValue(value);
    }
  }, [isControlled, onChange]);

  return {
    autoFetch,
    setAutoFetch,
    isControlled,
  };
}

export default useAutoFetch;
