import React, { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import api from '../api/client';

interface CardSearchResult {
  _id: string;
  name: string;
  setCode: string;
  collectorNumber: string;
}

interface InventoryDetail {
  inventoryIndex: number;
  condition: string;
  finish: string;
  quantityOwned: number;
  quantityForSale: number;
  quantityOwned_type: string;
  quantityForSale_type: string;
  quantityOwned_isNaN: boolean;
  quantityForSale_isNaN: boolean;
  buyPrice: number;
  sellPrice: number;
  sellerSku: string | null;
  sellerId: string | null;
  sellerName: string | null;
  sellerEmail: string | null;
  sellerActualName: string | null;
  sellerRole: string | null;
  tiktokProductId?: string;
  tiktokSkuId?: string;
}

const AdminDebugPage: React.FC = () => {
  const navigate = useNavigate();
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<CardSearchResult[]>([]);
  const [selectedCard, setSelectedCard] = useState<any>(null);
  const [loading, setLoading] = useState(false);

  const handleSearch = async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const response = await api.get('/debug/search', {
        params: { q: searchQuery }
      });
      setSearchResults(response.data.data);
    } catch (error: any) {
      alert('Search error: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleSelectCard = async (cardId: string) => {
    setLoading(true);
    try {
      const response = await api.get(`/debug/card/${cardId}`);
      setSelectedCard(response.data.data);
      console.log('=== CARD DEBUG INFO ===');
      console.log('Full response:', response.data.data);
    } catch (error: any) {
      alert('Error fetching card details: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-4">
            <button
              onClick={() => navigate('/admin/dashboard')}
              className="p-2 rounded-lg hover:bg-gray-100 dark:hover:bg-gray-800"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
              </svg>
            </button>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>
              🐛 Card Inventory Debugger
            </h1>
          </div>
        </div>
        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          Search for a card to inspect detailed inventory information. Check browser console and backend terminal for logs.
        </p>
      </div>

      {/* Search Section */}
      <div className="max-w-7xl mx-auto mb-6">
        <div className="p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--color-surface)' }}>
          <h2 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Search Card</h2>
          <div className="flex gap-3">
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              onKeyPress={(e) => e.key === 'Enter' && handleSearch()}
              placeholder="Enter card name..."
              className="flex-1 px-4 py-2 rounded-lg border"
              style={{
                backgroundColor: 'var(--color-background)',
                borderColor: 'var(--color-border)',
                color: 'var(--color-text)'
              }}
            />
            <button
              onClick={handleSearch}
              disabled={loading}
              className="px-6 py-2 rounded-lg font-medium disabled:opacity-50"
              style={{ backgroundColor: '#3B82F6', color: 'white' }}
            >
              {loading ? 'Searching...' : '🔍 Search'}
            </button>
          </div>

          {/* Search Results */}
          {searchResults.length > 0 && (
            <div className="mt-4 space-y-2">
              <p className="text-sm font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                Found {searchResults.length} cards:
              </p>
              {searchResults.map((card) => (
                <button
                  key={card._id}
                  onClick={() => handleSelectCard(card._id)}
                  className="w-full text-left px-4 py-3 rounded-lg border hover:border-blue-500 transition-colors"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    borderColor: 'var(--color-border)'
                  }}
                >
                  <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {card.name}
                  </div>
                  <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {card.setCode} #{card.collectorNumber}
                  </div>
                </button>
              ))}
            </div>
          )}
        </div>
      </div>

      {/* Card Details */}
      {selectedCard && (
        <div className="max-w-7xl mx-auto space-y-6">
          {/* Card Info */}
          <div className="p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--color-surface)' }}>
            <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              {selectedCard.card.name}
            </h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4 text-sm">
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Set:</span>
                <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {selectedCard.card.setCode} - {selectedCard.card.setName}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Collector #:</span>
                <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {selectedCard.card.collectorNumber}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Rarity:</span>
                <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {selectedCard.card.rarity}
                </div>
              </div>
              <div>
                <span style={{ color: 'var(--color-text-secondary)' }}>Total Inventory:</span>
                <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                  {selectedCard.totalInventoryItems}
                </div>
              </div>
            </div>
          </div>

          {/* Inventory Details */}
          <div className="p-6 rounded-lg shadow" style={{ backgroundColor: 'var(--color-surface)' }}>
            <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
              Inventory Details ({selectedCard.inventory.length} items)
            </h3>
            <div className="space-y-4">
              {selectedCard.inventory.map((inv: InventoryDetail, idx: number) => (
                <div
                  key={idx}
                  className="p-4 rounded-lg border"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    borderColor: inv.quantityForSale_isNaN || inv.quantityOwned_isNaN ? '#EF4444' : 'var(--color-border)'
                  }}
                >
                  <div className="flex justify-between items-start mb-3">
                    <div>
                      <div className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>
                        Inventory #{inv.inventoryIndex}
                      </div>
                      <div className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {inv.condition} • {inv.finish}
                      </div>
                    </div>
                    {(inv.quantityForSale_isNaN || inv.quantityOwned_isNaN) && (
                      <span className="px-3 py-1 rounded-full text-xs font-bold" style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                        ⚠️ NaN DETECTED
                      </span>
                    )}
                  </div>

                  <div className="grid grid-cols-2 md:grid-cols-3 gap-4 text-sm mb-3">
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Quantity Owned:</span>
                      <div className="font-medium" style={{ color: inv.quantityOwned_isNaN ? '#DC2626' : 'var(--color-text)' }}>
                        {inv.quantityOwned} ({inv.quantityOwned_type})
                        {inv.quantityOwned_isNaN && <span className="ml-2 text-red-600 font-bold">NaN!</span>}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Quantity For Sale:</span>
                      <div className="font-medium" style={{ color: inv.quantityForSale_isNaN ? '#DC2626' : 'var(--color-text)' }}>
                        {inv.quantityForSale} ({inv.quantityForSale_type})
                        {inv.quantityForSale_isNaN && <span className="ml-2 text-red-600 font-bold">NaN!</span>}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Seller SKU:</span>
                      <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                        {inv.sellerSku || 'N/A'}
                      </div>
                    </div>
                  </div>

                  {inv.sellerId && (
                    <div className="p-3 rounded-lg mb-3" style={{ backgroundColor: 'var(--color-surface)' }}>
                      <div className="text-xs font-bold mb-2" style={{ color: 'var(--color-text-secondary)' }}>SELLER INFO</div>
                      <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                        <div>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Name:</span>
                          <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                            {inv.sellerActualName || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Email:</span>
                          <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                            {inv.sellerEmail || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Role:</span>
                          <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                            {inv.sellerRole || 'N/A'}
                          </div>
                        </div>
                        <div>
                          <span style={{ color: 'var(--color-text-secondary)' }}>Seller ID:</span>
                          <div className="font-mono text-xs" style={{ color: 'var(--color-text)' }}>
                            {inv.sellerId}
                          </div>
                        </div>
                      </div>
                    </div>
                  )}

                  <div className="grid grid-cols-2 md:grid-cols-4 gap-3 text-sm">
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Buy Price:</span>
                      <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                        Rp {inv.buyPrice.toLocaleString()}
                      </div>
                    </div>
                    <div>
                      <span style={{ color: 'var(--color-text-secondary)' }}>Sell Price:</span>
                      <div className="font-medium" style={{ color: 'var(--color-text)' }}>
                        Rp {inv.sellPrice.toLocaleString()}
                      </div>
                    </div>
                    {inv.tiktokProductId && (
                      <div>
                        <span style={{ color: 'var(--color-text-secondary)' }}>TikTok Product:</span>
                        <div className="font-mono text-xs" style={{ color: 'var(--color-text)' }}>
                          {inv.tiktokProductId}
                        </div>
                      </div>
                    )}
                    {inv.tiktokSkuId && (
                      <div>
                        <span style={{ color: 'var(--color-text-secondary)' }}>TikTok SKU:</span>
                        <div className="font-mono text-xs" style={{ color: 'var(--color-text)' }}>
                          {inv.tiktokSkuId}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminDebugPage;
