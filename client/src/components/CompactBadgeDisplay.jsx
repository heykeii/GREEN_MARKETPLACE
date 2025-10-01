import React, { useState, useEffect } from 'react';
import axios from 'axios';

const CompactBadgeDisplay = ({ userId, isOwnProfile = false }) => {
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadgeData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (isOwnProfile) {
          // Fetch earned badges for own profile
          const badgesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/badges/earned`, {
            headers: { Authorization: `Bearer ${token}` }
          });
          setEarnedBadges(badgesRes.data.badges);
        } else {
          // Fetch only earned badges for public profile
          const badgesRes = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/badges/public/${userId}`);
          setEarnedBadges(badgesRes.data.badges);
        }
      } catch (error) {
        console.error('Error fetching badge data:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchBadgeData();
  }, [userId, isOwnProfile]);

  const getBadgeIcon = (type, level) => {
    const icons = {
      shopper: {
        bronze: '🥉',
        silver: '🥈',
        gold: '🥇'
      },
      campaigner: {
        bronze: '🥉',
        silver: '🥈',
        gold: '🥇'
      }
    };
    return icons[type]?.[level] || '🏆';
  };

  const getBadgeColor = (level) => {
    const colors = {
      bronze: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white',
      silver: 'bg-gradient-to-br from-gray-300 to-gray-500 text-white',
      gold: 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white'
    };
    return colors[level] || 'bg-gradient-to-br from-green-400 to-green-600 text-white';
  };

  const getMedalStyle = (level) => {
    const styles = {
      bronze: 'ring-2 ring-amber-300 shadow-lg shadow-amber-200/50',
      silver: 'ring-2 ring-gray-300 shadow-lg shadow-gray-200/50',
      gold: 'ring-2 ring-yellow-300 shadow-lg shadow-yellow-200/50'
    };
    return styles[level] || 'ring-2 ring-green-300 shadow-lg shadow-green-200/50';
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center space-x-2">
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
        <div className="w-8 h-8 bg-gray-200 rounded-full animate-pulse"></div>
      </div>
    );
  }

  if (earnedBadges.length === 0) {
    return (
      <div className="text-center py-2">
        <div className="text-green-600 text-sm">No badges yet</div>
      </div>
    );
  }

  return (
    <div className="flex flex-wrap items-center justify-center gap-2">
      {earnedBadges.slice(0, 6).map((badge, index) => (
        <div
          key={index}
          className={`relative w-10 h-10 rounded-full border-2 ${getBadgeColor(badge.level)} ${getMedalStyle(badge.level)} flex items-center justify-center transform hover:scale-110 transition-all duration-200 cursor-pointer group`}
          title={`${badge.name} - ${badge.description}`}
        >
          <span className="text-lg">{getBadgeIcon(badge.type, badge.level)}</span>
          {/* Medal shine effect */}
          <div className="absolute top-1 left-1 w-1 h-1 bg-white/40 rounded-full"></div>
          <div className="absolute top-2 left-2 w-0.5 h-0.5 bg-white/60 rounded-full"></div>
          
          {/* Tooltip on hover */}
          <div className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-2 py-1 bg-gray-800 text-white text-xs rounded opacity-0 group-hover:opacity-100 transition-opacity duration-200 whitespace-nowrap z-10">
            {badge.name}
          </div>
        </div>
      ))}
      {earnedBadges.length > 6 && (
        <div className="w-10 h-10 rounded-full bg-gray-100 border-2 border-gray-300 flex items-center justify-center text-gray-600 text-sm font-bold">
          +{earnedBadges.length - 6}
        </div>
      )}
    </div>
  );
};

export default CompactBadgeDisplay;
