// File: pages/join.js

import { useState } from 'react';

export default function JoinForm() {
  const [form, setForm] = useState({
    name: '',
    email: '',
    memberType: '',
    telegram: '',
    instagram: '',
    twitter: '',
    website: '',
    notes: '',
  });

  const [status, setStatus] = useState('');

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm({ ...form, [name]: value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setStatus('Submitting...');

    try {
      const res = await fetch('/api/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(form),
      });

      if (res.ok) {
        setStatus('Submitted! Thank you.');
        setForm({
          name: '',
          email: '',
          memberType: '',
          telegram: '',
          instagram: '',
          twitter: '',
          website: '',
          notes: '',
        });
      } else {
        setStatus('Submission failed. Try again.');
      }
    } catch (err) {
      console.error(err);
      setStatus('An error occurred.');
    }
  };

  return (
    <div className="p-6 max-w-xl mx-auto">
      <h1 className="text-2xl font-bold mb-4">Join the 3ROTIX Community</h1>
      <form onSubmit={handleSubmit} className="space-y-4">
        <input name="name" value={form.name} onChange={handleChange} required placeholder="Name" className="w-full p-2 border" />
        <input name="email" value={form.email} onChange={handleChange} required placeholder="Email" type="email" className="w-full p-2 border" />
        <select name="memberType" value={form.memberType} onChange={handleChange} className="w-full p-2 border">
          <option value="">Select Member Type</option>
          <option value="Creator">Creator</option>
          <option value="Builder">Builder</option>
          <option value="Supporter">Supporter</option>
          <option value="Other">Other</option>
        </select>
        <input name="telegram" value={form.telegram} onChange={handleChange} placeholder="Telegram Handle" className="w-full p-2 border" />
        <input name="instagram" value={form.instagram} onChange={handleChange} placeholder="Instagram Handle" className="w-full p-2 border" />
        <input name="twitter" value={form.twitter} onChange={handleChange} placeholder="Twitter Handle" className="w-full p-2 border" />
        <input name="website" value={form.website} onChange={handleChange} placeholder="Website/Link" className="w-full p-2 border" />
        <textarea name="notes" value={form.notes} onChange={handleChange} placeholder="Notes" className="w-full p-2 border" />
        <button type="submit" className="bg-purple-600 text-white px-4 py-2">Submit</button>
        <p className="text-sm mt-2">{status}</p>
      </form>
    </div>
  );
}
