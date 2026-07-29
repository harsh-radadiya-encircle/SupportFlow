import { useState, useEffect } from 'react';

/**
 * Custom hook for debouncing fast input state changes (e.g. search inputs)
 * @param value The raw input value
 * @param delay Delay in milliseconds (default: 400ms)
 */
export function useDebounce<T>(value: T, delay: number = 400): T {
  const [debouncedValue, setDebouncedValue] = useState<T>(value);

  useEffect(() => {
    const handler = setTimeout(() => {
      setDebouncedValue(value);
    }, delay);

    return () => {
      clearTimeout(handler);
    };
  }, [value, delay]);

  return debouncedValue;
}
