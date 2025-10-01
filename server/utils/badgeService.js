import User from '../models/user.model.js';
import { NotificationService } from './notificationService.js';

/**
 * Badge Service - Handles badge assignment and tracking
 */
export class BadgeService {
    // Badge thresholds
    static SHOPPER_THRESHOLDS = {
        bronze: 5,
        silver: 20,
        gold: 50
    };

    static CAMPAIGNER_THRESHOLDS = {
        bronze: 3,
        silver: 10,
        gold: 20
    };

    /**
     * Update user's purchase count and check for badge eligibility
     * @param {string} userId - User ID
     * @param {number} quantity - Number of items purchased
     * @returns {Promise<Object>} - Updated badges and notification info
     */
    static async updatePurchaseCount(userId, quantity) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Update purchase count
            user.purchaseCount += quantity;
            await user.save();

            // Check for new badges
            const newBadges = await this.checkShopperBadges(user);
            
            return {
                success: true,
                newBadges,
                currentCount: user.purchaseCount
            };
        } catch (error) {
            console.error('Error updating purchase count:', error);
            throw error;
        }
    }

    /**
     * Update user's campaign participation count and check for badge eligibility
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Updated badges and notification info
     */
    static async updateCampaignParticipation(userId) {
        try {
            const user = await User.findById(userId);
            if (!user) {
                throw new Error('User not found');
            }

            // Update campaign participation count
            user.campaignsJoinedCount += 1;
            await user.save();

            // Check for new badges
            const newBadges = await this.checkCampaignerBadges(user);
            
            return {
                success: true,
                newBadges,
                currentCount: user.campaignsJoinedCount
            };
        } catch (error) {
            console.error('Error updating campaign participation:', error);
            throw error;
        }
    }

    /**
     * Check and assign shopper badges based on purchase count
     * @param {Object} user - User document
     * @returns {Promise<Array>} - Array of newly earned badges
     */
    static async checkShopperBadges(user) {
        const newBadges = [];
        const currentCount = user.purchaseCount;

        // Check Bronze Shopper Badge (5 purchases)
        if (currentCount >= this.SHOPPER_THRESHOLDS.bronze && !user.badges.shopper.bronze) {
            user.badges.shopper.bronze = true;
            newBadges.push({
                type: 'shopper',
                level: 'bronze',
                name: 'Bronze Shopper',
                description: 'Completed 5 product purchases',
                threshold: this.SHOPPER_THRESHOLDS.bronze
            });
        }

        // Check Silver Shopper Badge (20 purchases)
        if (currentCount >= this.SHOPPER_THRESHOLDS.silver && !user.badges.shopper.silver) {
            user.badges.shopper.silver = true;
            newBadges.push({
                type: 'shopper',
                level: 'silver',
                name: 'Silver Shopper',
                description: 'Completed 20 product purchases',
                threshold: this.SHOPPER_THRESHOLDS.silver
            });
        }

        // Check Gold Shopper Badge (50 purchases)
        if (currentCount >= this.SHOPPER_THRESHOLDS.gold && !user.badges.shopper.gold) {
            user.badges.shopper.gold = true;
            newBadges.push({
                type: 'shopper',
                level: 'gold',
                name: 'Gold Shopper',
                description: 'Completed 50 product purchases',
                threshold: this.SHOPPER_THRESHOLDS.gold
            });
        }

        if (newBadges.length > 0) {
            await user.save();
            
            // Send notification for new badges
            try {
                await NotificationService.notifyBadgeEarned(user._id, newBadges);
            } catch (notificationError) {
                console.error('Failed to send badge notification:', notificationError);
            }
        }

        return newBadges;
    }

    /**
     * Check and assign campaigner badges based on campaign participation count
     * @param {Object} user - User document
     * @returns {Promise<Array>} - Array of newly earned badges
     */
    static async checkCampaignerBadges(user) {
        const newBadges = [];
        const currentCount = user.campaignsJoinedCount;

        // Check Bronze Campaigner Badge (3 campaigns)
        if (currentCount >= this.CAMPAIGNER_THRESHOLDS.bronze && !user.badges.campaigner.bronze) {
            user.badges.campaigner.bronze = true;
            newBadges.push({
                type: 'campaigner',
                level: 'bronze',
                name: 'Bronze Campaigner',
                description: 'Joined 3 sustainability campaigns',
                threshold: this.CAMPAIGNER_THRESHOLDS.bronze
            });
        }

        // Check Silver Campaigner Badge (10 campaigns)
        if (currentCount >= this.CAMPAIGNER_THRESHOLDS.silver && !user.badges.campaigner.silver) {
            user.badges.campaigner.silver = true;
            newBadges.push({
                type: 'campaigner',
                level: 'silver',
                name: 'Silver Campaigner',
                description: 'Joined 10 sustainability campaigns',
                threshold: this.CAMPAIGNER_THRESHOLDS.silver
            });
        }

        // Check Gold Campaigner Badge (20 campaigns)
        if (currentCount >= this.CAMPAIGNER_THRESHOLDS.gold && !user.badges.campaigner.gold) {
            user.badges.campaigner.gold = true;
            newBadges.push({
                type: 'campaigner',
                level: 'gold',
                name: 'Gold Campaigner',
                description: 'Joined 20 sustainability campaigns',
                threshold: this.CAMPAIGNER_THRESHOLDS.gold
            });
        }

        if (newBadges.length > 0) {
            await user.save();
            
            // Send notification for new badges
            try {
                await NotificationService.notifyBadgeEarned(user._id, newBadges);
            } catch (notificationError) {
                console.error('Failed to send badge notification:', notificationError);
            }
        }

        return newBadges;
    }

    /**
     * Get user's badge progress
     * @param {string} userId - User ID
     * @returns {Promise<Object>} - Badge progress information
     */
    static async getBadgeProgress(userId) {
        try {
            const user = await User.findById(userId).select('purchaseCount campaignsJoinedCount badges');
            if (!user) {
                throw new Error('User not found');
            }

            return {
                shopper: {
                    current: user.purchaseCount,
                    badges: user.badges.shopper,
                    progress: {
                        bronze: {
                            current: user.purchaseCount,
                            threshold: this.SHOPPER_THRESHOLDS.bronze,
                            earned: user.badges.shopper.bronze,
                            progress: Math.min(100, (user.purchaseCount / this.SHOPPER_THRESHOLDS.bronze) * 100)
                        },
                        silver: {
                            current: user.purchaseCount,
                            threshold: this.SHOPPER_THRESHOLDS.silver,
                            earned: user.badges.shopper.silver,
                            progress: Math.min(100, (user.purchaseCount / this.SHOPPER_THRESHOLDS.silver) * 100)
                        },
                        gold: {
                            current: user.purchaseCount,
                            threshold: this.SHOPPER_THRESHOLDS.gold,
                            earned: user.badges.shopper.gold,
                            progress: Math.min(100, (user.purchaseCount / this.SHOPPER_THRESHOLDS.gold) * 100)
                        }
                    }
                },
                campaigner: {
                    current: user.campaignsJoinedCount,
                    badges: user.badges.campaigner,
                    progress: {
                        bronze: {
                            current: user.campaignsJoinedCount,
                            threshold: this.CAMPAIGNER_THRESHOLDS.bronze,
                            earned: user.badges.campaigner.bronze,
                            progress: Math.min(100, (user.campaignsJoinedCount / this.CAMPAIGNER_THRESHOLDS.bronze) * 100)
                        },
                        silver: {
                            current: user.campaignsJoinedCount,
                            threshold: this.CAMPAIGNER_THRESHOLDS.silver,
                            earned: user.badges.campaigner.silver,
                            progress: Math.min(100, (user.campaignsJoinedCount / this.CAMPAIGNER_THRESHOLDS.silver) * 100)
                        },
                        gold: {
                            current: user.campaignsJoinedCount,
                            threshold: this.CAMPAIGNER_THRESHOLDS.gold,
                            earned: user.badges.campaigner.gold,
                            progress: Math.min(100, (user.campaignsJoinedCount / this.CAMPAIGNER_THRESHOLDS.gold) * 100)
                        }
                    }
                }
            };
        } catch (error) {
            console.error('Error getting badge progress:', error);
            throw error;
        }
    }

    /**
     * Get all earned badges for a user
     * @param {string} userId - User ID
     * @returns {Promise<Array>} - Array of earned badges
     */
    static async getEarnedBadges(userId) {
        try {
            const user = await User.findById(userId).select('badges');
            if (!user) {
                throw new Error('User not found');
            }

            const earnedBadges = [];

            // Shopper badges
            if (user.badges.shopper.bronze) {
                earnedBadges.push({
                    type: 'shopper',
                    level: 'bronze',
                    name: 'Bronze Shopper',
                    description: 'Completed 5 product purchases',
                    threshold: this.SHOPPER_THRESHOLDS.bronze
                });
            }
            if (user.badges.shopper.silver) {
                earnedBadges.push({
                    type: 'shopper',
                    level: 'silver',
                    name: 'Silver Shopper',
                    description: 'Completed 20 product purchases',
                    threshold: this.SHOPPER_THRESHOLDS.silver
                });
            }
            if (user.badges.shopper.gold) {
                earnedBadges.push({
                    type: 'shopper',
                    level: 'gold',
                    name: 'Gold Shopper',
                    description: 'Completed 50 product purchases',
                    threshold: this.SHOPPER_THRESHOLDS.gold
                });
            }

            // Campaigner badges
            if (user.badges.campaigner.bronze) {
                earnedBadges.push({
                    type: 'campaigner',
                    level: 'bronze',
                    name: 'Bronze Campaigner',
                    description: 'Joined 3 sustainability campaigns',
                    threshold: this.CAMPAIGNER_THRESHOLDS.bronze
                });
            }
            if (user.badges.campaigner.silver) {
                earnedBadges.push({
                    type: 'campaigner',
                    level: 'silver',
                    name: 'Silver Campaigner',
                    description: 'Joined 10 sustainability campaigns',
                    threshold: this.CAMPAIGNER_THRESHOLDS.silver
                });
            }
            if (user.badges.campaigner.gold) {
                earnedBadges.push({
                    type: 'campaigner',
                    level: 'gold',
                    name: 'Gold Campaigner',
                    description: 'Joined 20 sustainability campaigns',
                    threshold: this.CAMPAIGNER_THRESHOLDS.gold
                });
            }

            return earnedBadges;
        } catch (error) {
            console.error('Error getting earned badges:', error);
            throw error;
        }
    }
}
