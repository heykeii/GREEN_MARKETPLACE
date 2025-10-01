import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';

const BadgeDisplay = ({ userId, isOwnProfile = false }) => {
  const [badgeProgress, setBadgeProgress] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchBadgeData = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        
        if (isOwnProfile) {
          // Fetch progress and earned badges for own profile
          const [progressRes, badgesRes] = await Promise.all([
            axios.get(`${import.meta.env.VITE_API_URL}/api/v1/badges/progress`, {
              headers: { Authorization: `Bearer ${token}` }
            }),
            axios.get(`${import.meta.env.VITE_API_URL}/api/v1/badges/earned`, {
              headers: { Authorization: `Bearer ${token}` }
            })
          ]);
          
          setBadgeProgress(progressRes.data.progress);
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
      bronze: 'bg-gradient-to-br from-amber-400 to-amber-600 text-white border-amber-500 shadow-amber-200',
      silver: 'bg-gradient-to-br from-gray-300 to-gray-500 text-white border-gray-400 shadow-gray-200',
      gold: 'bg-gradient-to-br from-yellow-400 to-yellow-600 text-white border-yellow-500 shadow-yellow-200'
    };
    return colors[level] || 'bg-gradient-to-br from-green-400 to-green-600 text-white border-green-500 shadow-green-200';
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
      <Card className="shadow-2xl border-green-200 bg-white/95 backdrop-blur-sm">
        <CardContent className="p-6">
          <div className="text-green-700 text-center">Loading badges...</div>
        </CardContent>
      </Card>
    );
  }

  return (
    <Card className="shadow-2xl border-green-200 bg-white/95 backdrop-blur-sm">
      <CardHeader className="bg-gradient-to-r from-green-600 to-emerald-600 text-white rounded-t-lg">
        <CardTitle className="text-xl font-bold flex items-center">
          <span className="mr-2">🏆</span>
          {isOwnProfile ? 'Your Badges & Progress' : 'Badges'}
        </CardTitle>
      </CardHeader>
      <CardContent className="p-6 space-y-6">
        
        {/* Earned Badges */}
        {earnedBadges.length > 0 ? (
          <div className="space-y-4">
            <h3 className="text-lg font-semibold text-green-800">Earned Badges</h3>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
              {earnedBadges.map((badge, index) => (
                <div
                  key={index}
                  className={`relative p-4 rounded-full border-2 ${getBadgeColor(badge.level)} ${getMedalStyle(badge.level)} flex flex-col items-center space-y-2 transform hover:scale-105 transition-all duration-300`}
                >
                  <div className="text-4xl mb-2">{getBadgeIcon(badge.type, badge.level)}</div>
                  <div className="text-center">
                    <div className="font-bold text-sm">{badge.name}</div>
                    <div className="text-xs opacity-90 mt-1">{badge.description}</div>
                  </div>
                  {/* Medal shine effect */}
                  <div className="absolute top-2 left-2 w-2 h-2 bg-white/30 rounded-full"></div>
                  <div className="absolute top-3 left-3 w-1 h-1 bg-white/50 rounded-full"></div>
                </div>
              ))}
            </div>
          </div>
        ) : (
          <div className="text-center py-4">
            <div className="text-green-600 text-lg mb-2">🎯</div>
            <div className="text-green-700 font-medium">No badges earned yet</div>
            <div className="text-green-600 text-sm mt-1">
              {isOwnProfile ? 'Start shopping and joining campaigns to earn your first badge!' : 'This user hasn\'t earned any badges yet'}
            </div>
          </div>
        )}

        {/* Progress Section (only for own profile) */}
        {isOwnProfile && badgeProgress && (
          <div className="space-y-6">
            <div className="border-t border-green-200 pt-6">
              <h3 className="text-lg font-semibold text-green-800 mb-4">Progress to Next Badges</h3>
              
              {/* Shopper Progress */}
              <div className="space-y-4">
                <h4 className="font-medium text-green-700 flex items-center">
                  <span className="mr-2">🛒</span>
                  Shopper Badges
                </h4>
                <div className="space-y-3">
                  {Object.entries(badgeProgress.shopper.progress).map(([level, progress]) => (
                    <div key={level} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-700 capitalize">
                          {level} Shopper ({progress.current}/{progress.threshold})
                        </span>
                        <span className="text-sm text-green-600">
                          {progress.earned ? '✅ Earned' : `${Math.round(progress.progress)}%`}
                        </span>
                      </div>
                      {!progress.earned && (
                        <Progress 
                          value={progress.progress} 
                          className="h-2"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>

              {/* Campaigner Progress */}
              <div className="space-y-4">
                <h4 className="font-medium text-green-700 flex items-center">
                  <span className="mr-2">🌱</span>
                  Campaigner Badges
                </h4>
                <div className="space-y-3">
                  {Object.entries(badgeProgress.campaigner.progress).map(([level, progress]) => (
                    <div key={level} className="space-y-1">
                      <div className="flex justify-between items-center">
                        <span className="text-sm font-medium text-green-700 capitalize">
                          {level} Campaigner ({progress.current}/{progress.threshold})
                        </span>
                        <span className="text-sm text-green-600">
                          {progress.earned ? '✅ Earned' : `${Math.round(progress.progress)}%`}
                        </span>
                      </div>
                      {!progress.earned && (
                        <Progress 
                          value={progress.progress} 
                          className="h-2"
                        />
                      )}
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default BadgeDisplay;
