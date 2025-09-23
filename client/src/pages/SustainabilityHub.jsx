import React, { useEffect, useMemo, useState } from 'react';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { api } from '@/utils/apiClient';
import { Calendar, BookOpen, Sprout, Search, Rows, Grid3X3, Tag, MapPin } from 'lucide-react';
import { Link } from 'react-router-dom';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Card as UICard, CardContent as UICardContent } from '@/components/ui/card';
import { Button } from '@/components/ui/button';

const Tab = ({ label, active, onClick }) => (
  <button onClick={onClick} className={`px-4 py-2 rounded-lg text-sm font-medium border ${active ? 'bg-emerald-600 text-white border-emerald-600' : 'bg-white text-gray-700 border-gray-200 hover:bg-gray-50'}`}>{label}</button>
);

const Card = ({ item, view }) => {
  const TypeIcon = item.type === 'event' ? Calendar : item.type === 'resource' ? BookOpen : Sprout;
  const hasThumb = Boolean(item.media?.url && /\.(png|jpe?g|webp|gif|svg)$/i.test(item.media.url));
  const thumb = hasThumb ? item.media.url : null;

  if (view === 'list') {
    return (
      <Link to={`/sustainability/${item._id}`} className="group bg-white border border-gray-200 rounded-2xl p-4 shadow-sm hover:shadow-md hover:border-emerald-200 transition flex gap-4">
        {thumb && (
          <img src={thumb} alt="thumb" className="h-24 w-32 object-cover rounded-xl border" />
        )}
        <div className="flex-1 min-w-0">
          <div className="flex items-center justify-between mb-1">
            <h3 className="text-base font-semibold text-gray-900 truncate">{item.title}</h3>
            <span className="inline-flex items-center gap-1 text-xs text-gray-600 shrink-0">
              <TypeIcon className="h-3.5 w-3.5 text-emerald-600" />
              {item.type}
            </span>
          </div>
          <p className="text-gray-600 text-sm line-clamp-2">{item.description}</p>
          <div className="mt-2 flex items-center gap-2 text-xs">
            {item.type === 'event' && item.eventDate && (
              <span className="inline-flex items-center gap-1 text-gray-600"><Calendar className="h-3.5 w-3.5" />{new Date(item.eventDate).toLocaleDateString()}</span>
            )}
            {item.location && (
              <span className="inline-flex items-center gap-1 text-gray-600"><MapPin className="h-3.5 w-3.5" />{item.location}</span>
            )}
            <span className="ml-auto inline-flex items-center gap-1 text-emerald-700">
              <Tag className="h-3.5 w-3.5" />{item.tags?.length || 0} tags
            </span>
          </div>
        </div>
      </Link>
    );
  }

  return (
    <Link to={`/sustainability/${item._id}`} className="block bg-white border border-gray-200 rounded-2xl p-5 shadow-sm hover:shadow-md hover:border-emerald-200 transition">
      {thumb && (
        <div className="mb-3 -mt-1 -mx-1">
          <img src={thumb} alt="thumb" className="h-40 w-full object-cover rounded-xl border" />
        </div>
      )}
      <div className="flex items-center justify-between mb-2">
        <h3 className="text-lg font-semibold text-gray-900">{item.title}</h3>
        {item.type === 'event' && item.eventDate && (
          <span className="inline-flex items-center gap-1 text-xs text-gray-600"><Calendar className="h-3.5 w-3.5" /> {new Date(item.eventDate).toLocaleDateString()}</span>
        )}
      </div>
      <p className="text-gray-600 text-sm mb-3 line-clamp-3">{item.description}</p>
      <div className="flex items-center gap-2 text-xs">
        <span className="inline-flex items-center gap-1 px-2 py-1 rounded-md bg-gray-100 text-gray-700"><TypeIcon className="h-3.5 w-3.5 text-emerald-600" /> {item.type}</span>
        {item.tags?.slice(0, 3).map((t) => (
          <span key={t} className="px-2 py-1 rounded-md bg-emerald-50 text-emerald-700">#{t}</span>
        ))}
      </div>
    </Link>
  );
};

const SustainabilityHub = () => {
  const [tab, setTab] = useState('all');
  const [upcomingOnly, setUpcomingOnly] = useState(true);
  const [items, setItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [query, setQuery] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [view, setView] = useState('grid');

  useEffect(() => {
    const fetchData = async () => {
      setLoading(true);
      const params = new URLSearchParams();
      if (tab !== 'all') params.set('type', tab);
      if (tab === 'event') params.set('upcoming', upcomingOnly ? 'true' : 'false');
      if (query) params.set('q', query);
      if (sortBy) params.set('sort', sortBy);
      const res = await api.get(`/api/v1/sustainability/public?${params.toString()}`);
      setItems(res.items || []);
      setLoading(false);
    };
    fetchData();
  }, [tab, upcomingOnly, query, sortBy]);

  const stats = useMemo(() => {
    const total = items.length;
    const initiatives = items.filter((i) => i.type === 'initiative').length;
    const resources = items.filter((i) => i.type === 'resource').length;
    const events = items.filter((i) => i.type === 'event').length;
    return { total, initiatives, resources, events };
  }, [items]);

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

          <div className="mt-4 flex flex-col sm:flex-row gap-3 sm:items-center">
            <div className="relative flex-1">
              <Search className="h-4 w-4 text-gray-400 absolute left-3 top-1/2 -translate-y-1/2" />
              <Input
                value={query}
                onChange={(e) => setQuery(e.target.value)}
                placeholder="Search by title, description, or tags"
                className="pl-9"
              />
            </div>
            <div className="flex items-center gap-2">
              <Select value={sortBy} onValueChange={(v) => setSortBy(v)}>
                <SelectTrigger className="w-44">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest</SelectItem>
                  <SelectItem value="oldest">Oldest</SelectItem>
                  <SelectItem value="title">Title A–Z</SelectItem>
                </SelectContent>
              </Select>
              <Button variant="outline" onClick={() => setView(view === 'grid' ? 'list' : 'grid')} className="shrink-0">
                {view === 'grid' ? <Rows className="h-4 w-4" /> : <Grid3X3 className="h-4 w-4" />}
              </Button>
            </div>
          </div>
          <div className="mt-4 grid grid-cols-2 sm:grid-cols-4 gap-3">
            <UICard className="border-emerald-100">
              <UICardContent className="p-4">
                <div className="text-xs text-gray-500">Total items</div>
                <div className="text-lg font-semibold text-gray-900">{stats.total}</div>
              </UICardContent>
            </UICard>
            <UICard className="border-emerald-100">
              <UICardContent className="p-4">
                <div className="text-xs text-gray-500">Initiatives</div>
                <div className="text-lg font-semibold text-gray-900">{stats.initiatives}</div>
              </UICardContent>
            </UICard>
            <UICard className="border-emerald-100">
              <UICardContent className="p-4">
                <div className="text-xs text-gray-500">Resources</div>
                <div className="text-lg font-semibold text-gray-900">{stats.resources}</div>
              </UICardContent>
            </UICard>
            <UICard className="border-emerald-100">
              <UICardContent className="p-4">
                <div className="text-xs text-gray-500">Events</div>
                <div className="text-lg font-semibold text-gray-900">{stats.events}</div>
              </UICardContent>
            </UICard>
          </div>
        </div>
      </section>

      <section className="px-4 pb-16">
        <div className={`max-w-6xl mx-auto ${view === 'grid' ? 'grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4' : 'space-y-3'}`}>
          {loading ? (
            Array.from({ length: view === 'grid' ? 6 : 4 }).map((_, idx) => (
              <div key={idx} className="bg-white border border-gray-200 rounded-2xl p-5 shadow-sm animate-pulse">
                <div className="h-5 w-1/3 bg-gray-100 rounded mb-3" />
                <div className="h-4 w-full bg-gray-100 rounded mb-2" />
                <div className="h-4 w-2/3 bg-gray-100 rounded mb-4" />
                <div className="h-6 w-1/4 bg-gray-100 rounded" />
              </div>
            ))
          ) : items.length > 0 ? (
            items.map((i) => (
              <Card key={i._id} item={i} view={view} />
            ))
          ) : (
            <div className="col-span-full bg-white border border-dashed border-gray-300 rounded-2xl p-12 text-center">
              <div className="mx-auto w-12 h-12 rounded-full bg-emerald-50 flex items-center justify-center mb-3">
                <BookOpen className="h-6 w-6 text-emerald-600" />
              </div>
              <h3 className="text-gray-900 font-semibold">No content found</h3>
              <p className="text-gray-500 text-sm">Try adjusting filters or your search.</p>
            </div>
          )}
        </div>
      </section>

      <Footer />
    </div>
  );
};

export default SustainabilityHub;


