import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';

const CarbonFootprintDisplay = ({ productId, productData = null }) => {
  const [carbonFootprint, setCarbonFootprint] = useState(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  useEffect(() => {
    const fetchCarbonFootprint = async () => {
      try {
        setLoading(true);
        
        // If product data is provided and has carbon footprint, use it
        if (productData && productData.carbonFootprint && productData.carbonFootprint.hasCalculation) {
          setCarbonFootprint({
            carbonFootprintKg: productData.carbonFootprint.carbonFootprintKg,
            baselineFootprintKg: productData.carbonFootprint.baselineFootprintKg,
            co2SavingsKg: productData.carbonFootprint.co2SavingsKg,
            equivalentTrees: productData.carbonFootprint.equivalentTrees,
            equivalentMiles: productData.carbonFootprint.equivalentMiles,
            calculatedAt: productData.carbonFootprint.calculatedAt
          });
        } else {
          // Fetch from API
          const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/carbon-footprint/${productId}`);
          setCarbonFootprint(response.data.carbonFootprint);
        }
      } catch (error) {
        console.error('Error fetching carbon footprint:', error);
        setError('Failed to load carbon footprint data');
      } finally {
        setLoading(false);
      }
    };

    if (productId) {
      fetchCarbonFootprint();
    }
  }, [productId, productData]);

  if (loading) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-4">
          <div className="text-green-700 text-center">Loading carbon footprint...</div>
        </CardContent>
      </Card>
    );
  }

  if (error || !carbonFootprint) {
    return null; // Don't show anything if no carbon footprint data
  }

  const getImpactColor = (footprint) => {
    if (footprint <= 1) return 'text-green-600';
    if (footprint <= 5) return 'text-yellow-600';
    if (footprint <= 10) return 'text-orange-600';
    return 'text-red-600';
  };

  const getImpactLevel = (footprint) => {
    if (footprint <= 1) return { level: 'Very Low', color: 'bg-green-100 text-green-800' };
    if (footprint <= 5) return { level: 'Low', color: 'bg-yellow-100 text-yellow-800' };
    if (footprint <= 10) return { level: 'Medium', color: 'bg-orange-100 text-orange-800' };
    return { level: 'High', color: 'bg-red-100 text-red-800' };
  };

  const impactLevel = getImpactLevel(carbonFootprint.carbonFootprintKg);

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader className="pb-3">
        <CardTitle className="text-lg font-bold text-green-800 flex items-center">
          <span className="mr-2">🌍</span>
          Carbon Footprint
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        
        {/* Main Carbon Footprint */}
        <div className="text-center space-y-2">
          <div className={`text-3xl font-bold ${getImpactColor(carbonFootprint.carbonFootprintKg)}`}>
            {carbonFootprint.carbonFootprintKg} kg CO₂
          </div>
          <Badge className={impactLevel.color}>
            {impactLevel.level} Impact
          </Badge>
        </div>

        {/* Environmental Impact Metrics */}
        <div className="grid grid-cols-2 gap-4 text-center">
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="text-2xl mb-1">🌳</div>
            <div className="text-sm text-green-700 font-medium">Trees Equivalent</div>
            <div className="text-lg font-bold text-green-800">
              {carbonFootprint.equivalentTrees || 0}
            </div>
          </div>
          <div className="bg-white rounded-lg p-3 border border-green-200">
            <div className="text-2xl mb-1">🚗</div>
            <div className="text-sm text-green-700 font-medium">Miles Driven</div>
            <div className="text-lg font-bold text-green-800">
              {carbonFootprint.equivalentMiles || 0}
            </div>
          </div>
        </div>

        {/* CO2 Savings */}
        {carbonFootprint.co2SavingsKg > 0 && (
          <div className="bg-green-100 rounded-lg p-4 border border-green-200">
            <div className="text-center">
              <div className="text-green-800 font-bold text-lg mb-1">
                🌱 You Save {carbonFootprint.co2SavingsKg.toFixed(1)} kg CO₂
              </div>
              <div className="text-green-700 text-sm">
                vs. conventional alternatives
              </div>
            </div>
          </div>
        )}

        {/* Baseline Comparison */}
        {carbonFootprint.baselineFootprintKg > carbonFootprint.carbonFootprintKg && (
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-green-700">
              <span>Conventional Product</span>
              <span>{carbonFootprint.baselineFootprintKg.toFixed(1)} kg CO₂</span>
            </div>
            <div className="flex justify-between text-sm text-green-700">
              <span>This Product</span>
              <span>{carbonFootprint.carbonFootprintKg.toFixed(1)} kg CO₂</span>
            </div>
            <Progress 
              value={(carbonFootprint.carbonFootprintKg / carbonFootprint.baselineFootprintKg) * 100} 
              className="h-2"
            />
            <div className="text-xs text-green-600 text-center">
              {Math.round(((carbonFootprint.baselineFootprintKg - carbonFootprint.carbonFootprintKg) / carbonFootprint.baselineFootprintKg) * 100)}% less emissions
            </div>
          </div>
        )}

        {/* Calculation Date */}
        {carbonFootprint.calculatedAt && (
          <div className="text-xs text-green-600 text-center">
            Calculated on {new Date(carbonFootprint.calculatedAt).toLocaleDateString()}
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CarbonFootprintDisplay;
