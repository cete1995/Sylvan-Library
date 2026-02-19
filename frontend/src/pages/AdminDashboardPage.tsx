import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { pricingApi } from '../api/pricing';
import { Stats } from '../types';

const AdminDashboardPage: React.FC = () => {
  const [stats, setStats] = useState<Stats | null>(null);
  const [loading, setLoading] = useState(true);
  const [clearing, setClearing] = useState(false);
  const [syncing, setSyncing] = useState(false);
  const [fixingSellers, setFixingSellers] = useState(false);
  const [regeneratingSKUs, setRegeneratingSKUs] = useState(false);
  const [fixingInventory, setFixingInventory] = useState(false);
  const [forceSyncing, setForceSyncing] = useState(false);
  const [sets, setSets] = useState<Array<{setCode: string; setName: string; cardCount: number}>>([]); 
  const [setsLoading, setSetsLoading] = useState(false);

  // Format price with thousands separator
  const formatPrice = (price: string | number): string => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return numPrice.toLocaleString('id-ID');
  };

  useEffect(() => {
    loadStats();
    loadSets();
  }, []);

  const loadStats = async () => {
    try {
      const data = await adminApi.getStats();
      setStats(data);
    } catch (error) {
      console.error('Failed to load stats:', error);
    } finally {
      setLoading(false);
    }
  };

  const loadSets = async () => {
    setSetsLoading(true);
    try {
      const data = await adminApi.getSets();
      setSets(data.sets);
    } catch (error) {
      console.error('Failed to load sets:', error);
    } finally {
      setSetsLoading(false);
    }
  };

  const handleForceSyncAllPrices = async () => {
    const token = localStorage.getItem('token');
    if (!token) return;
    if (!confirm(
      'Force Resync will recalculate prices for EVERY card with CK data — including zero-stock cards. ' +
      'This is useful after importing a new set. Continue?'
    )) return;

    setForceSyncing(true);
    try {
      const result = await pricingApi.forceResyncAllPrices(token);
      alert(
        `Force resync completed!\n\n` +
        `Updated: ${result.updated} cards\n` +
        `Skipped (no inventory): ${result.skipped} cards\n` +
        `No CK data: ${result.noPrice} cards\n` +
        `Total processed: ${result.total} cards` +
        (result.errors?.length ? `\n\nFirst errors:\n${result.errors.slice(0, 5).join('\n')}` : '')
      );
      loadStats();
    } catch (error: any) {
      alert('Force resync failed: ' + (error.response?.data?.error || error.message));
    } finally {
      setForceSyncing(false);
    }
  };

  const handleSyncAllPrices = async () => {
    const token = localStorage.getItem('token');
    if (!token) {
      alert('Please log in to sync prices');
      return;
    }

    if (!confirm('This will sync all card prices (both UB and Regular sets) based on latest CardKingdom prices. This may take several minutes. Continue?')) {
      return;
    }

    setSyncing(true);
    try {
      const result = await pricingApi.syncAllPrices(token);
      alert(
        `Price sync completed!\n\n` +
        `Updated: ${result.updated} cards\n` +
        `Skipped: ${result.skipped} cards\n` +
        (result.noInventory ? `No Inventory: ${result.noInventory} cards (catalog-only, add inventory to enable pricing)\n` : '') +
        `Total: ${result.total} cards\n\n` +
        (result.errors && result.errors.length > 0 ? `First errors: ${result.errors.slice(0, 5).join(', ')}` : '')
      );
      loadStats(); // Reload stats
    } catch (error: any) {
      alert('Failed to sync prices: ' + (error.response?.data?.error || error.message));
    } finally {
      setSyncing(false);
    }
  };

  const handleClearDatabase = async () => {
    const confirmation = window.confirm(
      'Are you sure you want to clear ALL data from the database? This action cannot be undone!\n\nThis will delete:\n- All cards\n- All users (except admins and sellers)\n- All carts\n- All orders\n- All carousel images\n- All featured products & banners\n\n⚠️ PRESERVED (will NOT be deleted):\n- UB pricing settings\n- Regular pricing settings\n- Price history data (CardKingdom prices)\n\nType "DELETE ALL" in the next prompt to confirm.'
    );
    
    if (!confirmation) return;

    const finalConfirm = window.prompt('Type "DELETE ALL" to confirm:');
    if (finalConfirm !== 'DELETE ALL') {
      alert('Confirmation failed. Database was not cleared.');
      return;
    }

    setClearing(true);
    try {
      const result = await adminApi.clearDatabase();
      alert(
        `Database cleared successfully!\n\nDeleted:\n- ${result.deletedCounts.cards} cards\n- ${result.deletedCounts.users} users\n- ${result.deletedCounts.carts} carts\n- ${result.deletedCounts.orders} orders\n- ${result.deletedCounts.carousel} carousel images\n- ${result.deletedCounts.featuredProducts} featured products\n- ${result.deletedCounts.featuredBanners} featured banners\n\n✅ Preserved: UB/Regular pricing settings and price data`
      );
      loadStats(); // Reload stats
    } catch (error: any) {
      alert('Failed to clear database: ' + (error.response?.data?.error || error.message));
    } finally {
      setClearing(false);
    }
  };

  const handleFixSellerNames = async () => {
    if (!confirm('This will update all inventory items with correct seller names from their seller accounts. Continue?')) {
      return;
    }

    setFixingSellers(true);
    try {
      const result = await adminApi.fixSellerNames();
      alert(
        `Seller names fixed successfully!\n\n` +
        `Updated ${result.updatedCards} cards\n` +
        `Updated ${result.updatedItems} inventory items\n\n` +
        `Sellers:\n${result.sellers.map((s: any) => `- ${s.name} (${s.email})`).join('\n')}`
      );
      loadStats(); // Reload stats
    } catch (error: any) {
      alert('Failed to fix seller names: ' + (error.response?.data?.error || error.message));
    } finally {
      setFixingSellers(false);
    }
  };

  const handleRegenerateSKUs = async () => {
    if (!confirm('This will regenerate seller SKUs for all card inventory items.\n\nFormat: SetCode-CollectorNumber-FoilType-LanguageCode-Rarity\nExample: OTJ-0142-N-EN-Uncommon\n\nContinue?')) {
      return;
    }

    setRegeneratingSKUs(true);
    try {
      const result = await adminApi.regenerateSellerSKUs();
      alert(
        `Seller SKUs regenerated successfully!\n\n` +
        `Updated ${result.updatedCards} cards\n` +
        `Updated ${result.updatedItems} inventory items\n\n` +
        `Format: SetCode-CollectorNumber-FoilType-LanguageCode-Rarity\n` +
        `Example: OTJ-0142-N-EN-Uncommon`
      );
      loadStats(); // Reload stats
    } catch (error: any) {
      alert('Failed to regenerate seller SKUs: ' + (error.response?.data?.error || error.message));
    } finally {
      setRegeneratingSKUs(false);
    }
  };

  const handleFixInventoryQuantities = async () => {
    if (!confirm('This will fix all inventory items with invalid or NaN quantityForSale values.\n\nFor sellers: quantityForSale will be set to quantityOwned\nFor others: quantityForSale will be set to 0\n\nContinue?')) {
      return;
    }

    setFixingInventory(true);
    try {
      const result = await adminApi.fixInventoryQuantities();
      if (result.errors && result.errors.length > 0) {
        alert(
          `Fixed inventory quantities with some errors!\n\n` +
          `Updated ${result.updatedCards} cards\n` +
          `Updated ${result.updatedItems} inventory items\n` +
          `Errors: ${result.errors.length}\n\n` +
          `First error: ${result.errors[0]?.error}`
        );
      } else {
        alert(
          `Inventory quantities scanned successfully!\n\n` +
          `Total inventory items scanned: ${result.totalInventoryItems || 0}\n` +
          `Updated ${result.updatedCards} cards\n` +
          `Fixed ${result.updatedItems} inventory items\n\n` +
          (result.updatedItems === 0 ? 'All inventory quantities are valid! ✓' : '')
        );
      }
      loadStats(); // Reload stats
    } catch (error: any) {
      alert('Failed to fix inventory quantities: ' + (error.response?.data?.error || error.message));
    } finally {
      setFixingInventory(false);
    }
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <div className="inline-block animate-spin rounded-full h-12 w-12 border-b-2 border-primary-600 mb-4"></div>
          <div className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>Loading dashboard...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">
        {/* Header */}
        <div className="mb-8">
          <h1 className="text-4xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Admin Dashboard</h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>Welcome back! Manage your MTG card inventory from here.</p>
        </div>

        {/* Stats Cards */}
        <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-6 mb-8">
          {/* Total Cards */}
          <div className="bg-gradient-to-br from-blue-500 to-blue-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="bg-white bg-opacity-20 p-3 rounded-lg">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium opacity-90 mb-1">Unique Cards</div>
            <div className="text-4xl font-bold">{stats?.totalCards || 0}</div>
            <div className="text-xs opacity-75 mt-2">In catalog</div>
          </div>

          {/* Total Quantity */}
          <div className="bg-gradient-to-br from-purple-500 to-purple-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium opacity-90 mb-1">Total Quantity</div>
            <div className="text-4xl font-bold">{stats?.totalQuantity || 0}</div>
            <div className="text-xs opacity-75 mt-2">Cards in stock</div>
          </div>

          {/* Inventory Value */}
          <div className="bg-gradient-to-br from-green-500 to-green-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                <svg className="w-8 h-8 md:w-10 md:h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium opacity-90 mb-1">Inventory Value</div>
            <div className="text-3xl font-bold">Rp {formatPrice(stats?.totalInventoryValue || 0)}</div>
            <div className="text-xs opacity-75 mt-2">Buy price total</div>
          </div>

          {/* Listing Value */}
          <div className="bg-gradient-to-br from-orange-500 to-orange-600 rounded-xl shadow-lg p-6 text-white transform hover:scale-105 transition-transform">
            <div className="flex items-center justify-between mb-4">
              <div className="p-3 rounded-lg" style={{ backgroundColor: 'rgba(255, 255, 255, 0.1)' }}>
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
            </div>
            <div className="text-sm font-medium opacity-90 mb-1">Listing Value</div>
            <div className="text-3xl font-bold">Rp {formatPrice(stats?.totalListingValue || 0)}</div>
            <div className="text-xs opacity-75 mt-2">Sell price total</div>
          </div>
        </div>

        {/* Main Actions Grid */}
        <div className="grid lg:grid-cols-3 gap-6 mb-8">
          {/* Card Management */}
          <div className="rounded-xl shadow-md p-6 border-t-4 border-blue-500" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="flex items-center mb-4">
              <div className="bg-blue-100 p-3 rounded-lg mr-3">
                <svg className="w-6 h-6 text-blue-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Card Management</h3>
            </div>
            <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Add and manage individual cards in your inventory</p>
            <div className="space-y-3">
              <Link
                to="/admin/cards/new"
                className="block w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}
              >
                + Add New Card
              </Link>
              <Link
                to="/admin/cards"
                className="block w-full border-2 px-4 py-3 rounded-lg font-medium text-center hover:opacity-80"
                style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
              >
                Browse All Cards
              </Link>
            </div>
          </div>

          {/* Bulk Operations */}
          <div className="rounded-xl shadow-md p-6 border-t-4 border-green-500" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-lg mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" />
                </svg>
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Bulk Import</h3>
            </div>
            <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Import multiple cards at once using CSV or JSON</p>
            <div className="space-y-3">
              <Link
                to="/admin/bulk-upload"
                className="block w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
                style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-panel)' }}
              >
                Upload CSV File
              </Link>
              <Link
                to="/admin/set-upload"
                className="block w-full border-2 px-4 py-3 rounded-lg font-medium text-center hover:opacity-80"
                style={{ borderColor: 'var(--color-highlight)', color: 'var(--color-highlight)' }}
              >
                Import Set JSON
              </Link>
            </div>
          </div>

          {/* Website Content */}
          <div className="rounded-xl shadow-md p-6 border-t-4 border-purple-500" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="flex items-center mb-4">
              <div className="bg-purple-100 p-3 rounded-lg mr-3">
                <svg className="w-6 h-6 text-purple-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Website Content</h3>
            </div>
            <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Manage homepage carousel and featured items</p>
            <div className="space-y-3">
              <Link
                to="/admin/carousel"
                className="block w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
                style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}
              >
                Manage Carousel
              </Link>
              <Link
                to="/admin/featured"
                className="block w-full border-2 px-4 py-3 rounded-lg font-medium text-center hover:opacity-80"
                style={{ borderColor: 'var(--color-accent)', color: 'var(--color-accent)' }}
              >
                Featured Section
              </Link>
            </div>
          </div>

          {/* Set Management */}
          <div className="rounded-xl shadow-md p-6 border-t-4 border-indigo-500" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="flex items-center mb-4">
              <div className="bg-indigo-100 p-3 rounded-lg mr-3">
                <svg className="w-6 h-6 text-indigo-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Set Management</h3>
            </div>
            <p className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>View all sets uploaded via JSON import</p>
            
            {setsLoading ? (
              <div className="flex justify-center py-8">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-indigo-600"></div>
              </div>
            ) : sets.length === 0 ? (
              <div className="text-center py-8" style={{ color: 'var(--color-text-secondary)' }}>
                <p className="text-sm">No sets uploaded yet</p>
                <Link
                  to="/admin/set-upload"
                  className="inline-block mt-3 px-4 py-2 rounded-lg text-sm font-medium hover:opacity-90"
                  style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-panel)' }}
                >
                  Upload First Set
                </Link>
              </div>
            ) : (
              <div className="space-y-2 max-h-96 overflow-y-auto" style={{ 
                scrollbarWidth: 'thin',
                scrollbarColor: 'var(--color-accent) var(--color-panel)'
              }}>
                {sets.map((set) => (
                  <Link
                    key={set.setCode}
                    to={`/admin/cards?set=${set.setCode}`}
                    className="flex items-center p-3 rounded-lg hover:opacity-80 transition-all border"
                    style={{ 
                      backgroundColor: 'var(--color-background)',
                      borderColor: 'var(--color-border)'
                    }}
                  >
                    <i 
                      className={`ss ss-${set.setCode.toLowerCase()} ss-2x mr-3`}
                      style={{ color: 'var(--color-text)' }}
                    ></i>
                    <div className="flex-1 min-w-0">
                      <div className="font-medium truncate" style={{ color: 'var(--color-text)' }}>
                        {set.setName}
                      </div>
                      <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                        {set.setCode.toUpperCase()} • {set.cardCount} cards
                      </div>
                    </div>
                    <svg className="w-5 h-5 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </Link>
                ))}
              </div>
            )}
            <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
              <Link
                to="/admin/missing-images"
                className="flex items-center justify-center gap-2 w-full px-4 py-2 rounded-lg font-medium text-center hover:opacity-90"
                style={{ backgroundColor: '#ef4444', color: 'white' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                View Missing Images
              </Link>
            </div>
          </div>

          {/* Price Data Management */}
          <div className="rounded-xl shadow-md p-6 border-t-4 border-green-500" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="flex items-center mb-4">
              <div className="bg-green-100 p-3 rounded-lg mr-3">
                <svg className="w-6 h-6 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Price Data</h3>
            </div>
            <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Import and track market prices from MTGJson</p>
            <div className="space-y-3">
              <Link
                to="/admin/prices"
                className="block w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
                style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-panel)' }}
              >
                📊 Manage Price Data
              </Link>
              <Link
                to="/admin/ub-pricing"
                className="block w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
                style={{ background: 'linear-gradient(to right, #8B5CF6, #EC4899)', color: 'white' }}
              >
                🌌 UB Set Pricing
              </Link>
              <Link
                to="/admin/ub-settings"
                className="block w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
                style={{ background: 'linear-gradient(to right, #6366F1, #8B5CF6)', color: 'white' }}
              >
                ⚙️ UB Settings
              </Link>
              <Link
                to="/admin/regular-settings"
                className="block w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
                style={{ background: 'linear-gradient(to right, #3B82F6, #6366F1)', color: 'white' }}
              >
                ⚙️ Regular Sets Pricing
              </Link>
              <button
                onClick={handleSyncAllPrices}
                disabled={syncing}
                className="block w-full px-4 py-3 rounded-lg font-bold text-center hover:opacity-90 shadow-sm disabled:opacity-50 disabled:cursor-not-allowed"
                style={{ background: 'linear-gradient(to right, #F59E0B, #EF4444)', color: 'white' }}
              >
                {syncing ? '⏳ Syncing All Prices...' : '🔄 Sync All Prices Now'}
              </button>
              <Link
                to="/admin/sellers"
                className="block w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
                style={{ background: 'linear-gradient(to right, #10B981, #059669)', color: 'white' }}
              >
                👥 Seller Management
              </Link>
              <Link
                to="/admin/offline-sales"
                className="block w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
                style={{ background: 'linear-gradient(to right, #f59e0b, #d97706)', color: 'white' }}
              >
                🏬 Sold Offline
              </Link>
            </div>
          </div>

          {/* API Tools */}
          <div className="rounded-xl shadow-md p-6 border-t-4 border-pink-500" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="flex items-center mb-4">
              <div className="bg-pink-100 p-3 rounded-lg mr-3">
                <svg className="w-6 h-6 text-pink-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" />
                </svg>
              </div>
              <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>API Tools</h3>
            </div>
            <p className="mb-6 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Integrate and test marketplace APIs</p>
            <div className="space-y-3">
              <Link
                to="/admin/tiktok-debug"
                className="block w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
                style={{ background: 'linear-gradient(to right, #EC4899, #F43F5E)', color: 'white' }}
              >
                🛍️ TikTok Shop API
              </Link>
              <Link
                to="/admin/tiktok-get-orders"
                className="block w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
                style={{ background: 'linear-gradient(to right, #06b6d4, #3b82f6)', color: 'white' }}
              >
                📥 Sync Orders to DB
              </Link>
              <Link
                to="/admin/tiktok-saved-orders"
                className="block w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
                style={{ background: 'linear-gradient(to right, #8b5cf6, #6366f1)', color: 'white' }}
              >
                📦 View Saved Orders
              </Link>
              <Link
                to="/admin/tiktok-orders"
                className="block w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
                style={{ background: 'linear-gradient(to right, #10b981, #059669)', color: 'white' }}
              >
                🔍 Get Order Detail
              </Link>
            </div>
          </div>
        </div>

        {/* Info Banner */}
        <div className="border-l-4 border-blue-500 rounded-lg p-6 mb-6 shadow-sm" style={{ backgroundColor: 'var(--color-panel)' }}>
          <div className="flex items-start">
            <svg className="w-6 h-6 text-blue-600 mr-3 mt-0.5 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
            </svg>
            <div>
              <h3 className="font-bold text-lg mb-2" style={{ color: 'var(--color-text)' }}>Quick Guide</h3>
              <ul className="space-y-1.5 text-sm" style={{ color: 'var(--color-text)' }}>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Add New Card:</strong> Manually create a single card entry with full details</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Upload CSV:</strong> Import multiple cards with inventory from spreadsheet</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Import Set JSON:</strong> Add entire MTG sets from MTGJson (creates catalog without inventory)</span>
                </li>
                <li className="flex items-start">
                  <span className="text-blue-600 mr-2">•</span>
                  <span><strong>Browse Cards:</strong> Edit existing cards, update prices, manage inventory, and add notes</span>
                </li>
              </ul>
            </div>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl shadow-md p-6 border-l-4 border-yellow-500 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-yellow-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
            </svg>
            <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Maintenance</h3>
          </div>
          <p className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Fix data inconsistencies and update system information</p>
          <div className="flex gap-3 flex-wrap">
            <button
              onClick={handleFixSellerNames}
              disabled={fixingSellers}
              className="px-6 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              style={{ backgroundColor: '#F59E0B', color: 'white' }}
            >
              {fixingSellers ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fixing Seller Names...
                </span>
              ) : (
                '🔧 Fix Seller Names'
              )}
            </button>
            <button
              onClick={handleRegenerateSKUs}
              disabled={regeneratingSKUs}
              className="px-6 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              style={{ backgroundColor: '#10B981', color: 'white' }}
            >
              {regeneratingSKUs ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Regenerating SKUs...
                </span>
              ) : (
                '🏷️ Regenerate Seller SKUs'
              )}
            </button>
            <button
              onClick={handleFixInventoryQuantities}
              disabled={fixingInventory}
              className="px-6 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              style={{ backgroundColor: '#8B5CF6', color: 'white' }}
            >
              {fixingInventory ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Fixing Quantities...
                </span>
              ) : (
                '🔢 Fix Inventory Quantities'
              )}
            </button>
            <button
              onClick={handleForceSyncAllPrices}
              disabled={forceSyncing}
              className="px-6 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
              style={{ backgroundColor: '#0f766e', color: 'white' }}
            >
              {forceSyncing ? (
                <span className="flex items-center">
                  <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Force Resyncing All Prices...
                </span>
              ) : (
                '💹 Force Resync All Prices'
              )}
            </button>
          </div>
          <p className="mt-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            💡 <strong>Force Resync</strong> recalculates prices for every card regardless of stock level — use this after importing a new set to fix Rp 0 prices.
          </p>
          <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
            <Link
              to="/admin/debug"
              className="flex items-center justify-center gap-2 w-full px-4 py-3 rounded-lg font-medium text-center hover:opacity-90 shadow-sm"
              style={{ backgroundColor: '#DC2626', color: 'white' }}
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
              </svg>
              🐛 Card Inventory Debugger
            </Link>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="rounded-xl shadow-md p-6 border-l-4 border-red-500" style={{ backgroundColor: 'var(--color-panel)' }}>
          <div className="flex items-center mb-4">
            <svg className="w-6 h-6 text-red-600 mr-3" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h3 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>Danger Zone</h3>
          </div>
          <p className="mb-4 text-sm" style={{ color: 'var(--color-text-secondary)' }}>Irreversible actions that will permanently delete data</p>
          <button
            onClick={handleClearDatabase}
            disabled={clearing}
            className="px-6 py-3 rounded-lg font-medium hover:opacity-90 disabled:opacity-50 disabled:cursor-not-allowed shadow-sm"
            style={{ backgroundColor: '#DC2626', color: 'var(--color-panel)' }}
          >
            {clearing ? (
              <span className="flex items-center">
                <svg className="animate-spin -ml-1 mr-3 h-5 w-5 text-white" fill="none" viewBox="0 0 24 24">
                  <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                  <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                </svg>
                Clearing Database...
              </span>
            ) : (
              '🗑️ Clear All Database'
            )}
          </button>
          <p className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)' }}>This will delete all cards, users (except admins & sellers), orders, featured items, and all settings. This cannot be undone!</p>
        </div>
      </div>
    </div>
  );
};

export default AdminDashboardPage;
