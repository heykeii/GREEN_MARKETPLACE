# Sustainability Scoring API Documentation

## Overview

The Green Marketplace now includes a comprehensive sustainability scoring system that automatically calculates eco-friendliness scores for products based on their materials composition. This system uses OpenAI's GPT-4o-mini model to provide research-backed recyclability assessments.

## Process Flow

1. **Seller Input**: Seller enters materials used (e.g., "500g plastic, 200g aluminum")
2. **Data Conversion**: Input is parsed into structured JSON format
3. **AI Assessment**: OpenAI API provides recyclability scores (0.1-1.0 scale)
4. **Score Calculation**: System applies sustainability formula
5. **Admin Verification**: Results shown in admin panel for validation
6. **Consumer Display**: Approved scores displayed to buyers

## API Endpoints

### 1. Product Creation with Sustainability Scoring

**Endpoint**: `POST /api/products/create/product`

**New Field**: 
- `materialsInput` (string): Raw materials description (e.g., "500g plastic, 200g aluminum")

**Example Request**:
```json
{
  "name": "Eco Water Bottle",
  "description": "Sustainable water bottle",
  "price": 25,
  "quantity": 100,
  "category": "Eco Home & Living",
  "materialsUsed": ["plastic", "aluminum"],
  "materialsInput": "500g plastic, 200g aluminum",
  "origin": "Philippines",
  "productionMethod": "machine-assisted"
}
```

**Response**: Standard product creation response with additional sustainability fields.

### 2. Sustainability Score Preview

**Endpoint**: `POST /api/products/sustainability/preview`  
**Auth**: Required (Seller only)

Calculate sustainability score without saving to product.

**Request Body**:
```json
{
  "materialsInput": "500g plastic, 200g aluminum"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Sustainability score calculated successfully.",
  "sustainabilityData": {
    "structuredMaterials": {
      "plastic": "500g",
      "aluminum": "200g"
    },
    "recyclabilityScores": {
      "plastic": 0.3,
      "aluminum": 0.9
    },
    "sustainabilityScore": 0.471,
    "calculationBreakdown": {
      "totalWeight": 700,
      "weightedScore": 330,
      "formula": "Sustainability Score = (Σ(Material Weight × Recyclability Score)) / Total Weight",
      "details": [
        {
          "material": "plastic",
          "weight": "500g",
          "weightInGrams": 500,
          "recyclabilityScore": 0.3,
          "contribution": 150
        },
        {
          "material": "aluminum",
          "weight": "200g",
          "weightInGrams": 200,
          "recyclabilityScore": 0.9,
          "contribution": 180
        }
      ]
    }
  }
}
```

### 3. Recalculate Product Sustainability Score

**Endpoint**: `PATCH /api/products/sustainability/recalculate/:productId`  
**Auth**: Required (Seller only, own products)

Update existing product with new sustainability calculation.

**Request Body**:
```json
{
  "materialsInput": "600g plastic, 150g aluminum"
}
```

**Response**:
```json
{
  "success": true,
  "message": "Sustainability score recalculated successfully.",
  "product": {
    "_id": "product_id",
    "name": "Eco Water Bottle",
    "sustainabilityScore": 0.445,
    "sustainabilityCalculation": {
      "totalWeight": 750,
      "weightedScore": 315,
      "calculatedAt": "2025-09-21T10:30:00.000Z",
      "details": "..."
    }
  }
}
```

### 4. Get Product Sustainability Details

**Endpoint**: `GET /api/products/sustainability/:productId`  
**Auth**: Public

Retrieve detailed sustainability information for any product.

**Response**:
```json
{
  "success": true,
  "sustainabilityDetails": {
    "productId": "product_id",
    "productName": "Eco Water Bottle",
    "sustainabilityScore": 0.471,
    "structuredMaterials": {
      "plastic": "500g",
      "aluminum": "200g"
    },
    "materialRecyclabilityScores": {
      "plastic": 0.3,
      "aluminum": 0.9
    },
    "calculation": {
      "totalWeight": 700,
      "weightedScore": 330,
      "calculatedAt": "2025-09-21T10:30:00.000Z",
      "details": [...]
    }
  }
}
```

### 5. Admin: Manual Sustainability Scoring

**Endpoint**: `POST /api/admin/products/sustainability/:productId`  
**Auth**: Required (Admin only)

Manually trigger sustainability scoring for any product.

**Request Body**:
```json
{
  "materialsInput": "500g plastic, 200g aluminum"
}
```

**Response**: Similar to recalculate endpoint.

### 6. Admin: Pending Products with Sustainability Data

**Endpoint**: `GET /api/admin/products/pending`  
**Auth**: Required (Admin only)

Now includes sustainability data for admin verification.

**Enhanced Response**:
```json
{
  "success": true,
  "products": [
    {
      "_id": "product_id",
      "name": "Eco Water Bottle",
      "sustainabilityScore": 0.471,
      "sustainabilityData": {
        "score": 0.471,
        "hasStructuredMaterials": true,
        "structuredMaterials": {
          "plastic": "500g",
          "aluminum": "200g"
        },
        "recyclabilityScores": {
          "plastic": 0.3,
          "aluminum": 0.9
        },
        "calculation": {
          "totalWeight": 700,
          "weightedScore": 330,
          "calculatedAt": "2025-09-21T10:30:00.000Z",
          "details": [...]
        }
      }
    }
  ]
}
```

## Data Models

### Product Schema Updates

New fields added to the Product model:

```javascript
{
  // Existing fields...
  
  // New sustainability fields
  structuredMaterials: Map<String, String>, // {"plastic": "500g", "aluminum": "200g"}
  materialRecyclabilityScores: Map<String, Number>, // {"plastic": 0.3, "aluminum": 0.9}
  sustainabilityScore: Number, // 0.471
  sustainabilityCalculation: {
    totalWeight: Number, // 700
    weightedScore: Number, // 330
    calculatedAt: Date,
    details: String // JSON string of calculation breakdown
  }
}
```

## Sustainability Scoring Formula

```
Sustainability Score = (Σ(Material Weight × Recyclability Score)) / Total Weight
```

**Example**:
- Plastic: 500g × 0.3 = 150
- Aluminum: 200g × 0.9 = 180
- Total: (150 + 180) ÷ 700g = 0.471 (47.1%)

## Recyclability Scoring Guidelines

OpenAI provides scores based on:

- **0.9-1.0**: Highly recyclable (aluminum, steel)
- **0.7-0.8**: Good recyclability (paper, glass)
- **0.4-0.6**: Moderate recyclability (some plastics)
- **0.1-0.3**: Poor recyclability (mixed materials, difficult plastics)

## Weight Unit Support

The system supports multiple weight units:
- Grams: `g`, `gram`, `grams`
- Kilograms: `kg`, `kilogram`, `kilograms`
- Pounds: `lb`, `lbs`, `pound`, `pounds`
- Ounces: `oz`, `ounce`, `ounces`
- Milliliters: `ml`, `milliliter`, `milliliters`
- Liters: `l`, `liter`, `liters`

## Error Handling

The system includes comprehensive error handling:
- Invalid material input formats
- Unsupported weight units
- OpenAI API failures (with fallback scoring)
- Database validation errors
- Missing required parameters

## Testing

Run the test suite:
```bash
cd server
node test/sustainabilityScoring.test.js
```

## Environmental Variables Required

Ensure your `.env` file includes:
```
OPENAI_API_SECRET=your_openai_api_key
```

## Consumer Benefits

✅ **Transparency**: Research-backed sustainability scores  
✅ **Easy Comparison**: Standardized 0-1 scoring scale  
✅ **Informed Decisions**: Material-level breakdown  
✅ **Trust**: Admin-verified scores  
✅ **Education**: Understanding of recyclability factors
