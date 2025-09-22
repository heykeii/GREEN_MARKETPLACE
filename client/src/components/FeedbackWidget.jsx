import React, { useState } from 'react';
import { api } from '@/utils/apiClient';
import { toast } from '@/utils/toast';

const categories = [
  { value: 'feedback', label: 'General feedback' },
  { value: 'comment', label: 'Comment' },
  { value: 'suggestion', label: 'Suggestion' },
  { value: 'bug', label: 'Bug report' },
  { value: 'other', label: 'Other' },
];

const FeedbackWidget = () => {
  const [form, setForm] = useState({ name: '', email: '', category: 'feedback', message: '' });
  const [submitting, setSubmitting] = useState(false);

  const handleChange = (e) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!form.message.trim()) {
      toast.error('Please enter your message.');
      return;
    }
    setSubmitting(true);
    try {
      const isLoggedIn = Boolean(localStorage.getItem('token'));
      const endpoint = isLoggedIn ? '/api/v1/feedback' : '/api/v1/feedback/public';
      await api.post(endpoint, {
        ...form,
        page: 'homepage',
        url: window.location.href,
      });
      toast.success('Thanks! Your feedback was sent.');
      setForm({ name: '', email: '', category: 'feedback', message: '' });
    } catch (err) {
      toast.error(err.message || 'Failed to send feedback');
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <section className="py-16 px-4 bg-gradient-to-br from-emerald-50 via-white to-emerald-50/40">
      <div className="max-w-5xl mx-auto">
        <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 overflow-hidden">
          <div className="grid md:grid-cols-2">
            <div className="p-8 md:p-12 bg-gradient-to-br from-emerald-600 to-teal-600 text-white">
              <h2 className="text-3xl md:text-4xl font-extrabold mb-4">We need your feedback</h2>
              <p className="text-emerald-50/90 mb-8">Help us improve Green Marketplace. Share your comments, feedback, or suggestions.</p>
              <ul className="space-y-3 text-emerald-50/90 text-sm">
                <li>• Improve features you use</li>
                <li>• Report issues you encounter</li>
                <li>• Suggest ideas for the community</li>
              </ul>
            </div>
            <form onSubmit={handleSubmit} className="p-8 md:p-12 space-y-4">
              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Name</label>
                  <input name="name" value={form.name} onChange={handleChange} placeholder="Optional" className="w-full rounded-lg border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" />
                </div>
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-1">Email</label>
                  <input type="email" name="email" value={form.email} onChange={handleChange} placeholder="Optional" className="w-full rounded-lg border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" />
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Category</label>
                <select name="category" value={form.category} onChange={handleChange} className="w-full rounded-lg border-gray-300 focus:border-emerald-500 focus:ring-emerald-500">
                  {categories.map((c) => (
                    <option key={c.value} value={c.value}>{c.label}</option>
                  ))}
                </select>
              </div>
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-1">Your message</label>
                <textarea name="message" value={form.message} onChange={handleChange} rows={5} className="w-full rounded-lg border-gray-300 focus:border-emerald-500 focus:ring-emerald-500" placeholder="Share your thoughts..." />
              </div>
              <div className="flex items-center justify-end">
                <button type="submit" disabled={submitting} className="inline-flex items-center px-6 py-3 rounded-xl bg-emerald-600 text-white font-semibold hover:bg-emerald-700 disabled:opacity-60">
                  {submitting ? 'Sending…' : 'Send feedback'}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </section>
  );
};

export default FeedbackWidget;


