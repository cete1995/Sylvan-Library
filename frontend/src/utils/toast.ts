type ToastType = 'success' | 'error' | 'info' | 'warning';

interface ToastOptions {
  message: string;
  type?: ToastType;
  duration?: number;
}

const getToastStyles = (type: ToastType): string => {
  const baseStyles = 'fixed bottom-24 left-1/2 transform -translate-x-1/2 px-6 py-3 rounded-lg shadow-lg z-50 font-semibold text-sm md:text-base max-w-md text-center';
  
  switch (type) {
    case 'success':
      return `${baseStyles} bg-green-500 text-white`;
    case 'error':
      return `${baseStyles} bg-red-500 text-white`;
    case 'warning':
      return `${baseStyles} bg-yellow-500 text-gray-900`;
    case 'info':
      return `${baseStyles} bg-blue-500 text-white`;
    default:
      return `${baseStyles} bg-gray-800 text-white`;
  }
};

const getToastIcon = (type: ToastType): string => {
  switch (type) {
    case 'success':
      return '✓';
    case 'error':
      return '✕';
    case 'warning':
      return '⚠';
    case 'info':
      return 'ⓘ';
    default:
      return '';
  }
};

export const showToast = ({ message, type = 'info', duration = 3000 }: ToastOptions): void => {
  const toast = document.createElement('div');
  toast.className = getToastStyles(type);
  
  const icon = getToastIcon(type);
  toast.textContent = icon ? `${icon} ${message}` : message;
  
  // Add animation
  toast.style.animation = 'slideUp 0.3s ease-out';
  
  // Add CSS animation if not already present
  if (!document.getElementById('toast-styles')) {
    const style = document.createElement('style');
    style.id = 'toast-styles';
    style.textContent = `
      @keyframes slideUp {
        from {
          transform: translate(-50%, 100px);
          opacity: 0;
        }
        to {
          transform: translate(-50%, 0);
          opacity: 1;
        }
      }
      @keyframes slideDown {
        from {
          transform: translate(-50%, 0);
          opacity: 1;
        }
        to {
          transform: translate(-50%, 100px);
          opacity: 0;
        }
      }
    `;
    document.head.appendChild(style);
  }
  
  document.body.appendChild(toast);
  
  setTimeout(() => {
    toast.style.animation = 'slideDown 0.3s ease-in';
    setTimeout(() => {
      toast.remove();
    }, 300);
  }, duration);
};

// Convenience methods
export const toast = {
  success: (message: string, duration?: number) => showToast({ message, type: 'success', duration }),
  error: (message: string, duration?: number) => showToast({ message, type: 'error', duration }),
  warning: (message: string, duration?: number) => showToast({ message, type: 'warning', duration }),
  info: (message: string, duration?: number) => showToast({ message, type: 'info', duration }),
};
