import React from 'react';
import AwarenessCampaign from './AwarenessCampaign';
import PromotionalCampaign from './PromotionalCampaign';
import CommunityCampaign from './CommunityCampaign';
import axios from 'axios';
import { toast } from 'react-hot-toast';

const CampaignCard = ({ campaign, currentUser, onUpdate }) => {
  const handleLike = async (campaignId) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/campaigns/${campaignId}/like`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Robust id handling for likes update
        const currentUserId = currentUser?._id || currentUser?.id;
        const isSameUser = (a, b) => String(a) === String(b);
        const updatedLikes = response.data.isLiked
          ? [ ...(campaign.likes || []), { _id: currentUserId } ]
          : (campaign.likes || []).filter(like => !isSameUser(like?._id || like?.id, currentUserId));

        onUpdate && onUpdate(campaignId, { likes: updatedLikes });
        return response;
      }
    } catch (error) {
      console.error('Error liking campaign:', error);
      throw error;
    }
  };

  const handleComment = async (campaignId, text) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/campaigns/${campaignId}/comment`, 
        { text }, 
        {
          headers: {
            Authorization: `Bearer ${localStorage.getItem('token')}`
          }
        }
      );
      
      if (response.data.success) {
        // Update the campaign in parent component
        onUpdate && onUpdate(campaignId, {
          comments: [...(campaign.comments || []), response.data.comment]
        });
      }
    } catch (error) {
      console.error('Error adding comment:', error);
      throw error;
    }
  };

  const handleJoin = async (campaignId) => {
    try {
      const response = await axios.post(`${import.meta.env.VITE_API_URL}/api/v1/campaigns/${campaignId}/join`, {}, {
        headers: {
          Authorization: `Bearer ${localStorage.getItem('token')}`
        }
      });
      
      if (response.data.success) {
        // Update the campaign in parent component
        const isParticipant = campaign.participants?.some(p => p._id === currentUser.id);
        onUpdate && onUpdate(campaignId, {
          participants: response.data.isParticipant 
            ? [...(campaign.participants || []), { _id: currentUser.id, name: currentUser.name }]
            : (campaign.participants || []).filter(p => p._id !== currentUser.id),
          progress: response.data.progress
        });
      }
    } catch (error) {
      console.error('Error joining campaign:', error);
      throw error;
    }
  };

  // Render appropriate campaign type
  switch (campaign.type) {
    case 'awareness':
      return (
        <AwarenessCampaign
          campaign={campaign}
          currentUser={currentUser}
          onLike={handleLike}
          onComment={handleComment}
        />
      );
    case 'promotional':
      return (
        <PromotionalCampaign
          campaign={campaign}
          currentUser={currentUser}
        />
      );
    case 'community':
      return (
        <CommunityCampaign
          campaign={campaign}
          currentUser={currentUser}
          onJoin={handleJoin}
          onComment={handleComment}
        />
      );
    default:
      return (
        <div className="w-full max-w-2xl mx-auto p-6 border border-red-200 rounded-lg bg-red-50">
          <p className="text-red-800">Unknown campaign type: {campaign.type}</p>
        </div>
      );
  }
};

export default CampaignCard;
