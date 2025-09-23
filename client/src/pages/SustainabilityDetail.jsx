import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/utils/apiClient';
import { Calendar, Tag, ExternalLink, ArrowLeft, MapPin } from 'lucide-react';

const MediaViewer = ({ media }) => {
  if (!media?.url) return null;
  const isImage = (media.type === 'image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(media.url);
  const isVideo = (media.type === 'video') || /\.(mp4|webm|ogg)$/i.test(media.url);
  const isPdf = (media.type === 'pdf') || /\.pdf($|\?)/i.test(media.url);
  return (
    <div className="space-y-3">
      {isImage && (
        <img src={media.url} alt="attachment" className="w-full rounded-xl border max-h-[70vh] object-contain bg-white shadow-sm" />
      )}
      {isVideo && (
        <video src={media.url} controls className="w-full rounded-xl border shadow-sm" />
      )}
      {isPdf && (
        <iframe src={media.url} title="attachment" className="w-full h-[70vh] rounded-xl border bg-white shadow-sm" />
      )}
      {!isImage && !isVideo && !isPdf && (
        <div className="rounded-lg border bg-gray-50 p-4 text-sm text-gray-700">Attachment type not previewable. Use the button below to open it.</div>
      )}
      <div>
        <a href={media.url} target="_blank" rel="noreferrer" className="inline-flex items-center px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">Open attachment</a>
      </div>
    </div>
  );
};

const SustainabilityDetail = () => {
  const { id } = useParams();
  const [item, setItem] = useState(null);
  const [loading, setLoading] = useState(true);
  const [related, setRelated] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const res = await api.get(`/api/v1/sustainability/public/${id}`);
        setItem(res.item);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, [id]);

  useEffect(() => {
    const loadRelated = async () => {
      if (!item) return;
      const tag = item.tags?.[0] || '';
      const q = tag || item.title?.split(' ')?.[0] || '';
      if (!q) return;
      try {
        const res = await api.get(`/api/v1/sustainability/public?q=${encodeURIComponent(q)}`);
        const list = (res.items || []).filter((r) => r._id !== id).slice(0, 6);
        setRelated(list);
      } catch {}
    };
    loadRelated();
  }, [item, id]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="px-4 pt-28 pb-10">
        <div className="max-w-4xl mx-auto">
          <Link to="/sustainability" className="inline-flex items-center gap-1 text-sm text-emerald-700 hover:text-emerald-800">
            <ArrowLeft className="h-4 w-4" /> Back to Sustainability Hub
          </Link>
          {loading ? (
            <div className="mt-6 bg-white border rounded-xl p-6">Loading…</div>
          ) : !item ? (
            <div className="mt-6 bg-white border rounded-xl p-6">Content not found.</div>
          ) : (
            <div className="mt-6 bg-white border rounded-2xl p-6 space-y-6">
              <div>
                <div className="flex flex-wrap items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs capitalize">{item.type}</span>
                  {item.eventDate && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600"><Calendar className="h-3.5 w-3.5" />{new Date(item.eventDate).toLocaleString()}</span>
                  )}
                  {item.location && (
                    <span className="inline-flex items-center gap-1 text-xs text-gray-600"><MapPin className="h-3.5 w-3.5" />{item.location}</span>
                  )}
                </div>
                <div className="flex items-start justify-between gap-4">
                  <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{item.title}</h1>
                  <div className="shrink-0 inline-flex gap-2">
                    {item.link && (
                      <a href={item.link} target="_blank" rel="noreferrer" className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg border text-sm hover:bg-gray-50">
                        <ExternalLink className="h-4 w-4" /> Open link
                      </a>
                    )}
                  </div>
                </div>
              </div>

              {item.media && <MediaViewer media={item.media} />}

              {item.description && (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line text-gray-800 leading-7">{item.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {item.tags?.map((t) => (
                  <span key={t} className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs"><Tag className="h-3.5 w-3.5" />{t}</span>
                ))}
              </div>

              {item.link && (
                <div className="hidden">
                  {/* kept for fallback link, visible actions are in header */}
                  <a href={item.link} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-800 underline">Open related link</a>
                </div>
              )}

              {related.length > 0 && (
                <div className="pt-2 border-t">
                  <h2 className="text-lg font-semibold text-gray-900 mb-3">Related content</h2>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                    {related.map((r) => (
                      <Link key={r._id} to={`/sustainability/${r._id}`} className="block rounded-xl border bg-white p-4 hover:shadow-sm transition">
                        <div className="text-sm text-gray-500 capitalize">{r.type}</div>
                        <div className="font-medium text-gray-900 truncate">{r.title}</div>
                        <div className="mt-1 text-sm text-gray-600 line-clamp-2">{r.description}</div>
                        <div className="mt-2 flex gap-1 text-xs">
                          {(r.tags || []).slice(0, 2).map((t) => (
                            <span key={t} className="px-2 py-0.5 rounded bg-emerald-50 text-emerald-700">#{t}</span>
                          ))}
                        </div>
                      </Link>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SustainabilityDetail;


