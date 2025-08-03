import { useState } from 'react';

export default function WaitlistModal({ isOpen, onClose }) {
  const [formData, setFormData] = useState({
    name: '',
    email: '',
    memberType: '',
    socials: '',
    notes: '',
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
      const response = await fetch(
        'https://script.google.com/macros/s/AKfycbzWpwKvV60_Sd-QkfvxhL-8leiNt1VlTn4SRfzSN0mVY7XB3EszdHpENMVUt9QeBOWS/exec',
        {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify(formData),
          mode: 'no-cors',
        }
      );
      setSubmitted(true);
      setFormData({
        name: '',
        email: '',
        memberType: '',
        socials: '',
        notes: '',
      });
    } catch (err) {
      alert('Submission failed. Check your connection.');
    }
    setSubmitting(false);
    onClose();
  };

  if (!isOpen) return null;

  return (
    <div
      className="fixed inset-0 bg-black bg-opacity-80 flex items-center justify-center z-50"
      onClick={onClose}
    >
      <div
        className="bg-neutral-900 text-white rounded-2xl p-8 w-full max-w-md shadow-2xl relative animate-fadeIn border border-pink-600"
        onClick={(e) => e.stopPropagation()}
      >
        <button
          className="absolute top-3 right-4 text-gray-400 hover:text-pink-500 text-3xl font-bold"
          onClick={onClose}
        >
          ×
        </button>
        <h2 className="text-3xl font-bold mb-6 text-pink-500 text-center">
          Join the 3ROTIX Waitlist
        </h2>
        {submitted ? (
          <p className="text-green-400 font-semibold text-center mb-4">
            Thank you for joining! We’ll be in touch soon.
          </p>
        ) : (
          <form onSubmit={handleSubmit} className="space-y-5">
            <div>
              <label className="block mb-1 font-semibold text-pink-400">
                Name *
              </label>
              <input
                type="text"
                name="name"
                required
                placeholder="Enter your name"
                className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 focus:border-pink-500 focus:outline-none placeholder-gray-500"
                value={formData.name}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-pink-400">
                Email *
              </label>
              <input
                type="email"
                name="email"
                required
                placeholder="Enter your email"
                className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 focus:border-pink-500 focus:outline-none placeholder-gray-500"
                value={formData.email}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-pink-400">
                Member Type
              </label>
              <select
                name="memberType"
                className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 focus:border-pink-500 focus:outline-none"
                value={formData.memberType}
                onChange={handleChange}
                disabled={submitting}
              >
                <option value="">Select...</option>
                <option value="creator">Creator</option>
                <option value="builder">Builder</option>
                <option value="supporter">Supporter</option>
                <option value="other">Other</option>
              </select>
            </div>
            <div>
              <label className="block mb-1 font-semibold text-pink-400">
                Social Links
              </label>
              <input
                type="text"
                name="socials"
                placeholder="Linktree, Twitter, Telegram, etc."
                className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 focus:border-pink-500 focus:outline-none placeholder-gray-500"
                value={formData.socials}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
            <div>
              <label className="block mb-1 font-semibold text-pink-400">
                Notes
              </label>
              <textarea
                name="notes"
                rows="3"
                placeholder="Type any comments, feedback, etc..."
                className="w-full px-4 py-2 rounded bg-black text-white border border-gray-700 focus:border-pink-500 focus:outline-none placeholder-gray-500"
                value={formData.notes}
                onChange={handleChange}
                disabled={submitting}
              />
            </div>
            <button
              type="submit"
              className="w-full bg-pink-600 hover:bg-pink-700 text-white px-6 py-3 rounded-lg font-bold transition"
              disabled={submitting}
            >
              {submitting ? 'Submitting...' : 'Join the Movement'}
            </button>
          </form>
        )}
      </div>
    </div>
  );
}
