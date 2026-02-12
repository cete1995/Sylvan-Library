import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { cardApi } from '../api/cards';
import { priceApi } from '../api/price';
import { CardFormData, InventoryItem } from '../types';
import CardPriceChart from '../components/CardPriceChart';
import ManaSymbols from '../components/ManaSymbols';
import { useAuth } from '../contexts/AuthContext';
import { isUBSet } from '../utils/ubPricing';
import { ubPricingApi } from '../api/ubPricing';

const AdminCardFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const { token } = useAuth();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [allPrices, setAllPrices] = useState<any>(null);
  const [calculatingPrice, setCalculatingPrice] = useState<number | null>(null);
  const [syncingAllPrices, setSyncingAllPrices] = useState(false);
  const [formData, setFormData] = useState<CardFormData>({
    name: '',
    setCode: '',
    setName: '',
    collectorNumber: '',
    language: 'EN',
    colorIdentity: [],
    rarity: 'common',
    imageUrl: '',
    scryfallId: '',
    uuid: '',
    typeLine: '',
    oracleText: '',
    manaCost: '',
    notes: '',
    inventory: [],
  });

  useEffect(() => {
    if (isEdit && id) {
      loadCard(id);
    }
  }, [id, isEdit]);

  const loadCard = async (cardId: string) => {
    try {
      const data = await cardApi.getCardById(cardId);
      const card = data.card;
      setFormData({
        name: card.name,
        setCode: card.setCode,
        setName: card.setName,
        collectorNumber: card.collectorNumber,
        language: card.language,
        colorIdentity: card.colorIdentity,
        rarity: card.rarity as 'common' | 'uncommon' | 'rare' | 'mythic' | 'special' | 'bonus',
        imageUrl: card.imageUrl || '',
        scryfallId: card.scryfallId || '',
        uuid: card.uuid || '',
        typeLine: card.typeLine || '',
        oracleText: card.oracleText || '',
        manaCost: card.manaCost || '',
        notes: card.notes || '',
        inventory: card.inventory || [],
      });

      // Fetch latest price if UUID exists
      if (card.uuid && token) {
        console.log('Fetching price for UUID:', card.uuid);
        try {
          const priceData = await priceApi.getLatestPrice(token, card.uuid);
          console.log('Price data received:', priceData);
          if (priceData.success && priceData.price?.prices) {
            setAllPrices(priceData.price.prices);
          } else {
            console.log('No price data found');
          }
        } catch (err) {
          console.error('Price fetch error:', err);
        }
      } else {
        console.log('No UUID or token:', { uuid: card.uuid, hasToken: !!token });
      }
    } catch (error) {
      setError('Failed to load card');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    try {
      const submitData = {
        ...formData,
        imageUrl: formData.imageUrl || undefined,
        scryfallId: formData.scryfallId || undefined,
        typeLine: formData.typeLine || undefined,
        oracleText: formData.oracleText || undefined,
        manaCost: formData.manaCost || undefined,
        notes: formData.notes || undefined,
      };

      if (isEdit && id) {
        await adminApi.updateCard(id, submitData);
      } else {
        await adminApi.createCard(submitData);
      }

      navigate('/admin/cards');
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to save card');
    } finally {
      setLoading(false);
    }
  };

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>
  ) => {
    const { name, value } = e.target;
    setFormData((prev) => ({
      ...prev,
      [name]: value,
    }));
  };

  const handleColorToggle = (color: string) => {
    setFormData((prev) => ({
      ...prev,
      colorIdentity: prev.colorIdentity.includes(color)
        ? prev.colorIdentity.filter((c) => c !== color)
        : [...prev.colorIdentity, color],
    }));
  };

  const addInventoryItem = () => {
    setFormData((prev) => ({
      ...prev,
      inventory: [
        ...prev.inventory,
        {
          condition: 'NM' as const,
          finish: 'nonfoil' as const,
          quantityOwned: 0,
          quantityForSale: 0,
          buyPrice: 0,
          sellPrice: 0,
        },
      ],
    }));
  };

  const removeInventoryItem = (index: number) => {
    setFormData((prev) => ({
      ...prev,
      inventory: prev.inventory.filter((_, i) => i !== index),
    }));
  };

  const updateInventoryItem = (index: number, field: keyof InventoryItem, value: any) => {
    setFormData((prev) => ({
      ...prev,
      inventory: prev.inventory.map((item, i) =>
        i === index ? { ...item, [field]: value } : item
      ),
    }));
  };

  const calculateUBPrice = async (index: number) => {
    if (!token || !id || !isUBSet(formData.setCode)) return;

    try {
      setCalculatingPrice(index);
      const item = formData.inventory[index];
      const result = await ubPricingApi.calculateUBPrice(token, id, item.finish);
      
      if (result.success && result.ubPrice) {
        updateInventoryItem(index, 'sellPrice', result.ubPrice);
      }
    } catch (err: any) {
      console.error('Failed to calculate UB price:', err);
      setError(err.response?.data?.error || 'Failed to calculate UB price');
    } finally {
      setCalculatingPrice(null);
    }
  };

  const syncAllUBPrices = async () => {
    if (!token || !id || !isUBSet(formData.setCode)) return;

    try {
      setSyncingAllPrices(true);
      setError('');
      
      // Calculate for each inventory item
      for (let i = 0; i < formData.inventory.length; i++) {
        const item = formData.inventory[i];
        try {
          const result = await ubPricingApi.calculateUBPrice(token, id, item.finish);
          if (result.success && result.ubPrice) {
            updateInventoryItem(i, 'sellPrice', result.ubPrice);
          }
        } catch (err) {
          console.error(`Failed to calculate price for item ${i}:`, err);
        }
      }
    } catch (err: any) {
      setError(err.response?.data?.error || 'Failed to sync all prices');
    } finally {
      setSyncingAllPrices(false);
    }
  };

  return (
    <div className="container mx-auto px-4 py-8" style={{ maxWidth: '1400px' }}>
      <Link to="/admin/cards" className="hover:underline mb-4 inline-block" style={{ color: 'var(--color-accent)' }}>
        ← Back to Card List
      </Link>

      <div className="flex items-center gap-4 mb-8">
        <h1 className="text-4xl font-bold" style={{ color: 'var(--color-text)' }}>
          {isEdit ? 'Edit Card' : 'Add New Card'}
        </h1>
        {isUBSet(formData.setCode) && (
          <span className="px-4 py-2 rounded-lg font-bold text-sm" style={{ background: 'linear-gradient(to right, #8B5CF6, #EC4899)', color: 'white' }}>
            🌌 UB SET - Special Pricing
          </span>
        )}
      </div>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <div className="grid lg:grid-cols-[320px_1fr] gap-6">
        {/* Left Column - Sticky Card Image (Edit Mode Only) */}
        {isEdit && formData.imageUrl && (
          <div className="lg:sticky lg:top-4 self-start">
            <div className="rounded-lg shadow p-4" style={{ backgroundColor: 'var(--color-panel)' }}>
              <h2 className="text-xl font-bold mb-3" style={{ color: 'var(--color-text)' }}>Card Image</h2>
              <img 
                src={formData.imageUrl} 
                alt={formData.name}
                className="w-full rounded-lg shadow-lg border-2"
                style={{ borderColor: 'var(--color-accent)' }}
              />
            </div>
          </div>
        )}

        {/* Right Column - Form */}
        <div>
          <form onSubmit={handleSubmit} className="space-y-6">

          {/* Card Information */}
        <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <h2 className="text-2xl font-bold mb-4" style={{ color: 'var(--color-text)' }}>Card Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Card Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                disabled={isEdit}
                className="input"
                style={isEdit ? { backgroundColor: 'var(--color-background)', color: 'var(--color-text)', cursor: 'not-allowed', opacity: 0.8 } : {}}
              />
            </div>

            <div>
              <label className="label">Set Code *</label>
              <input
                type="text"
                name="setCode"
                value={formData.setCode}
                onChange={handleChange}
                required
                disabled={isEdit}
                className="input"
                style={isEdit ? { backgroundColor: 'var(--color-background)', color: 'var(--color-text)', cursor: 'not-allowed', opacity: 0.8 } : {}}
              />
            </div>

            <div>
              <label className="label">Set Name *</label>
              <input
                type="text"
                name="setName"
                value={formData.setName}
                onChange={handleChange}
                required
                disabled={isEdit}
                className="input"
                style={isEdit ? { backgroundColor: 'var(--color-background)', color: 'var(--color-text)', cursor: 'not-allowed', opacity: 0.8 } : {}}
              />
            </div>

            <div>
              <label className="label">Collector Number *</label>
              <input
                type="text"
                name="collectorNumber"
                value={formData.collectorNumber}
                onChange={handleChange}
                required
                disabled={isEdit}
                className="input"
                style={isEdit ? { backgroundColor: 'var(--color-background)', color: 'var(--color-text)', cursor: 'not-allowed', opacity: 0.8 } : {}}
              />
            </div>

            <div>
              <label className="label">Language</label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                disabled={isEdit}
                className="input"
                style={isEdit ? { backgroundColor: 'var(--color-background)', color: 'var(--color-text)', cursor: 'not-allowed', opacity: 0.8 } : {}}
              />
            </div>

            <div>
              <label className="label">Rarity *</label>
              <select 
                name="rarity" 
                value={formData.rarity} 
                onChange={handleChange} 
                disabled={isEdit}
                className="input"
                style={isEdit ? { backgroundColor: 'var(--color-background)', color: 'var(--color-text)', cursor: 'not-allowed', opacity: 0.8 } : {}}
              >
                <option value="common">Common</option>
                <option value="uncommon">Uncommon</option>
                <option value="rare">Rare</option>
                <option value="mythic">Mythic</option>
                <option value="special">Special</option>
                <option value="bonus">Bonus</option>
              </select>
            </div>

            <div>
              <label className="label">Mana Cost</label>
              <input
                type="text"
                name="manaCost"
                value={formData.manaCost}
                onChange={handleChange}
                disabled={isEdit}
                className="input"
                style={isEdit ? { backgroundColor: 'var(--color-background)', color: 'var(--color-text)', cursor: 'not-allowed', opacity: 0.8 } : {}}
                placeholder="{2}{G}{G}"
              />
              {formData.manaCost && (
                <div className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Preview: <ManaSymbols cost={formData.manaCost} />
                </div>
              )}
            </div>

            <div className="md:col-span-2">
              <label className="label">Color Identity</label>
              <div className="flex gap-4">
                {[
                  { color: 'W', name: 'White', bg: '#F0E68C' },
                  { color: 'U', name: 'Blue', bg: '#0E68AB' },
                  { color: 'B', name: 'Black', bg: '#150B00' },
                  { color: 'R', name: 'Red', bg: '#D3202A' },
                  { color: 'G', name: 'Green', bg: '#00733E' },
                ].map(({ color, name, bg }) => (
                  <button
                    key={color}
                    type="button"
                    onClick={() => handleColorToggle(color)}
                    disabled={isEdit}
                    className={`px-4 py-2 rounded-lg border-2 ${
                      formData.colorIdentity.includes(color) ? 'border-primary-600' : 'border-gray-300'
                    } disabled:opacity-60 disabled:cursor-not-allowed`}
                    style={{
                      backgroundColor: formData.colorIdentity.includes(color) ? bg : 'white',
                      color: formData.colorIdentity.includes(color) ? 'white' : 'black',
                    }}
                  >
                    {name}
                  </button>
                ))}
              </div>
            </div>

            <div className="md:col-span-2">
              <label className="label">Type Line</label>
              <input
                type="text"
                name="typeLine"
                value={formData.typeLine}
                onChange={handleChange}
                disabled={isEdit}
                className="input"
                style={isEdit ? { backgroundColor: 'var(--color-background)', color: 'var(--color-text)', cursor: 'not-allowed', opacity: 0.8 } : {}}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Oracle Text</label>
              <textarea
                name="oracleText"
                value={formData.oracleText}
                onChange={handleChange}
                rows={3}
                disabled={isEdit}
                className="input"
                style={isEdit ? { backgroundColor: 'var(--color-background)', color: 'var(--color-text)', cursor: 'not-allowed', opacity: 0.8 } : {}}
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Image URL</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                disabled={isEdit}
                className="input"
                style={isEdit ? { backgroundColor: 'var(--color-background)', color: 'var(--color-text)', cursor: 'not-allowed', opacity: 0.8 } : {}}
              />
            </div>

            <div>
              <label className="label">Scryfall ID</label>
              <input
                type="text"
                name="scryfallId"
                value={formData.scryfallId}
                onChange={handleChange}
                disabled={isEdit}
                className="input"
                style={isEdit ? { backgroundColor: 'var(--color-background)', color: 'var(--color-text)', cursor: 'not-allowed', opacity: 0.8 } : {}}
              />
            </div>

            <div>
              <label className="label">UUID (MTGJson)</label>
              <input
                type="text"
                name="uuid"
                value={formData.uuid}
                onChange={handleChange}
                disabled={isEdit}
                className="input"
                style={isEdit ? { backgroundColor: 'var(--color-background)', color: 'var(--color-text)', cursor: 'not-allowed', opacity: 0.8 } : {}}
                placeholder="Auto-filled from set JSON"
              />
            </div>

            {isEdit && allPrices && (
              <div className="md:col-span-2">
                <label className="label">Latest Prices (Retail)</label>
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 p-4 rounded-lg border" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                  {/* CardKingdom Prices */}
                  {allPrices.cardkingdom?.retail && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-text)' }}>CardKingdom</h4>
                      <div className="space-y-1 text-sm">
                        {allPrices.cardkingdom.retail.normal && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-secondary)' }}>Normal:</span>
                            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>${allPrices.cardkingdom.retail.normal.toFixed(2)}</span>
                          </div>
                        )}
                        {allPrices.cardkingdom.retail.foil && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-secondary)' }}>Foil:</span>
                            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>${allPrices.cardkingdom.retail.foil.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                  
                  {/* TCGPlayer Prices */}
                  {allPrices.tcgplayer?.retail && (
                    <div>
                      <h4 className="font-semibold text-sm mb-2" style={{ color: 'var(--color-text)' }}>TCGPlayer</h4>
                      <div className="space-y-1 text-sm">
                        {allPrices.tcgplayer.retail.normal && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-secondary)' }}>Normal:</span>
                            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>${allPrices.tcgplayer.retail.normal.toFixed(2)}</span>
                          </div>
                        )}
                        {allPrices.tcgplayer.retail.foil && (
                          <div className="flex justify-between">
                            <span style={{ color: 'var(--color-text-secondary)' }}>Foil:</span>
                            <span className="font-semibold" style={{ color: 'var(--color-text)' }}>${allPrices.tcgplayer.retail.foil.toFixed(2)}</span>
                          </div>
                        )}
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {isEdit && !allPrices && formData.uuid && (
              <div className="md:col-span-2">
                <label className="label">Latest Prices</label>
                <input
                  type="text"
                  value="No price data available"
                  disabled
                  className="input disabled:bg-gray-100 disabled:cursor-not-allowed"
                  style={{ color: 'var(--color-text-secondary)' }}
                />
              </div>
            )}

            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="input"
                placeholder="Add your notes here..."
              />
            </div>
          </div>
        </div>

        {/* Price Chart */}
        {isEdit && formData.uuid && (
          <CardPriceChart uuid={formData.uuid} />
        )}

        {/* Inventory Management */}
        <div className="rounded-lg shadow p-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>Inventory</h2>
              {isUBSet(formData.setCode) && isEdit && (
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  UB Set: CK price &lt;$5 = ×20,000 | CK price ≥$5 = ×15,000
                </p>
              )}
            </div>
            <div className="flex gap-2">
              {isUBSet(formData.setCode) && isEdit && formData.inventory.length > 0 && (
                <button 
                  type="button" 
                  onClick={syncAllUBPrices}
                  disabled={syncingAllPrices}
                  className="px-4 py-2 rounded-lg font-semibold text-sm transition-all"
                  style={{ 
                    background: syncingAllPrices ? 'var(--color-text-secondary)' : 'linear-gradient(to right, #8B5CF6, #EC4899)',
                    color: 'white',
                    opacity: syncingAllPrices ? 0.6 : 1
                  }}
                >
                  {syncingAllPrices ? '⏳ Syncing...' : '🔄 Sync All UB Prices'}
                </button>
              )}
              <button type="button" onClick={addInventoryItem} className="btn-primary">
                + Add Inventory Item
              </button>
            </div>
          </div>

          {formData.inventory.length === 0 ? (
            <p className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>No inventory items. Click "Add Inventory Item" to add stock.</p>
          ) : (
            <div className="space-y-4">
              {formData.inventory.map((item, index) => (
                <div key={index} className="border rounded-lg p-4" style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}>
                  <div className="grid md:grid-cols-6 gap-4">
                    <div>
                      <label className="label text-sm">Condition</label>
                      <select
                        value={item.condition}
                        onChange={(e) => updateInventoryItem(index, 'condition', e.target.value)}
                        className="input text-sm"
                      >
                        <option value="NM">NM</option>
                        <option value="LP">LP</option>
                        <option value="P">P</option>
                      </select>
                    </div>

                    <div>
                      <label className="label text-sm">Finish</label>
                      <select
                        value={item.finish}
                        onChange={(e) => updateInventoryItem(index, 'finish', e.target.value)}
                        className="input text-sm"
                      >
                        <option value="nonfoil">Nonfoil</option>
                        <option value="foil">Foil</option>
                        <option value="etched">Etched</option>
                      </select>
                    </div>

                    <div>
                      <label className="label text-sm">Owned</label>
                      <input
                        type="number"
                        value={item.quantityOwned}
                        onChange={(e) => updateInventoryItem(index, 'quantityOwned', Number(e.target.value))}
                        min="0"
                        className="input text-sm"
                      />
                    </div>

                    <div>
                      <label className="label text-sm">For Sale</label>
                      <input
                        type="number"
                        value={item.quantityForSale}
                        onChange={(e) => updateInventoryItem(index, 'quantityForSale', Number(e.target.value))}
                        min="0"
                        className="input text-sm"
                      />
                    </div>

                    <div>
                      <label className="label text-sm">Buy Price</label>
                      <input
                        type="number"
                        value={item.buyPrice}
                        onChange={(e) => updateInventoryItem(index, 'buyPrice', Number(e.target.value))}
                        min="0"
                        className="input text-sm"
                      />
                    </div>

                    <div>
                      <label className="label text-sm">Sell Price</label>
                      <div className="flex gap-1">
                        <input
                          type="number"
                          value={item.sellPrice}
                          onChange={(e) => updateInventoryItem(index, 'sellPrice', Number(e.target.value))}
                          min="0"
                          className="input text-sm flex-1"
                        />
                        {isUBSet(formData.setCode) && isEdit && (
                          <button
                            type="button"
                            onClick={() => calculateUBPrice(index)}
                            disabled={calculatingPrice === index}
                            className="px-2 py-1 rounded text-xs font-medium whitespace-nowrap"
                            style={{
                              background: calculatingPrice === index ? 'var(--color-text-secondary)' : 'linear-gradient(to right, #8B5CF6, #EC4899)',
                              color: 'white',
                              opacity: calculatingPrice === index ? 0.6 : 1
                            }}
                            title="Auto-calculate from CK price"
                          >
                            {calculatingPrice === index ? '...' : 'Auto'}
                          </button>
                        )}
                      </div>
                    </div>
                  </div>
                  
                  {/* TikTok Shop / Tokopedia Sync Fields */}
                  <div className="grid md:grid-cols-3 gap-4 mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <div>
                      <label className="label text-sm">
                        <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                        </svg>
                        TikTok Product ID
                      </label>
                      <input
                        type="text"
                        value={item.tiktokProductId || ''}
                        onChange={(e) => updateInventoryItem(index, 'tiktokProductId', e.target.value)}
                        placeholder="e.g., 1729409636071801988"
                        className="input text-sm font-mono"
                        style={{ fontSize: '0.75rem' }}
                      />
                    </div>

                    <div>
                      <label className="label text-sm">
                        <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 7h.01M7 3h5c.512 0 1.024.195 1.414.586l7 7a2 2 0 010 2.828l-7 7a2 2 0 01-2.828 0l-7-7A1.994 1.994 0 013 12V7a4 4 0 014-4z" />
                        </svg>
                        TikTok SKU ID
                      </label>
                      <input
                        type="text"
                        value={item.tiktokSkuId || ''}
                        onChange={(e) => updateInventoryItem(index, 'tiktokSkuId', e.target.value)}
                        placeholder="SKU ID from TikTok"
                        className="input text-sm font-mono"
                        style={{ fontSize: '0.75rem' }}
                      />
                    </div>

                    <div>
                      <label className="label text-sm">
                        <svg className="w-3 h-3 inline mr-1" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
                        </svg>
                        Seller SKU
                      </label>
                      <input
                        type="text"
                        value={item.sellerSku || ''}
                        onChange={(e) => updateInventoryItem(index, 'sellerSku', e.target.value)}
                        placeholder="Your custom SKU"
                        className="input text-sm font-mono"
                        style={{ fontSize: '0.75rem' }}
                      />
                    </div>
                  </div>
                  
                  <div className="flex items-center justify-between mt-2">
                    <button
                      type="button"
                      onClick={() => removeInventoryItem(index)}
                      className="text-red-600 hover:text-red-800 text-sm"
                    >
                      Remove
                    </button>
                    {isUBSet(formData.setCode) && item.sellPrice > 0 && (
                      <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        ≈ ${(item.sellPrice / (item.sellPrice < 100000 ? 20000 : 15000)).toFixed(2)} CK
                      </span>
                    )}
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Submit Buttons */}
        <div className="flex gap-4">
          <button type="submit" disabled={loading} className="btn-primary flex-1 disabled:opacity-50">
            {loading ? 'Saving...' : isEdit ? 'Update Card' : 'Create Card'}
          </button>
          <Link to="/admin/cards" className="btn-secondary flex-1 text-center">
            Cancel
          </Link>
        </div>
      </form>
        </div>
      </div>
    </div>
  );
};

export default AdminCardFormPage;
