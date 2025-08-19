import { useState, useCallback } from 'react';

interface AsyncOperationState<T> {
  isLoading: boolean;
  error: string | null;
  data: T | null;
}

export const useAsyncOperation = <T = any>() => {
  const [state, setState] = useState<AsyncOperationState<T>>({
    isLoading: false,
    error: null,
    data: null,
  });

  const execute = useCallback(async (
    operation: () => Promise<T>,
    onSuccess?: (data: T) => void,
    onError?: (error: Error) => void
  ): Promise<T | null> => {
    setState(prev => ({ ...prev, isLoading: true, error: null }));

    try {
      const result = await operation();
      setState(prev => ({ ...prev, isLoading: false, data: result }));
      onSuccess?.(result);
      return result;
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'An unknown error occurred';
      setState(prev => ({ ...prev, isLoading: false, error: errorMessage }));
      onError?.(error instanceof Error ? error : new Error(errorMessage));
      return null;
    }
  }, []);

  const reset = useCallback(() => {
    setState({
      isLoading: false,
      error: null,
      data: null,
    });
  }, []);

  return {
    ...state,
    execute,
    reset,
  };
};