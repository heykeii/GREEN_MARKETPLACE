import React, { useEffect, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/utils/apiClient';
import { Calendar, BookOpen, Sprout } from 'lucide-react';
import { Link } from 'react-router-dom';

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-medium border ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>{label}</button>
);

const Card = ({ item }) => (
  <Link to={`/sustainability/${item._id}`} className="block bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition">
    <div className="flex items-center justify-between mb-2">
      <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
      {item.type === 'event' && item.eventDate && (
        <span className="inline-flex items-center gap-1 text-xs text-gray-600"><Calendar className="h-3.5 w-3.5" /> {new Date(item.eventDate).toLocaleDateString()}</span>
      )}
    </div>
    <p className="text-gray-600 text-sm mb-3">{item.description}</p>
    <div className="flex items-center gap-2 text-xs">
      <span className="px-2 py-1 rounded-md bg-gray-100 text-gray-700">{item.type}</span>
      {item.tags?.slice(0, 3).map((t) => (
        <span key={t} className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700">#{t}</span>
      ))}
    </div>
  </Link>
);

const SustainabilityHub = () => {
  const [tab, setTab] = useState('all');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [items, setItems] = useState([]);

  useEffect(() => {
    const fetchData = async () => {
      const params = new URLSearchParams();
      if (tab !== 'all') params.set('type', tab);
      if (tab === 'event') params.set('upcoming', upcomingOnly ? 'true' : 'false');
      const res = await api.get(`/api/v1/sustainability/public?${params.toString()}`);
      setItems(res.items || []);
    };
    fetchData();
  }, [tab, upcomingOnly]);

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />

      <section className="px-4 pt-28 pb-10 bg-gradient-to-b from-emerald-50 to-transparent">
        <div className="max-w-6xl mx-auto">
          <div className="flex items-center gap-3 mb-4">
            <Sprout className="h-6 w-6 text-emerald-600" />
            <h1 className="text-3xl font-extrabold text-gray-900">Sustainability Hub</h1>
          </div>
          <p className="text-gray-600 mb-6 max-w-3xl">Discover initiatives, resources, and community events that promote sustainable living.</p>

          <div className="flex flex-wrap items-center gap-2">
            <Tab label="All" active={tab === 'all'} onClick={() => setTab('all')} />
            <Tab label="Initiatives" active={tab === 'initiative'} onClick={() => setTab('initiative')} />
            <Tab label="Resources" active={tab === 'resource'} onClick={() => setTab('resource')} />
            <Tab label="Events" active={tab === 'event'} onClick={() => setTab('event')} />
            {tab === 'event' && (
              <button onClick={() => setUpcomingOnly(!upcomingOnly)} className="ml-auto px-3 py-1.5 rounded-lg text-sm border border-gray-200 bg-white hover:bg-gray-50">
                {upcomingOnly ? 'Show past events' : 'Show upcoming events'}
              </button>
            )}
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {items.map((i) => (
            <Card key={i._id} item={i} />
          ))}
          {items.length === 0 && (
            <div className="col-span-full bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-gray-900 font-semibold">No content found</h3>
              <p className="text-gray-500 text-sm">Please check back later.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SustainabilityHub;


