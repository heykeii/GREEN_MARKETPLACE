import { getOpenAIClient } from './openai.js';

/**
 * Parse material input string into structured format
 * @param {string} materialsInput - e.g., "500g plastic, 200g aluminum"
 * @returns {Object} - e.g., {"plastic": "500g", "aluminum": "200g"}
 */
export const parseMaterialsInput = (materialsInput) => {
  try {
    if (!materialsInput || typeof materialsInput !== 'string') {
      throw new Error('Materials input must be a non-empty string');
    }

    const structuredMaterials = {};
    const materials = materialsInput.split(',').map(item => item.trim());

    for (const material of materials) {
      // Match patterns like "500g plastic", "2kg aluminum", "100ml oil"
      const match = material.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)\s+(.+)$/);
      
      if (match) {
        const [, amount, unit, materialName] = match;
        const weight = `${amount}${unit}`;
        const normalizedMaterialName = materialName.toLowerCase().trim();
        structuredMaterials[normalizedMaterialName] = weight;
      } else {
        // Try alternative format: "plastic 500g"
        const altMatch = material.match(/^(.+?)\s+(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
        if (altMatch) {
          const [, materialName, amount, unit] = altMatch;
          const weight = `${amount}${unit}`;
          const normalizedMaterialName = materialName.toLowerCase().trim();
          structuredMaterials[normalizedMaterialName] = weight;
        } else {
          console.warn(`Could not parse material: "${material}"`);
        }
      }
    }

    if (Object.keys(structuredMaterials).length === 0) {
      throw new Error('No valid materials could be parsed from input');
    }

    return structuredMaterials;
  } catch (error) {
    console.error('Error parsing materials input:', error);
    throw error;
  }
};

/**
 * Convert weight string to grams for consistent calculation
 * @param {string} weightStr - e.g., "500g", "2kg", "100ml"
 * @returns {number} - weight in grams
 */
export const convertToGrams = (weightStr) => {
  try {
    const match = weightStr.match(/^(\d+(?:\.\d+)?)\s*([a-zA-Z]+)$/);
    if (!match) {
      throw new Error(`Invalid weight format: ${weightStr}`);
    }

    const [, amount, unit] = match;
    const numericAmount = parseFloat(amount);

    const unitConversions = {
      'g': 1,
      'gram': 1,
      'grams': 1,
      'kg': 1000,
      'kilogram': 1000,
      'kilograms': 1000,
      'lb': 453.592,
      'lbs': 453.592,
      'pound': 453.592,
      'pounds': 453.592,
      'oz': 28.3495,
      'ounce': 28.3495,
      'ounces': 28.3495,
      // For liquids, assume density similar to water (1ml ≈ 1g)
      'ml': 1,
      'milliliter': 1,
      'milliliters': 1,
      'l': 1000,
      'liter': 1000,
      'liters': 1000
    };

    const normalizedUnit = unit.toLowerCase();
    const conversionFactor = unitConversions[normalizedUnit];

    if (conversionFactor === undefined) {
      throw new Error(`Unsupported unit: ${unit}`);
    }

    return numericAmount * conversionFactor;
  } catch (error) {
    console.error('Error converting weight to grams:', error);
    throw error;
  }
};

/**
 * Get recyclability scores from OpenAI for materials
 * @param {Object} structuredMaterials - {"plastic": "500g", "aluminum": "200g"}
 * @returns {Promise<Object>} - {"plastic": 0.3, "aluminum": 0.9}
 */
export const getRecyclabilityScores = async (structuredMaterials) => {
  try {
    const openai = getOpenAIClient();
    const materialNames = Object.keys(structuredMaterials);

    if (materialNames.length === 0) {
      throw new Error('No materials provided for scoring');
    }

    const prompt = `As a sustainability expert, provide recyclability scores for the following materials. Base your scores on current recycling infrastructure, environmental impact studies, and material science research.

Materials to score: ${materialNames.join(', ')}

For each material, provide a recyclability score between 0.1 and 1.0 where:
- 1.0 = Highly recyclable (like aluminum, steel)
- 0.7-0.9 = Good recyclability (like paper, glass)
- 0.4-0.6 = Moderate recyclability (like some plastics)
- 0.1-0.3 = Poor recyclability (like mixed materials, certain plastics)

Consider factors like:
- Current recycling infrastructure availability
- Energy efficiency of recycling process
- Quality degradation during recycling
- Market demand for recycled material
- Environmental impact of recycling vs. new production

Respond ONLY with a valid JSON object in this exact format:
{"material_name": score, "material_name": score}

Example: {"plastic": 0.3, "aluminum": 0.9}`;

    const response = await openai.chat.completions.create({
      model: 'gpt-4o-mini',
      messages: [
        {
          role: 'system',
          content: 'You are a sustainability expert specializing in material recyclability assessment. Provide accurate, research-based recyclability scores.'
        },
        {
          role: 'user',
          content: prompt
        }
      ],
      temperature: 0.1, // Low temperature for consistent scoring
      max_tokens: 500
    });

    const responseText = response.choices[0].message.content.trim();
    
    // Parse the JSON response
    let scores;
    try {
      scores = JSON.parse(responseText);
    } catch (parseError) {
      console.error('Error parsing OpenAI response:', responseText);
      throw new Error('Invalid JSON response from OpenAI');
    }

    // Validate scores
    const validatedScores = {};
    for (const material of materialNames) {
      const score = scores[material];
      if (typeof score === 'number' && score >= 0.1 && score <= 1.0) {
        validatedScores[material] = score;
      } else {
        console.warn(`Invalid score for ${material}: ${score}, defaulting to 0.5`);
        validatedScores[material] = 0.5; // Default moderate score
      }
    }

    return validatedScores;
  } catch (error) {
    console.error('Error getting recyclability scores from OpenAI:', error);
    
    // Fallback: provide default scores based on common knowledge
    const fallbackScores = {};
    const materialNames = Object.keys(structuredMaterials);
    
    for (const material of materialNames) {
      const lowerMaterial = material.toLowerCase();
      if (lowerMaterial.includes('aluminum') || lowerMaterial.includes('steel') || lowerMaterial.includes('metal')) {
        fallbackScores[material] = 0.9;
      } else if (lowerMaterial.includes('paper') || lowerMaterial.includes('cardboard')) {
        fallbackScores[material] = 0.8;
      } else if (lowerMaterial.includes('glass')) {
        fallbackScores[material] = 0.85;
      } else if (lowerMaterial.includes('plastic')) {
        fallbackScores[material] = 0.3;
      } else if (lowerMaterial.includes('wood') || lowerMaterial.includes('bamboo')) {
        fallbackScores[material] = 0.7;
      } else {
        fallbackScores[material] = 0.5; // Default moderate score
      }
    }
    
    return fallbackScores;
  }
};

/**
 * Calculate sustainability score based on materials and their weights
 * @param {Object} structuredMaterials - {"plastic": "500g", "aluminum": "200g"}
 * @param {Object} recyclabilityScores - {"plastic": 0.3, "aluminum": 0.9}
 * @returns {Object} - Calculation result with score and details
 */
export const calculateSustainabilityScore = (structuredMaterials, recyclabilityScores) => {
  try {
    let totalWeight = 0;
    let weightedScore = 0;
    const calculationDetails = [];

    // Convert all weights to grams and calculate weighted score
    for (const [material, weightStr] of Object.entries(structuredMaterials)) {
      const weightInGrams = convertToGrams(weightStr);
      const recyclabilityScore = recyclabilityScores[material] || 0.5;

      totalWeight += weightInGrams;
      const materialContribution = weightInGrams * recyclabilityScore;
      weightedScore += materialContribution;

      calculationDetails.push({
        material,
        weight: weightStr,
        weightInGrams,
        recyclabilityScore,
        contribution: materialContribution
      });
    }

    if (totalWeight === 0) {
      throw new Error('Total weight cannot be zero');
    }

    // Calculate final sustainability score (0-1 scale)
    const sustainabilityScore = Number((weightedScore / totalWeight).toFixed(3));

    const result = {
      sustainabilityScore,
      totalWeight,
      weightedScore,
      calculationDetails,
      formula: 'Sustainability Score = (Σ(Material Weight × Recyclability Score)) / Total Weight',
      calculatedAt: new Date()
    };

    return result;
  } catch (error) {
    console.error('Error calculating sustainability score:', error);
    throw error;
  }
};

/**
 * Validate the outcome of sustainability scoring
 * Ensures inputs are sane and outputs are within expected bounds
 * @param {Object} structuredMaterials
 * @param {Object} recyclabilityScores
 * @param {Object} calculationResult
 * @returns {{ valid: boolean, errors: string[] }}
 */
export const validateSustainabilityResult = (structuredMaterials, recyclabilityScores, calculationResult) => {
  const errors = [];

  if (!structuredMaterials || typeof structuredMaterials !== 'object' || Object.keys(structuredMaterials).length === 0) {
    errors.push('No parsed materials.');
  }

  if (!recyclabilityScores || typeof recyclabilityScores !== 'object' || Object.keys(recyclabilityScores).length === 0) {
    errors.push('Missing recyclability scores.');
  }

  // Ensure every material has a score within bounds
  for (const material of Object.keys(structuredMaterials || {})) {
    const score = recyclabilityScores?.[material];
    if (typeof score !== 'number' || Number.isNaN(score)) {
      errors.push(`Invalid score for material: ${material}`);
    } else if (score < 0.1 || score > 1.0) {
      errors.push(`Score out of range (0.1-1.0) for ${material}: ${score}`);
    }
  }

  if (!calculationResult || typeof calculationResult !== 'object') {
    errors.push('Missing calculation result.');
  } else {
    const { sustainabilityScore, totalWeight, weightedScore, calculationDetails } = calculationResult;
    if (typeof sustainabilityScore !== 'number' || Number.isNaN(sustainabilityScore)) {
      errors.push('Invalid sustainability score.');
    } else if (sustainabilityScore < 0 || sustainabilityScore > 1) {
      errors.push(`Sustainability score out of range: ${sustainabilityScore}`);
    }
    if (typeof totalWeight !== 'number' || !(totalWeight > 0)) {
      errors.push('Total weight must be > 0.');
    }
    if (typeof weightedScore !== 'number' || weightedScore < 0) {
      errors.push('Weighted score must be >= 0.');
    }
    if (!Array.isArray(calculationDetails) || calculationDetails.length === 0) {
      errors.push('Missing calculation details.');
    }
    // Optional: verify Σ(weightInGrams) ~= totalWeight within tolerance
    if (Array.isArray(calculationDetails) && calculationDetails.length > 0 && typeof totalWeight === 'number') {
      const sumWeights = calculationDetails.reduce((s, d) => s + (Number(d.weightInGrams) || 0), 0);
      const tolerance = Math.max(1, totalWeight * 0.01); // 1g or 1%
      if (Math.abs(sumWeights - totalWeight) > tolerance) {
        errors.push('Total weight does not match sum of material weights.');
      }
    }
  }

  return { valid: errors.length === 0, errors };
};

/**
 * Complete sustainability scoring process
 * @param {string} materialsInput - Raw input from seller
 * @returns {Promise<Object>} - Complete scoring result
 */
export const processSustainabilityScoring = async (materialsInput) => {
  try {
    // Step 1: Try to parse materials with weights
    let structuredMaterials;
    let usedWeightlessFallback = false;
    try {
      structuredMaterials = parseMaterialsInput(materialsInput);
    } catch (parseErr) {
      // Fallback: treat each provided material name as equally weighted (no weights supplied)
      usedWeightlessFallback = true;
      const names = (materialsInput || '')
        .split(',')
        .map((s) => s.trim())
        .filter(Boolean);

      if (names.length === 0) {
        throw parseErr;
      }

      // Assign equal dummy weights so the weighted formula reduces to a simple average
      // This preserves downstream logic while matching the "no weights" formula semantics
      structuredMaterials = Object.fromEntries(
        names.map((n) => [n.toLowerCase(), '1g'])
      );
    }
    
    // Step 2: Get recyclability scores from OpenAI
    const recyclabilityScores = await getRecyclabilityScores(structuredMaterials);
    
    // Step 3: Calculate sustainability score (0-1 scale)
    const calculationResult = calculateSustainabilityScore(structuredMaterials, recyclabilityScores);

    // If the weightless fallback was used, override formula string to reflect average formula and include percentage
    if (usedWeightlessFallback) {
      calculationResult.formula = 'Sustainability Score = (Σ(Recyclability Score of each material) / Number of Materials) × 100';
      calculationResult.percentageScore = Number((calculationResult.sustainabilityScore * 100).toFixed(2));
      calculationResult.weightsProvided = false;
      // Hide dummy weights ("1g") from presentation while retaining them internally for math
      calculationResult.calculationDetails = (calculationResult.calculationDetails || []).map((d) => ({
        ...d,
        weight: '',
      }));
    } else {
      calculationResult.weightsProvided = true;
      calculationResult.percentageScore = Number((calculationResult.sustainabilityScore * 100).toFixed(2));
    }

    // Step 4: Validate result
    const validation = validateSustainabilityResult(structuredMaterials, recyclabilityScores, calculationResult);

    return {
      structuredMaterials,
      recyclabilityScores,
      ...calculationResult,
      validation
    };
  } catch (error) {
    console.error('Error in sustainability scoring process:', error);
    throw error;
  }
};
