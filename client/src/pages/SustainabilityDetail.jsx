import React, { useEffect, useState } from 'react';
import { useParams, Link } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/utils/apiClient';

const MediaViewer = ({ media }) => {
  if (!media?.url) return null;
  const isImage = (media.type === 'image') || /\.(png|jpe?g|gif|webp|svg)$/i.test(media.url);
  const isVideo = (media.type === 'video') || /\.(mp4|webm|ogg)$/i.test(media.url);
  const isPdf = (media.type === 'pdf') || /\.pdf($|\?)/i.test(media.url);
  return (
    <div className="space-y-3">
      {isImage && (
        <img src={media.url} alt="attachment" className="w-full rounded-xl border max-h-[70vh] object-contain bg-white" />
      )}
      {isVideo && (
        <video src={media.url} controls className="w-full rounded-xl border" />
      )}
      {isPdf && (
        <iframe src={media.url} title="attachment" className="w-full h-[70vh] rounded-xl border bg-white" />
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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="px-4 pt-28 pb-10">
        <div className="max-w-4xl mx-auto">
          <Link to="/sustainability" className="text-sm text-emerald-700 hover:text-emerald-800">← Back to Sustainability Hub</Link>
          {loading ? (
            <div className="mt-6 bg-white border rounded-xl p-6">Loading…</div>
          ) : !item ? (
            <div className="mt-6 bg-white border rounded-xl p-6">Content not found.</div>
          ) : (
            <div className="mt-6 bg-white border rounded-2xl p-6 space-y-6">
              <div>
                <div className="flex items-center gap-2 mb-2">
                  <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs">{item.type}</span>
                  {item.eventDate && <span className="text-xs text-gray-500">{new Date(item.eventDate).toLocaleString()}</span>}
                </div>
                <h1 className="text-2xl md:text-3xl font-extrabold text-gray-900">{item.title}</h1>
              </div>

              {item.media && <MediaViewer media={item.media} />}

              {item.description && (
                <div className="prose max-w-none">
                  <p className="whitespace-pre-line text-gray-800 leading-7">{item.description}</p>
                </div>
              )}

              <div className="flex flex-wrap gap-2">
                {item.tags?.map((t) => (
                  <span key={t} className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700 text-xs">#{t}</span>
                ))}
              </div>

              {item.link && (
                <div>
                  <a href={item.link} target="_blank" rel="noreferrer" className="text-emerald-700 hover:text-emerald-800 underline">Open related link</a>
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


