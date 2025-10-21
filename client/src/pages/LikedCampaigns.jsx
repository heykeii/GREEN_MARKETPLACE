import React, { useState, useEffect, useContext } from 'react';
import { AuthContext } from '../context/AuthContext';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';
import { Heart, ArrowLeft } from 'lucide-react';
import { Link, useNavigate } from 'react-router-dom';
import axios from 'axios';
import { toast } from '@/utils/toast';
import { Button } from '@/components/ui/button';
import { getLikedCampaignIds } from '@/lib/utils';

const LikedCampaigns = () => {
  const { user: contextUser } = useContext(AuthContext);
  const [likedCampaigns, setLikedCampaigns] = useState([]);
  const [loading, setLoading] = useState(true);
  const navigate = useNavigate();

  useEffect(() => {
    fetchLikedCampaigns();
  }, []);

  const fetchLikedCampaigns = async () => {
    try {
      setLoading(true);
      const token = localStorage.getItem('token');
      const user = JSON.parse(localStorage.getItem('user') || 'null');
      
      // Get all campaigns first
      const allCampaignsResponse = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/campaigns`);
      const allCampaigns = allCampaignsResponse.data.campaigns || [];
      
      if (!user) {
        // For non-logged in users, get liked campaigns from localStorage
        const likedIds = getLikedCampaignIds();
        const likedCampaignsFiltered = allCampaigns.filter(campaign => 
          likedIds.includes(String(campaign._id))
        );
        setLikedCampaigns(likedCampaignsFiltered);
      } else {
        // For logged in users, filter campaigns where user has liked them
        const userId = user._id || user.id;
        const likedCampaignsFiltered = allCampaigns.filter(campaign => 
          campaign.likes?.some(like => {
            const likeId = like._id || like.id || like;
            return String(likeId) === String(userId);
          })
        );
        setLikedCampaigns(likedCampaignsFiltered);
      }
    } catch (error) {
      console.error('Error fetching liked campaigns:', error);
      toast.error('Failed to load liked campaigns');
    } finally {
      setLoading(false);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-gray-50 via-green-50/20 to-emerald-50/30 pt-20 md:pt-24">
        {/* Header */}
        <div className="max-w-6xl mx-auto px-4 py-6">
          <div className="flex items-center gap-4 mb-8">
            <button 
              onClick={() => navigate(-1)}
              className="p-2 hover:bg-gray-100 rounded-full transition-colors"
            >
              <ArrowLeft className="h-6 w-6 text-gray-600" />
            </button>
            <h1 className="text-2xl md:text-3xl font-bold text-gray-900 flex items-center gap-3">
              <Heart className="h-8 w-8 text-red-500 fill-current" />
              Liked Campaigns
            </h1>
          </div>

          {loading ? (
            // Loading skeleton
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {[1, 2, 3].map((i) => (
                <div key={i} className="bg-white rounded-3xl p-6 shadow-xl animate-pulse">
                  <div className="w-16 h-16 bg-gray-200 rounded-full mb-4"></div>
                  <div className="h-6 bg-gray-200 rounded-lg w-3/4 mb-3"></div>
                  <div className="h-4 bg-gray-200 rounded-lg w-1/2 mb-4"></div>
                  <div className="h-40 bg-gray-200 rounded-2xl mb-4"></div>
                </div>
              ))}
            </div>
          ) : likedCampaigns.length > 0 ? (
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {likedCampaigns.map((campaign) => (
                <Link 
                  key={campaign._id} 
                  to={`/campaigns/${campaign._id}`}
                  className="bg-white rounded-3xl p-6 shadow-xl hover:shadow-2xl transition-all duration-300 transform hover:-translate-y-1 border border-gray-100"
                >
                  <div className="flex items-center gap-4 mb-4">
                    <img
                      src={campaign.createdBy?.avatar || '/default-avatar.svg'}
                      alt={campaign.createdBy?.name}
                      className="w-12 h-12 rounded-full object-cover border-2 border-gray-200"
                    />
                    <div>
                      <h3 className="font-semibold text-gray-900">{campaign.createdBy?.firstName} {campaign.createdBy?.lastName}</h3>
                      <p className="text-sm text-gray-500">{new Date(campaign.createdAt).toLocaleDateString()}</p>
                    </div>
                  </div>
                  <h2 className="text-xl font-bold text-gray-900 mb-2">{campaign.title}</h2>
                  <p className="text-gray-600 text-sm mb-4 line-clamp-2">{campaign.description}</p>
                  {campaign.image && (
                    <div className="aspect-video rounded-2xl overflow-hidden mb-4">
                      <img
                        src={campaign.image}
                        alt={campaign.title}
                        className="w-full h-full object-cover"
                      />
                    </div>
                  )}
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <Heart className="h-5 w-5 text-red-500 fill-current" />
                      <span className="text-gray-600 font-medium">{campaign.likes?.length || 0}</span>
                    </div>
                    <div className="px-4 py-1 rounded-full bg-gray-100 text-sm font-medium text-gray-600 capitalize">
                      {campaign.type}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          ) : (
            <div className="text-center py-12">
              <div className="w-20 h-20 bg-red-50 rounded-full flex items-center justify-center mx-auto mb-6">
                <Heart className="h-10 w-10 text-red-500" />
              </div>
              <h2 className="text-xl font-bold text-gray-900 mb-2">No Liked Campaigns Yet</h2>
              <p className="text-gray-600 mb-6">Start exploring and liking campaigns that inspire you!</p>
              <Button
                onClick={() => navigate('/campaigns')}
                className="bg-gradient-to-r from-green-500 to-emerald-500 text-white px-8 py-2 rounded-full hover:shadow-lg transition-all"
              >
                Explore Campaigns
              </Button>
            </div>
          )}
        </div>
      </div>
      <Footer />
    </>
  );
};

export default LikedCampaigns;
