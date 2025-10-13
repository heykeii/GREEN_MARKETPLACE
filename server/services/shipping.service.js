import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class ShippingService {
    constructor() {
        this.openai = null;
    }

    _getOpenAIClient() {
        if (!this.openai && process.env.OPENAI_API_KEY) {
            this.openai = new OpenAI({
                apiKey: process.env.OPENAI_API_KEY
            });
        }
        return this.openai;
    }
    /**
     * Estimates shipping fee based on seller and buyer locations
     * @param {Object} params - Shipping parameters
     * @param {string} params.sellerLocation - Seller's location (city/province)
     * @param {string} params.buyerCity - Buyer's city
     * @param {string} params.buyerProvince - Buyer's province
     * @param {number} params.totalWeight - Total weight in kg (optional)
     * @returns {Promise<Object>} Estimated shipping fee and details
     */
    async estimateShippingFee({ sellerLocation, buyerCity, buyerProvince, totalWeight = 1 }) {
        try {
            const openai = this._getOpenAIClient();
            
            // If OpenAI is not available, use fallback
            if (!openai) {
                console.warn('OpenAI API key not configured, using fallback estimation');
                return this._fallbackEstimate(sellerLocation, buyerCity, buyerProvince, totalWeight);
            }

            const prompt = `You are a Philippines shipping cost estimator. Calculate the estimated shipping fee for domestic delivery within the Philippines.

Seller Location: ${sellerLocation || 'Metro Manila'}
Buyer Location: ${buyerCity}, ${buyerProvince}
Package Weight: ${totalWeight} kg

Based on standard Philippine courier services (like J&T, LBC, JRS), provide a realistic shipping estimate.

Consider:
1. Distance between locations
2. Whether locations are in Metro Manila, Luzon, Visayas, or Mindanao
3. Standard courier rates in the Philippines
4. Package weight

Respond ONLY with a JSON object in this exact format:
{
  "shippingFee": <number in pesos>,
  "estimatedDays": <number of delivery days>,
  "courierType": "<standard/express>",
  "distance": "<short/medium/long>",
  "explanation": "<brief explanation>"
}

Example for Manila to Batangas (1kg):
{
  "shippingFee": 58,
  "estimatedDays": 2,
  "courierType": "standard",
  "distance": "short",
  "explanation": "Short distance within Luzon region"
}`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{
                    role: "system",
                    content: "You are a Philippines shipping cost calculator. Always respond with valid JSON only, no additional text."
                }, {
                    role: "user",
                    content: prompt
                }],
                temperature: 0.3,
                max_tokens: 300
            });

            const response = completion.choices[0].message.content.trim();
            const estimate = JSON.parse(response);

            // Validate response
            if (!estimate.shippingFee || typeof estimate.shippingFee !== 'number') {
                throw new Error('Invalid shipping estimate response');
            }

            // Ensure minimum shipping fee
            if (estimate.shippingFee < 40) {
                estimate.shippingFee = 40; // Minimum shipping fee in PH
            }

            return {
                success: true,
                shippingFee: Math.round(estimate.shippingFee * 100) / 100,
                estimatedDays: estimate.estimatedDays || 3,
                courierType: estimate.courierType || 'standard',
                distance: estimate.distance || 'medium',
                explanation: estimate.explanation || 'Standard shipping within Philippines'
            };

        } catch (error) {
            console.error('Shipping estimation error:', error);
            
            // Fallback to basic estimation
            return this._fallbackEstimate(sellerLocation, buyerCity, buyerProvince, totalWeight);
        }
    }

    /**
     * Fallback estimation when OpenAI fails
     * Based on real Philippine courier rates (J&T, LBC, JRS Express)
     * @private
     */
    _fallbackEstimate(sellerLocation, buyerCity, buyerProvince, totalWeight) {
        const seller = (sellerLocation || '').toLowerCase();
        const city = (buyerCity || '').toLowerCase();
        const province = (buyerProvince || '').toLowerCase();

        let baseFee = 50;
        let estimatedDays = 2;
        let distance = 'medium';
        let explanation = 'Standard shipping';

        // Extract province from seller location
        const sellerProvince = this._extractProvince(seller);
        
        // 1. Same city/municipality (cheapest)
        if (seller.includes(city) || city.includes(seller.split(',')[0])) {
            baseFee = 40;
            estimatedDays = 1;
            distance = 'short';
            explanation = 'Same city delivery';
        }
        // 2. Same province
        else if (sellerProvince === province || 
                 (sellerProvince && province.includes(sellerProvince)) ||
                 (province && sellerProvince.includes(province))) {
            baseFee = 45;
            estimatedDays = 1-2;
            distance = 'short';
            explanation = 'Within same province';
        }
        // 3. Metro Manila to/from nearby CALABARZON
        else if (this._isMetroManilaToCALABARZON(seller, province) || 
                 this._isMetroManilaToCALABARZON(province, seller)) {
            baseFee = 55;
            estimatedDays = 2;
            distance = 'short';
            explanation = 'Metro Manila to nearby province';
        }
        // 4. Within Luzon but different regions
        else if (this._isLuzon(province) && this._isLuzon(seller)) {
            baseFee = 70;
            estimatedDays = 2-3;
            distance = 'medium';
            explanation = 'Within Luzon region';
        }
        // 5. Luzon to Visayas or vice versa
        else if ((this._isLuzon(province) && this._isVisayas(seller)) || 
                 (this._isVisayas(province) && this._isLuzon(seller))) {
            baseFee = 120;
            estimatedDays = 3-4;
            distance = 'long';
            explanation = 'Inter-island shipping (Luzon-Visayas)';
        }
        // 6. Luzon to Mindanao or vice versa
        else if ((this._isLuzon(province) && this._isMindanao(seller)) || 
                 (this._isMindanao(province) && this._isLuzon(seller))) {
            baseFee = 150;
            estimatedDays = 4-5;
            distance = 'long';
            explanation = 'Inter-island shipping (Luzon-Mindanao)';
        }
        // 7. Visayas to Mindanao or vice versa
        else if ((this._isVisayas(province) && this._isMindanao(seller)) || 
                 (this._isMindanao(province) && this._isVisayas(seller))) {
            baseFee = 130;
            estimatedDays = 3-4;
            distance = 'long';
            explanation = 'Inter-island shipping (Visayas-Mindanao)';
        }

        // Add weight surcharge (₱10 per kg above 2kg)
        if (totalWeight > 2) {
            baseFee += Math.ceil((totalWeight - 2) * 10);
        }

        return {
            success: true,
            shippingFee: Math.round(baseFee),
            estimatedDays: typeof estimatedDays === 'string' ? 2 : estimatedDays,
            courierType: 'standard',
            distance: distance,
            explanation: explanation
        };
    }

    /**
     * Extract province name from location string
     * @private
     */
    _extractProvince(location) {
        const loc = location.toLowerCase();
        
        // Check all provinces
        const allProvinces = [
            'batangas', 'cavite', 'laguna', 'rizal', 'quezon', 'bulacan', 'pampanga', 
            'nueva ecija', 'tarlac', 'pangasinan', 'la union', 'benguet', 'ilocos norte',
            'ilocos sur', 'cagayan', 'isabela', 'bataan', 'zambales', 'aurora',
            'cebu', 'bohol', 'leyte', 'samar', 'negros occidental', 'negros oriental',
            'iloilo', 'aklan', 'capiz', 'antique',
            'davao', 'bukidnon', 'misamis', 'lanao', 'cotabato', 'zamboanga'
        ];
        
        for (const prov of allProvinces) {
            if (loc.includes(prov)) {
                return prov;
            }
        }
        
        // Check if it's Metro Manila
        if (loc.includes('manila') || loc.includes('quezon city') || loc.includes('makati') ||
            loc.includes('taguig') || loc.includes('pasig') || loc.includes('caloocan')) {
            return 'metro manila';
        }
        
        return null;
    }

    /**
     * Check if route is Metro Manila to CALABARZON or vice versa
     * @private
     */
    _isMetroManilaToCALABARZON(loc1, loc2) {
        const isManila = loc1.includes('manila') || loc1.includes('quezon city') || 
                        loc1.includes('makati') || loc1.includes('taguig') || 
                        loc1.includes('pasig') || loc1.includes('caloocan');
        
        const calabarzon = ['cavite', 'laguna', 'batangas', 'rizal', 'quezon'];
        const isCALABARZON = calabarzon.some(p => loc2.includes(p));
        
        return isManila && isCALABARZON;
    }

    _isLuzon(province) {
        const luzon = ['batangas', 'cavite', 'laguna', 'rizal', 'bulacan', 'pampanga', 'nueva ecija', 'tarlac', 'pangasinan', 'la union', 'benguet', 'ilocos', 'cagayan', 'isabela', 'quirino', 'nueva vizcaya', 'bataan', 'zambales', 'quezon', 'aurora', 'marinduque', 'romblon', 'palawan', 'occidental mindoro', 'oriental mindoro', 'albay', 'camarines', 'catanduanes', 'masbate', 'sorsogon'];
        return luzon.some(l => province.includes(l));
    }

    _isVisayas(province) {
        const visayas = ['cebu', 'bohol', 'leyte', 'samar', 'negros', 'panay', 'iloilo', 'aklan', 'capiz', 'antique', 'guimaras', 'biliran', 'siquijor'];
        return visayas.some(v => province.includes(v));
    }

    _isMindanao(province) {
        const mindanao = ['davao', 'bukidnon', 'misamis', 'lanao', 'cotabato', 'maguindanao', 'sultan kudarat', 'south cotabato', 'sarangani', 'agusan', 'surigao', 'dinagat', 'zamboanga', 'basilan', 'sulu', 'tawi-tawi'];
        return mindanao.some(m => province.includes(m));
    }
}

export default new ShippingService();
