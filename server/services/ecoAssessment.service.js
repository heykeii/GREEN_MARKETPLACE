import OpenAI from 'openai';
import dotenv from 'dotenv';

dotenv.config();

class EcoAssessmentService {
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
     * Assess the environmental impact and sustainability of a product
     * @param {Object} productData - Product details
     * @param {string} productData.name - Product name
     * @param {string} productData.description - Product description
     * @param {Array<Object>} productData.materials - Materials used with weights
     * @param {string} productData.productionMethod - Production method
     * @param {boolean} productData.isRecyclable - Whether product is recyclable
     * @param {string} productData.packaging - Packaging information
     * @returns {Promise<Object>} Eco assessment result
     */
    async assessProduct(productData) {
        try {
            const openai = this._getOpenAIClient();
            
            // If OpenAI is not available, use fallback
            if (!openai) {
                console.warn('OpenAI API key not configured, using fallback eco assessment');
                return this._fallbackAssessment(productData);
            }

            const { name, description, materials, productionMethod, isRecyclable, packaging } = productData;

            // Prepare materials description
            const materialsDesc = materials && materials.length > 0
                ? materials.map(m => `${m.material || m.name || m} (${m.weight || 'unknown weight'})`).join(', ')
                : 'Not specified';

            const prompt = `You are an environmental sustainability expert conducting a thorough product assessment.

PRODUCT DETAILS:
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━
Name: ${name || 'Not specified'}
Description: ${description || 'Not specified'}
Materials: ${materialsDesc}
Production: ${productionMethod || 'Not specified'}
Recyclable: ${isRecyclable ? 'Yes' : 'No'}
Packaging: ${packaging || 'Not specified'}
━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━━

ASSESSMENT FRAMEWORK - Analyze using these 4 criteria:

1. **Materials Analysis**
   - Renewable (bamboo, cork, hemp, organic cotton)?
   - Recycled content (post-consumer/post-industrial)?
   - Harmful (plastic, PVC, heavy metals, toxic dyes)?

2. **Production Method**
   - Energy use: Handmade (low) vs Factory (high)?
   - Waste generation and water usage?
   - Renewable energy sources?

3. **Recyclability & Waste**
   - End-of-life: Recyclable, compostable, or landfill?
   - Material separation complexity?
   - Biodegradability timeline?

4. **Chemicals & Synthetics**
   - Synthetic fibers (polyester, nylon, acrylic)?
   - Chemical treatments (dyes, finishes, coatings)?
   - Toxic substances (formaldehyde, phthalates)?

RATING CRITERIA (Be strict and evidence-based):

**High** = 3-4 positive factors:
- 80%+ renewable/recycled materials
- Low-energy production (handmade/solar)
- 100% recyclable or biodegradable
- No harmful chemicals

**Moderate** = 1-2 positive factors:
- 40-79% sustainable materials
- Some eco-practices
- Partially recyclable
- Limited chemical use

**Low** = 0-1 positive factors:
- <40% sustainable materials
- High-energy production
- Not recyclable
- Synthetic/toxic components

CRITICAL REQUIREMENTS:

✅ BE SPECIFIC: Name actual materials and their environmental impact
   Example: "Bamboo sequesters 35% more CO2 than hardwood trees"

✅ BE ANALYTICAL: Explain WHY something is sustainable/unsustainable
   Example: "Handmade production eliminates 80% of factory emissions"

✅ BE ACTIONABLE: Give concrete, implementable recommendations
   Example: "Switch to GOTS-certified organic cotton instead of conventional cotton"

✅ BE HONEST: If info is vague/missing, rate Moderate or Low
   Example: If materials are just "fabric" without details → Moderate/Low

❌ AVOID VAGUE STATEMENTS:
- "Eco-friendly materials" → Which ones? Why?
- "Sustainable production" → What makes it sustainable?
- "Consider green options" → What specific options?

JSON FORMAT (strictly follow):
{
  "rating": "High|Moderate|Low",
  "summary": "2-3 sentences with SPECIFIC material names, production details, and environmental impact analysis",
  "strengths": [
    "Specific material/process with quantifiable benefit (e.g., '90% recycled PET reduces petroleum use')",
    "Detailed production advantage with impact (e.g., 'Solar-powered facility eliminates 500kg CO2/year')",
    "Concrete environmental benefit with evidence (e.g., 'Biodegrades in 90 days vs 500 years for plastic')"
  ],
  "recommendations": [
    "Actionable step with specific alternative (e.g., 'Replace synthetic dyes with plant-based natural dyes')",
    "Concrete certification/standard to pursue (e.g., 'Obtain B-Corp certification for verified sustainability')",
    "Specific improvement with measurable goal (e.g., 'Use 100% post-consumer recycled packaging materials')"
  ]
}

GOOD EXAMPLE:
{
  "rating": "High",
  "summary": "This product excels with 100% bamboo construction (renewable resource that grows 3ft/day) and handcrafted production (85% less energy than factory). Natural beeswax finish avoids toxic chemical coatings. Lacks third-party sustainability certification.",
  "strengths": [
    "Bamboo absorbs 35% more CO2 than equivalent trees and requires zero pesticides or irrigation",
    "Handmade production by local artisans reduces carbon footprint by 500kg CO2 annually vs mechanized manufacturing",
    "Fully biodegradable - decomposes within 4-6 months in composting conditions vs 500+ years for plastic alternatives"
  ],
  "recommendations": [
    "Obtain FSC (Forest Stewardship Council) certification to verify sustainable bamboo harvesting practices",
    "Replace petroleum-based wax coating with plant-based carnauba or soy wax for fully natural composition",
    "Implement carbon-neutral shipping by partnering with offset programs like Carbonfund.org"
  ]
}

NOW ANALYZE THIS PRODUCT WITH DEPTH AND SPECIFICITY:`;

            const completion = await openai.chat.completions.create({
                model: "gpt-4",
                messages: [{
                    role: "system",
                    content: "You are a strict environmental sustainability auditor with expertise in lifecycle assessment, material science, and circular economy principles. Provide detailed, evidence-based analysis with specific material names, quantifiable impacts, and actionable recommendations. Be critical and thorough - avoid generic praise. If information is vague or missing, rate conservatively. Always respond with valid JSON only."
                }, {
                    role: "user",
                    content: prompt
                }],
                temperature: 0.2,
                max_tokens: 1000
            });

            const response = completion.choices[0].message.content.trim();
            const assessment = JSON.parse(response);

            // Validate response structure
            if (!assessment.rating || !assessment.summary) {
                throw new Error('Invalid assessment response structure');
            }

            // Ensure rating is valid
            const validRatings = ['Low', 'Moderate', 'High'];
            if (!validRatings.includes(assessment.rating)) {
                assessment.rating = 'Moderate';
            }

            // Ensure arrays exist
            assessment.strengths = assessment.strengths || [];
            assessment.recommendations = assessment.recommendations || [];

            return {
                success: true,
                rating: assessment.rating,
                summary: assessment.summary,
                strengths: assessment.strengths,
                recommendations: assessment.recommendations,
                assessedAt: new Date()
            };

        } catch (error) {
            console.error('Eco assessment error:', error);
            
            // Fallback to basic assessment
            return this._fallbackAssessment(productData);
        }
    }

    /**
     * Fallback assessment when OpenAI is unavailable
     * @private
     */
    _fallbackAssessment(productData) {
        const { name, description, materials, productionMethod, isRecyclable } = productData;
        
        let score = 50;
        const strengths = [];
        const recommendations = [];

        // Analyze materials
        const materialsStr = JSON.stringify(materials || []).toLowerCase();
        const descStr = (description || '').toLowerCase();
        const nameStr = (name || '').toLowerCase();
        const allText = `${materialsStr} ${descStr} ${nameStr}`;

        // Sustainable materials (SPECIFIC)
        if (allText.includes('bamboo')) {
            score += 15;
            strengths.push('Bamboo material grows 20x faster than trees and requires no pesticides, making it highly renewable');
        }
        if (allText.includes('hemp')) {
            score += 15;
            strengths.push('Hemp requires 50% less water than cotton and naturally resists pests without chemical treatments');
        }
        if (allText.includes('cork')) {
            score += 12;
            strengths.push('Cork is harvested from tree bark without harming the tree, allowing sustainable regeneration every 9 years');
        }
        if (allText.includes('organic') && allText.includes('cotton')) {
            score += 10;
            strengths.push('Organic cotton eliminates synthetic pesticides and uses 91% less water than conventional cotton farming');
        } else if (allText.includes('cotton') && !allText.includes('organic')) {
            score -= 5;
            recommendations.push('Switch to GOTS-certified organic cotton to eliminate 16,000kg of pesticides per hectare');
        }
        if (allText.includes('recycled')) {
            score += 12;
            strengths.push('Uses recycled materials, diverting waste from landfills and reducing virgin resource extraction by up to 70%');
        }
        if (allText.includes('wood') && !allText.includes('reclaimed') && !allText.includes('certified')) {
            recommendations.push('Source FSC-certified wood to ensure sustainable forestry practices and prevent deforestation');
        }

        // Problematic materials (SPECIFIC)
        if (allText.includes('plastic') && !allText.includes('recycled')) {
            score -= 15;
            recommendations.push('Replace virgin plastic with post-consumer recycled PET (rPET) to reduce petroleum dependence by 60%');
        }
        if (allText.includes('polyester') || allText.includes('nylon') || allText.includes('acrylic')) {
            score -= 12;
            recommendations.push('Replace synthetic fibers with natural alternatives like organic cotton, linen, or Tencel (lyocell)');
        }
        if (allText.includes('pvc') || allText.includes('vinyl')) {
            score -= 18;
            recommendations.push('Eliminate PVC/vinyl materials as they release toxic dioxins - use natural rubber or TPE instead');
        }

        // Production method (SPECIFIC)
        const productionStr = (productionMethod || '').toLowerCase();
        if (productionStr.includes('handmade') || productionStr.includes('hand made') || productionStr.includes('manual')) {
            score += 12;
            strengths.push('Handmade production reduces energy consumption by 80% compared to mechanized manufacturing');
        } else if (productionStr.includes('factory') || productionStr.includes('machine')) {
            recommendations.push('Transition to renewable energy sources (solar/wind) in manufacturing to cut CO2 emissions by 70%');
        }
        if (productionStr.includes('solar') || productionStr.includes('renewable energy')) {
            score += 15;
            strengths.push('Renewable energy powered production eliminates fossil fuel dependency and associated carbon emissions');
        }
        if (productionStr.includes('local') || allText.includes('locally made')) {
            score += 8;
            strengths.push('Local production reduces transportation emissions by up to 90% compared to overseas manufacturing');
        }

        // Recyclability (SPECIFIC)
        if (isRecyclable) {
            score += 12;
            strengths.push('Product recyclability extends material lifecycle and prevents 500+ years of landfill decomposition time');
        } else {
            score -= 8;
            recommendations.push('Design for disassembly using mono-materials (single material type) to enable 95%+ recyclability');
        }

        // Biodegradability
        if (allText.includes('biodegradable') || allText.includes('compostable')) {
            score += 10;
            strengths.push('Biodegradable materials decompose naturally within 90-180 days versus 500+ years for plastics');
        }

        // Certifications
        if (allText.includes('fair trade')) {
            score += 5;
            strengths.push('Fair Trade certification ensures ethical labor practices and environmental sustainability standards');
        }
        if (!allText.includes('certified') && !allText.includes('certification')) {
            recommendations.push('Obtain third-party eco-certifications (GOTS, FSC, Cradle-to-Cradle) to verify sustainability claims');
        }

        // Cap score
        score = Math.max(0, Math.min(100, score));

        // Determine rating
        let rating = 'Moderate';
        if (score >= 70) rating = 'High';
        else if (score < 40) rating = 'Low';

        // Build detailed summary
        let summary = '';
        if (rating === 'High') {
            summary = `This product demonstrates strong sustainability with ${strengths.length > 0 ? 'proven' : 'identified'} eco-friendly features including renewable materials and low-impact production. Environmental credentials are solid but documentation could be enhanced.`;
        } else if (rating === 'Moderate') {
            summary = `This product shows environmental consideration but lacks comprehensive sustainability information. Current materials and production methods need verification and improvement for higher eco-performance.`;
        } else {
            summary = `This product requires significant sustainability improvements. Limited information about materials sourcing and production impact raises concerns about environmental footprint and lifecycle sustainability.`;
        }

        // Default strengths if none found
        if (strengths.length === 0) {
            strengths.push(
                'Product has potential for sustainability improvements with proper material selection',
                'Opportunity exists to implement eco-friendly production methods and reduce environmental impact',
                'Can transition to circular economy principles with design modifications'
            );
        }

        // Default recommendations if none generated
        if (recommendations.length === 0) {
            recommendations.push(
                'Conduct lifecycle assessment (LCA) to quantify environmental impact from raw materials to disposal',
                'Source materials with verified sustainability certifications (FSC, GOTS, Cradle-to-Cradle)',
                'Implement take-back or recycling program to ensure circular product lifecycle'
            );
        }

        // Ensure exactly 3 of each
        while (strengths.length < 3) {
            const defaults = [
                'Material composition allows for potential recyclability improvements',
                'Product design can be optimized for reduced material waste during production',
                'Opportunity to partner with certified sustainable suppliers'
            ];
            strengths.push(defaults[strengths.length]);
        }
        while (recommendations.length < 3) {
            const defaults = [
                'Publish transparent supply chain information showing material origins and production facilities',
                'Calculate and offset carbon footprint through verified carbon credit programs',
                'Implement packaging redesign using 100% post-consumer recycled or compostable materials'
            ];
            recommendations.push(defaults[recommendations.length - 3]);
        }

        return {
            success: true,
            rating,
            summary,
            strengths: strengths.slice(0, 3),
            recommendations: recommendations.slice(0, 3),
            assessedAt: new Date()
        };
    }
}

export default new EcoAssessmentService();

