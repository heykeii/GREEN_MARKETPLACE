import React, { useEffect, useState } from 'react';
import { useParams } from 'react-router-dom';
import { Card, CardContent } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import noProfile from '@/assets/no_profile.jpg';
import axios from 'axios';
import Navbar from '@/components/Navbar';
import { FaFacebook, FaInstagram, FaTwitter, FaLinkedin, FaYoutube, FaTiktok, FaPinterest, FaSnapchatGhost, FaDiscord, FaTelegramPlane, FaGlobe, FaLink } from 'react-icons/fa';

const getSocialIcon = (platform) => {
  const iconMap = {
    website: <FaGlobe className="text-xl text-green-700" />,
    facebook: <FaFacebook className="text-xl text-blue-600" />,
    instagram: <FaInstagram className="text-xl text-pink-500" />,
    twitter: <FaTwitter className="text-xl text-sky-500" />,
    linkedin: <FaLinkedin className="text-xl text-blue-700" />,
    youtube: <FaYoutube className="text-xl text-red-600" />,
    tiktok: <FaTiktok className="text-xl text-black" />,
    pinterest: <FaPinterest className="text-xl text-red-500" />,
    snapchat: <FaSnapchatGhost className="text-xl text-yellow-400" />,
    discord: <FaDiscord className="text-xl text-indigo-500" />,
    telegram: <FaTelegramPlane className="text-xl text-blue-400" />,
    other: <FaLink className="text-xl text-green-700" />,
  };
  return iconMap[platform] || <FaLink className="text-xl text-green-700" />;
};

const PublicProfile = () => {
  const { userId } = useParams();
  const [profile, setProfile] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);
  const isAdmin = typeof window !== 'undefined' && localStorage.getItem('admin_token');

  useEffect(() => {
    const fetchProfile = async () => {
      setLoading(true);
      try {
        const res = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/users/profile/${userId}`);
        setProfile(res.data.profile);
        setError(null);
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
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <Card className="p-8 shadow-xl border-green-200">
          <CardContent className="text-center">
            <div className="text-green-700 text-lg font-semibold animate-pulse">
              Loading profile...
            </div>
          </CardContent>
        </Card>
      </div>
    );
  }
  if (error || !profile) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-emerald-50">
        <Card className="p-8 shadow-xl border-green-200">
          <CardContent className="text-center">
            <div className="text-red-700 text-lg font-semibold">
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
      <div className="min-h-screen bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50 py-8 px-4 sm:px-6 lg:px-8">
        <div className="max-w-3xl mx-auto">
          <Card className="shadow-2xl border-green-200 bg-white/95 backdrop-blur-sm">
            <CardContent className="p-8 flex flex-col items-center space-y-6">
              {/* Avatar */}
              <div className="relative group">
                <div className="w-40 h-40 rounded-full bg-gradient-to-br from-green-400 to-emerald-500 p-1 shadow-xl">
                  <img
                    src={profile.avatar || noProfile}
                    onError={e => { e.target.onerror = null; e.target.src = noProfile; }}
                    alt="avatar"
                    className="w-full h-full rounded-full object-cover bg-white"
                  />
                </div>
              </div>
              {/* Name & Email */}
              <div className="text-center space-y-2">
                <h1 className="text-2xl font-bold text-green-800">
                  {profile.firstName} {profile.lastName}
                </h1>
                <div className="px-4 py-2 bg-green-50 rounded-full">
                  <span className="text-green-700 text-sm font-medium">{profile.email}</span>
                </div>
                {/* Seller Badge */}
                {profile.sellerStatus === 'verified' && (
                  <Badge className="bg-gradient-to-r from-green-600 to-emerald-600 text-white px-4 py-2 text-sm font-semibold shadow-md">
                    <svg className="w-4 h-4 mr-1" fill="currentColor" viewBox="0 0 20 20">
                      <path fillRule="evenodd" d="M16.707 5.293a1 1 0 010 1.414l-8 8a1 1 0 01-1.414 0l-4-4a1 1 0 011.414-1.414L8 12.586l7.293-7.293a1 1 0 011.414 0z" clipRule="evenodd" />
                    </svg>
                    Verified Seller
                  </Badge>
                )}
              </div>
              {/* Bio */}
              {profile.bio && (
                <div className="text-center">
                  <p className="text-green-700 text-sm italic px-4">{profile.bio}</p>
                </div>
              )}
              {/* Contact */}
              {profile.contactNumber && (
                <div className="text-center">
                  <span className="text-green-700 text-sm font-medium">Contact: {profile.contactNumber}</span>
                </div>
              )}
              {/* Location */}
              {(profile.location?.address || profile.location?.city || profile.location?.province) && (
                <div className="text-center">
                  <span className="text-green-600 text-sm font-medium">
                    {[
                      profile.location?.address,
                      profile.location?.city,
                      profile.location?.province,
                      profile.location?.zipCode
                    ].filter(Boolean).join(', ')}
                  </span>
                </div>
              )}
              {/* Social Links */}
              {profile.socialLinks && profile.socialLinks.length > 0 && (
                <div className="w-full space-y-3">
                  <h4 className="text-green-800 font-semibold text-sm text-center">Social Links</h4>
                  <div className="space-y-2">
                    {profile.socialLinks.map((link, index) => (
                      <a
                        key={index}
                        href={link.url}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center justify-center w-full px-3 py-2 bg-green-50 hover:bg-green-100 rounded-lg transition-colors group"
                      >
                        <span className="text-lg mr-2">{getSocialIcon(link.platform)}</span>
                        <span className="text-green-700 text-sm font-medium group-hover:text-green-800 truncate">
                          {link.displayName || link.platform}
                        </span>
                      </a>
                    ))}
                  </div>
                </div>
              )}
              {/* Role & Timestamps */}
              <div className="text-center text-xs text-gray-400 mt-4">
                <div>Role: {profile.role}</div>
                <div>Joined: {new Date(profile.createdAt).toLocaleDateString()}</div>
                <div>Last Updated: {new Date(profile.updatedAt).toLocaleDateString()}</div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </>
  );
};

export default PublicProfile; 