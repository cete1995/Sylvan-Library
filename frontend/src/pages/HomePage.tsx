import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import Carousel from '../components/Carousel';
import FeaturedSection from '../components/FeaturedSection';
import { carouselApi } from '../api/carousel';

const HomePage: React.FC = () => {
  const [carouselImages, setCarouselImages] = useState<{ imageUrl: string; altText?: string }[]>([]);

  useEffect(() => {
    loadCarousel();
  }, []);

  const loadCarousel = async () => {
    try {
      const images = await carouselApi.getImages();
      setCarouselImages(images);
    } catch (error) {
      console.error('Failed to load carousel:', error);
    }
  };

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Carousel Section */}
      <Carousel images={carouselImages} autoPlay={true} interval={5000} />

      {/* Featured Section */}
      <FeaturedSection />

      {/* Hero Section */}
      <div className="bg-gradient-to-r from-blue-600 via-blue-700 to-indigo-800 text-white">
        <div className="container mx-auto px-4 py-16 md:py-24">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl md:text-6xl font-bold mb-6 leading-tight">
              Welcome to Sylvan Library
            </h1>
            <p className="text-lg md:text-2xl mb-8 text-blue-100 leading-relaxed">
              Your premier destination for Magic: The Gathering singles. Discover thousands of carefully curated cards from every set, all in excellent condition and ready to enhance your deck.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link
                to="/catalog"
                className="inline-flex items-center justify-center px-8 py-4 rounded-xl font-bold text-lg hover:opacity-90 transition-all shadow-lg hover:shadow-xl transform hover:scale-105"
                style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-accent)' }}
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                Browse Cards
              </Link>
              <Link 
                to="/login" 
                className="inline-flex items-center justify-center border-2 border-white text-white px-8 py-4 rounded-xl font-bold text-lg hover:bg-white/10 transition-all backdrop-blur-sm"
              >
                <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 16l-4-4m0 0l4-4m-4 4h14m-5 4v1a3 3 0 01-3 3H6a3 3 0 01-3-3V7a3 3 0 013-3h7a3 3 0 013 3v1" />
                </svg>
                Sign In
              </Link>
            </div>
          </div>
        </div>
      </div>

      {/* Features Section */}
      <div className="container mx-auto px-4 py-16 md:py-24">
        <div className="text-center mb-12">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Why Choose Sylvan Library?</h2>
          <p className="text-lg max-w-2xl mx-auto" style={{ color: 'var(--color-text-secondary)' }}>
            We're committed to providing the best MTG shopping experience with quality cards, competitive prices, and excellent service.
          </p>
        </div>
        
        <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-8">
          <div className="rounded-xl shadow-lg p-8 text-center transform hover:scale-105 transition-all hover:shadow-xl" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="bg-gradient-to-br from-green-400 to-green-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m6 2a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Quality Guaranteed</h3>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Every card is carefully graded and inspected. We ensure accurate condition descriptions and secure packaging for safe delivery.
            </p>
          </div>

          <div className="rounded-xl shadow-lg p-8 text-center transform hover:scale-105 transition-all hover:shadow-xl" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="bg-gradient-to-br from-blue-400 to-blue-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Easy Search</h3>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Find exactly what you need with our powerful search and filter tools. Browse by set, rarity, price, and more.
            </p>
          </div>

          <div className="rounded-xl shadow-lg p-8 text-center transform hover:scale-105 transition-all hover:shadow-xl sm:col-span-2 lg:col-span-1" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="bg-gradient-to-br from-purple-400 to-purple-600 w-20 h-20 rounded-2xl flex items-center justify-center mx-auto mb-6 shadow-lg">
              <svg className="w-10 h-10 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
            </div>
            <h3 className="text-2xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Competitive Prices</h3>
            <p className="leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
              Fair and transparent pricing on all singles, from commons to mythics. Great value for your collection.
            </p>
          </div>
        </div>
      </div>

      {/* Stats Section */}
      <div className="bg-gradient-to-r from-indigo-600 to-purple-700 text-white py-16">
        <div className="container mx-auto px-4">
          <div className="grid grid-cols-2 md:grid-cols-4 gap-8 text-center">
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">10K+</div>
              <div className="text-indigo-200">Unique Cards</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">100%</div>
              <div className="text-indigo-200">Authentic</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">Fast</div>
              <div className="text-indigo-200">Shipping</div>
            </div>
            <div>
              <div className="text-4xl md:text-5xl font-bold mb-2">24/7</div>
              <div className="text-indigo-200">Support</div>
            </div>
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div className="py-16 md:py-24" style={{ backgroundColor: 'var(--color-panel)' }}>
        <div className="container mx-auto px-4 text-center max-w-3xl">
          <h2 className="text-3xl md:text-4xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Ready to Build Your Perfect Deck?</h2>
          <p className="text-lg md:text-xl mb-8 leading-relaxed" style={{ color: 'var(--color-text-secondary)' }}>
            Start browsing our extensive collection today and find the perfect cards for your strategy
          </p>
          <Link 
            to="/catalog" 
            className="inline-flex items-center bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700 text-white px-10 py-4 rounded-xl font-bold text-lg shadow-lg hover:shadow-xl transition-all transform hover:scale-105"
          >
            <svg className="w-6 h-6 mr-2" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
            </svg>
            View All Cards
          </Link>
        </div>
      </div>
    </div>
  );
};

export default HomePage;
