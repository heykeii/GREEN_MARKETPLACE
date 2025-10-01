import { BadgeService } from '../utils/badgeService.js';

/**
 * Get user's badge progress and earned badges
 */
export const getBadgeProgress = async (req, res) => {
    try {
        const userId = req.user._id;
        const progress = await BadgeService.getBadgeProgress(userId);
        
        res.json({
            success: true,
            progress
        });
    } catch (error) {
        console.error('Get badge progress error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch badge progress',
            error: error.message
        });
    }
};

/**
 * Get user's earned badges
 */
export const getEarnedBadges = async (req, res) => {
    try {
        const userId = req.user._id;
        const badges = await BadgeService.getEarnedBadges(userId);
        
        res.json({
            success: true,
            badges
        });
    } catch (error) {
        console.error('Get earned badges error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch earned badges',
            error: error.message
        });
    }
};

/**
 * Get another user's earned badges (public profile)
 */
export const getPublicBadges = async (req, res) => {
    try {
        const { userId } = req.params;
        const badges = await BadgeService.getEarnedBadges(userId);
        
        res.json({
            success: true,
            badges
        });
    } catch (error) {
        console.error('Get public badges error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch public badges',
            error: error.message
        });
    }
};
