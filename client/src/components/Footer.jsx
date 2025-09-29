import React, { forwardRef } from 'react';

const Footer = forwardRef((props, ref) => (
  <footer id="site-footer" ref={ref} className="relative bg-gradient-to-br from-emerald-800 via-emerald-700 to-emerald-600 text-white overflow-hidden">
    {/* Decorative background elements */}
    <div className="absolute inset-0 opacity-10">
      <div className="absolute top-0 left-0 w-72 h-72 bg-emerald-400 rounded-full mix-blend-multiply filter blur-xl animate-pulse"></div>
      <div className="absolute bottom-0 right-0 w-96 h-96 bg-emerald-300 rounded-full mix-blend-multiply filter blur-xl animate-pulse delay-1000"></div>
    </div>
    
    <div className="relative max-w-7xl mx-auto px-4 sm:px-6 py-12 sm:py-16">
      {/* Main footer content */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8 sm:gap-12 mb-10 sm:mb-12">
        {/* Brand section */}
        <div className="lg:col-span-2">
          <div className="flex items-center mb-4 sm:mb-6">
            <div className="w-10 h-10 bg-emerald-400 rounded-xl flex items-center justify-center mr-3">
              <svg width="24" height="24" fill="currentColor" viewBox="0 0 24 24" className="text-emerald-800">
                <path d="M12 2L13.09 8.26L22 9L13.09 9.74L12 16L10.91 9.74L2 9L10.91 8.26L12 2M6.5 18.5L7.5 21.5L10.5 20.5L7.5 19.5L6.5 18.5Z"/>
              </svg>
            </div>
            <h2 className="text-2xl sm:text-3xl font-bold bg-gradient-to-r from-white to-emerald-100 bg-clip-text text-transparent">
              Green Marketplace
            </h2>
          </div>
          <p className="text-emerald-100 text-base sm:text-lg leading-relaxed max-w-md mb-3 sm:mb-4">
            Your trusted platform for eco-friendly, sustainable, and community-empowering products. Shop green, live clean, and support a better future for all.
          </p>
          <p className="text-emerald-200 font-medium text-xs sm:text-sm tracking-wide uppercase">
            Empowering communities • Protecting the planet
          </p>
        </div>
        
        {/* Contact section */}
        <div>
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-emerald-100">Get in Touch</h3>
          <div className="space-y-4">
            <div className="flex items-center group">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="text-emerald-300 mr-3 group-hover:text-emerald-200 transition-colors">
                <path d="M20 4H4c-1.1 0-1.99.9-1.99 2L2 18c0 1.1.9 2 2 2h16c1.1 0 2-.9 2-2V6c0-1.1-.9-2-2-2zm0 4l-8 5-8-5V6l8 5 8-5v2z"/>
              </svg>
              <a href="mailto:support@greenmarketplace.com" className="text-emerald-100 hover:text-white transition-colors">
                support@greenmarketplace.com
              </a>
            </div>
            <div className="flex items-center group">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="text-emerald-300 mr-3 group-hover:text-emerald-200 transition-colors">
                <path d="M6.62 10.79c1.44 2.83 3.76 5.14 6.59 6.59l2.2-2.2c.27-.27.67-.36 1.02-.24 1.12.37 2.33.57 3.57.57.55 0 1 .45 1 1V20c0 .55-.45 1-1 1-9.39 0-17-7.61-17-17 0-.55.45-1 1-1h3.5c.55 0 1 .45 1 1 0 1.25.2 2.45.57 3.57.11.35.03.74-.25 1.02l-2.2 2.2z"/>
              </svg>
              <a href="tel:+639123456789" className="text-emerald-100 hover:text-white transition-colors">
                +63 912 345 6789
              </a>
            </div>
            <div className="flex items-center group">
              <svg width="18" height="18" fill="currentColor" viewBox="0 0 24 24" className="text-emerald-300 mr-3 group-hover:text-emerald-200 transition-colors">
                <path d="M12 2C8.13 2 5 5.13 5 9c0 5.25 7 13 7 13s7-7.75 7-13c0-3.87-3.13-7-7-7zm0 9.5c-1.38 0-2.5-1.12-2.5-2.5s1.12-2.5 2.5-2.5 2.5 1.12 2.5 2.5-1.12 2.5-2.5 2.5z"/>
              </svg>
              <span className="text-emerald-100">Batangas, Philippines</span>
            </div>
          </div>
        </div>
        
        {/* Social media section */}
        <div>
          <h3 className="text-lg sm:text-xl font-semibold mb-4 sm:mb-6 text-emerald-100">Connect With Us</h3>
          <div className="flex flex-col space-y-3 sm:space-y-4">
            <a href="https://facebook.com/greenmarketplace" target="_blank" rel="noopener noreferrer" 
               className="flex items-center text-emerald-100 hover:text-white transition-all duration-300 group">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-emerald-500 transition-colors">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M22.675 0h-21.35C.595 0 0 .592 0 1.326v21.348C0 23.408.595 24 1.325 24h11.495v-9.294H9.692v-3.622h3.128V8.413c0-3.1 1.893-4.788 4.659-4.788 1.325 0 2.463.099 2.797.143v3.24l-1.918.001c-1.504 0-1.797.715-1.797 1.763v2.313h3.587l-.467 3.622h-3.12V24h6.116C23.406 24 24 23.408 24 22.674V1.326C24 .592 23.406 0 22.675 0"/>
                </svg>
              </div>
              <span className="font-medium">Facebook</span>
            </a>
            <a href="https://twitter.com/greenmarketph" target="_blank" rel="noopener noreferrer" 
               className="flex items-center text-emerald-100 hover:text-white transition-all duration-300 group">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-emerald-500 transition-colors">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M24 4.557a9.83 9.83 0 0 1-2.828.775 4.932 4.932 0 0 0 2.165-2.724c-.951.564-2.005.974-3.127 1.195a4.916 4.916 0 0 0-8.38 4.482C7.691 8.095 4.066 6.13 1.64 3.161c-.542.929-.856 2.01-.857 3.17 0 2.188 1.115 4.116 2.823 5.247a4.904 4.904 0 0 1-2.229-.616c-.054 2.281 1.581 4.415 3.949 4.89a4.936 4.936 0 0 1-2.224.084c.627 1.956 2.444 3.377 4.6 3.417A9.867 9.867 0 0 1 0 21.543a13.94 13.94 0 0 0 7.548 2.209c9.057 0 14.009-7.496 14.009-13.986 0-.21 0-.423-.016-.634A9.936 9.936 0 0 0 24 4.557z"/>
                </svg>
              </div>
              <span className="font-medium">Twitter</span>
            </a>
            <a href="https://instagram.com/greenmarketplace" target="_blank" rel="noopener noreferrer" 
               className="flex items-center text-emerald-100 hover:text-white transition-all duration-300 group">
              <div className="w-10 h-10 bg-emerald-600 rounded-lg flex items-center justify-center mr-3 group-hover:bg-emerald-500 transition-colors">
                <svg width="20" height="20" fill="currentColor" viewBox="0 0 24 24">
                  <path d="M12 2.163c3.204 0 3.584.012 4.85.07 1.366.062 2.633.334 3.608 1.308.974.974 1.246 2.241 1.308 3.608.058 1.266.07 1.646.07 4.85s-.012 3.584-.07 4.85c-.062 1.366-.334 2.633-1.308 3.608-.974.974-2.241 1.246-3.608 1.308-1.266.058-1.646.07-4.85.07s-3.584-.012-4.85-.07c-1.366-.062-2.633-.334-3.608-1.308-.974-.974-1.246-2.241-1.308-3.608C2.175 15.647 2.163 15.267 2.163 12s.012-3.584.07-4.85c.062-1.366.334-2.633 1.308-3.608C4.515 2.497 5.782 2.225 7.148 2.163 8.414 2.105 8.794 2.163 12 2.163zm0-2.163C8.741 0 8.332.013 7.052.072 5.771.131 4.659.425 3.678 1.406 2.697 2.387 2.403 3.499 2.344 4.78.013 8.332 0 8.741 0 12c0 3.259.013 3.668.072 4.948.059 1.281.353 2.393 1.334 3.374.981.981 2.093 1.275 3.374 1.334C8.332 23.987 8.741 24 12 24c3.259 0 3.668-.013 4.948-.072 1.281-.059 2.393-.353 3.374-1.334.981-.981 1.275-2.093 1.334-3.374.059-1.28.072-1.689.072-4.948 0-3.259-.013-3.668-.072-4.948-.059-1.281-.353-2.393-1.334-3.374-.981-.981-2.093-1.275-3.374-1.334C15.668.013 15.259 0 12 0zm0 5.838a6.162 6.162 0 1 0 0 12.324 6.162 6.162 0 0 0 0-12.324zm0 10.162a3.999 3.999 0 1 1 0-7.998 3.999 3.999 0 0 1 0 7.998zm6.406-11.845a1.44 1.44 0 1 0 0 2.881 1.44 1.44 0 0 0 0-2.881z"/>
                </svg>
              </div>
              <span className="font-medium">Instagram</span>
            </a>
          </div>
        </div>
      </div>
      
     
      {/* Copyright */}
      <div className="border-t border-emerald-600/50 pt-6 sm:pt-8 text-center">
        <div className="flex flex-col md:flex-row items-center justify-center gap-2 sm:gap-3 md:gap-6">
          <p className="text-emerald-200 text-xs sm:text-sm">
            &copy; {new Date().getFullYear()} Green Marketplace. All rights reserved. Made with 💚 for a sustainable future.
          </p>
          <a href="/terms" className="text-emerald-100 hover:text-white text-xs sm:text-sm underline underline-offset-4 decoration-emerald-300/70">
            Terms and Conditions
          </a>
        </div>
      </div>
    </div>
  </footer>
));

export default Footer;