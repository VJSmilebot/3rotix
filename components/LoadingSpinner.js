// components/LoadingSpinner.js

const LoadingSpinner = ({ size = 'md', className = '' }) => {
  const sizeClasses = {
    sm: 'w-4 h-4',
    md: 'w-8 h-8',
    lg: 'w-12 h-12',
    xl: 'w-16 h-16'
  };

  return (
    <div className={`inline-block animate-spin rounded-full border-2 border-gray-300 border-t-pink-600 ${sizeClasses[size]} ${className}`} />
  );
};

export const LoadingPage = ({ message = 'Loading...' }) => (
  <div className="min-h-screen bg-black text-white flex items-center justify-center">
    <div className="text-center">
      <LoadingSpinner size="xl" className="mx-auto mb-4" />
      <p className="text-lg text-gray-300">{message}</p>
    </div>
  </div>
);

export const LoadingButton = ({ loading, children, ...props }) => (
  <button disabled={loading} {...props}>
    {loading ? (
      <div className="flex items-center justify-center gap-2">
        <LoadingSpinner size="sm" />
        <span>Loading...</span>
      </div>
    ) : (
      children
    )}
  </button>
);

export default LoadingSpinner;