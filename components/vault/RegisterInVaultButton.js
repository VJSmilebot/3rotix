// components/vault/RegisterInVaultButton.js
'use client';

import { useEffect, useState } from 'react';

export default function RegisterInVaultButton({ media, isRegistered: isRegisteredProp }) {
  const [loading, setLoading] = useState(false);
  const [registered, setRegistered] = useState(!!isRegisteredProp);

  // keep local state in sync with what Studio tells us
  useEffect(() => {
    setRegistered(!!isRegisteredProp);
  }, [isRegisteredProp]);

  const handleClick = async () => {
    if (registered || loading) return;

    setLoading(true);
    try {
      const res = await fetch('/api/vault/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          mediaId: media.id,
          mediaType: 'video',
        }),
      });

      const data = await res.json().catch(() => ({}));

      if (!res.ok) {
        console.error('[RegisterInVaultButton] error:', data);
        alert(data.error || 'Failed to register in Vault');
      } else {
        // success – lock the button + change label
        setRegistered(true);
      }
    } catch (err) {
      console.error('[RegisterInVaultButton] error:', err);
      alert('Something went wrong while registering this clip.');
    } finally {
      setLoading(false);
    }
  };

  const label = registered
    ? 'In Vault'
    : loading
    ? 'Registering…'
    : 'Register in Vault';

  return (
    <button
      type="button"
      onClick={handleClick}
      disabled={registered || loading}
      className={`px-2 py-1 rounded-md text-[11px] border ${
        registered
          ? 'border-emerald-500/70 text-emerald-300 bg-emerald-500/10 cursor-default'
          : 'border-gray-700 text-gray-200 hover:border-pink-500 hover:text-pink-300'
      }`}
    >
      {label}
    </button>
  );
}
