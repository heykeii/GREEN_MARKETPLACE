import { CarbonFootprintService } from '../utils/carbonFootprintService.js';
import CarbonFootprint from '../models/carbonFootprint.model.js';
import Product from '../models/products.model.js';

/**
 * Calculate carbon footprint for a product
 */
export const calculateCarbonFootprint = async (req, res) => {
    try {
        const { productId } = req.params;
        const { materials, weight, productionMethod } = req.body;

        // Validate input
        if (!materials || !Array.isArray(materials) || materials.length === 0) {
            return res.status(400).json({
                success: false,
                message: 'Materials array is required'
            });
        }

        if (!weight || weight <= 0) {
            return res.status(400).json({
                success: false,
                message: 'Valid weight is required'
            });
        }

        if (!productionMethod) {
            return res.status(400).json({
                success: false,
                message: 'Production method is required'
            });
        }

        // Check if product exists and belongs to user
        const product = await Product.findOne({ 
            _id: productId, 
            seller: req.user._id 
        });

        if (!product) {
            return res.status(404).json({
                success: false,
                message: 'Product not found or not authorized'
            });
        }

        // Calculate carbon footprint
        const result = await CarbonFootprintService.calculateCarbonFootprint({
            materials,
            weight,
            productionMethod
        });

        if (!result.success) {
            return res.status(500).json({
                success: false,
                message: 'Failed to calculate carbon footprint'
            });
        }

        // Save to database
        await CarbonFootprintService.saveCarbonFootprint(
            productId,
            result.data,
            result.aiResponse,
            result.prompt
        );

        // Update product with input data
        await Product.findByIdAndUpdate(productId, {
            'carbonFootprintInput.materials': materials,
            'carbonFootprintInput.weight': weight,
            'carbonFootprintInput.productionMethod': productionMethod
        });

        res.json({
            success: true,
            message: 'Carbon footprint calculated successfully',
            data: result.data
        });

    } catch (error) {
        console.error('Calculate carbon footprint error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to calculate carbon footprint',
            error: error.message
        });
    }
};

/**
 * Get carbon footprint for a product
 */
export const getCarbonFootprint = async (req, res) => {
    try {
        const { productId } = req.params;

        const carbonFootprint = await CarbonFootprintService.getCarbonFootprint(productId);

        if (!carbonFootprint) {
            return res.status(404).json({
                success: false,
                message: 'Carbon footprint not found for this product'
            });
        }

        res.json({
            success: true,
            carbonFootprint
        });

    } catch (error) {
        console.error('Get carbon footprint error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch carbon footprint',
            error: error.message
        });
    }
};

/**
 * Get user's carbon savings dashboard
 */
export const getUserCarbonSavings = async (req, res) => {
    try {
        const userId = req.user._id;

        const savings = await CarbonFootprintService.getUserCarbonSavings(userId);

        res.json({
            success: true,
            savings
        });

    } catch (error) {
        console.error('Get user carbon savings error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch carbon savings',
            error: error.message
        });
    }
};

/**
 * Get all carbon footprints (admin only)
 */
export const getAllCarbonFootprints = async (req, res) => {
    try {
        const page = parseInt(req.query.page) || 1;
        const limit = parseInt(req.query.limit) || 10;
        const verified = req.query.verified;

        const result = await CarbonFootprintService.getAllCarbonFootprints(
            page,
            limit,
            verified === 'true' ? true : verified === 'false' ? false : null
        );

        res.json({
            success: true,
            ...result
        });

    } catch (error) {
        console.error('Get all carbon footprints error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch carbon footprints',
            error: error.message
        });
    }
};

/**
 * Verify carbon footprint (admin only)
 */
export const verifyCarbonFootprint = async (req, res) => {
    try {
        const { carbonFootprintId } = req.params;
        const { verified, notes } = req.body;

        const carbonFootprint = await CarbonFootprintService.verifyCarbonFootprint(
            carbonFootprintId,
            verified,
            req.user._id,
            notes
        );

        res.json({
            success: true,
            message: `Carbon footprint ${verified ? 'verified' : 'rejected'} successfully`,
            carbonFootprint
        });

    } catch (error) {
        console.error('Verify carbon footprint error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to verify carbon footprint',
            error: error.message
        });
    }
};

/**
 * Get carbon footprint statistics (admin only)
 */
export const getCarbonFootprintStats = async (req, res) => {
    try {
        const totalProducts = await Product.countDocuments({
            'carbonFootprint.hasCalculation': true
        });

        const totalSavings = await Product.aggregate([
            { $match: { 'carbonFootprint.hasCalculation': true } },
            { $group: { _id: null, total: { $sum: '$carbonFootprint.co2SavingsKg' } } }
        ]);

        const averageFootprint = await Product.aggregate([
            { $match: { 'carbonFootprint.hasCalculation': true } },
            { $group: { _id: null, average: { $avg: '$carbonFootprint.carbonFootprintKg' } } }
        ]);

        const verifiedCount = await CarbonFootprint.countDocuments({ verified: true });
        const pendingCount = await CarbonFootprint.countDocuments({ verified: false });

        res.json({
            success: true,
            stats: {
                totalProducts,
                totalSavings: totalSavings[0]?.total || 0,
                averageFootprint: averageFootprint[0]?.average || 0,
                verifiedCount,
                pendingCount
            }
        });

    } catch (error) {
        console.error('Get carbon footprint stats error:', error);
        res.status(500).json({
            success: false,
            message: 'Failed to fetch carbon footprint statistics',
            error: error.message
        });
    }
};
