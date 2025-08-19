import { renderHook, act } from '@testing-library/react';
import { useAsyncOperation } from '../hooks/useAsyncOperation';

describe('useAsyncOperation', () => {
  it('should handle successful async operations', async () => {
    const { result } = renderHook(() => useAsyncOperation());

    const mockOperation = vi.fn().mockResolvedValue('success');
    const mockOnSuccess = vi.fn();

    await act(async () => {
      const response = await result.current.execute(mockOperation, mockOnSuccess);
      expect(response).toBe('success');
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe('success');
    expect(mockOnSuccess).toHaveBeenCalledWith('success');
  });

  it('should handle failed async operations', async () => {
    const { result } = renderHook(() => useAsyncOperation());

    const mockOperation = vi.fn().mockRejectedValue(new Error('Operation failed'));
    const mockOnError = vi.fn();

    await act(async () => {
      const response = await result.current.execute(mockOperation, undefined, mockOnError);
      expect(response).toBe(null);
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe('Operation failed');
    expect(mockOnError).toHaveBeenCalledWith(expect.any(Error));
  });

  it('should set loading state during operation', async () => {
    const { result } = renderHook(() => useAsyncOperation());

    const mockOperation = vi.fn().mockImplementation(() => 
      new Promise(resolve => setTimeout(() => resolve('success'), 100))
    );

    act(() => {
      result.current.execute(mockOperation);
    });

    expect(result.current.isLoading).toBe(true);

    await act(async () => {
      await new Promise(resolve => setTimeout(resolve, 150));
    });

    expect(result.current.isLoading).toBe(false);
  });

  it('should reset state correctly', () => {
    const { result } = renderHook(() => useAsyncOperation());

    act(() => {
      result.current.reset();
    });

    expect(result.current.isLoading).toBe(false);
    expect(result.current.error).toBe(null);
    expect(result.current.data).toBe(null);
  });
});