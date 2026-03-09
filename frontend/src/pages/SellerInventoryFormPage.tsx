import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { cardApi } from '../api/cards';
import { Card } from '../types';

const SellerInventoryFormPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [card, setCard] = useState<Card | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');

  const [inventoryData, setInventoryData] = useState({
    condition: 'NM' as 'NM' | 'LP' | 'P',
    finish: 'nonfoil' as 'nonfoil' | 'foil',
    quantity: 0,
    quantityForSale: 0,
  });

  useEffect(() => {
    if (id) {
      loadCard(id);
    }
  }, [id]);

  const loadCard = async (cardId: string) => {
    setLoading(true);
    try {
      const data = await cardApi.getCardById(cardId);
      setCard(data.card);
    } catch (error) {
      setError('Failed to load card');
    } finally {
      setLoading(false);
    }
  };

  const handleAddInventory = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!card) return;

    setError('');
    setSuccess('');

    if (inventoryData.quantity < 0 || inventoryData.quantityForSale < 0) {
      setError('Quantities cannot be negative');
      return;
    }

    if (inventoryData.quantityForSale > inventoryData.quantity) {
      setError('Quantity for sale cannot exceed total quantity');
      return;
    }

    setLoading(true);
    try {
      await cardApi.addInventory(card._id, inventoryData);
      setSuccess('Inventory added successfully!');
      setInventoryData({
        condition: 'NM',
        finish: 'nonfoil',
        quantity: 0,
        quantityForSale: 0,
      });
      // Reload card to show updated inventory
      loadCard(card._id);
    } catch (error: any) {
      setError(error.response?.data?.error || 'Failed to add inventory');
    } finally {
      setLoading(false);
    }
  };

  if (loading && !card) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div style={{ color: 'var(--color-text-secondary)' }}>Loading...</div>
      </div>
    );
  }

  if (!card) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div style={{ color: 'var(--color-text-secondary)' }}>Card not found</div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-8" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-4xl">
        <button
          onClick={() => navigate('/seller/dashboard')}
          className="mb-6 inline-flex items-center gap-1.5 px-4 py-2 rounded-xl font-semibold text-sm hover:opacity-80 transition-all"
          style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Dashboard
        </button>

        <div className="grid md:grid-cols-2 gap-8">
          {/* Card Info */}
          <div>
            <div className="rounded-lg p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
              <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
                {card.name}
              </h2>
              {card.imageUrl && (
                <img
                  src={card.imageUrl}
                  alt={card.name}
                  className="w-full rounded-lg mb-4"
                />
              )}
              <div className="space-y-2" style={{ color: 'var(--color-text-secondary)' }}>
                <p><strong>Set:</strong> {card.setCode}</p>
                <p><strong>Collector Number:</strong> {card.collectorNumber}</p>
                <p><strong>Rarity:</strong> {card.rarity}</p>
              </div>
            </div>

            {/* Current Inventory */}
            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-panel)' }}>
              <h3 className="text-xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>
                Current Inventory
              </h3>
              {card.inventory && card.inventory.length > 0 ? (
                <div className="space-y-2">
                  {card.inventory.map((inv, idx) => (
                    <div
                      key={idx}
                      className="p-3 rounded"
                      style={{ backgroundColor: 'var(--color-background)' }}
                    >
                      <div className="flex justify-between mb-1" style={{ color: 'var(--color-text)' }}>
                        <span className="font-semibold">
                          {inv.condition} - {inv.finish}
                        </span>
                        <span>{inv.quantityForSale} / {inv.quantityOwned}</span>
                      </div>
                      {inv.sellerName && (
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          Seller: {inv.sellerName}
                        </div>
                      )}
                    </div>
                  ))}
                </div>
              ) : (
                <p style={{ color: 'var(--color-text-secondary)' }}>No inventory yet</p>
              )}
            </div>
          </div>

          {/* Add Inventory Form */}
          <div>
            <div className="rounded-lg p-6" style={{ backgroundColor: 'var(--color-panel)' }}>
              <h2 className="text-2xl font-bold mb-6" style={{ color: 'var(--color-text)' }}>
                Add Inventory
              </h2>

              {error && (
                <div className="alert-error mb-4">
                  {error}
                </div>
              )}

              {success && (
                <div className="alert-success mb-4">
                  {success}
                </div>
              )}

              <form onSubmit={handleAddInventory} className="space-y-4">
                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    Condition
                  </label>
                  <select
                    value={inventoryData.condition}
                    onChange={(e) => setInventoryData({ ...inventoryData, condition: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <option value="NM">Near Mint (NM)</option>
                    <option value="LP">Lightly Played (LP)</option>
                    <option value="P">Played (P)</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    Finish
                  </label>
                  <select
                    value={inventoryData.finish}
                    onChange={(e) => setInventoryData({ ...inventoryData, finish: e.target.value as any })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)',
                    }}
                  >
                    <option value="nonfoil">Non-foil</option>
                    <option value="foil">Foil</option>
                  </select>
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    Total Quantity
                  </label>
                  <input
                    type="number"
                    min="0"
                    value={inventoryData.quantity}
                    onChange={(e) => setInventoryData({ ...inventoryData, quantity: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)',
                    }}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                    Quantity for Sale
                  </label>
                  <input
                    type="number"
                    min="0"
                    max={inventoryData.quantity}
                    value={inventoryData.quantityForSale}
                    onChange={(e) => setInventoryData({ ...inventoryData, quantityForSale: parseInt(e.target.value) || 0 })}
                    className="w-full px-4 py-2 rounded-lg border"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      borderColor: 'var(--color-border)',
                    }}
                    required
                  />
                </div>

                <button
                  type="submit"
                  disabled={loading}
                  className="w-full px-6 py-3 rounded-lg font-semibold"
                  style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                >
                  {loading ? 'Adding...' : 'Add Inventory'}
                </button>
              </form>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default SellerInventoryFormPage;
