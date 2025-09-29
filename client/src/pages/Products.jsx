import React, { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import Footer from '@/components/Footer';
import ProductsListing from '@/components/ProductsListing';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { FaFilter, FaSearch, FaLeaf, FaList, FaTh } from 'react-icons/fa';
import { CATEGORY_OPTIONS } from '@/constants/categories';

const Products = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('');
  const [sortBy, setSortBy] = useState('newest');
  const [viewMode, setViewMode] = useState('grid');

  const handleSearch = (e) => {
    e.preventDefault();
    if (searchQuery.trim()) {
      navigate(`/search?q=${encodeURIComponent(searchQuery.trim())}`);
    }
  };

  return (
    <>
      <Navbar />
      <div className="min-h-screen bg-gradient-to-br from-emerald-50 via-emerald-100 to-teal-50">
        {/* Hero Section */}
        <section className="pt-20 pb-10 sm:pb-12 px-3 sm:px-4">
          <div className="max-w-7xl mx-auto text-center">
            <div className="mb-8">
              <h1 className="text-3xl sm:text-4xl md:text-6xl font-black text-slate-800 mb-3 sm:mb-4">
                Sustainable
                <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                  Products
                </span>
              </h1>
              <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto px-2">
                Discover eco-friendly products that make a difference for you and the planet
              </p>
            </div>

            {/* Search Bar */}
            <form onSubmit={handleSearch} className="max-w-2xl mx-auto mb-6 sm:mb-8 px-2 sm:px-0">
              <div className="flex items-center gap-2 sm:gap-3 bg-white border border-gray-200 rounded-full shadow-sm px-3 sm:px-4 py-1.5 sm:py-2">
                <FaSearch className="text-gray-400" />
                <input
                  type="text"
                  placeholder="Search products..."
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  className="flex-1 bg-transparent outline-none border-0 focus:ring-0 text-sm sm:text-lg py-1.5 sm:py-2"
                />
                <Button
                  type="submit"
                  className="bg-emerald-600 hover:bg-emerald-700 text-white rounded-full px-4 sm:px-6 py-1.5 sm:py-2"
                >
                  Search
                </Button>
              </div>
            </form>
          </div>
        </section>

        {/* Filters Section */}
        <section className="px-3 sm:px-4 mb-6 sm:mb-8">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-2xl shadow-lg border border-gray-100 p-4 sm:p-6">
              <div className="flex flex-col lg:flex-row gap-3 sm:gap-4 items-center justify-between">
                <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 items-center w-full lg:w-auto">
                  {/* Category Filter */}
                  <div className="flex items-center gap-2 w-full sm:w-auto">
                    <FaFilter className="text-emerald-600" />
                    <select
                      value={selectedCategory}
                      onChange={(e) => setSelectedCategory(e.target.value)}
                      className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                    >
                      <option value="">All Categories</option>
                      {CATEGORY_OPTIONS.map((category, index) => (
                        <option key={index} value={category.name}>
                          {category.name}
                        </option>
                      ))}
                    </select>
                  </div>

                  {/* Sort Filter */}
                  <select
                    value={sortBy}
                    onChange={(e) => setSortBy(e.target.value)}
                    className="w-full sm:w-auto px-3 sm:px-4 py-2 border border-gray-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-emerald-500 bg-white"
                  >
                    <option value="newest">Newest First</option>
                    <option value="oldest">Oldest First</option>
                    <option value="price-low">Price: Low to High</option>
                    <option value="price-high">Price: High to Low</option>
                    <option value="rating">Highest Rated</option>
                  </select>
                </div>

                {/* View Mode Toggle */}
                <div className="flex items-center gap-1 sm:gap-2 bg-gray-100 rounded-lg p-1">
                  <button
                    onClick={() => setViewMode('grid')}
                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                      viewMode === 'grid'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-600 hover:text-emerald-600'
                    }`}
                  >
                    <FaTh />
                  </button>
                  <button
                    onClick={() => setViewMode('list')}
                    className={`p-1.5 sm:p-2 rounded-md transition-colors ${
                      viewMode === 'list'
                        ? 'bg-emerald-600 text-white'
                        : 'text-gray-600 hover:text-emerald-600'
                    }`}
                  >
                    <FaList />
                  </button>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Products Section */}
        <section className="px-3 sm:px-4 pb-14 sm:pb-16">
          <div className="max-w-7xl mx-auto">
            <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8 md:p-12">
              <div className="flex items-center gap-3 mb-8">
                <FaLeaf className="text-2xl text-emerald-600" />
                <h2 className="text-xl sm:text-2xl font-bold text-gray-900">All Products</h2>
              </div>
              <ProductsListing 
                categoryFilter={selectedCategory}
                sortBy={sortBy}
                viewMode={viewMode}
              />
            </div>
          </div>
        </section>
      </div>
      <Footer />
    </>
  );
};

export default Products;
