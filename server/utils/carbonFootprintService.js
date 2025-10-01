import OpenAI from 'openai';
import CarbonFootprint from '../models/carbonFootprint.model.js';
import Product from '../models/products.model.js';

// Initialize OpenAI client with error handling
let openai = null;
try {
  if (process.env.OPENAI_API_KEY) {
    openai = new OpenAI({
      apiKey: process.env.OPENAI_API_KEY,
    });
  } else {
    console.warn('OpenAI API key not found. Carbon footprint calculations will use fallback method.');
  }
} catch (error) {
  console.warn('Failed to initialize OpenAI client:', error.message);
}

/**
 * Carbon Footprint Service - Handles AI-powered carbon footprint calculations
 */
export class CarbonFootprintService {
  
  /**
   * Calculate carbon footprint using OpenAI
   * @param {Object} productData - Product information
   * @param {Array} materials - Array of materials with percentages
   * @param {number} weight - Product weight in kg
   * @param {string} productionMethod - Production method
   * @returns {Promise<Object>} - Carbon footprint calculation results
   */
  static async calculateCarbonFootprint(productData) {
    try {
      const { materials, weight, productionMethod } = productData;
      
      // Check if OpenAI is available
      if (!openai) {
        console.log('OpenAI not available, using fallback calculation method');
        return this.calculateFallbackCarbonFootprint(productData);
      }
      
      // Create detailed prompt for OpenAI
      const prompt = this.createCarbonFootprintPrompt(materials, weight, productionMethod);
      
      // Call OpenAI API
      const response = await openai.chat.completions.create({
        model: "gpt-4",
        messages: [
          {
            role: "system",
            content: "You are an environmental scientist specializing in carbon footprint calculations. You must provide accurate, research-based carbon footprint estimates using established scientific studies and databases like Ecoinvent, IPCC guidelines, and peer-reviewed research."
          },
          {
            role: "user",
            content: prompt
          }
        ],
        temperature: 0.1, // Low temperature for consistent, factual responses
        max_tokens: 1000
      });

      const aiResponse = response.choices[0].message.content;
      
      // Parse the AI response
      const carbonData = this.parseAIResponse(aiResponse);
      
      // Calculate additional metrics
      const enhancedData = this.calculateAdditionalMetrics(carbonData);
      
      return {
        success: true,
        data: enhancedData,
        aiResponse,
        prompt
      };
      
    } catch (error) {
      console.error('Carbon footprint calculation error:', error);
      // Fallback to basic calculation if OpenAI fails
      console.log('OpenAI failed, using fallback calculation method');
      return this.calculateFallbackCarbonFootprint(productData);
    }
  }

  /**
   * Fallback carbon footprint calculation when OpenAI is not available
   */
  static calculateFallbackCarbonFootprint(productData) {
    const { materials, weight, productionMethod } = productData;
    
    // Basic carbon footprint calculation based on material types
    const materialFootprints = {
      'organic cotton': 2.5,
      'recycled cotton': 1.8,
      'hemp': 1.2,
      'bamboo': 1.5,
      'linen': 1.8,
      'wool': 3.5,
      'recycled plastic': 1.2,
      'biodegradable plastic': 2.0,
      'wood': 0.8,
      'recycled wood': 0.5,
      'metal': 2.5,
      'recycled metal': 1.5,
      'glass': 1.0,
      'recycled glass': 0.6,
      'paper': 1.2,
      'recycled paper': 0.8,
      'leather': 4.0,
      'vegan leather': 2.5,
      'cork': 0.5,
      'jute': 1.0,
      'sisal': 1.2
    };

    // Production method multipliers
    const productionMultipliers = {
      'handmade': 0.8,
      'machine-made': 1.0,
      'upcycled': 0.6,
      'recycled': 0.7,
      'organic': 0.9,
      'conventional': 1.2,
      'artisan': 0.8,
      'industrial': 1.1
    };

    // Calculate weighted average carbon footprint
    let totalFootprint = 0;
    let totalPercentage = 0;

    materials.forEach(material => {
      const materialName = material.name.toLowerCase();
      const percentage = material.percentage || 100;
      const baseFootprint = materialFootprints[materialName] || 2.0; // Default fallback
      
      totalFootprint += (baseFootprint * percentage / 100);
      totalPercentage += percentage;
    });

    // Normalize if percentages don't add up to 100
    if (totalPercentage > 0) {
      totalFootprint = (totalFootprint / totalPercentage) * 100;
    }

    // Apply production method multiplier
    const productionMultiplier = productionMultipliers[productionMethod] || 1.0;
    const carbonFootprintKg = (totalFootprint * weight * productionMultiplier) / 100;

    // Calculate baseline (conventional alternative)
    const baselineFootprintKg = carbonFootprintKg * 1.5; // Assume 50% higher for conventional
    const co2SavingsKg = Math.max(0, baselineFootprintKg - carbonFootprintKg);

    const result = {
      carbonFootprintKg: Math.round(carbonFootprintKg * 10) / 10,
      baselineFootprintKg: Math.round(baselineFootprintKg * 10) / 10,
      co2SavingsKg: Math.round(co2SavingsKg * 10) / 10,
      materialBreakdown: `Fallback calculation based on material types and production method`,
      productionImpact: `Production method: ${productionMethod}`,
      calculationMethod: 'Fallback calculation (OpenAI not available)',
      studiesReferenced: 'Basic material carbon footprint database'
    };

    // Calculate additional metrics
    const enhancedData = this.calculateAdditionalMetrics(result);

    return {
      success: true,
      data: enhancedData,
      aiResponse: 'Fallback calculation used - OpenAI not available',
      prompt: 'Fallback calculation'
    };
  }

  /**
   * Create detailed prompt for OpenAI carbon footprint calculation
   */
  static createCarbonFootprintPrompt(materials, weight, productionMethod) {
    const materialsText = materials.map(m => 
      `${m.name} (${m.percentage}%)`
    ).join(', ');

    return `
Calculate the carbon footprint for a product with the following specifications:

MATERIALS: ${materialsText}
WEIGHT: ${weight} kg
PRODUCTION METHOD: ${productionMethod}

Please provide a detailed carbon footprint calculation based on established scientific studies and databases. Use the following format:

CARBON_FOOTPRINT: [number in kg CO2]
BASELINE_FOOTPRINT: [number in kg CO2 for conventional equivalent]
MATERIAL_BREAKDOWN: [detailed breakdown of each material's contribution]
PRODUCTION_IMPACT: [impact of production method]
CALCULATION_METHOD: [brief explanation of methodology used]
STUDIES_REFERENCED: [key studies or databases used]

Requirements:
1. Use data from established sources like Ecoinvent database, IPCC guidelines, or peer-reviewed studies
2. Consider the full lifecycle: material extraction, production, transportation, and end-of-life
3. Account for the production method's impact on emissions
4. Provide realistic, scientifically-backed estimates
5. If using recycled/upcycled materials, account for the reduced impact
6. Consider regional factors where applicable

Be precise and scientific in your calculations. The carbon footprint should be in kg CO2 equivalent.
    `.trim();
  }

  /**
   * Parse AI response to extract carbon footprint data
   */
  static parseAIResponse(aiResponse) {
    try {
      // Extract carbon footprint
      const carbonMatch = aiResponse.match(/CARBON_FOOTPRINT:\s*([\d.]+)/i);
      const carbonFootprint = carbonMatch ? parseFloat(carbonMatch[1]) : 0;

      // Extract baseline footprint
      const baselineMatch = aiResponse.match(/BASELINE_FOOTPRINT:\s*([\d.]+)/i);
      const baselineFootprint = baselineMatch ? parseFloat(baselineMatch[1]) : carbonFootprint * 1.5;

      // Extract material breakdown
      const materialMatch = aiResponse.match(/MATERIAL_BREAKDOWN:\s*([^\n]+)/i);
      const materialBreakdown = materialMatch ? materialMatch[1].trim() : '';

      // Extract production impact
      const productionMatch = aiResponse.match(/PRODUCTION_IMPACT:\s*([^\n]+)/i);
      const productionImpact = productionMatch ? productionMatch[1].trim() : '';

      // Extract calculation method
      const methodMatch = aiResponse.match(/CALCULATION_METHOD:\s*([^\n]+)/i);
      const calculationMethod = methodMatch ? methodMatch[1].trim() : '';

      // Extract studies referenced
      const studiesMatch = aiResponse.match(/STUDIES_REFERENCED:\s*([^\n]+)/i);
      const studiesReferenced = studiesMatch ? studiesMatch[1].trim() : '';

      return {
        carbonFootprintKg: carbonFootprint,
        baselineFootprintKg: baselineFootprint,
        co2SavingsKg: Math.max(0, baselineFootprint - carbonFootprint),
        materialBreakdown,
        productionImpact,
        calculationMethod,
        studiesReferenced
      };
    } catch (error) {
      console.error('Error parsing AI response:', error);
      throw new Error('Failed to parse AI response');
    }
  }

  /**
   * Calculate additional environmental metrics
   */
  static calculateAdditionalMetrics(carbonData) {
    const { carbonFootprintKg, co2SavingsKg } = carbonData;
    
    // Calculate equivalent trees (1 tree absorbs ~22 kg CO2 per year)
    const equivalentTrees = carbonFootprintKg / 22;
    
    // Calculate equivalent miles driven (average car emits ~0.4 kg CO2 per mile)
    const equivalentMiles = carbonFootprintKg / 0.4;
    
    // Calculate savings in trees
    const savingsTrees = co2SavingsKg / 22;
    
    return {
      ...carbonData,
      equivalentTrees: Math.round(equivalentTrees * 10) / 10,
      equivalentMiles: Math.round(equivalentMiles * 10) / 10,
      savingsTrees: Math.round(savingsTrees * 10) / 10
    };
  }

  /**
   * Save carbon footprint calculation to database
   */
  static async saveCarbonFootprint(productId, carbonData, aiResponse, prompt) {
    try {
      // Create or update carbon footprint record
      const carbonFootprint = await CarbonFootprint.findOneAndUpdate(
        { product: productId },
        {
          product: productId,
          materials: carbonData.materials || [],
          weight: carbonData.weight || 1,
          productionMethod: carbonData.productionMethod || 'conventional',
          carbonFootprintKg: carbonData.carbonFootprintKg,
          baselineFootprintKg: carbonData.baselineFootprintKg,
          co2SavingsKg: carbonData.co2SavingsKg,
          equivalentTrees: carbonData.equivalentTrees,
          equivalentMiles: carbonData.equivalentMiles,
          aiModel: 'gpt-4',
          aiPrompt: prompt,
          aiResponse: aiResponse,
          calculationDate: new Date(),
          verified: false
        },
        { upsert: true, new: true }
      );

      // Update product with carbon footprint data
      await Product.findByIdAndUpdate(productId, {
        'carbonFootprint.hasCalculation': true,
        'carbonFootprint.carbonFootprintKg': carbonData.carbonFootprintKg,
        'carbonFootprint.baselineFootprintKg': carbonData.baselineFootprintKg,
        'carbonFootprint.co2SavingsKg': carbonData.co2SavingsKg,
        'carbonFootprint.equivalentTrees': carbonData.equivalentTrees,
        'carbonFootprint.equivalentMiles': carbonData.equivalentMiles,
        'carbonFootprint.calculatedAt': new Date()
      });

      return carbonFootprint;
    } catch (error) {
      console.error('Error saving carbon footprint:', error);
      throw new Error('Failed to save carbon footprint data');
    }
  }

  /**
   * Get carbon footprint for a product
   */
  static async getCarbonFootprint(productId) {
    try {
      const carbonFootprint = await CarbonFootprint.findOne({ product: productId })
        .populate('product', 'name category');
      
      return carbonFootprint;
    } catch (error) {
      console.error('Error fetching carbon footprint:', error);
      throw new Error('Failed to fetch carbon footprint data');
    }
  }

  /**
   * Get user's total carbon savings
   */
  static async getUserCarbonSavings(userId) {
    try {
      // Get all products purchased by user
      const Order = (await import('../models/orders.model.js')).default;
      const orders = await Order.find({ 
        customer: userId, 
        status: 'completed' 
      }).populate('items.product');

      let totalSavings = 0;
      let totalFootprint = 0;
      let totalBaseline = 0;

      for (const order of orders) {
        for (const item of order.items) {
          if (item.product && item.product.carbonFootprint && item.product.carbonFootprint.hasCalculation) {
            const quantity = item.quantity;
            const savings = item.product.carbonFootprint.co2SavingsKg || 0;
            const footprint = item.product.carbonFootprint.carbonFootprintKg || 0;
            const baseline = item.product.carbonFootprint.baselineFootprintKg || 0;

            totalSavings += savings * quantity;
            totalFootprint += footprint * quantity;
            totalBaseline += baseline * quantity;
          }
        }
      }

      return {
        totalSavings,
        totalFootprint,
        totalBaseline,
        equivalentTrees: Math.round((totalSavings / 22) * 10) / 10,
        equivalentMiles: Math.round((totalSavings / 0.4) * 10) / 10
      };
    } catch (error) {
      console.error('Error calculating user carbon savings:', error);
      throw new Error('Failed to calculate user carbon savings');
    }
  }

  /**
   * Verify carbon footprint calculation (admin function)
   */
  static async verifyCarbonFootprint(carbonFootprintId, verified, adminId, notes) {
    try {
      const carbonFootprint = await CarbonFootprint.findByIdAndUpdate(
        carbonFootprintId,
        {
          verified,
          verifiedBy: adminId,
          verifiedAt: new Date(),
          adminNotes: notes
        },
        { new: true }
      );

      return carbonFootprint;
    } catch (error) {
      console.error('Error verifying carbon footprint:', error);
      throw new Error('Failed to verify carbon footprint');
    }
  }

  /**
   * Get all carbon footprints for admin review
   */
  static async getAllCarbonFootprints(page = 1, limit = 10, verified = null) {
    try {
      const filter = {};
      if (verified !== null) {
        filter.verified = verified;
      }

      const carbonFootprints = await CarbonFootprint.find(filter)
        .populate('product', 'name category seller')
        .populate('verifiedBy', 'firstName lastName')
        .sort({ createdAt: -1 })
        .skip((page - 1) * limit)
        .limit(limit);

      const total = await CarbonFootprint.countDocuments(filter);

      return {
        carbonFootprints,
        pagination: {
          currentPage: page,
          totalPages: Math.ceil(total / limit),
          total,
          hasNext: page < Math.ceil(total / limit),
          hasPrev: page > 1
        }
      };
    } catch (error) {
      console.error('Error fetching carbon footprints:', error);
      throw new Error('Failed to fetch carbon footprints');
    }
  }
}
