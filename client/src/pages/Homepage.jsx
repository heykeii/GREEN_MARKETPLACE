import React, { useRef } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import ProductPage from './ProductPage';
import { FaLeaf, FaRecycle, FaUsers, FaHandsHelping } from 'react-icons/fa';

const categories = [
  { icon: <FaLeaf className="text-emerald-600 text-3xl" />, label: 'Eco-Friendly' },
  { icon: <FaRecycle className="text-emerald-500 text-3xl" />, label: 'Recycled' },
  { icon: <FaHandsHelping className="text-emerald-400 text-3xl" />, label: 'Community Impact' },
  { icon: <FaUsers className="text-emerald-700 text-3xl" />, label: 'Trusted Sellers' },
];

const Homepage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const productsRef = useRef(null);

  const handleScrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div>
      <Navbar onProductsClick={handleScrollToProducts} />
      {/* Hero Section */}
      <section className="relative bg-gradient-to-br from-emerald-100 to-teal-100 py-24 px-4 flex flex-col items-center text-center overflow-hidden">
        {/* Decorative SVG/Illustration */}
        <div className="absolute top-0 left-0 w-96 h-96 bg-emerald-200/30 rounded-full blur-3xl -translate-x-1/2 -translate-y-1/2" />
        <div className="absolute bottom-0 right-0 w-96 h-96 bg-teal-200/30 rounded-full blur-3xl translate-x-1/2 translate-y-1/2" />
        <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
          <svg width="400" height="400" viewBox="0 0 400 400" fill="none" className="opacity-10" xmlns="http://www.w3.org/2000/svg">
            <circle cx="200" cy="200" r="180" fill="#059669" />
            <ellipse cx="200" cy="200" rx="120" ry="180" fill="#34d399" />
            <ellipse cx="200" cy="200" rx="180" ry="120" fill="#6ee7b7" />
          </svg>
        </div>
        {/* Badge */}
     
        <h1 className="text-5xl md:text-6xl font-extrabold text-emerald-800 mb-4 drop-shadow-lg leading-tight">
          Shop Green. <span className="text-teal-600">Live Clean.</span>
        </h1>
        <p className="text-lg md:text-xl text-emerald-700 mb-10 max-w-2xl mx-auto font-medium">
          Discover eco-friendly products from trusted sellers. Support sustainability, empower communities, and shop with confidence!
        </p>
        <Button className="bg-emerald-600 hover:bg-emerald-700 text-white px-10 py-8 text-2xl font-bold rounded-2xl shadow-xl transition-all duration-200" onClick={handleScrollToProducts}>
          Shop Now
        </Button>
      </section>

      {/* Featured Categories */}
      <section className="max-w-5xl mx-auto py-12 px-4">
        <h2 className="text-2xl font-bold text-emerald-800 mb-8 text-center">Featured Categories</h2>
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-8 justify-items-center">
          {categories.map((cat, idx) => (
            <div key={idx} className="flex flex-col items-center bg-white rounded-2xl shadow-md p-6 hover:shadow-xl transition-shadow">
              {cat.icon}
              <span className="mt-3 text-emerald-700 font-semibold text-lg">{cat.label}</span>
            </div>
          ))}
        </div>
      </section>

      {/* Why Choose Us */}
      <section className="bg-gradient-to-r from-emerald-50 to-teal-50 py-16 px-4">
        <div className="max-w-4xl mx-auto text-center">
          <h2 className="text-2xl font-bold text-emerald-800 mb-8">Why Choose Green Marketplace?</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-4 gap-8">
            <div className="flex flex-col items-center">
              <FaLeaf className="text-emerald-600 text-4xl mb-2" />
              <span className="font-semibold text-emerald-700">Eco-Conscious</span>
              <p className="text-gray-500 text-sm mt-2">All products are curated for sustainability and environmental impact.</p>
            </div>
            <div className="flex flex-col items-center">
              <FaRecycle className="text-emerald-500 text-4xl mb-2" />
              <span className="font-semibold text-emerald-700">Recycled & Upcycled</span>
              <p className="text-gray-500 text-sm mt-2">Find unique items made from recycled or upcycled materials.</p>
            </div>
            <div className="flex flex-col items-center">
              <FaHandsHelping className="text-emerald-400 text-4xl mb-2" />
              <span className="font-semibold text-emerald-700">Community Impact</span>
              <p className="text-gray-500 text-sm mt-2">Every purchase supports local communities and small businesses, making a real difference.</p>
            </div>
            <div className="flex flex-col items-center">
              <FaUsers className="text-emerald-700 text-4xl mb-2" />
              <span className="font-semibold text-emerald-700">Trusted Sellers</span>
              <p className="text-gray-500 text-sm mt-2">Shop with confidence from verified, community-rated sellers.</p>
            </div>
          </div>
        </div>
      </section>

      {/* Marketplace Products */}
      <section ref={productsRef} className="py-16 px-4 bg-gradient-to-br from-green-50 via-emerald-50 to-teal-50">
        <div className="max-w-7xl mx-auto">
          <ProductPage />
        </div>
      </section>
    </div>
  );
};

export default Homepage;
