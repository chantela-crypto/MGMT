// Button interaction utilities and helpers
export const debounce = <T extends (...args: any[]) => any>(
  func: T,
  wait: number
): ((...args: Parameters<T>) => void) => {
  let timeout: NodeJS.Timeout;
  return (...args: Parameters<T>) => {
    clearTimeout(timeout);
    timeout = setTimeout(() => func(...args), wait);
  };
};

export const throttle = <T extends (...args: any[]) => any>(
  func: T,
  limit: number
): ((...args: Parameters<T>) => void) => {
  let inThrottle: boolean;
  return (...args: Parameters<T>) => {
    if (!inThrottle) {
      func(...args);
      inThrottle = true;
      setTimeout(() => inThrottle = false, limit);
    }
  };
};

// Safe error handling wrapper for button actions
export const safeButtonAction = async <T>(
  action: () => Promise<T> | T,
  onSuccess?: (result: T) => void,
  onError?: (error: Error) => void
): Promise<{ success: boolean; result?: T; error?: Error }> => {
  try {
    const result = await action();
    onSuccess?.(result);
    return { success: true, result };
  } catch (error) {
    const err = error instanceof Error ? error : new Error('Unknown error');
    onError?.(err);
    return { success: false, error: err };
  }
};

// Prevent double-click submissions
export const preventDoubleClick = (handler: () => void, delay: number = 1000) => {
  let isProcessing = false;
  
  return () => {
    if (isProcessing) return;
    
    isProcessing = true;
    handler();
    
    setTimeout(() => {
      isProcessing = false;
    }, delay);
  };
};

// Form submission helper
export const handleFormSubmission = (
  e: React.FormEvent,
  onSubmit: () => void | Promise<void>,
  validation?: () => boolean
) => {
  e.preventDefault();
  
  if (validation && !validation()) {
    return;
  }
  
  onSubmit();
};