import React, { useState, useEffect } from 'react';
import { useNavigate, useParams, Link } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { cardApi } from '../api/cards';
import { CardFormData, InventoryItem } from '../types';

const AdminCardFormPage: React.FC = () => {
  const { id } = useParams<{ id?: string }>();
  const navigate = useNavigate();
  const isEdit = !!id;

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
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
        typeLine: card.typeLine || '',
        oracleText: card.oracleText || '',
        manaCost: card.manaCost || '',
        notes: card.notes || '',
        inventory: card.inventory || [],
      });
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

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <Link to="/admin/cards" className="text-primary-600 hover:underline mb-4 inline-block">
        ← Back to Card List
      </Link>

      <h1 className="text-4xl font-bold mb-8">
        {isEdit ? 'Edit Card' : 'Add New Card'}
      </h1>

      {error && (
        <div className="mb-6 p-4 bg-red-100 border border-red-400 text-red-700 rounded">
          {error}
        </div>
      )}

      <form onSubmit={handleSubmit} className="space-y-6">
        {/* Card Information */}
        <div className="bg-white rounded-lg shadow p-6">
          <h2 className="text-2xl font-bold mb-4">Card Information</h2>
          <div className="grid md:grid-cols-2 gap-4">
            <div className="md:col-span-2">
              <label className="label">Card Name *</label>
              <input
                type="text"
                name="name"
                value={formData.name}
                onChange={handleChange}
                required
                className="input"
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
                className="input"
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
                className="input"
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
                className="input"
              />
            </div>

            <div>
              <label className="label">Language</label>
              <input
                type="text"
                name="language"
                value={formData.language}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">Rarity *</label>
              <select name="rarity" value={formData.rarity} onChange={handleChange} className="input">
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
                className="input"
              />
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
                    className={`px-4 py-2 rounded-lg border-2 ${
                      formData.colorIdentity.includes(color) ? 'border-primary-600' : 'border-gray-300'
                    }`}
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
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Oracle Text</label>
              <textarea
                name="oracleText"
                value={formData.oracleText}
                onChange={handleChange}
                rows={3}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Image URL</label>
              <input
                type="url"
                name="imageUrl"
                value={formData.imageUrl}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div>
              <label className="label">Scryfall ID</label>
              <input
                type="text"
                name="scryfallId"
                value={formData.scryfallId}
                onChange={handleChange}
                className="input"
              />
            </div>

            <div className="md:col-span-2">
              <label className="label">Notes</label>
              <textarea
                name="notes"
                value={formData.notes}
                onChange={handleChange}
                rows={2}
                className="input"
              />
            </div>
          </div>
        </div>

        {/* Inventory Management */}
        <div className="bg-white rounded-lg shadow p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-2xl font-bold">Inventory</h2>
            <button type="button" onClick={addInventoryItem} className="btn-primary">
              + Add Inventory Item
            </button>
          </div>

          {formData.inventory.length === 0 ? (
            <p className="text-gray-500 text-center py-8">No inventory items. Click "Add Inventory Item" to add stock.</p>
          ) : (
            <div className="space-y-4">
              {formData.inventory.map((item, index) => (
                <div key={index} className="border rounded-lg p-4 bg-gray-50">
                  <div className="grid md:grid-cols-6 gap-4">
                    <div>
                      <label className="label text-sm">Condition</label>
                      <select
                        value={item.condition}
                        onChange={(e) => updateInventoryItem(index, 'condition', e.target.value)}
                        className="input text-sm"
                      >
                        <option value="NM">NM</option>
                        <option value="SP">SP</option>
                        <option value="MP">MP</option>
                        <option value="HP">HP</option>
                        <option value="DMG">DMG</option>
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
                      <input
                        type="number"
                        value={item.sellPrice}
                        onChange={(e) => updateInventoryItem(index, 'sellPrice', Number(e.target.value))}
                        min="0"
                        className="input text-sm"
                      />
                    </div>
                  </div>
                  <button
                    type="button"
                    onClick={() => removeInventoryItem(index)}
                    className="mt-2 text-red-600 hover:text-red-800 text-sm"
                  >
                    Remove
                  </button>
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
  );
};

export default AdminCardFormPage;
