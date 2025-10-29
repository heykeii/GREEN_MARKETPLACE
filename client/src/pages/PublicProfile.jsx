import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import { useNavigate } from 'react-router-dom';
import { toast } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaYoutube, FaTiktok, FaPinterest, FaSnapchatGhost, FaDiscord, FaTelegramPlane, FaGlobe, FaLink, FaMapMarkerAlt, FaPhone, FaEnvelope, FaCalendarAlt, FaUsers, FaStore, FaCertificate } from 'react-icons/fa';
import ReportButton from '@/components/ReportButton';
import BadgeModal from '@/components/BadgeModal';
import CompactBadgeDisplay from '@/components/CompactBadgeDisplay';

const getSocialIcon = (platform) => {
  const iconMap = {
    website: <FaGlobe className="text-xl" />,
    facebook: <FaFacebook className="text-xl" />,
    instagram: <FaInstagram className="text-xl" />,
    twitter: <FaTwitter className="text-xl" />,
    linkedin: <FaLinkedin className="text-xl" />,
    youtube: <FaYoutube className="text-xl" />,
    tiktok: <FaTiktok className="text-xl" />,
    pinterest: <FaPinterest className="text-xl" />,
    snapchat: <FaSnapchatGhost className="text-xl" />,
    discord: <FaDiscord className="text-xl" />,
    telegram: <FaTelegramPlane className="text-xl" />,
    other: <FaLink className="text-xl" />,
  };
  return iconMap[platform] || <FaLink className="text-xl" />;
};

const getSocialColor = (platform) => {
  const colorMap = {
    website: 'from-green-500 to-emerald-600',
    facebook: 'from-blue-500 to-blue-700',
    instagram: 'from-pink-500 via-purple-500 to-orange-500',
    twitter: 'from-sky-400 to-blue-500',
    linkedin: 'from-blue-600 to-blue-800',
    youtube: 'from-red-500 to-red-700',
    tiktok: 'from-gray-800 to-black',
    pinterest: 'from-red-400 to-red-600',
    snapchat: 'from-yellow-300 to-yellow-500',
    discord: 'from-indigo-400 to-indigo-600',
    telegram: 'from-sky-400 to-blue-500',
    other: 'from-green-500 to-emerald-600',
  };
  return colorMap[platform] || 'from-green-500 to-emerald-600';
};

const PublicProfile = () => {
  const { userId } = useParams();
  const navigate = useNavigate();
  const fromAdmin = typeof window !== 'undefined' && new URLSearchParams(window.location.search).get('from') === 'admin';
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const [products, setProducts] = useState([]);
  const [campaigns, setCampaigns] = useState([]);
  const [followLoading, setFollowLoading] = useState(false);
  const [certifications, setCertifications] = useState([]);
  const [failedCertImgs, setFailedCertImgs] = useState(new Set());
  const [badgeModalOpen, setBadgeModalOpen] = useState(false);
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('admin_token');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/profile/${userId}`, {
          headers: (() => {
            const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
            return token ? { Authorization: `Bearer ${token}` } : undefined;
          })()
        });
        const fetchedProfile = res.data.profile;
        setProfile(fetchedProfile);
        setError(null);
        if (fetchedProfile?.isSeller) {
          try {
            const prodRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/products/by-seller/${userId}`);
            if (prodRes.data?.success) setProducts(prodRes.data.products || []);
          } catch(e) {}
        } else {
          setProducts([]);
        }
        try {
          const campRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/campaigns/by-user/${userId}`);
          if (campRes.data?.success) setCampaigns(campRes.data.campaigns || []);
        } catch(e) {}
        // Fetch sustainability certifications (public)
        try {
          const certRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/certifications/user/${userId}`);
          if (certRes.data?.success) setCertifications(certRes.data.items || []);
        } catch(e) {}
      } catch (e) {
        setError('Failed to load profile.');
      } finally {
        setLoading(false);
      }
    };
    fetchProfile();
  }, [userId]);

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Card className="p-12 shadow-2xl border-0 bg-white/80 backdrop-blur-lg">
          <CardContent className="text-center">
            <div className="flex flex-col items-center gap-4">
              <div className="w-16 h-16 border-4 border-emerald-500 border-t-transparent rounded-full animate-spin"></div>
              <div className="text-emerald-700 text-lg font-medium">
                Loading profile...
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        <Card className="p-12 shadow-2xl border-0 bg-white/80 backdrop-blur-lg">
          <CardContent className="text-center">
            <div className="text-red-600 text-lg font-semibold">
              {error || 'Profile not found.'}
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }

  return (
    <>
      {!isAdmin && <Navbar />}
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-green-50 to-teal-50">
        {/* Hero Section with Cover */}
        <div className="relative h-64 bg-gradient-to-r from-emerald-600 via-green-600 to-teal-600 overflow-hidden">
          <div className="absolute inset-0 bg-[url('data:image/svg+xml;base64,PHN2ZyB3aWR0aD0iNjAiIGhlaWdodD0iNjAiIHZpZXdCb3g9IjAgMCA2MCA2MCIgeG1sbnM9Imh0dHA6Ly93d3cudzMub3JnLzIwMDAvc3ZnIj48ZyBmaWxsPSJub25lIiBmaWxsLXJ1bGU9ImV2ZW5vZGQiPjxnIGZpbGw9IiNmZmZmZmYiIGZpbGwtb3BhY2l0eT0iMC4xIj48cGF0aCBkPSJNMzYgMzRjMC0yLjIxLTEuNzktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00em0wLTEwYzAtMi4yMS0xLjcktNC00LTRzLTQgMS43OS00IDQgMS43OSA0IDQgNCA0LTEuNzkgNC00eiIvPjwvZz48L2c+PC9zdmc+')] opacity-20"></div>
          <div className="absolute inset-0 bg-gradient-to-b from-transparent to-emerald-900/20"></div>
          
          <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 relative z-10 h-full flex items-start pt-6">
            <Button
              variant="ghost"
              onClick={() => {
                if (fromAdmin) {
                  navigate('/admin/user-management');
                } else if (window.history.length > 1) {
                  navigate(-1);
                } else {
                  navigate('/');
                }
              }}
              className="text-white hover:bg-white/20 backdrop-blur-sm border border-white/30"
            >
              ← Back
            </Button>
          </div>
        </div>

        {/* Profile Content */}
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 -mt-32 pb-16">
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
            {/* Main Profile Card */}
            <div className="lg:col-span-2">
              <Card className="shadow-2xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-0">
                  {/* Profile Header */}
                  <div className="p-8 pb-6">
                    <div className="flex flex-col sm:flex-row gap-6 items-start">
                      {/* Avatar */}
                      <div className="relative group mx-auto sm:mx-0">
                        <div className="absolute -inset-1 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-full blur opacity-75 group-hover:opacity-100 transition duration-300"></div>
                        <div className="relative w-32 h-32 rounded-full bg-gradient-to-br from-emerald-400 to-teal-500 p-1 shadow-xl">
                          <img
                            src={profile.avatar || '/default-avatar.svg'}
                            onError={e => { e.target.onerror = null; e.target.src = '/default-avatar.svg'; }}
                            alt="avatar"
                            className="w-full h-full rounded-full object-cover bg-white ring-4 ring-white"
                          />
                        </div>
                        {profile.sellerStatus === 'verified' && (
                          <div className="absolute -bottom-2 left-1/2 transform -translate-x-1/2">
                            <Badge className="bg-gradient-to-r from-emerald-600 to-green-600 text-white px-3 py-1 text-xs font-semibold shadow-lg border-2 border-white">
                              <svg className="w-3 h-3 mr-1" fill="currentColor" viewBox="0 0 20 20">
                                <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                              </svg>
                              Verified
                            </Badge>
                          </div>
                        )}
                      </div>

                      {/* Name and Info */}
                      <div className="flex-1 text-center sm:text-left">
                        <h1 className="text-3xl font-bold text-gray-900 mb-2">
                          {profile.firstName} {profile.lastName}
                        </h1>
                        <div className="flex items-center justify-center sm:justify-start gap-2 mb-4">
                          <FaEnvelope className="text-emerald-600 text-sm" />
                          <span className="text-gray-600 text-sm">{profile.email}</span>
                        </div>

                        {/* Stats */}
                        <div className="flex flex-wrap items-center justify-center sm:justify-start gap-4 mb-4">
                          <div className="flex items-center gap-2 px-4 py-2 bg-emerald-50 rounded-full">
                            <FaUsers className="text-emerald-600" />
                            <div className="text-sm">
                              <span className="font-bold text-gray-900">{profile.followerCount || 0}</span>
                              <span className="text-gray-600 ml-1">followers</span>
                            </div>
                          </div>
                          <div className="flex items-center gap-2 px-4 py-2 bg-teal-50 rounded-full">
                            <FaUsers className="text-teal-600" />
                            <div className="text-sm">
                              <span className="font-bold text-gray-900">{profile.followingCount || 0}</span>
                              <span className="text-gray-600 ml-1">following</span>
                            </div>
                          </div>
                        </div>

                        {/* Action Buttons */}
                        <div className="flex flex-wrap gap-3 justify-center sm:justify-start">
                          <Button
                            disabled={followLoading}
                            onClick={async () => {
                              const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
                              if (!token) { toast.error('Please login to follow users'); return; }
                              if (!profile) return;
                              try {
                                setFollowLoading(true);
                                if (profile.isFollowing) {
                                  await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/users/unfollow`, { targetUserId: userId }, { headers: { Authorization: `Bearer ${token}` } });
                                  setProfile({ ...profile, isFollowing: false, followerCount: Math.max(0, (profile.followerCount||0) - 1) });
                                } else {
                                  await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/users/follow`, { targetUserId: userId }, { headers: { Authorization: `Bearer ${token}` } });
                                  setProfile({ ...profile, isFollowing: true, followerCount: (profile.followerCount||0) + 1 });
                                }
                              } catch (e) {
                                toast.error('Action failed');
                              } finally {
                                setFollowLoading(false);
                              }
                            }}
                            className={`${profile.isFollowing ? 'bg-gray-200 hover:bg-gray-300 text-gray-700' : 'bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white'} px-6 shadow-md transition-all duration-300`}
                          >
                            {profile.isFollowing ? 'Following' : '+ Follow'}
                          </Button>
                          <Button
                            onClick={() => {
                              const token = localStorage.getItem('token') || localStorage.getItem('admin_token');
                              if (!token) {
                                toast.error('Please login to send a message');
                                return;
                              }
                              fetch(`${import.meta.env.VITE_API_URL}/api/v1/chat/conversations`, {
                                method: 'POST',
                                headers: {
                                  'Content-Type': 'application/json',
                                  'Authorization': `Bearer ${token}`
                                },
                                body: JSON.stringify({ recipientId: userId })
                              })
                                .then(async (r) => {
                                  const data = await r.json();
                                  const cid = data?.conversation?._id;
                                  if (cid) navigate(`/messages/${cid}`);
                                  else toast.error('Unable to open conversation');
                                })
                                .catch(() => toast.error('Unable to open conversation'));
                            }}
                            variant="outline"
                            className="px-6 border-emerald-600 text-emerald-600 hover:bg-emerald-50"
                          >
                            Message
                          </Button>
                          <ReportButton
                            reportedItemType="user"
                            reportedItemId={userId}
                            reportedItemName={`${profile.firstName} ${profile.lastName}`.trim()}
                            variant="outline"
                            className="px-6 border-red-300 text-red-600 hover:bg-red-50"
                          >
                            Report
                          </ReportButton>
                        </div>
                      </div>
                    </div>
                  </div>

                  {/* Divider */}
                  <div className="h-px bg-gradient-to-r from-transparent via-gray-200 to-transparent"></div>

                  {/* Bio and Details */}
                  <div className="p-8 space-y-6">
                    {profile.bio && (
                      <div className="bg-gradient-to-r from-emerald-50 to-teal-50 rounded-xl p-6 border border-emerald-100">
                        <p className="text-gray-700 leading-relaxed italic">{profile.bio}</p>
                      </div>
                    )}

                    {/* Contact Information */}
                    <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                      {profile.contactNumber && (
                        <div className="flex items-center gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-emerald-100 flex items-center justify-center">
                            <FaPhone className="text-emerald-600" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Phone</div>
                            <div className="text-sm font-medium text-gray-900">{profile.contactNumber}</div>
                          </div>
                        </div>
                      )}
                      {(profile.location?.address || profile.location?.city || profile.location?.province) && (
                        <div className="flex items-start gap-3 p-4 bg-white rounded-lg border border-gray-200 hover:border-emerald-300 transition-colors">
                          <div className="w-10 h-10 rounded-full bg-teal-100 flex items-center justify-center flex-shrink-0">
                            <FaMapMarkerAlt className="text-teal-600" />
                          </div>
                          <div>
                            <div className="text-xs text-gray-500 mb-1">Location</div>
                            <div className="text-sm font-medium text-gray-900">
                              {[
                                profile.location?.address,
                                profile.location?.city,
                                profile.location?.province,
                                profile.location?.zipCode
                              ].filter(Boolean).join(', ')}
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Business Information */}
                    {profile.sellerStatus === 'verified' && profile.sellerInfo?.type === 'business' && (
                      <div className="bg-gradient-to-br from-emerald-50 to-green-50 rounded-xl p-6 border-2 border-emerald-200">
                        <div className="flex items-center gap-3 mb-4">
                          <div className="w-12 h-12 rounded-full bg-white flex items-center justify-center shadow-md">
                            <FaStore className="text-emerald-600 text-xl" />
                          </div>
                          <h3 className="text-xl font-bold text-gray-900">{profile.sellerInfo.businessName}</h3>
                        </div>
                        <div className="text-sm text-gray-700 space-y-1 ml-15">
                          <p>{profile.sellerInfo.businessAddress.street}</p>
                          <p>{profile.sellerInfo.businessAddress.city}, {profile.sellerInfo.businessAddress.province}</p>
                          <p>{profile.sellerInfo.businessAddress.zipCode}</p>
                        </div>
                      </div>
                    )}

                    {/* Member Since */}
                    <div className="flex items-center justify-center gap-6 text-sm text-gray-500 pt-4 border-t border-gray-100">
                      <div className="flex items-center gap-2">
                        <FaCalendarAlt className="text-emerald-600" />
                        <span>Joined {new Date(profile.createdAt).toLocaleDateString('en-US', { month: 'long', year: 'numeric' })}</span>
                      </div>
                    </div>
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Sidebar */}
            <div className="space-y-6">
              {/* Sustainability Certifications */}
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center shadow-lg">
                      <span className="text-white text-lg">♻️</span>
                    </div>
                    <h3 className="text-lg font-bold text-gray-900">Sustainability Certifications</h3>
                  </div>
                  {certifications.length === 0 ? (
                    <div className="text-gray-500 text-sm">No certifications to display</div>
                  ) : (
                    <div className="space-y-4">
                      {certifications.map((c) => {
                        const showImage = !!c.media?.url && !failedCertImgs.has(c._id);
                        return (
                        <div key={c._id} className="flex items-start gap-3 p-3 rounded-lg border border-gray-100 hover:border-emerald-200 transition-colors">
                          {showImage ? (
                            <img
                              src={c.media.url}
                              alt={c.title}
                              className="w-14 h-14 object-cover rounded-md border flex-shrink-0"
                              onError={() => {
                                setFailedCertImgs(prev => new Set(prev).add(c._id));
                              }}
                            />
                          ) : (
                            <div className="w-14 h-14 rounded-md bg-emerald-50 flex items-center justify-center text-emerald-600 flex-shrink-0">
                              <FaCertificate className="text-2xl" />
                            </div>
                          )}
                          <div className="flex-1 min-w-0">
                            <div className="flex flex-wrap items-center gap-2">
                              <h4 className="font-semibold text-gray-900 truncate">{c.title}</h4>
                              {c.issuedBy && (
                                <Badge variant="secondary" className="text-xs">{c.issuedBy}</Badge>
                              )}
                            </div>
                            {c.issueDate && (
                              <div className="text-xs text-gray-500 mt-0.5">Issued {new Date(c.issueDate).toLocaleDateString()}</div>
                            )}
                            {c.description && (
                              <p className="text-sm text-gray-700 mt-1 line-clamp-2">{c.description}</p>
                            )}
                          </div>
                        </div>
                        );
                      })}
                    </div>
                  )}
                </CardContent>
              </Card>
              {/* Achievements Card */}
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
                <CardContent className="p-6">
                  <div className="flex items-center gap-2 mb-4">
                    <div className="text-2xl">🏆</div>
                    <h3 className="text-lg font-bold text-gray-900">Achievements</h3>
                  </div>
                  <div 
                    className="cursor-pointer hover:bg-emerald-50 rounded-lg p-3 transition-all duration-300 border border-transparent hover:border-emerald-200"
                    onClick={() => setBadgeModalOpen(true)}
                  >
                    <CompactBadgeDisplay userId={userId} isOwnProfile={false} />
                  </div>
                  <button 
                    onClick={() => setBadgeModalOpen(true)}
                    className="w-full mt-4 text-emerald-600 hover:text-emerald-700 text-sm font-medium py-2 px-4 rounded-lg hover:bg-emerald-50 transition-colors"
                  >
                    View all badges →
                  </button>
                </CardContent>
              </Card>

              {/* Social Links Card */}
              {profile.socialLinks && profile.socialLinks.length > 0 && (
                <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm overflow-hidden">
                  <CardContent className="p-6">
                    <h3 className="text-lg font-bold text-gray-900 mb-4">Connect</h3>
                    <div className="space-y-3">
                      {profile.socialLinks.map((link, index) => (
                        <a
                          key={index}
                          href={link.url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="flex items-center gap-3 p-3 rounded-lg hover:scale-105 transition-all duration-300 group bg-gradient-to-r hover:shadow-lg"
                          style={{
                            background: 'linear-gradient(135deg, #f9fafb 0%, #f3f4f6 100%)',
                          }}
                        >
                          <div className={`w-10 h-10 rounded-full bg-gradient-to-br ${getSocialColor(link.platform)} flex items-center justify-center text-white shadow-md group-hover:shadow-lg transition-all`}>
                            {getSocialIcon(link.platform)}
                          </div>
                          <span className="text-gray-700 font-medium group-hover:text-gray-900 truncate flex-1 text-sm">
                            {link.displayName || link.platform}
                          </span>
                        </a>
                      ))}
                    </div>
                  </CardContent>
                </Card>
              )}
            </div>
          </div>

          {/* Products Section */}
          {profile.isSeller && (
            <div className="mt-12">
              <div className="flex items-center gap-3 mb-6">
                <div className="w-10 h-10 rounded-full bg-gradient-to-br from-emerald-600 to-green-600 flex items-center justify-center shadow-lg">
                  <FaStore className="text-white" />
                </div>
                <h2 className="text-2xl font-bold text-gray-900">Products by {profile.firstName}</h2>
              </div>
              {products.length === 0 ? (
                <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                  <CardContent className="p-12 text-center">
                    <div className="text-gray-400 text-lg">No products listed yet</div>
                  </CardContent>
                </Card>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
                  {products.map((p) => (
                    <Card key={p._id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white">
                      <CardContent className="p-0">
                        <div className="relative overflow-hidden aspect-square">
                          <img 
                            src={(p.images && p.images[0]) || '/placeholder-product.jpg'} 
                            alt={p.name} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute inset-0 bg-gradient-to-t from-black/50 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300"></div>
                        </div>
                        <div className="p-4 space-y-2">
                          <h3 className="font-semibold text-gray-900 truncate group-hover:text-emerald-600 transition-colors">{p.name}</h3>
                          <div className="flex items-center justify-between">
                            <span className="text-xl font-bold text-emerald-600">₱{(p.price||0).toLocaleString()}</span>
                            <Badge variant="secondary" className="text-xs">{p.category}</Badge>
                          </div>
                          <Button 
                            onClick={()=>window.location.href=`/product/${p._id}`} 
                            className="w-full bg-gradient-to-r from-emerald-600 to-green-600 hover:from-emerald-700 hover:to-green-700 text-white shadow-md"
                          >
                            View Details
                          </Button>
                        </div>
                      </CardContent>
                    </Card>
                  ))}
                </div>
              )}
            </div>
          )}

          {/* Campaigns Section */}
          <div className="mt-12">
            <div className="flex items-center gap-3 mb-6">
              <div className="text-3xl">🌱</div>
              <h2 className="text-2xl font-bold text-gray-900">Campaigns by {profile.firstName}</h2>
            </div>
            {campaigns.length === 0 ? (
              <Card className="shadow-xl border-0 bg-white/95 backdrop-blur-sm">
                <CardContent className="p-12 text-center">
                  <div className="text-gray-400 text-lg">No campaigns yet</div>
                </CardContent>
              </Card>
            ) : (
              <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                {campaigns.map((c) => (
                  <Card key={c._id} className="group overflow-hidden border-0 shadow-lg hover:shadow-2xl transition-all duration-300 hover:-translate-y-1 bg-white">
                    <CardContent className="p-0">
                      {c.image && (
                        <div className="relative overflow-hidden h-48">
                          <img 
                            src={c.image} 
                            alt={c.title} 
                            className="w-full h-full object-cover group-hover:scale-110 transition-transform duration-500"
                          />
                          <div className="absolute top-3 right-3">
                            <Badge className="bg-white/90 text-gray-900 capitalize backdrop-blur-sm">{c.type}</Badge>
                          </div>
                        </div>
                      )}
                      <div className="p-4 space-y-3">
                        <h3 className="font-semibold text-gray-900 line-clamp-2 group-hover:text-emerald-600 transition-colors">{c.title}</h3>
                        <div className="flex items-center gap-2 text-xs text-gray-500">
                          <FaCalendarAlt />
                          <span>{new Date(c.createdAt).toLocaleDateString()}</span>
                        </div>
                        <Button 
                          onClick={()=>window.location.href=`/campaigns/${c._id}`} 
                          className="w-full bg-gradient-to-r from-teal-600 to-emerald-600 hover:from-teal-700 hover:to-emerald-700 text-white shadow-md"
                        >
                          View Campaign
                        </Button>
                      </div>
                    </CardContent>
                  </Card>
                ))}
              </div>
            )}
          </div>
        </div>
      </div>
      
      <BadgeModal 
        isOpen={badgeModalOpen}
        onClose={() => setBadgeModalOpen(false)}
        userId={userId}
        isOwnProfile={false}
      />
      
      {!isAdmin && <Footer />}
    </>
  );
};

export default PublicProfile;