import React, { useEffect, useState } from 'react';
import AdminLayout from '@/components/AdminLayout';
import { api } from '@/utils/apiClient';
import { toast } from '@/utils/toast';

const emptyForm = { title: '', description: '', type: 'initiative', tags: '', eventDate: '', mediaUrl: '', mediaType: 'image', link: '', isPublished: true };

const AdminSustainability = () => {
  const [items, setItems] = useState([]);
  const [form, setForm] = useState(emptyForm);
  const [editingId, setEditingId] = useState(null);

  const load = async () => {
    const res = await api.get('/api/v1/admin/sustainability');
    setItems(res.items || []);
  };

  useEffect(() => { load(); }, []);

  const submit = async (e) => {
    e.preventDefault();
    const payload = {
      title: form.title,
      description: form.description,
      type: form.type,
      tags: form.tags ? form.tags.split(',').map(t => t.trim()).filter(Boolean) : [],
      eventDate: form.type === 'event' && form.eventDate ? form.eventDate : undefined,
      media: form.mediaUrl ? { url: form.mediaUrl, type: form.mediaType } : undefined,
      link: form.link,
      isPublished: form.isPublished
    };
    try {
      if (editingId) {
        await api.patch(`/api/v1/admin/sustainability/${editingId}`, payload);
        toast.success('Updated');
      } else {
        await api.post('/api/v1/admin/sustainability', payload);
        toast.success('Created');
      }
      setForm(emptyForm); setEditingId(null); load();
    } catch (e) {
      toast.error(e.message || 'Failed to save');
    }
  };

  const edit = (item) => {
    setEditingId(item._id);
    setForm({
      title: item.title,
      description: item.description || '',
      type: item.type,
      tags: (item.tags || []).join(', '),
      eventDate: item.eventDate ? item.eventDate.substring(0, 10) : '',
      mediaUrl: item.media?.url || '',
      mediaType: item.media?.type || 'image',
      link: item.link || '',
      isPublished: item.isPublished
    });
  };

  const remove = async (id) => {
    if (!confirm('Delete this content?')) return;
    try { await api.delete(`/api/v1/admin/sustainability/${id}`); toast.success('Deleted'); load(); } catch (e) { toast.error(e.message || 'Delete failed'); }
  };

  return (
    <AdminLayout title="Sustainability Content">
      <div className="p-6">
        <div className="mb-6">
          <h1 className="text-2xl font-extrabold text-gray-900">{editingId ? 'Edit Content' : 'Create Sustainability Content'}</h1>
          <p className="text-gray-500">Share initiatives, resources, or events with the community. Upload an image/video/PDF or paste a link.</p>
        </div>
        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        <form onSubmit={submit} className="bg-white border border-gray-200 rounded-2xl p-6 space-y-4 lg:col-span-1 shadow-sm">
          <div className="flex items-center justify-between">
            <h2 className="font-semibold text-gray-900">{editingId ? 'Edit content' : 'New content'}</h2>
            {editingId && <span className="text-xs text-gray-500">ID: {editingId.slice(0,8)}…</span>}
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Title</label>
            <input required value={form.title} onChange={(e)=>setForm({...form,title:e.target.value})} className="w-full rounded-lg border-gray-300"/>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Type</label>
            <select value={form.type} onChange={(e)=>setForm({...form,type:e.target.value})} className="w-full rounded-lg border-gray-300">
              <option value="initiative">Initiative</option>
              <option value="resource">Resource</option>
              <option value="event">Event</option>
            </select>
          </div>
          {form.type === 'event' && (
            <div>
              <label className="block text-sm text-gray-700 mb-1">Event date</label>
              <input type="date" value={form.eventDate} onChange={(e)=>setForm({...form,eventDate:e.target.value})} className="w-full rounded-lg border-gray-300"/>
            </div>
          )}
          <div>
            <label className="block text-sm text-gray-700 mb-1">Description</label>
            <textarea rows={4} value={form.description} onChange={(e)=>setForm({...form,description:e.target.value})} className="w-full rounded-lg border-gray-300"/>
            <p className="text-xs text-gray-400 mt-1">You can add full details; the public page will show the entire description.</p>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">Tags (comma-separated)</label>
            <input value={form.tags} onChange={(e)=>setForm({...form,tags:e.target.value})} className="w-full rounded-lg border-gray-300"/>
          </div>
          <div className="grid grid-cols-3 gap-3">
            <div className="col-span-2 space-y-2">
              <label className="block text-sm text-gray-700">Media</label>
              <input type="file" accept="image/*,application/pdf,video/*" onChange={async (e) => {
                const file = e.target.files?.[0];
                if (!file) return;
                const reader = new FileReader();
                reader.onload = async () => {
                  try {
                    const dataUrl = reader.result;
                    const upload = await api.post('/api/v1/admin/sustainability/upload', { dataUrl }, { timeout: 180000 });
                    setForm((prev)=>({ ...prev, mediaUrl: upload.media.url, mediaType: upload.media.type }));
                    toast.success('Uploaded to Cloudinary');
                  } catch (err) {
                    toast.error(err.message || 'Upload failed');
                  }
                };
                reader.readAsDataURL(file);
              }} className="w-full rounded-lg border-gray-300" />
              <input placeholder="Or paste media URL (image/pdf/video/link)" value={form.mediaUrl} onChange={(e)=>setForm({...form,mediaUrl:e.target.value})} className="w-full rounded-lg border-gray-300"/>
              {form.mediaUrl && (
                <div className="rounded-lg border bg-gray-50 p-2 flex items-center justify-between">
                  <span className="text-xs truncate mr-2">{form.mediaUrl}</span>
                  <a href={form.mediaUrl} target="_blank" rel="noreferrer" className="text-xs text-emerald-700 hover:text-emerald-800">Preview</a>
                </div>
              )}
            </div>
            <div>
              <label className="block text-sm text-gray-700 mb-1">Media Type</label>
              <select value={form.mediaType} onChange={(e)=>setForm({...form,mediaType:e.target.value})} className="w-full rounded-lg border-gray-300">
                <option value="image">image</option>
                <option value="video">video</option>
                <option value="pdf">pdf</option>
                <option value="link">link</option>
              </select>
            </div>
          </div>
          <div>
            <label className="block text-sm text-gray-700 mb-1">External link (optional)</label>
            <input value={form.link} onChange={(e)=>setForm({...form,link:e.target.value})} className="w-full rounded-lg border-gray-300"/>
          </div>
          <div className="flex items-center gap-2">
            <input id="pub" type="checkbox" checked={form.isPublished} onChange={(e)=>setForm({...form,isPublished:e.target.checked})} />
            <label htmlFor="pub" className="text-sm text-gray-700">Published</label>
          </div>
          <div className="flex gap-2">
            <button type="submit" className="px-4 py-2 rounded-lg bg-emerald-600 text-white hover:bg-emerald-700">{editingId ? 'Update' : 'Create'}</button>
            {editingId && <button type="button" onClick={()=>{setEditingId(null);setForm(emptyForm);}} className="px-4 py-2 rounded-lg border border-gray-300 hover:bg-gray-50">Cancel</button>}
          </div>
        </form>

        <div className="lg:col-span-2 space-y-3">
          {items.map((i)=> (
            <div key={i._id} className="bg-white border border-gray-200 rounded-2xl p-5 flex flex-col md:flex-row md:items-center md:justify-between gap-4 hover:shadow-md transition">
              <div className="flex items-start gap-4">
                {i.media?.url ? (
                  i.media.type === 'image' ? (
                    <img src={i.media.url} alt="thumb" className="w-16 h-16 rounded-lg object-cover border" />
                  ) : (
                    <div className="w-16 h-16 rounded-lg bg-gray-100 border flex items-center justify-center text-gray-500 text-xs">{i.media.type}</div>
                  )
                ) : (
                  <div className="w-16 h-16 rounded-lg bg-gray-100 border flex items-center justify-center text-gray-400 text-xs">no media</div>
                )}
                <div>
                  <div className="flex items-center gap-2 mb-1">
                    <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700 text-xs capitalize">{i.type}</span>
                    {i.type === 'event' && i.eventDate && (
                      <span className="text-xs text-gray-500">{new Date(i.eventDate).toLocaleDateString()}</span>
                    )}
                    {!i.isPublished && <span className="px-2 py-1 rounded-md bg-yellow-100 text-yellow-800 text-xs">Unpublished</span>}
                  </div>
                  <div className="font-semibold text-gray-900">{i.title}</div>
                  <div className="text-sm text-gray-600 line-clamp-2 max-w-2xl">{i.description}</div>
                </div>
              </div>
              <div className="flex gap-2">
                <button onClick={()=>edit(i)} className="px-3 py-1.5 rounded-md bg-white border border-gray-300 text-sm hover:bg-gray-50">Edit</button>
                <button onClick={()=>remove(i._id)} className="px-3 py-1.5 rounded-md bg-red-600 text-white text-sm hover:bg-red-700">Delete</button>
              </div>
            </div>
          ))}
          {items.length === 0 && (
            <div className="bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center text-gray-500">No content yet.</div>
          )}
        </div>
      </div>
      </div>
    </AdminLayout>
  );
};

export default AdminSustainability;


