// Category options for the Green Marketplace
export const CATEGORY_OPTIONS = [
  { "name": "Eco Home & Living" },
  { "name": "Sustainable Fashion & Accessories" },
  { "name": "Natural Beauty & Personal Care" },
  { "name": "Zero-Waste Essentials" },
  { "name": "Gifts & Eco Kits" },
  { "name": "Upcycled Art & Crafts" },
  { "name": "Eco Baby & Kids" },
  { "name": "Garden & Outdoors" },
  { "name": "Education & Advocacy" }
];

// Helper function to get category names as an array
export const getCategoryNames = () => {
  return CATEGORY_OPTIONS.map(option => option.name);
};

// Helper function to validate if a category is valid
export const isValidCategory = (category) => {
  return CATEGORY_OPTIONS.some(option => option.name === category);
}; 