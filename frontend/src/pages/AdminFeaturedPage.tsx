import React, { useState, useEffect } from 'react';
import { useAuth } from '../contexts/AuthContext';
import {
  getAdminFeaturedBanner,
  upsertFeaturedBanner,
  getAdminFeaturedProducts,
  addFeaturedProduct,
  updateFeaturedProduct,
  deleteFeaturedProduct,
  FeaturedProduct,
} from '../api/featured';
import { cardApi } from '../api/cards';
import { Card } from '../types';

const AdminFeaturedPage: React.FC = () => {
  const { token } = useAuth();
  const [activeTab, setActiveTab] = useState<'banner' | 'products'>('banner');

  // Banner state
  const [bannerForm, setBannerForm] = useState({
    imageUrl: '',
    title: '',
    buttonText: 'Click for More',
    buttonLink: '',
    isActive: true,
  });

  // Products state
  const [featuredProducts, setFeaturedProducts] = useState<FeaturedProduct[]>([]);
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<Card[]>([]);
  const [selectedCard, setSelectedCard] = useState<Card | null>(null);
  const [productForm, setProductForm] = useState({
    order: 0,
    isActive: true,
  });
  const [editingProduct, setEditingProduct] = useState<FeaturedProduct | null>(null);

  // Loading and error states
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  useEffect(() => {
    loadData();
  }, [activeTab]);

  const loadData = async () => {
    if (!token) return;

    try {
      setLoading(true);
      if (activeTab === 'banner') {
        const bannerData = await getAdminFeaturedBanner(token);
        if (bannerData) {
          setBannerForm({
            imageUrl: bannerData.imageUrl,
            title: bannerData.title,
            buttonText: bannerData.buttonText,
            buttonLink: bannerData.buttonLink,
            isActive: bannerData.isActive,
          });
        }
      } else {
        const products = await getAdminFeaturedProducts(token);
        setFeaturedProducts(products);
      }
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'Failed to load data');
    } finally {
      setLoading(false);
    }
  };

  const handleBannerSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token) return;

    try {
      setLoading(true);
      console.log('Submitting banner data:', bannerForm);
      const result = await upsertFeaturedBanner(token, bannerForm);
      console.log('Banner update result:', result);
      showMessage('success', 'Banner updated successfully!');
      loadData();
    } catch (error: any) {
      console.error('Banner update error:', error);
      const errorMessage = error.response?.data?.message || error.response?.data?.error || error.message || 'Failed to update banner';
      showMessage('error', errorMessage);
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    try {
      setLoading(true);
      const results = await cardApi.getCards({ q: searchQuery, limit: 20 });
      setSearchResults(results.cards);
      showMessage('success', `Found ${results.cards.length} cards`);
    } catch (error: any) {
      showMessage('error', 'Failed to search cards');
    } finally {
      setLoading(false);
    }
  };

  const handleAddProduct = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!token || !selectedCard) {
      showMessage('error', 'Please select a card first');
      return;
    }

    try {
      setLoading(true);
      if (editingProduct) {
        await updateFeaturedProduct(token, editingProduct._id!, {
          cardId: selectedCard._id,
          ...productForm,
        });
        showMessage('success', 'Product updated successfully!');
      } else {
        await addFeaturedProduct(token, {
          cardId: selectedCard._id,
          ...productForm,
        });
        showMessage('success', 'Product added successfully!');
      }
      setSelectedCard(null);
      setSearchQuery('');
      setSearchResults([]);
      setEditingProduct(null);
      setProductForm({ order: 0, isActive: true });
      loadData();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'Failed to add product');
    } finally {
      setLoading(false);
    }
  };

  const handleDeleteProduct = async (productId: string) => {
    if (!token || !confirm('Are you sure you want to remove this featured product?')) {
      return;
    }

    try {
      setLoading(true);
      await deleteFeaturedProduct(token, productId);
      showMessage('success', 'Product removed successfully!');
      loadData();
    } catch (error: any) {
      showMessage('error', error.response?.data?.message || 'Failed to remove product');
    } finally {
      setLoading(false);
    }
  };

  const handleEditProduct = (product: FeaturedProduct) => {
    setEditingProduct(product);
    setSelectedCard(product.cardId);
    setProductForm({
      order: product.order,
      isActive: product.isActive,
    });
  };

  const showMessage = (type: 'success' | 'error', text: string) => {
    setMessage({ type, text });
    setTimeout(() => setMessage(null), 5000);
  };

  const formatPrice = (price: number): string => {
    return `Rp. ${price.toLocaleString('id-ID')}`;
  };

  const getCardPrice = (card: Card): number => {
    // Get Near Mint nonfoil price (default display price)
    const nmNonfoil = card.inventory?.find(item => item.condition === 'NM' && item.finish === 'nonfoil');
    return nmNonfoil?.sellPrice || 0;
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <h1 className="text-3xl font-bold text-gray-800 mb-6">Manage Featured Section</h1>

        {/* Message Display */}
        {message && (
          <div
            className={`mb-6 p-4 rounded-lg ${
              message.type === 'success' ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'
            }`}
          >
            {message.text}
          </div>
        )}

        {/* Tabs */}
        <div className="flex border-b border-gray-200 mb-6">
          <button
            onClick={() => setActiveTab('banner')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'banner'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Featured Banner
          </button>
          <button
            onClick={() => setActiveTab('products')}
            className={`px-6 py-3 font-semibold ${
              activeTab === 'products'
                ? 'text-blue-600 border-b-2 border-blue-600'
                : 'text-gray-500 hover:text-gray-700'
            }`}
          >
            Featured Products
          </button>
        </div>

        {/* Banner Tab */}
        {activeTab === 'banner' && (
          <div className="bg-white rounded-lg shadow-md p-6">
            <h2 className="text-xl font-semibold mb-4">Banner Settings</h2>
            <form onSubmit={handleBannerSubmit} className="space-y-4">
              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Image URL
                </label>
                <input
                  type="url"
                  value={bannerForm.imageUrl}
                  onChange={(e) => setBannerForm({ ...bannerForm, imageUrl: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Title
                </label>
                <input
                  type="text"
                  value={bannerForm.title}
                  onChange={(e) => setBannerForm({ ...bannerForm, title: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Text
                </label>
                <input
                  type="text"
                  value={bannerForm.buttonText}
                  onChange={(e) => setBannerForm({ ...bannerForm, buttonText: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  required
                />
              </div>

              <div>
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Button Link
                </label>
                <input
                  type="text"
                  value={bannerForm.buttonLink}
                  onChange={(e) => setBannerForm({ ...bannerForm, buttonLink: e.target.value })}
                  className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                  placeholder="/catalog or https://example.com"
                  required
                />
              </div>

              <div className="flex items-center">
                <input
                  type="checkbox"
                  id="bannerActive"
                  checked={bannerForm.isActive}
                  onChange={(e) => setBannerForm({ ...bannerForm, isActive: e.target.checked })}
                  className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                />
                <label htmlFor="bannerActive" className="ml-2 text-sm text-gray-700">
                  Active
                </label>
              </div>

              {bannerForm.imageUrl && (
                <div className="mt-4">
                  <p className="text-sm font-medium text-gray-700 mb-2">Preview:</p>
                  <div className="relative h-64 rounded-lg overflow-hidden">
                    <img
                      src={bannerForm.imageUrl}
                      alt="Banner preview"
                      className="w-full h-full object-cover"
                    />
                    <div className="absolute inset-0 bg-black bg-opacity-30 flex items-center justify-center">
                      <button
                        type="button"
                        className="bg-blue-600 text-white font-bold py-2 px-6 rounded-lg"
                      >
                        {bannerForm.buttonText}
                      </button>
                    </div>
                  </div>
                </div>
              )}

              <button
                type="submit"
                disabled={loading}
                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400"
              >
                {loading ? 'Saving...' : 'Save Banner'}
              </button>
            </form>
          </div>
        )}

        {/* Products Tab */}
        {activeTab === 'products' && (
          <div className="space-y-6">
            {/* Add/Edit Product Form */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">
                {editingProduct ? 'Edit Featured Product' : 'Add Featured Product'}
              </h2>

              {/* Search Cards */}
              <div className="mb-4">
                <label className="block text-sm font-medium text-gray-700 mb-2">
                  Search Cards
                </label>
                <div className="flex gap-2">
                  <input
                    type="text"
                    value={searchQuery}
                    onChange={(e) => setSearchQuery(e.target.value)}
                    onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
                    className="flex-1 px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    placeholder="Search by card name..."
                  />
                  <button
                    type="button"
                    onClick={handleSearch}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-6 py-2 rounded-lg"
                  >
                    Search
                  </button>
                </div>
              </div>

              {/* Search Results */}
              {searchResults.length > 0 && (
                <div className="mb-4 max-h-64 overflow-y-auto border border-gray-200 rounded-lg">
                  {searchResults.map((card) => (
                    <div
                      key={card._id}
                      onClick={() => {
                        setSelectedCard(card);
                        setSearchResults([]);
                        setSearchQuery('');
                      }}
                      className="p-3 hover:bg-gray-50 cursor-pointer border-b border-gray-100 flex items-center gap-3"
                    >
                      <img
                        src={card.imageUrl}
                        alt={card.name}
                        className="w-12 h-16 object-contain"
                      />
                      <div className="flex-1">
                        <p className="font-semibold text-sm">{card.name}</p>
                        <p className="text-xs text-gray-500">{card.setName}</p>
                        <p className="text-xs text-blue-600 font-semibold">
                          {formatPrice(getCardPrice(card))}
                        </p>
                      </div>
                    </div>
                  ))}
                </div>
              )}

              {/* Selected Card */}
              {selectedCard && (
                <div className="mb-4 p-4 bg-blue-50 border border-blue-200 rounded-lg">
                  <p className="text-sm font-medium text-gray-700 mb-2">Selected Card:</p>
                  <div className="flex items-center gap-3">
                    <img
                      src={selectedCard.imageUrl}
                      alt={selectedCard.name}
                      className="w-16 h-22 object-contain"
                    />
                    <div>
                      <p className="font-semibold">{selectedCard.name}</p>
                      <p className="text-sm text-gray-600">{selectedCard.setName}</p>
                      <p className="text-sm text-blue-600 font-semibold">
                        {formatPrice(getCardPrice(selectedCard))}
                      </p>
                    </div>
                  </div>
                </div>
              )}

              {/* Product Form */}
              <form onSubmit={handleAddProduct} className="space-y-4">
                <div>
                  <label className="block text-sm font-medium text-gray-700 mb-2">
                    Display Order
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={productForm.order}
                    onChange={(e) => setProductForm({ ...productForm, order: parseInt(e.target.value) })}
                    className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                    required
                  />
                  <p className="text-xs text-gray-500 mt-1">Lower numbers appear first</p>
                </div>

                <div className="flex items-center">
                  <input
                    type="checkbox"
                    id="productActive"
                    checked={productForm.isActive}
                    onChange={(e) => setProductForm({ ...productForm, isActive: e.target.checked })}
                    className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
                  />
                  <label htmlFor="productActive" className="ml-2 text-sm text-gray-700">
                    Active
                  </label>
                </div>

                <div className="flex gap-2">
                  <button
                    type="submit"
                    disabled={loading || !selectedCard}
                    className="flex-1 bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 px-6 rounded-lg transition-colors disabled:bg-gray-400"
                  >
                    {loading ? 'Saving...' : editingProduct ? 'Update Product' : 'Add Product'}
                  </button>
                  {editingProduct && (
                    <button
                      type="button"
                      onClick={() => {
                        setEditingProduct(null);
                        setSelectedCard(null);
                        setProductForm({ order: 0, isActive: true });
                      }}
                      className="bg-gray-500 hover:bg-gray-600 text-white font-bold py-3 px-6 rounded-lg transition-colors"
                    >
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* Featured Products List */}
            <div className="bg-white rounded-lg shadow-md p-6">
              <h2 className="text-xl font-semibold mb-4">Current Featured Products</h2>
              {featuredProducts.length === 0 ? (
                <p className="text-gray-500 text-center py-8">No featured products yet.</p>
              ) : (
                <div className="space-y-3">
                  {featuredProducts.map((product) => (
                    <div
                      key={product._id}
                      className="flex items-center gap-4 p-4 border border-gray-200 rounded-lg hover:border-blue-300 transition-colors"
                    >
                      <img
                        src={product.cardId.imageUrl}
                        alt={product.cardId.name}
                        className="w-16 h-22 object-contain"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{product.cardId.name}</p>
                        <p className="text-sm text-gray-600">{product.cardId.setName}</p>
                        <p className="text-sm text-blue-600 font-semibold">
                          {formatPrice(getCardPrice(product.cardId))}
                        </p>
                        <div className="flex gap-2 mt-1">
                          <span className="text-xs bg-gray-100 px-2 py-1 rounded">
                            Order: {product.order}
                          </span>
                          <span
                            className={`text-xs px-2 py-1 rounded ${
                              product.isActive ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'
                            }`}
                          >
                            {product.isActive ? 'Active' : 'Inactive'}
                          </span>
                        </div>
                      </div>
                      <div className="flex gap-2">
                        <button
                          onClick={() => handleEditProduct(product)}
                          className="bg-yellow-500 hover:bg-yellow-600 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Edit
                        </button>
                        <button
                          onClick={() => handleDeleteProduct(product._id!)}
                          className="bg-red-600 hover:bg-red-700 text-white px-4 py-2 rounded-lg text-sm"
                        >
                          Remove
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminFeaturedPage;
