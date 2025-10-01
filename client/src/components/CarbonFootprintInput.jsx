import React, { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';

const CarbonFootprintInput = ({ onDataChange, initialData = null }) => {
  const [materials, setMaterials] = useState(initialData?.materials || [{ name: '', percentage: 100 }]);
  const [weight, setWeight] = useState(initialData?.weight || 1);
  const [productionMethod, setProductionMethod] = useState(initialData?.productionMethod || '');

  const handleMaterialChange = (index, field, value) => {
    const updatedMaterials = materials.map((material, i) => 
      i === index ? { ...material, [field]: value } : material
    );
    setMaterials(updatedMaterials);
    onDataChange({ materials: updatedMaterials, weight, productionMethod });
  };

  const addMaterial = () => {
    const newMaterials = [...materials, { name: '', percentage: 100 }];
    setMaterials(newMaterials);
    onDataChange({ materials: newMaterials, weight, productionMethod });
  };

  const removeMaterial = (index) => {
    if (materials.length > 1) {
      const newMaterials = materials.filter((_, i) => i !== index);
      setMaterials(newMaterials);
      onDataChange({ materials: newMaterials, weight, productionMethod });
    }
  };

  const handleWeightChange = (value) => {
    const numValue = parseFloat(value) || 1;
    setWeight(numValue);
    onDataChange({ materials, weight: numValue, productionMethod });
  };

  const handleProductionMethodChange = (value) => {
    setProductionMethod(value);
    onDataChange({ materials, weight, productionMethod: value });
  };

  const commonMaterials = [
    'Organic Cotton', 'Recycled Cotton', 'Hemp', 'Bamboo', 'Linen', 'Wool',
    'Recycled Plastic', 'Biodegradable Plastic', 'Wood', 'Recycled Wood',
    'Metal', 'Recycled Metal', 'Glass', 'Recycled Glass', 'Paper', 'Recycled Paper',
    'Leather', 'Vegan Leather', 'Cork', 'Jute', 'Sisal', 'Other'
  ];

  return (
    <Card className="border-green-200 bg-green-50">
      <CardHeader>
        <CardTitle className="text-lg font-bold text-green-800 flex items-center">
          <span className="mr-2">🌍</span>
          Carbon Footprint Calculation
        </CardTitle>
        <p className="text-sm text-green-700">
          Help buyers understand the environmental impact of your product
        </p>
      </CardHeader>
      <CardContent className="space-y-6">
        
        {/* Materials Section */}
        <div className="space-y-4">
          <Label className="text-green-800 font-semibold">Materials Used</Label>
          {materials.map((material, index) => (
            <div key={index} className="flex gap-3 items-end">
              <div className="flex-1">
                <Label htmlFor={`material-${index}`} className="text-green-700 text-sm">
                  Material {index + 1}
                </Label>
                <Select 
                  value={material.name} 
                  onValueChange={(value) => handleMaterialChange(index, 'name', value)}
                >
                  <SelectTrigger>
                    <SelectValue placeholder="Select material" />
                  </SelectTrigger>
                  <SelectContent>
                    {commonMaterials.map((mat) => (
                      <SelectItem key={mat} value={mat}>{mat}</SelectItem>
                    ))}
                  </SelectContent>
                </Select>
              </div>
              <div className="w-24">
                <Label htmlFor={`percentage-${index}`} className="text-green-700 text-sm">
                  %
                </Label>
                <Input
                  id={`percentage-${index}`}
                  type="number"
                  min="0"
                  max="100"
                  value={material.percentage}
                  onChange={(e) => handleMaterialChange(index, 'percentage', parseInt(e.target.value) || 0)}
                  className="text-center"
                />
              </div>
              {materials.length > 1 && (
                <Button
                  type="button"
                  variant="outline"
                  size="sm"
                  onClick={() => removeMaterial(index)}
                  className="text-red-600 hover:text-red-800"
                >
                  Remove
                </Button>
              )}
            </div>
          ))}
          <Button
            type="button"
            variant="outline"
            onClick={addMaterial}
            className="w-full border-green-300 text-green-700 hover:bg-green-100"
          >
            + Add Another Material
          </Button>
        </div>

        {/* Weight Section */}
        <div className="space-y-2">
          <Label htmlFor="weight" className="text-green-800 font-semibold">
            Product Weight (kg)
          </Label>
          <Input
            id="weight"
            type="number"
            min="0.001"
            step="0.1"
            value={weight}
            onChange={(e) => handleWeightChange(e.target.value)}
            placeholder="1.0"
            className="border-green-300 focus:border-green-500"
          />
          <p className="text-xs text-green-600">
            Enter the total weight of the product in kilograms
          </p>
        </div>

        {/* Production Method Section */}
        <div className="space-y-2">
          <Label htmlFor="production-method" className="text-green-800 font-semibold">
            Production Method
          </Label>
          <Select value={productionMethod} onValueChange={handleProductionMethodChange}>
            <SelectTrigger>
              <SelectValue placeholder="How was your product made? (e.g., handmade, upcycled, machine-made)" />
            </SelectTrigger>
            <SelectContent>
              <SelectItem value="handmade">
                <div className="flex flex-col">
                  <span className="font-medium">Handmade</span>
                  <span className="text-xs text-gray-500">Crafted by hand, lower energy use</span>
                </div>
              </SelectItem>
              <SelectItem value="machine-made">
                <div className="flex flex-col">
                  <span className="font-medium">Machine-made</span>
                  <span className="text-xs text-gray-500">Manufactured using machines</span>
                </div>
              </SelectItem>
              <SelectItem value="upcycled">
                <div className="flex flex-col">
                  <span className="font-medium">Upcycled</span>
                  <span className="text-xs text-gray-500">Repurposed from existing materials</span>
                </div>
              </SelectItem>
              <SelectItem value="recycled">
                <div className="flex flex-col">
                  <span className="font-medium">Recycled</span>
                  <span className="text-xs text-gray-500">Made from recycled materials</span>
                </div>
              </SelectItem>
              <SelectItem value="organic">
                <div className="flex flex-col">
                  <span className="font-medium">Organic</span>
                  <span className="text-xs text-gray-500">Produced using organic methods</span>
                </div>
              </SelectItem>
              <SelectItem value="conventional">
                <div className="flex flex-col">
                  <span className="font-medium">Conventional</span>
                  <span className="text-xs text-gray-500">Standard production methods</span>
                </div>
              </SelectItem>
              <SelectItem value="artisan">
                <div className="flex flex-col">
                  <span className="font-medium">Artisan</span>
                  <span className="text-xs text-gray-500">Handcrafted by skilled artisans</span>
                </div>
              </SelectItem>
              <SelectItem value="industrial">
                <div className="flex flex-col">
                  <span className="font-medium">Industrial</span>
                  <span className="text-xs text-gray-500">Large-scale industrial production</span>
                </div>
              </SelectItem>
            </SelectContent>
          </Select>
          <p className="text-xs text-green-600">
            Choose the method that best describes how your product was made. This significantly affects the carbon footprint calculation.
          </p>
        </div>

        {/* Preview */}
        {(materials.some(m => m.name) && weight > 0 && productionMethod) && (
          <div className="bg-white rounded-lg p-4 border border-green-200">
            <h4 className="font-semibold text-green-800 mb-2">Preview</h4>
            <div className="space-y-1 text-sm text-green-700">
              <div><strong>Materials:</strong> {materials.filter(m => m.name).map(m => `${m.name} (${m.percentage}%)`).join(', ')}</div>
              <div><strong>Weight:</strong> {weight} kg</div>
              <div><strong>Production:</strong> {productionMethod}</div>
            </div>
            <div className="mt-2">
              <Badge className="bg-green-100 text-green-800">
                Ready for carbon footprint calculation
              </Badge>
            </div>
          </div>
        )}
      </CardContent>
    </Card>
  );
};

export default CarbonFootprintInput;
