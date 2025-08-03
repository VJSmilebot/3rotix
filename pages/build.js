// pages/build.js
import { useState } from 'react';
import Image from 'next/image';
import logo from '../public/logo.png';

export default function Build() {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    message: '',
  });
  const [submitted, setSubmitted] = useState(false);
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setSubmitting(true);
    try {
      const res = await fetch('https://formspree.io/f/xgvybjoy', {
        method: 'POST',
        headers: { 'Accept': 'application/json' },
        body: JSON.stringify(formData),
      });
      if (res.ok) {
        setSubmitted(true);
      }
    } catch (err) {
      // Optionally handle error
    }
    setSubmitting(false);
  };

  return (
    <div className="relative min-h-screen flex flex-col justify-center items-center text-white px-4 py-16 text-center bg-black">
      {/* Background Logo */}
      <div className="absolute inset-0 flex justify-center items-center opacity-10 pointer-events-none z-0">
        <Image
          src={logo}
          alt="3ROTIX Logo"
          width={900}
          height={400}
          style={{ objectFit: 'contain' }}
        />
      </div>
      <div className="z-10 max-w-3xl space-y-6">
        <h1 className="text-6xl font-bold mb-4">Build With Us</h1>
        <p className="text-xl">
          3ROTIX isn't just a platform — it's a movement. We're building something new, something better — and we want you to help shape it.
        </p>
        <p className="text-lg">
          Whether you're a creator, fan, dev, designer, strategist, or someone with ideas and good vibes — you're invited to be part of our contributor program.
        </p>
        <h2 className="text-4xl mt-10 mb-4 font-semibold">Early Roles</h2>
        <ul className="text-left text-lg list-disc pl-6 space-y-2">
          <li><strong>🛠 OG Builder:</strong> Join before launch. Get your name on the wall. Forever part of 3ROTIX history.</li>
          <li><strong>📡 Signal Scout:</strong> Invite other creators or fans. Help us grow — earn perks and early access.</li>
          <li><strong>🐞 Bug Buster:</strong> Spot issues, make suggestions. Help us improve — get acknowledged.</li>
          <li><strong>🧪 Beta Tester:</strong> Be the first to test tools and give feedback. Your input will shape the platform.</li>
        </ul>
        <h2 className="text-4xl mt-10 mb-4 font-semibold">Interested?</h2>
        <p className="text-lg mb-6">
          Fill out the form below and tell us how you want to help. This is just the beginning.
        </p>
        {submitted ? (
          <p className="text-green-400 font-semibold">Thank you for joining! We’ll be in touch soon.</p>
        ) : (
          <form
            onSubmit={handleSubmit}
            className="space-y-4 max-w-md mx-auto"
          >
            <input
              type="text"
              name="name"
              placeholder="Your name"
              required
              className="w-full p-2 rounded text-black"
              value={formData.name}
              onChange={handleChange}
              disabled={submitting}
            />
            <input
              type="email"
              name="email"
              placeholder="Your email"
              required
              className="w-full p-2 rounded text-black"
              value={formData.email}
              onChange={handleChange}
              disabled={submitting}
            />
            <textarea
              name="message"
              placeholder="Tell us about yourself"
              rows="4"
              required
              className="w-full p-2 rounded text-black"
              value={formData.message}
              onChange={handleChange}
              disabled={submitting}
            ></textarea>
            <button
              type="submit"
              className="bg-pink-600 hover:bg-pink-700 text-white py-2 px-6 rounded"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Submit'}
            </button>
          </form>
        )}
        <p className="text-pink-400 mt-6 text-sm">You’ll hear from us soon. OGs will be rewarded.</p>
      </div>
    </div>
  );
}
