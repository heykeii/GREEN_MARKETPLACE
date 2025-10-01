import React, { useState, useEffect } from 'react';
import { Dialog, DialogContent, DialogHeader, DialogTitle } from '@/components/ui/dialog';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import { Button } from '@/components/ui/button';
import axios from 'axios';

const BadgeModal = ({ isOpen, onClose, userId, isOwnProfile = false }) => {
  const [badgeProgress, setBadgeProgress] = useState(null);
  const [earnedBadges, setEarnedBadges] = useState([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!isOpen) return;

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
  }, [isOpen, userId, isOwnProfile]);

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

  return (
    <Dialog open={isOpen} onOpenChange={onClose}>
      <DialogContent className="max-w-4xl max-h-[90vh] overflow-y-auto">
        <DialogHeader>
          <DialogTitle className="text-2xl font-bold text-green-800 flex items-center">
            <span className="mr-3">🏆</span>
            {isOwnProfile ? 'Your Badges & Progress' : 'Achievement Badges'}
          </DialogTitle>
        </DialogHeader>

        <div className="space-y-6">
          {loading ? (
            <div className="text-center py-8">
              <div className="text-green-700 text-lg">Loading badges...</div>
            </div>
          ) : (
            <>
              {/* Earned Badges */}
              {earnedBadges.length > 0 ? (
                <div className="space-y-4">
                  <h3 className="text-xl font-semibold text-green-800">Earned Badges</h3>
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
                    {earnedBadges.map((badge, index) => (
                      <div
                        key={index}
                        className={`relative p-6 rounded-full border-2 ${getBadgeColor(badge.level)} ${getMedalStyle(badge.level)} flex flex-col items-center space-y-3 transform hover:scale-105 transition-all duration-300`}
                      >
                        <div className="text-5xl mb-2">{getBadgeIcon(badge.type, badge.level)}</div>
                        <div className="text-center">
                          <div className="font-bold text-lg">{badge.name}</div>
                          <div className="text-sm opacity-90 mt-2">{badge.description}</div>
                        </div>
                        {/* Medal shine effect */}
                        <div className="absolute top-3 left-3 w-3 h-3 bg-white/30 rounded-full"></div>
                        <div className="absolute top-4 left-4 w-1.5 h-1.5 bg-white/50 rounded-full"></div>
                      </div>
                    ))}
                  </div>
                </div>
              ) : (
                <div className="text-center py-8">
                  <div className="text-green-600 text-4xl mb-4">🎯</div>
                  <div className="text-green-700 font-medium text-lg">No badges earned yet</div>
                  <div className="text-green-600 text-sm mt-2">
                    {isOwnProfile ? 'Start shopping and joining campaigns to earn your first badge!' : 'This user hasn\'t earned any badges yet'}
                  </div>
                </div>
              )}

              {/* Progress Section (only for own profile) */}
              {isOwnProfile && badgeProgress && (
                <div className="space-y-6 border-t border-green-200 pt-6">
                  <h3 className="text-xl font-semibold text-green-800">Progress to Next Badges</h3>
                  
                  {/* Shopper Progress */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-green-700 flex items-center text-lg">
                      <span className="mr-3 text-2xl">🛒</span>
                      Shopper Badges
                    </h4>
                    <div className="space-y-4">
                      {Object.entries(badgeProgress.shopper.progress).map(([level, progress]) => (
                        <div key={level} className="bg-green-50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-medium text-green-700 capitalize">
                              {level} Shopper ({progress.current}/{progress.threshold})
                            </span>
                            <span className="text-lg text-green-600 font-semibold">
                              {progress.earned ? '✅ Earned' : `${Math.round(progress.progress)}%`}
                            </span>
                          </div>
                          {!progress.earned && (
                            <Progress 
                              value={progress.progress} 
                              className="h-3"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>

                  {/* Campaigner Progress */}
                  <div className="space-y-4">
                    <h4 className="font-medium text-green-700 flex items-center text-lg">
                      <span className="mr-3 text-2xl">🌱</span>
                      Campaigner Badges
                    </h4>
                    <div className="space-y-4">
                      {Object.entries(badgeProgress.campaigner.progress).map(([level, progress]) => (
                        <div key={level} className="bg-green-50 rounded-lg p-4">
                          <div className="flex justify-between items-center mb-2">
                            <span className="text-lg font-medium text-green-700 capitalize">
                              {level} Campaigner ({progress.current}/{progress.threshold})
                            </span>
                            <span className="text-lg text-green-600 font-semibold">
                              {progress.earned ? '✅ Earned' : `${Math.round(progress.progress)}%`}
                            </span>
                          </div>
                          {!progress.earned && (
                            <Progress 
                              value={progress.progress} 
                              className="h-3"
                            />
                          )}
                        </div>
                      ))}
                    </div>
                  </div>
                </div>
              )}
            </>
          )}
        </div>

        <div className="flex justify-end pt-4 border-t border-green-200">
          <Button onClick={onClose} className="bg-green-600 hover:bg-green-700 text-white">
            Close
          </Button>
        </div>
      </DialogContent>
    </Dialog>
  );
};

export default BadgeModal;
