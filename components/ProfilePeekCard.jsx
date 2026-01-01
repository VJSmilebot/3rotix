import { useState } from 'react';

export function ProfilePeekCard({ user, children }) {
  const [show, setShow] = useState(false);

  return (
    <div
      className="relative inline-block"
      onMouseEnter={() => setShow(true)}
      onMouseLeave={() => setShow(false)}
    >
      {children}
      {show && (
        <div className="absolute z-10 bg-white border rounded shadow-lg p-4 w-64">
          <img src={user.image || '/default-avatar.png'} className="w-12 h-12 rounded-full mb-2" alt={user.handle} />
          <div className="font-bold">{user.handle}</div>
          <div className="text-sm text-gray-600">{user.displayName}</div>
          <div className="text-xs text-gray-500 mt-1">Bio placeholder</div>
        </div>
      )}
    </div>
  );
}