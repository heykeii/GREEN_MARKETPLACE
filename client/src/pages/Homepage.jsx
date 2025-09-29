import React, { useRef, useEffect, useState } from 'react';
import { useNavigate } from 'react-router-dom';
import Navbar from '@/components/Navbar';
import { Button } from '@/components/ui/button';
import ProductsListing from '@/components/ProductsListing';
import { FaLeaf, FaRecycle, FaUsers, FaHandsHelping, FaStar, FaShieldAlt, FaHeart, FaTruck } from 'react-icons/fa';
import Footer from '@/components/Footer';
import FeedbackWidget from '@/components/FeedbackWidget';

const categories = [
  { icon: <FaLeaf className="text-emerald-600 text-4xl" />, label: 'Eco-Friendly', description: 'Sustainable living' },
  { icon: <FaRecycle className="text-emerald-500 text-4xl" />, label: 'Recycled', description: 'Circular economy' },
  { icon: <FaHandsHelping className="text-emerald-400 text-4xl" />, label: 'Community Impact', description: 'Social responsibility' },
  { icon: <FaUsers className="text-emerald-700 text-4xl" />, label: 'Trusted Sellers', description: 'Verified partners' },
];

const values = [
  { 
    icon: <FaShieldAlt className="text-emerald-400 text-2xl" />, 
    title: 'Quality Guaranteed', 
    description: 'Every product meets our strict sustainability standards' 
  },
  { 
    icon: <FaHeart className="text-emerald-400 text-2xl" />, 
    title: 'Environment First', 
    description: 'Making eco-conscious choices easier for everyone' 
  },
  { 
    icon: <FaHandsHelping className="text-emerald-400 text-2xl" />, 
    title: 'Expert Curation', 
    description: 'Our team handpicks only the best, most impactful sustainable products for you' 
  },
  { 
    icon: <FaUsers className="text-emerald-400 text-2xl" />, 
    title: 'Community Driven', 
    description: 'Supporting local artisans and sustainable businesses' 
  },
];

const Homepage = () => {
  const navigate = useNavigate();
  const user = JSON.parse(localStorage.getItem('user') || 'null');
  const productsRef = useRef(null);
  const footerRef = useRef(null);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setIsVisible(true);
  }, []);

  const handleScrollToProducts = () => {
    productsRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  const handleAboutClick = () => {
    footerRef.current?.scrollIntoView({ behavior: 'smooth' });
  };

  return (
    <div className="min-h-screen">
      <Navbar onProductsClick={handleScrollToProducts} onAboutClick={handleAboutClick} />
      
      {/* Hero Section - Enhanced with modern gradients and animations */}
      <section className="relative min-h-[90vh] sm:min-h-screen flex items-center justify-center px-3 sm:px-4 bg-gradient-to-br from-slate-900 via-emerald-900 to-teal-800 overflow-hidden">
        {/* Animated background elements */}
        <div className="absolute inset-0">
          <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-400/20 rounded-full blur-3xl animate-pulse" />
          <div className="absolute top-3/4 right-1/4 w-80 h-80 bg-teal-400/15 rounded-full blur-2xl animate-pulse delay-1000" />
          <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-cyan-400/10 rounded-full blur-xl animate-pulse delay-500" />
        </div>

        {/* Floating particles */}
        <div className="absolute inset-0 overflow-hidden">
          {[...Array(20)].map((_, i) => (
            <div
              key={i}
              className="absolute w-2 h-2 bg-emerald-400/30 rounded-full animate-float"
              style={{
                left: `${Math.random() * 100}%`,
                top: `${Math.random() * 100}%`,
                animationDelay: `${Math.random() * 3}s`,
                animationDuration: `${3 + Math.random() * 4}s`
              }}
            />
          ))}
        </div>

        {/* Hero content */}
        <div className={`relative z-10 text-center max-w-5xl mx-auto transition-all duration-1000 ${isVisible ? 'opacity-100 translate-y-0' : 'opacity-0 translate-y-10'}`}>
          {/* Premium badge */}
          <div className="inline-flex items-center gap-2 bg-emerald-500/20 backdrop-blur-sm border border-emerald-400/30 rounded-full px-4 sm:px-6 py-1.5 sm:py-2 mb-6 sm:mb-8">
            <FaStar className="text-yellow-400 text-sm" />
            <span className="text-emerald-100 text-sm font-medium">Launching Soon - Join the Movement</span>
          </div>

          <h1 className="text-4xl xs:text-5xl md:text-7xl lg:text-8xl font-black text-white mb-4 sm:mb-6 leading-[1.05]">
            Shop
            <span className="block bg-gradient-to-r from-emerald-400 via-teal-300 to-cyan-300 bg-clip-text text-transparent">
              Sustainably
            </span>
          </h1>
          
          <p className="text-base sm:text-lg md:text-2xl text-emerald-100/90 mb-8 sm:mb-12 max-w-3xl mx-auto font-light leading-relaxed px-2">
            Discover premium eco-friendly products from verified sustainable brands. 
            <span className="block mt-2 text-teal-200">Transform your lifestyle. Protect our planet.</span>
          </p>

          <div className="flex flex-col sm:flex-row gap-3 sm:gap-4 justify-center items-center mb-12 sm:mb-16">
            <Button 
              className="group relative bg-gradient-to-r from-emerald-500 to-teal-500 hover:from-emerald-600 hover:to-teal-600 text-white px-8 sm:px-12 py-4 sm:py-6 text-lg sm:text-xl font-bold rounded-2xl shadow-2xl transition-all duration-300 hover:scale-105 hover:shadow-emerald-500/25" 
              onClick={handleScrollToProducts}
            >
              <span className="relative z-10">Explore Marketplace</span>
              <div className="absolute inset-0 bg-gradient-to-r from-emerald-600 to-teal-600 rounded-2xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
            </Button>
            
            <Button 
              variant="outline" 
              className="border-2 border-emerald-400/50 bg-transparent text-emerald-100 hover:bg-emerald-500/20 px-6 sm:px-8 py-4 sm:py-6 text-base sm:text-lg font-semibold rounded-2xl backdrop-blur-sm transition-all duration-300"
              onClick={handleAboutClick}
            >
              Learn More
            </Button>
          </div>

          {/* Value propositions instead of fake stats */}
          <div className="grid grid-cols-2 md:grid-cols-4 gap-4 sm:gap-6 max-w-5xl mx-auto px-2">
            {values.map((value, idx) => (
              <div key={idx} className="group bg-white/10 backdrop-blur-sm rounded-xl p-6 hover:bg-white/20 transition-all duration-300 border border-white/10">
                <div className="flex flex-col items-center text-center">
                  <div className="mb-3 group-hover:scale-110 transition-transform duration-300">
                    {value.icon}
                  </div>
                  <h3 className="text-white font-bold text-sm mb-2">{value.title}</h3>
                  <p className="text-emerald-200/80 text-xs leading-relaxed">{value.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* Scroll indicator */}
        <div className="absolute bottom-8 left-1/2 transform -translate-x-1/2 animate-bounce">
          <div className="w-6 h-10 border-2 border-emerald-400/50 rounded-full flex justify-center">
            <div className="w-1 h-3 bg-emerald-400 rounded-full mt-2 animate-pulse" />
          </div>
        </div>
      </section>

      {/* Featured Categories - Enhanced with glassmorphism */}
      <section className="py-16 sm:py-24 px-3 sm:px-4 bg-gradient-to-br from-gray-50 to-emerald-50/50 relative overflow-hidden">
        <div className="absolute inset-0 bg-grid-pattern opacity-5" />
        
        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-800 mb-4 sm:mb-6">
              Featured
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Categories
              </span>
            </h2>
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto px-2">
              Curated collections of sustainable products that make a difference
            </p>
          </div>

          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 sm:gap-8">
            {categories.map((cat, idx) => (
              <div 
                key={idx} 
                className="group relative bg-white/80 backdrop-blur-sm rounded-3xl p-8 hover:bg-white shadow-lg hover:shadow-2xl transition-all duration-500 border border-white/20 hover:scale-105 cursor-pointer"
                style={{ animationDelay: `${idx * 100}ms` }}
              >
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/10 to-teal-500/10 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
                
                <div className="relative z-10 text-center">
                  <div className="mb-6 group-hover:scale-110 transition-transform duration-300">
                    {cat.icon}
                  </div>
                  <h3 className="text-xl font-bold text-slate-800 mb-2">{cat.label}</h3>
                  <p className="text-slate-600 text-sm">{cat.description}</p>
                </div>

                {/* Hover effect overlay */}
                <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-teal-500/5 rounded-3xl opacity-0 group-hover:opacity-100 transition-opacity duration-300" />
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Why Choose Us - Premium design */}
      <section className="py-16 sm:py-24 px-3 sm:px-4 bg-gradient-to-br from-slate-800 via-emerald-900 to-slate-900 relative overflow-hidden">
        {/* Background pattern */}
        <div className="absolute inset-0 opacity-10">
          <div className="absolute top-0 left-0 w-full h-full bg-gradient-to-br from-emerald-500/20 to-transparent" />
          <div className="absolute bottom-0 right-0 w-1/2 h-1/2 bg-gradient-to-tl from-teal-500/20 to-transparent" />
        </div>

        <div className="max-w-7xl mx-auto relative z-10">
          <div className="text-center mb-20">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-white mb-4 sm:mb-6">
              Why Choose
              <span className="block bg-gradient-to-r from-emerald-400 to-teal-400 bg-clip-text text-transparent">
                Our Marketplace?
              </span>
            </h2>
            <p className="text-base sm:text-xl text-emerald-100/80 max-w-3xl mx-auto px-2">
              We're not just another marketplace. We're your partner in creating a sustainable future.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 sm:gap-8">
            {[
              {
                icon: <FaLeaf className="text-emerald-400 text-5xl mb-6" />,
                title: "100% Eco-Conscious",
                description: "Every product is carefully vetted for environmental impact and sustainability standards."
              },
              {
                icon: <FaRecycle className="text-emerald-300 text-5xl mb-6" />,
                title: "Circular Economy",
                description: "Discover innovative products made from recycled materials, supporting waste reduction."
              },
              {
                icon: <FaHandsHelping className="text-emerald-200 text-5xl mb-6" />,
                title: "Community First",
                description: "Every purchase directly supports local communities and drives positive social impact."
              },
              {
                icon: <FaUsers className="text-emerald-500 text-5xl mb-6" />,
                title: "Verified Excellence",
                description: "Shop with confidence from rigorously vetted sellers with proven track records."
              }
            ].map((item, idx) => (
              <div 
                key={idx}
                className="group bg-white/10 backdrop-blur-sm rounded-2xl p-8 hover:bg-white/20 transition-all duration-500 border border-white/10 hover:border-emerald-400/30 hover:scale-105"
              >
                <div className="text-center">
                  <div className="group-hover:scale-110 transition-transform duration-300">
                    {item.icon}
                  </div>
                  <h3 className="text-xl font-bold text-white mb-4">{item.title}</h3>
                  <p className="text-emerald-100/70 text-sm leading-relaxed">{item.description}</p>
                </div>
              </div>
            ))}
          </div>
        </div>
      </section>

      {/* Marketplace Products - Enhanced container */}
      <section ref={productsRef} className="py-16 sm:py-24 px-3 sm:px-4 bg-gradient-to-br from-gray-50 via-white to-emerald-50/30">
        <div className="max-w-7xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-3xl sm:text-5xl md:text-6xl font-black text-slate-800 mb-4 sm:mb-6">
              Featured
              <span className="block bg-gradient-to-r from-emerald-600 to-teal-600 bg-clip-text text-transparent">
                Products
              </span>
            </h2>
            <p className="text-base sm:text-xl text-slate-600 max-w-2xl mx-auto px-2">
              Handpicked sustainable products that combine style, quality, and environmental responsibility
            </p>
          </div>
          
          <div className="bg-white rounded-3xl shadow-2xl border border-gray-100 p-6 sm:p-8 md:p-12">
            <ProductsListing />
          </div>
        </div>
      </section>

      <FeedbackWidget />

      <Footer ref={footerRef} />

      <style jsx="true">{`
        @keyframes float {
          0%, 100% { transform: translateY(0px) rotate(0deg); }
          50% { transform: translateY(-20px) rotate(180deg); }
        }
        
        .animate-float {
          animation: float 6s ease-in-out infinite;
        }

        .bg-grid-pattern {
          background-image: radial-gradient(circle at 1px 1px, rgba(59, 130, 246, 0.2) 1px, transparent 0);
          background-size: 20px 20px;
        }
      `}</style>
    </div>
  );
};

export default Homepage;