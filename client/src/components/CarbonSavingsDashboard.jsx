import React, { useState, useEffect } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Progress } from '@/components/ui/progress';
import axios from 'axios';

const CarbonSavingsDashboard = () => {
  const [savings, setSavings] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCarbonSavings = async () => {
      try {
        setLoading(true);
        const token = localStorage.getItem('token');
        const response = await axios.get(`${import.meta.env.VITE_API_URL}/api/v1/carbon-footprint/user/savings`, {
          headers: { Authorization: `Bearer ${token}` }
        });
        setSavings(response.data.savings);
      } catch (error) {
        console.error('Error fetching carbon savings:', error);
      } finally {
        setLoading(false);
      }
    };

    fetchCarbonSavings();
  }, []);

  if (loading) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardContent className="p-6">
          <div className="text-green-700 text-center">Loading your carbon savings...</div>
        </CardContent>
      </Card>
    );
  }

  if (!savings || savings.totalSavings === 0) {
    return (
      <Card className="border-green-200 bg-green-50">
        <CardHeader>
          <CardTitle className="text-lg font-bold text-green-800 flex items-center">
            <span className="mr-2">🌍</span>
            Your Carbon Impact
          </CardTitle>
        </CardHeader>
        <CardContent className="text-center py-8">
          <div className="text-green-600 text-4xl mb-4">🌱</div>
          <div className="text-green-700 font-medium text-lg mb-2">Start Your Eco Journey</div>
          <div className="text-green-600 text-sm">
            Purchase eco-friendly products to start reducing your carbon footprint!
          </div>
        </CardContent>
      </Card>
    );
  }

  const getSavingsLevel = (savings) => {
    if (savings >= 100) return { level: 'Eco Champion', color: 'bg-green-100 text-green-800', icon: '🏆' };
    if (savings >= 50) return { level: 'Green Hero', color: 'bg-blue-100 text-blue-800', icon: '🦸' };
    if (savings >= 25) return { level: 'Eco Warrior', color: 'bg-yellow-100 text-yellow-800', icon: '⚔️' };
    if (savings >= 10) return { level: 'Green Starter', color: 'bg-orange-100 text-orange-800', icon: '🌱' };
    return { level: 'Eco Beginner', color: 'bg-gray-100 text-gray-800', icon: '🌿' };
  };

  const savingsLevel = getSavingsLevel(savings.totalSavings);

  return (
    <Card className="border-green-200 bg-gradient-to-br from-green-50 to-emerald-50">
      <CardHeader>
        <CardTitle className="text-xl font-bold text-green-800 flex items-center">
          <span className="mr-2">🌍</span>
          Your Carbon Impact
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Main Savings Display */}
        <div className="text-center space-y-4">
          <div className="text-4xl font-bold text-green-600">
            {savings.totalSavings.toFixed(1)} kg CO₂
          </div>
          <div className="text-lg text-green-700 font-medium">
            Carbon Footprint Saved
          </div>
          <Badge className={`${savingsLevel.color} text-lg px-4 py-2`}>
            <span className="mr-2">{savingsLevel.icon}</span>
            {savingsLevel.level}
          </Badge>
        </div>

        {/* Environmental Impact Metrics */}
        <div className="grid grid-cols-2 gap-4">
          <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
            <div className="text-3xl mb-2">🌳</div>
            <div className="text-2xl font-bold text-green-800 mb-1">
              {savings.equivalentTrees}
            </div>
            <div className="text-sm text-green-700">Trees Planted</div>
          </div>
          <div className="bg-white rounded-lg p-4 border border-green-200 text-center">
            <div className="text-3xl mb-2">🚗</div>
            <div className="text-2xl font-bold text-green-800 mb-1">
              {savings.equivalentMiles}
            </div>
            <div className="text-sm text-green-700">Miles Not Driven</div>
          </div>
        </div>

        {/* Detailed Breakdown */}
        <div className="space-y-4">
          <h3 className="font-semibold text-green-800">Your Impact Breakdown</h3>
          
          <div className="space-y-3">
            <div className="flex justify-between items-center">
              <span className="text-green-700">Total CO₂ Saved</span>
              <span className="font-bold text-green-800">{savings.totalSavings.toFixed(1)} kg</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-green-700">Your Product Footprint</span>
              <span className="font-bold text-green-800">{savings.totalFootprint.toFixed(1)} kg</span>
            </div>
            
            <div className="flex justify-between items-center">
              <span className="text-green-700">Conventional Alternative</span>
              <span className="font-bold text-green-800">{savings.totalBaseline.toFixed(1)} kg</span>
            </div>
          </div>

          {/* Savings Progress Bar */}
          <div className="space-y-2">
            <div className="flex justify-between text-sm text-green-700">
              <span>Savings vs. Conventional</span>
              <span>{Math.round((savings.totalSavings / savings.totalBaseline) * 100)}%</span>
            </div>
            <Progress 
              value={(savings.totalSavings / savings.totalBaseline) * 100} 
              className="h-3"
            />
          </div>
        </div>

        {/* Motivational Message */}
        <div className="bg-green-100 rounded-lg p-4 border border-green-200">
          <div className="text-center">
            <div className="text-green-800 font-bold text-lg mb-2">
              🌟 Amazing Impact!
            </div>
            <div className="text-green-700 text-sm">
              By choosing eco-friendly products, you've made a significant positive impact on the environment. 
              Keep up the great work!
            </div>
          </div>
        </div>

        {/* Next Level Progress */}
        <div className="space-y-2">
          <div className="text-sm text-green-700 font-medium">Progress to Next Level</div>
          <div className="space-y-1">
            {savings.totalSavings < 10 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>🌿 Eco Beginner → 🌱 Green Starter</span>
                <span>{savings.totalSavings.toFixed(1)}/10 kg</span>
              </div>
            )}
            {savings.totalSavings >= 10 && savings.totalSavings < 25 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>🌱 Green Starter → ⚔️ Eco Warrior</span>
                <span>{savings.totalSavings.toFixed(1)}/25 kg</span>
              </div>
            )}
            {savings.totalSavings >= 25 && savings.totalSavings < 50 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>⚔️ Eco Warrior → 🦸 Green Hero</span>
                <span>{savings.totalSavings.toFixed(1)}/50 kg</span>
              </div>
            )}
            {savings.totalSavings >= 50 && savings.totalSavings < 100 && (
              <div className="flex justify-between text-xs text-green-600">
                <span>🦸 Green Hero → 🏆 Eco Champion</span>
                <span>{savings.totalSavings.toFixed(1)}/100 kg</span>
              </div>
            )}
            {savings.totalSavings >= 100 && (
              <div className="text-xs text-green-600 text-center">
                🏆 You've reached the highest level! Keep making a difference!
              </div>
            )}
          </div>
        </div>
      </CardContent>
    </Card>
  );
};

export default CarbonSavingsDashboard;
