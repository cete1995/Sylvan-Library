import React, { useEffect, useState } from 'react';
import { getFeaturedProducts, FeaturedProduct } from '../api/featured';
import { useNavigate } from 'react-router-dom';

const FeaturedSection: React.FC = () => {
  const [products, setProducts] = useState<FeaturedProduct[]>([]);
  const [displayedProducts, setDisplayedProducts] = useState<FeaturedProduct[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const navigate = useNavigate();

  const PRODUCTS_PER_PAGE = 4;

  useEffect(() => {
    loadFeaturedData();
  }, []);

  useEffect(() => {
    // Update displayed products when currentIndex changes
    const start = currentIndex;
    const end = currentIndex + PRODUCTS_PER_PAGE;
    setDisplayedProducts(products.slice(start, end));
  }, [currentIndex, products]);

  const loadFeaturedData = async () => {
    try {
      const productsData = await getFeaturedProducts();
      setProducts(productsData);
      setDisplayedProducts(productsData.slice(0, PRODUCTS_PER_PAGE));
    } catch (error) {
      console.error('Error loading featured data:', error);
    }
  };

  const handleNext = () => {
    if (currentIndex + PRODUCTS_PER_PAGE < products.length) {
      setCurrentIndex(currentIndex + PRODUCTS_PER_PAGE);
    } else {
      // Loop back to start
      setCurrentIndex(0);
    }
  };

  const handleProductClick = (cardId: string) => {
    navigate(`/card/${cardId}`);
  };

  const formatPrice = (price: number): string => {
    return `Rp. ${price.toLocaleString('id-ID')}`;
  };

  const getCardPrice = (card: any): number => {
    // Get Near Mint nonfoil price (default display price)
    const nmNonfoil = card.inventory?.find((item: any) => item.condition === 'NM' && item.finish === 'nonfoil');
    return nmNonfoil?.sellPrice || 0;
  };

  if (products.length === 0) {
    return null; // Don't render if no featured content
  }

  return (
    <div className="max-w-7xl mx-auto px-4 py-6 md:py-8">
      {/* Product Highlights */}
      <div className="flex flex-col">
        <div className="flex justify-between items-center mb-3 md:mb-4">
          <h2 className="text-xl md:text-2xl font-bold text-gray-800">Product Highlights</h2>
          {products.length > PRODUCTS_PER_PAGE && (
            <button
              onClick={handleNext}
              className="bg-blue-600 hover:bg-blue-700 text-white font-semibold py-1.5 px-3 md:py-2 md:px-4 rounded transition-colors duration-200 text-sm md:text-base"
            >
              Next →
            </button>
          )}
        </div>

        <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 md:gap-4 flex-1">
          {displayedProducts.map((product) => (
            <div
              key={product._id}
              onClick={() => handleProductClick(product.cardId._id)}
              className="bg-white border border-gray-200 rounded-lg overflow-hidden shadow-md hover:shadow-xl transition-all duration-200 cursor-pointer group"
            >
              <div className="aspect-square overflow-hidden bg-gray-100">
                <img
                  src={product.cardId.imageUrl}
                  alt={product.cardId.name}
                  className="w-full h-full object-contain transition-transform duration-200 group-hover:scale-105"
                />
              </div>
              <div className="p-2 md:p-3">
                <h3 className="font-semibold text-xs md:text-sm text-gray-800 truncate mb-1">
                  {product.cardId.name}
                </h3>
                <p className="text-xs text-gray-500 truncate mb-1 md:mb-2">
                  {product.cardId.setName}
                </p>
                <div className="flex justify-between items-center">
                  <span className="text-xs md:text-sm font-bold text-blue-600">
                    {formatPrice(getCardPrice(product.cardId))}
                  </span>
                  <span className={`text-xs px-1.5 md:px-2 py-0.5 md:py-1 rounded ${
                    product.cardId.rarity === 'mythic'
                      ? 'bg-red-100 text-red-600'
                      : product.cardId.rarity === 'rare'
                      ? 'bg-yellow-100 text-yellow-700'
                      : product.cardId.rarity === 'uncommon'
                      ? 'bg-gray-100 text-gray-600'
                      : 'bg-green-100 text-green-600'
                  }`}>
                    {product.cardId.rarity}
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Pagination indicator */}
        {products.length > PRODUCTS_PER_PAGE && (
          <div className="flex justify-center mt-3 md:mt-4 space-x-2">
            {Array.from({ length: Math.ceil(products.length / PRODUCTS_PER_PAGE) }).map((_, idx) => (
              <div
                key={idx}
                className={`h-2 w-2 rounded-full ${
                  Math.floor(currentIndex / PRODUCTS_PER_PAGE) === idx
                    ? 'bg-blue-600'
                    : 'bg-gray-300'
                }`}
              />
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default FeaturedSection;
