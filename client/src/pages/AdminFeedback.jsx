import React, { useEffect, useMemo, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/utils/apiClient';
import { toast } from '@/utils/toast';
import {
  MessageSquareText,
  Lightbulb,
  Bug,
  MessageCircle,
  CheckCircle2,
  Archive,
  User,
  Mail,
  Clock,
  Tag
} from 'lucide-react';

const StatusBadge = ({ status }) => {
  const color = status === 'new' ? 'bg-amber-100 text-amber-800' : status === 'reviewed' ? 'bg-emerald-100 text-emerald-800' : 'bg-gray-100 text-gray-700';
  const label = status.charAt(0).toUpperCase() + status.slice(1);
  return <span className={`px-2.5 py-1 rounded-full text-xs font-medium ${color}`}>{label}</span>;
};

const CategoryChip = ({ category }) => {
  const map = {
    feedback: { icon: MessageCircle, color: 'bg-blue-50 text-blue-700 border-blue-100' },
    comment: { icon: MessageSquareText, color: 'bg-sky-50 text-sky-700 border-sky-100' },
    suggestion: { icon: Lightbulb, color: 'bg-emerald-50 text-emerald-700 border-emerald-100' },
    bug: { icon: Bug, color: 'bg-red-50 text-red-700 border-red-100' },
    other: { icon: Tag, color: 'bg-gray-50 text-gray-700 border-gray-100' }
  };
  const { icon: Icon, color } = map[category] || map.other;
  return (
    <span className={`inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium border ${color}`}>
      <Icon className="h-3.5 w-3.5" />
      {category}
    </span>
  );
};

const AdminFeedback = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [filters, setFilters] = useState({ status: '', category: '', page: 1 });
  const [replyTextById, setReplyTextById] = useState({});
  const stats = useMemo(() => ({
    total: items.length,
    newCount: items.filter((i) => i.status === 'new').length,
    reviewed: items.filter((i) => i.status === 'reviewed').length,
    archived: items.filter((i) => i.status === 'archived').length
  }), [items]);

  const fetchData = async () => {
    setLoading(true);
    try {
      const query = new URLSearchParams(Object.fromEntries(Object.entries(filters).filter(([_, v]) => v))).toString();
      const res = await api.get(`/api/v1/admin/feedback?${query}`);
      setItems(res.items || []);
    } catch (e) {
      toast.error(e.message || 'Failed to load feedback');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchData();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [filters.status, filters.category]);

  const updateStatus = async (id, status) => {
    try {
      await api.patch(`/api/v1/admin/feedback/${id}/status`, { status });
      toast.success('Status updated');
      setItems((prev) => prev.map((f) => (f._id === id ? { ...f, status } : f)));
    } catch (e) {
      toast.error(e.message || 'Failed to update');
    }
  };

  const submitReply = async (id) => {
    const text = (replyTextById[id] || '').trim();
    if (!text) { toast.error('Please enter a reply'); return; }
    try {
      const res = await api.post(`/api/v1/admin/feedback/${id}/reply`, { content: text });
      toast.success('Reply sent');
      setItems((prev) => prev.map((f) => (f._id === id ? (res.feedback || f) : f)));
      setReplyTextById((p) => ({ ...p, [id]: '' }));
    } catch (e) {
      toast.error(e.message || 'Failed to send reply');
    }
  };

  const deleteReply = async (id) => {
    try {
      await api.delete(`/api/v1/admin/feedback/${id}/reply`);
      setItems((prev) => prev.map((f) => (f._id === id ? { ...f, adminReply: undefined } : f)));
      toast.success('Reply deleted');
    } catch (e) {
      toast.error(e.message || 'Failed to delete reply');
    }
  };

  return (
    <AdminLayout title="Feedback">
      <div className="p-6 space-y-6">
        <div className="flex flex-col lg:flex-row lg:items-end lg:justify-between gap-4">
          <div>
            <h1 className="text-3xl font-extrabold text-gray-900 tracking-tight">User Feedback</h1>
            <p className="text-gray-500">Comments, suggestions, and bug reports from users</p>
            <div className="mt-3 flex flex-wrap gap-2 text-xs">
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">Total: {stats.total}</span>
              <span className="px-2 py-1 rounded-md bg-amber-100 text-amber-800">New: {stats.newCount}</span>
              <span className="px-2 py-1 rounded-md bg-emerald-100 text-emerald-800">Reviewed: {stats.reviewed}</span>
              <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">Archived: {stats.archived}</span>
            </div>
          </div>
          <div className="flex items-center gap-2">
            {[
              { key: '', label: 'All' },
              { key: 'new', label: 'New' },
              { key: 'reviewed', label: 'Reviewed' },
              { key: 'archived', label: 'Archived' }
            ].map((tab) => (
              <button
                key={tab.key || 'all'}
                onClick={() => setFilters({ ...filters, status: tab.key })}
                className={`px-3 py-1.5 rounded-lg text-sm font-medium border transition-colors ${
                  filters.status === tab.key
                    ? 'bg-emerald-600 text-white border-emerald-600'
                    : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'
                }`}
              >
                {tab.label}
              </button>
            ))}
            <select value={filters.category} onChange={(e) => setFilters({ ...filters, category: e.target.value })} className="rounded-lg border-gray-200 text-sm">
              <option value="">All categories</option>
              <option value="feedback">General feedback</option>
              <option value="comment">Comment</option>
              <option value="suggestion">Suggestion</option>
              <option value="bug">Bug</option>
              <option value="other">Other</option>
            </select>
          </div>
        </div>

        <div className="grid grid-cols-1 gap-4">
          {loading ? (
            <div className="bg-white border border-gray-200 rounded-xl p-8 text-gray-500">Loading…</div>
          ) : items.length === 0 ? (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <MessageCircle className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-gray-900 font-semibold">No feedback yet</h3>
              <p className="text-gray-500 text-sm">You’ll see new submissions here as users send them.</p>
            </div>
          ) : (
            items.map((f) => (
              <div
                key={f._id}
                className="group bg-white border border-gray-200 hover:border-emerald-200 rounded-2xl p-5 shadow-sm hover:shadow-md transition-all"
              >
                <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
                  <div className="flex-1">
                    <div className="flex items-center gap-2 mb-2">
                      <StatusBadge status={f.status} />
                      <CategoryChip category={f.category} />
                      <span className="inline-flex items-center gap-1 text-xs text-gray-400">
                        <Clock className="h-3.5 w-3.5" /> {new Date(f.createdAt).toLocaleString()}
                      </span>
                    </div>
                    <div className="text-[15px] leading-6 text-gray-800 whitespace-pre-line">{f.message}</div>
                    <div className="mt-3 flex flex-wrap items-center gap-3 text-xs text-gray-500">
                      <span className="inline-flex items-center gap-1"><User className="h-3.5 w-3.5" /> {f.name || 'Anonymous'}</span>
                      {f.email && <span className="inline-flex items-center gap-1"><Mail className="h-3.5 w-3.5" /> {f.email}</span>}
                      {f.meta?.page && <span className="inline-flex items-center gap-1"><Tag className="h-3.5 w-3.5" /> {f.meta.page}</span>}
                    </div>
                  </div>
                  <div className="flex gap-2 shrink-0">
                    {f.status !== 'reviewed' && (
                      <button
                        onClick={() => updateStatus(f._id, 'reviewed')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                      >
                        <CheckCircle2 className="h-4 w-4" /> Mark reviewed
                      </button>
                    )}
                    {f.status !== 'archived' && (
                      <button
                        onClick={() => updateStatus(f._id, 'archived')}
                        className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-md bg-gray-100 text-gray-800 text-sm hover:bg-gray-200"
                      >
                        <Archive className="h-4 w-4" /> Archive
                      </button>
                    )}
                  </div>
                </div>

                {/* Admin reply box */}
                <div className="mt-4 pl-0 md:pl-8">
                  {f.adminReply?.content ? (
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-3 text-sm">
                      <div className="flex items-center justify-between mb-1">
                        <div className="text-emerald-800 font-semibold">Admin reply</div>
                        <button onClick={() => deleteReply(f._id)} className="text-red-600 text-xs hover:underline">Delete</button>
                      </div>
                      <div className="text-emerald-900 whitespace-pre-line">{f.adminReply.content}</div>
                      <div className="text-xs text-emerald-700 mt-1">
                        {f.adminReply.admin ? `${f.adminReply.admin.firstName || ''} ${f.adminReply.admin.lastName || ''}`.trim() : 'Admin'} • {new Date(f.adminReply.createdAt).toLocaleString()}
                      </div>
                    </div>
                  ) : (
                    <div className="flex flex-col sm:flex-row gap-2">
                      <input
                        type="text"
                        placeholder="Write a reply to this feedback…"
                        value={replyTextById[f._id] || ''}
                        onChange={(e) => setReplyTextById((p) => ({ ...p, [f._id]: e.target.value }))}
                        className="flex-1 rounded-lg border border-gray-300 px-3 py-2 text-sm"
                      />
                      <button
                        onClick={() => submitReply(f._id)}
                        className="px-3 py-2 rounded-lg bg-emerald-600 text-white text-sm hover:bg-emerald-700"
                      >
                        Reply
                      </button>
                    </div>
                  )}
                </div>
              </div>
            ))
          )}
        </div>
      </div>
    </AdminLayout>
  );
};

export default AdminFeedback;


