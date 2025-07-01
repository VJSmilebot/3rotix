import { useEffect, useState } from 'react';

export default function AgeGate() {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    const confirmed = localStorage.getItem('ageConfirmed');
    if (!confirmed) {
      setIsVisible(true);
    }
  }, []);

  const handleConfirm = () => {
    localStorage.setItem('ageConfirmed', 'true');
    setIsVisible(false);
  };

  const handleReject = () => {
    window.location.href = 'https://www.google.com';
  };

  if (!isVisible) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center bg-black bg-opacity-90 text-white">
      <div className="max-w-md p-6 bg-gray-900 rounded-lg shadow-lg text-center">
        <h2 className="text-xl font-bold mb-4">18+ Age Confirmation</h2>
        <p className="mb-6">This site contains content intended for adults only. Are you 18 or older?</p>
        <div className="flex justify-center space-x-4">
          <button
            onClick={handleConfirm}
            className="px-6 py-2 bg-pink-600 text-white rounded hover:bg-pink-700"
          >
            Yes, Enter
          </button>
          <button
            onClick={handleReject}
            className="px-6 py-2 bg-gray-600 text-white rounded hover:bg-gray-700"
          >
            No, Exit
          </button>
        </div>
      </div>
    </div>
  );
}
