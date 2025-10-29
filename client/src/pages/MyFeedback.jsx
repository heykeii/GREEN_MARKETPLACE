import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { toast } from '@/utils/toast';

const MyFeedback = () => {
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchMine = async () => {
      setLoading(true);
      try {
        const res = await fetch(`${import.meta.env.VITE_API_URL}/api/v1/feedback/mine`, {
          headers: { Authorization: `Bearer ${localStorage.getItem('token')}` }
        });
        const data = await res.json();
        if (data.success) setItems(data.items || []);
      } catch (e) {
        toast.error('Failed to load your feedback');
      } finally {
        setLoading(false);
      }
    };
    fetchMine();
  }, []);

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-[#f5fdfb] via-[#e7f7f4] to-[#daf2ef] py-14 px-4 pt-24">
        <div className="max-w-4xl mx-auto">
          <h1 className="text-2xl sm:text-3xl font-extrabold text-emerald-800 mb-6">My Feedback</h1>
          {loading ? (
            <Card><CardContent className="p-6">Loading…</CardContent></Card>
          ) : items.length === 0 ? (
            <Card><CardContent className="p-6 text-gray-600">You haven't submitted any feedback yet.</CardContent></Card>
          ) : (
            <div className="space-y-4">
              {items.map((f) => (
                <Card key={f._id} className="bg-white border border-gray-200 rounded-2xl">
                  <CardContent className="p-5 space-y-3">
                    <div className="flex items-center gap-2 text-xs">
                      <Badge variant="outline">{f.category}</Badge>
                      <span className="text-gray-500">{new Date(f.createdAt).toLocaleString()}</span>
                    </div>
                    <div className="text-gray-800 whitespace-pre-line">{f.message}</div>
                    {f.adminReply?.content ? (
                      <div className="mt-2 p-3 rounded-xl border border-emerald-200 bg-emerald-50">
                        <div className="text-sm text-emerald-800 font-semibold mb-1">Admin reply</div>
                        <div className="text-sm text-emerald-900 whitespace-pre-line">{f.adminReply.content}</div>
                        <div className="text-xs text-emerald-700 mt-1">
                          {(f.adminReply.admin?.firstName || 'Admin') + (f.adminReply.admin?.lastName ? ' ' + f.adminReply.admin.lastName : '')} • {f.adminReply.createdAt ? new Date(f.adminReply.createdAt).toLocaleString() : ''}
                        </div>
                      </div>
                    ) : (
                      <div className="text-sm text-gray-500">No admin reply yet</div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default MyFeedback;


