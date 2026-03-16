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
  const [fixingDfcImages, setFixingDfcImages] = useState(false);
  const [fixingDfcLayouts, setFixingDfcLayouts] = useState(false);
  const [forceSyncing, setForceSyncing] = useState(false);
  const [clearingUsers, setClearingUsers] = useState(false);
  const [clearingCards, setClearingCards] = useState(false);
  const [clearingOrders, setClearingOrders] = useState(false);
  const [sets, setSets] = useState<Array<{setCode: string; setName: string; cardCount: number}>>([]); 
  const [setsLoading, setSetsLoading] = useState(false);
  const [showSets, setShowSets] = useState(false);

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
    } catch {
      // stats show empty/zero state
    } finally {
      setLoading(false);
    }
  };

  const loadSets = async () => {
    setSetsLoading(true);
    try {
      const data = await adminApi.getSets();
      setSets(data.sets);
    } catch {
      // sets show empty state
    } finally {
      setSetsLoading(false);
    }
  };

  const handleForceSyncAllPrices = async () => {
    if (!confirm(
      'Force Resync will recalculate prices for EVERY card with CK data — including zero-stock cards. ' +
      'This is useful after importing a new set. Continue?'
    )) return;

    setForceSyncing(true);
    try {
      const result = await pricingApi.forceResyncAllPrices();
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
    if (!confirm('This will sync all card prices (both UB and Regular sets) based on latest CardKingdom prices. This may take several minutes. Continue?')) {
      return;
    }

    setSyncing(true);
    try {
      const result = await pricingApi.syncAllPrices();
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

  const handleClearUsers = async () => {
    const input = window.prompt('This deletes ALL customer accounts and carts.\nAdmin and seller accounts are kept. API keys are preserved.\n\nType DELETE USERS to confirm:');
    if (input !== 'DELETE USERS') { if (input !== null) alert('Cancelled — confirmation did not match.'); return; }
    setClearingUsers(true);
    try {
      const result = await adminApi.clearUsers();
      alert(`Users cleared!\n\n${result.deletedCounts.users} customer account(s) deleted\n${result.deletedCounts.carts} cart(s) deleted\n\n✅ Admin/seller accounts and API keys preserved.`);
      loadStats();
    } catch (error: any) {
      alert('Failed to clear users: ' + (error.response?.data?.error || error.message));
    } finally {
      setClearingUsers(false);
    }
  };

  const handleClearCards = async () => {
    const input = window.prompt('This deletes ALL cards, prices, carousel images, and featured content.\n\nType DELETE CARDS to confirm:');
    if (input !== 'DELETE CARDS') { if (input !== null) alert('Cancelled — confirmation did not match.'); return; }
    setClearingCards(true);
    try {
      const result = await adminApi.clearCards();
      alert(`Cards cleared!\n\n${result.deletedCounts.cards} card(s) deleted\n${result.deletedCounts.prices} price record(s) deleted\n${result.deletedCounts.carousel} carousel image(s) deleted\n${result.deletedCounts.featuredProducts} featured product(s) deleted\n${result.deletedCounts.featuredBanners} featured banner(s) deleted`);
      loadStats();
    } catch (error: any) {
      alert('Failed to clear cards: ' + (error.response?.data?.error || error.message));
    } finally {
      setClearingCards(false);
    }
  };

  const handleClearOrders = async () => {
    const input = window.prompt('This deletes ALL orders, carts, and TikTok orders.\n\nType DELETE ORDERS to confirm:');
    if (input !== 'DELETE ORDERS') { if (input !== null) alert('Cancelled — confirmation did not match.'); return; }
    setClearingOrders(true);
    try {
      const result = await adminApi.clearOrders();
      alert(`Orders cleared!\n\n${result.deletedCounts.orders} order(s) deleted\n${result.deletedCounts.carts} cart(s) deleted\n${result.deletedCounts.tikTokOrders} TikTok order(s) deleted`);
      loadStats();
    } catch (error: any) {
      alert('Failed to clear orders: ' + (error.response?.data?.error || error.message));
    } finally {
      setClearingOrders(false);
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

  const handleFixDfcImages = async () => {
    if (!confirm('This will update all DFC cards stored with a back-face Scryfall URL to use the front-face URL instead. Continue?')) {
      return;
    }

    setFixingDfcImages(true);
    try {
      const result = await adminApi.fixDfcImageUrls();
      alert(`DFC image URLs fixed!\n\n${result.modifiedCount} card(s) updated to front-face URL.`);
    } catch (error: any) {
      alert('Failed to fix DFC image URLs: ' + (error.response?.data?.error || error.message));
    } finally {
      setFixingDfcImages(false);
    }
  };

  const handleFixDfcLayouts = async () => {
    if (!confirm('This scans the database for double-faced cards (transform / MDFC) by detecting their back-face image URLs, then marks both faces with layout=transform so the flip button shows correctly.\n\nRun now?')) return;
    setFixingDfcLayouts(true);
    try {
      const result = await adminApi.fixDfcLayouts();
      alert(`DFC layout fix complete!\n\n${result.dfcPairs} DFC pair(s) found\n${result.updatedCount} card(s) updated to layout=transform`);
    } catch (error: any) {
      alert('Failed to fix DFC layouts: ' + (error.response?.data?.error || error.message));
    } finally {
      setFixingDfcLayouts(false);
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
      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {/* ── Header ── */}
        <div className="mb-8">
          <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>Admin Dashboard</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>Boardgame Time — Store Management</p>
        </div>

        {/* ── Stats ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Unique Cards', value: stats?.totalCards || 0, sub: 'In catalog', color: '#3B82F6', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /> },
            { label: 'Total Stock', value: stats?.totalQuantity || 0, sub: 'Cards in stock', color: '#8B5CF6', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4" /> },
            { label: 'Buy Value', value: `Rp ${formatPrice(stats?.totalInventoryValue || 0)}`, sub: 'Cost basis', color: '#10B981', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
            { label: 'Sell Value', value: `Rp ${formatPrice(stats?.totalListingValue || 0)}`, sub: 'Listing total', color: '#F97316', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" /> },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5 shadow-sm border" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.color + '1A' }}>
                  <svg className="w-5 h-5" style={{ color: s.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">{s.icon}</svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</span>
              </div>
              <div className="text-2xl font-bold truncate" style={{ color: 'var(--color-text)' }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Sales Analytics ── */}
        <div className="grid grid-cols-2 lg:grid-cols-4 gap-4 mb-10">
          {[
            { label: 'Total Orders', value: stats?.totalOrders || 0, sub: 'All time', color: '#6366F1', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /> },
            { label: 'Revenue', value: `Rp ${formatPrice(stats?.totalRevenue || 0)}`, sub: 'Paid orders', color: '#10B981', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" /> },
            { label: 'Pending Orders', value: stats?.pendingOrders || 0, sub: 'Needs processing', color: '#F59E0B', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" /> },
            { label: 'Unpaid Orders', value: stats?.unpaidOrders || 0, sub: 'Awaiting payment', color: '#EF4444', icon: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /> },
          ].map(s => (
            <div key={s.label} className="rounded-2xl p-5 shadow-sm border" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-3 mb-3">
                <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: s.color + '1A' }}>
                  <svg className="w-5 h-5" style={{ color: s.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24">{s.icon}</svg>
                </div>
                <span className="text-xs font-semibold uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>{s.label}</span>
              </div>
              <div className="text-2xl font-bold truncate" style={{ color: 'var(--color-text)' }}>{s.value}</div>
              <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{s.sub}</div>
            </div>
          ))}
        </div>

        {/* ── Low Stock Alert ── */}
        {stats?.lowStockCards && stats.lowStockCards.length > 0 && (
          <div className="mb-8 rounded-2xl border overflow-hidden" style={{ borderColor: '#F59E0B44', backgroundColor: 'var(--color-panel)' }}>
            <div className="flex items-center gap-2 px-5 py-3 border-b" style={{ borderColor: '#F59E0B44', backgroundColor: 'rgba(245,158,11,0.08)' }}>
              <svg className="w-4 h-4" style={{ color: '#F59E0B' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" /></svg>
              <span className="font-bold text-sm uppercase tracking-widest" style={{ color: '#F59E0B' }}>Low Stock Alert</span>
              <span className="ml-auto px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#F59E0B' }}>{stats.lowStockCards.length}</span>
            </div>
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {stats.lowStockCards.map(c => (
                <Link key={c._id} to={`/admin/cards?q=${encodeURIComponent(c.name)}`}
                  className="flex items-center gap-3 px-5 py-3 hover:opacity-80 transition-all">
                  <i className={`ss ss-${c.setCode.toLowerCase()} ss-2x`} style={{ color: 'var(--color-text-secondary)' }}></i>
                  <span className="flex-1 text-sm font-medium truncate" style={{ color: 'var(--color-text)' }}>{c.name}</span>
                  <span className="text-xs font-bold px-2 py-0.5 rounded-full" style={{ backgroundColor: c.minQty === 1 ? '#FEE2E2' : '#FEF3C7', color: c.minQty === 1 ? '#DC2626' : '#D97706' }}>
                    {c.minQty} left
                  </span>
                  <svg className="w-3.5 h-3.5 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" /></svg>
                </Link>
              ))}
            </div>
          </div>
        )}

        {/* ── Section helper ── */}
        {/* Each section: label bar + tile grid */}

        {/* ── 📦 Catalog & Inventory ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="w-2 h-5 rounded-full" style={{ backgroundColor: '#3B82F6' }}></div>
            <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>Catalog &amp; Inventory</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-5 gap-3">
            {[
              { to: '/admin/cards/new', label: 'Add New Card', desc: 'Create single entry', bg: '#DBEAFE', ic: '#2563EB', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" /> },
              { to: '/admin/cards', label: 'Browse Cards', desc: 'Edit & manage cards', bg: '#EDE9FE', ic: '#7C3AED', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 6h16M4 10h16M4 14h16M4 18h16" /> },
              { to: '/admin/bulk-upload', label: 'Upload CSV', desc: 'Bulk card import', bg: '#D1FAE5', ic: '#059669', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12" /> },
              { to: '/admin/set-upload', label: 'Import Set JSON', desc: 'Full set from MTGJson', bg: '#FEF3C7', ic: '#D97706', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" /> },
              { to: '/admin/missing-images', label: 'Missing Images', desc: 'Cards without art', bg: '#FEE2E2', ic: '#DC2626', svg: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /></> },
            ].map(t => (
              <Link key={t.to} to={t.to} className="flex flex-col gap-2 p-4 rounded-xl border hover:shadow-md transition-all hover:border-blue-300"
                style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.bg }}>
                  <svg className="w-5 h-5" style={{ color: t.ic }} fill="none" stroke="currentColor" viewBox="0 0 24 24">{t.svg}</svg>
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight" style={{ color: 'var(--color-text)' }}>{t.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{t.desc}</div>
                </div>
              </Link>
            ))}
          </div>

          {/* Sets Library (collapsible) */}
          <div className="mt-4 rounded-xl border overflow-hidden" style={{ borderColor: 'var(--color-border)' }}>
            <button
              onClick={() => setShowSets(s => !s)}
              className="w-full flex items-center justify-between px-4 py-3 text-sm font-semibold hover:opacity-90 transition-all"
              style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}
            >
              <span className="flex items-center gap-2">
                <svg className="w-4 h-4" style={{ color: '#6366F1' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" />
                </svg>
                Set Library
                <span className="px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#6366F1' }}>{sets.length}</span>
              </span>
              <svg className={`w-4 h-4 transition-transform ${showSets ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
              </svg>
            </button>
            {showSets && (
              <div className="border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                {setsLoading ? (
                  <div className="py-6 flex justify-center"><div className="animate-spin rounded-full h-6 w-6 border-b-2 border-indigo-500"></div></div>
                ) : sets.length === 0 ? (
                  <div className="py-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>No sets imported yet.</div>
                ) : (
                  <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-2 p-3 max-h-72 overflow-y-auto">
                    {sets.map(set => (
                      <Link key={set.setCode} to={`/admin/cards?set=${set.setCode}`}
                        className="flex items-center gap-2 p-2.5 rounded-lg border hover:opacity-80 transition-all"
                        style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-panel)' }}>
                        <i className={`ss ss-${set.setCode.toLowerCase()} ss-2x`} style={{ color: 'var(--color-text)' }}></i>
                        <div className="flex-1 min-w-0">
                          <div className="font-medium text-xs truncate" style={{ color: 'var(--color-text)' }}>{set.setName}</div>
                          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{set.setCode.toUpperCase()} · {set.cardCount} cards</div>
                        </div>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>

        {/* ── 💰 Pricing ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="w-2 h-5 rounded-full" style={{ backgroundColor: '#10B981' }}></div>
            <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>Pricing</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3 mb-3">
            {[
              { to: '/admin/prices', label: 'Price Data', desc: 'Import & track CK prices', bg: '#D1FAE5', ic: '#059669', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 19v-6a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2a2 2 0 002-2zm0 0V9a2 2 0 012-2h2a2 2 0 012 2v10m-6 0a2 2 0 002 2h2a2 2 0 002-2m0 0V5a2 2 0 012-2h2a2 2 0 012 2v14a2 2 0 01-2 2h-2a2 2 0 01-2-2z" /> },
              { to: '/admin/ub-pricing', label: 'UB Set Pricing', desc: 'Universes Beyond cards', bg: '#EDE9FE', ic: '#7C3AED', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /> },
              { to: '/admin/ub-settings', label: 'UB Settings', desc: 'UB pricing multipliers', bg: '#FEF3C7', ic: '#D97706', svg: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></> },
              { to: '/admin/regular-settings', label: 'Regular Settings', desc: 'Standard set multipliers', bg: '#DBEAFE', ic: '#2563EB', svg: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" /></> },
            ].map(t => (
              <Link key={t.to} to={t.to} className="flex flex-col gap-2 p-4 rounded-xl border hover:shadow-md transition-all hover:border-green-300"
                style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.bg }}>
                  <svg className="w-5 h-5" style={{ color: t.ic }} fill="none" stroke="currentColor" viewBox="0 0 24 24">{t.svg}</svg>
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight" style={{ color: 'var(--color-text)' }}>{t.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{t.desc}</div>
                </div>
              </Link>
            ))}
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            <button onClick={handleSyncAllPrices} disabled={syncing}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
              style={{ background: 'linear-gradient(135deg,#F59E0B,#EF4444)', color: 'white' }}>
              {syncing ? <><span className="animate-spin mr-1">⏳</span>Syncing...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 4v5h.582m15.356 2A8.001 8.001 0 004.582 9m0 0H9m11 11v-5h-.581m0 0a8.003 8.003 0 01-15.357-2m15.357 2H15" /></svg>Sync All Prices</>}
            </button>
            <button onClick={handleForceSyncAllPrices} disabled={forceSyncing}
              className="flex items-center justify-center gap-2 py-3 px-5 rounded-xl font-bold text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow-sm"
              style={{ background: 'linear-gradient(135deg,#0f766e,#0891b2)', color: 'white' }}>
              {forceSyncing ? <><span className="animate-spin mr-1">⏳</span>Force Resyncing...</> : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" /></svg>Force Resync All Prices</>}
            </button>
          </div>
          <p className="mt-2 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            <strong>Force Resync</strong> recalculates prices for every card regardless of stock — use after importing a new set.
          </p>
        </div>

        {/* ── � Boardgame Café ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="w-2 h-5 rounded-full" style={{ backgroundColor: '#E31E24' }}></div>
            <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>Boardgame Café</h2>
          </div>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-3">
            {/* Game Library */}
            <Link to="/admin/boardgames"
              className="flex flex-col gap-3 p-5 rounded-xl border hover:shadow-md transition-all hover:border-red-400"
              style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)', background: 'linear-gradient(135deg, rgba(227,30,36,0.07) 0%, rgba(185,28,28,0.03) 100%)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: 'rgba(227,30,36,0.12)' }}>🎲</div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Game Library</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Add & edit boardgames · detail pages, gallery, how-to-play</div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: '#E31E24' }}>
                Manage games
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>
            {/* Console Rental */}
            <Link to="/admin/cafe"
              className="flex flex-col gap-3 p-5 rounded-xl border hover:shadow-md transition-all hover:border-indigo-400"
              style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)', background: 'linear-gradient(135deg, rgba(99,102,241,0.07) 0%, rgba(76,29,149,0.03) 100%)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: 'rgba(99,102,241,0.12)' }}>🎮</div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Console Rental</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>PS5 & Switch hourly rates, happy hour start time & pricing</div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: '#6366f1' }}>
                Edit settings
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>
            {/* Café Settings */}
            <Link to="/admin/cafe"
              className="flex flex-col gap-3 p-5 rounded-xl border hover:shadow-md transition-all hover:border-green-400"
              style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)', background: 'linear-gradient(135deg, rgba(22,163,74,0.07) 0%, rgba(20,83,45,0.03) 100%)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: 'rgba(22,163,74,0.12)' }}>☕</div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Café Settings</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Hours, entry fee, Mahjong tables, contact links & tagline</div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: '#16a34a' }}>
                Open editor
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M9 5l7 7-7 7" /></svg>
              </span>
            </Link>
            {/* Preview */}
            <Link to="/cafe" target="_blank"
              className="flex flex-col gap-3 p-5 rounded-xl border hover:shadow-md transition-all hover:border-amber-400"
              style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
              <div className="w-12 h-12 rounded-2xl flex items-center justify-center text-2xl" style={{ backgroundColor: 'rgba(251,191,36,0.15)' }}>🌐</div>
              <div>
                <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Preview Café Page</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>See the live /cafe page exactly as customers see it</div>
              </div>
              <span className="inline-flex items-center gap-1 text-xs font-semibold mt-auto" style={{ color: '#D97706' }}>
                Open in new tab
                <svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H6a2 2 0 00-2 2v10a2 2 0 002 2h10a2 2 0 002-2v-4M14 4h6m0 0v6m0-6L10 14" /></svg>
              </span>
            </Link>
          </div>
        </div>

        {/* ── �🌐 Storefront ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="w-2 h-5 rounded-full" style={{ backgroundColor: '#8B5CF6' }}></div>
            <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>Storefront</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
            {[
              { to: '/admin/carousel', label: 'Carousel', desc: 'Homepage slideshow', bg: '#EDE9FE', ic: '#7C3AED', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" /> },
              { to: '/admin/featured', label: 'Featured Section', desc: 'Highlight products', bg: '#FEF3C7', ic: '#D97706', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.915c.969 0 1.371 1.24.588 1.81l-3.976 2.888a1 1 0 00-.363 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.976-2.888a1 1 0 00-1.176 0l-3.976 2.888c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.363-1.118l-3.976-2.888c-.784-.57-.38-1.81.588-1.81h4.914a1 1 0 00.951-.69l1.519-4.674z" /> },
              { to: '/admin/offline-sales', label: 'Sell Offline', desc: 'Walk-in sales to customers', bg: '#D1FAE5', ic: '#059669', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M3 3h2l.4 2M7 13h10l4-8H5.4M7 13L5.4 5M7 13l-2.293 2.293c-.63.63-.184 1.707.707 1.707H17m0 0a2 2 0 100 4 2 2 0 000-4zm-8 2a2 2 0 11-4 0 2 2 0 014 0z" /> },
              { to: '/admin/offline-buys', label: 'Buy From Member', desc: 'Buy cards from walk-in members', bg: '#DBEAFE', ic: '#2563EB', svg: <><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" /></> },
              { to: '/admin/orders', label: 'Online Orders', desc: 'View & manage web orders', bg: '#D1FAE5', ic: '#059669', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-3 7h3m-3 4h3m-6-4h.01M9 16h.01" /> },
            ].map(t => (
              <Link key={t.to} to={t.to} className="flex flex-col gap-2 p-4 rounded-xl border hover:shadow-md transition-all hover:border-purple-300"
                style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.bg }}>
                  <svg className="w-5 h-5" style={{ color: t.ic }} fill="none" stroke="currentColor" viewBox="0 0 24 24">{t.svg}</svg>
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight" style={{ color: 'var(--color-text)' }}>{t.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{t.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── 🛍️ TikTok Shop ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="w-2 h-5 rounded-full" style={{ backgroundColor: '#EC4899' }}></div>
            <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>TikTok Shop</h2>
          </div>
          <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
            {[
              { to: '/admin/tiktok-debug', label: 'TikTok API', desc: 'Bulk update & debug', bg: '#FCE7F3', ic: '#DB2777', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 20l4-16m4 4l4 4-4 4M6 16l-4-4 4-4" /> },
              { to: '/admin/tiktok-get-orders', label: 'Sync Orders', desc: 'Pull orders to DB', bg: '#DBEAFE', ic: '#2563EB', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" /> },
              { to: '/admin/tiktok-saved-orders', label: 'Saved Orders', desc: 'View order history', bg: '#EDE9FE', ic: '#7C3AED', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" /> },
              { to: '/admin/tiktok-orders', label: 'Order Detail', desc: 'Lookup by order ID', bg: '#D1FAE5', ic: '#059669', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" /> },
            ].map(t => (
              <Link key={t.to} to={t.to} className="flex flex-col gap-2 p-4 rounded-xl border hover:shadow-md transition-all hover:border-pink-300"
                style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.bg }}>
                  <svg className="w-5 h-5" style={{ color: t.ic }} fill="none" stroke="currentColor" viewBox="0 0 24 24">{t.svg}</svg>
                </div>
                <div>
                  <div className="font-semibold text-sm leading-tight" style={{ color: 'var(--color-text)' }}>{t.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{t.desc}</div>
                </div>
              </Link>
            ))}
          </div>
        </div>

        {/* ── 👥 Community ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="w-2 h-5 rounded-full" style={{ backgroundColor: '#0EA5E9' }}></div>
            <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>Community</h2>
          </div>
          <div className="grid grid-cols-2 gap-3">
            {[
              { to: '/admin/sellers', label: 'Seller Management', desc: 'Manage seller accounts & inventory', bg: '#D1FAE5', ic: '#059669', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /> },
              { to: '/admin/membership', label: 'Membership', desc: 'Members, WPN email & store credits', bg: '#EDE9FE', ic: '#7C3AED', svg: <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 6H5a2 2 0 00-2 2v9a2 2 0 002 2h14a2 2 0 002-2V8a2 2 0 00-2-2h-5m-4 0V5a2 2 0 114 0v1m-4 0a2 2 0 104 0m-5 8a2 2 0 100-4 2 2 0 000 4zm0 0c1.306 0 2.417.835 2.83 2M9 14a3.001 3.001 0 00-2.83 2M15 11h3m-3 4h2" /> },
            ].map(t => (
              <Link key={t.to} to={t.to} className="flex items-center gap-4 p-4 rounded-xl border hover:shadow-md transition-all hover:border-sky-300"
                style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
                <div className="w-12 h-12 rounded-xl flex items-center justify-center flex-shrink-0" style={{ backgroundColor: t.bg }}>
                  <svg className="w-6 h-6" style={{ color: t.ic }} fill="none" stroke="currentColor" viewBox="0 0 24 24">{t.svg}</svg>
                </div>
                <div>
                  <div className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{t.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{t.desc}</div>
                </div>
                <svg className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                </svg>
              </Link>
            ))}
          </div>
        </div>

        {/* ── 🛠️ Maintenance ── */}
        <div className="mb-8">
          <div className="flex items-center gap-2 mb-4 pb-2 border-b" style={{ borderColor: 'var(--color-border)' }}>
            <div className="w-2 h-5 rounded-full" style={{ backgroundColor: '#F59E0B' }}></div>
            <h2 className="font-bold text-sm uppercase tracking-widest" style={{ color: 'var(--color-text-secondary)' }}>Maintenance</h2>
          </div>
          <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>Data repair tools — run these to fix inconsistencies after bulk operations or imports.</p>
          <div className="grid sm:grid-cols-2 lg:grid-cols-3 gap-3">
            {[
              { label: 'Fix Seller Names', desc: 'Resync names from accounts', loading: fixingSellers, onClick: handleFixSellerNames, color: '#F59E0B' },
              { label: 'Regenerate SKUs', desc: 'Rebuild seller inventory SKUs', loading: regeneratingSKUs, onClick: handleRegenerateSKUs, color: '#10B981' },
              { label: 'Fix Inventory Qty', desc: 'Repair NaN stock values', loading: fixingInventory, onClick: handleFixInventoryQuantities, color: '#8B5CF6' },
              { label: 'Fix DFC Image URLs', desc: 'Replace /back/ → /front/ URLs', loading: fixingDfcImages, onClick: handleFixDfcImages, color: '#3B82F6' },
              { label: 'Fix DFC Layouts', desc: 'Mark transform/MDFC cards so flip button shows', loading: fixingDfcLayouts, onClick: handleFixDfcLayouts, color: '#EC4899' },
            ].map(m => (
              <button key={m.label} onClick={m.onClick} disabled={m.loading}
                className="flex items-center gap-3 p-4 rounded-xl border text-left hover:shadow-md transition-all disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
                <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: m.color + '22' }}>
                  {m.loading
                    ? <svg className="animate-spin w-4 h-4" style={{ color: m.color }} fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>
                    : <svg className="w-4 h-4" style={{ color: m.color }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" /></svg>
                  }
                </div>
                <div>
                  <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>{m.loading ? 'Running…' : m.label}</div>
                  <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>{m.desc}</div>
                </div>
              </button>
            ))}
            <Link to="/admin/debug" className="flex items-center gap-3 p-4 rounded-xl border hover:shadow-md transition-all"
              style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
              <div className="w-9 h-9 rounded-lg flex items-center justify-center flex-shrink-0" style={{ backgroundColor: '#FEE2E2' }}>
                <svg className="w-4 h-4" style={{ color: '#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8v4m0 4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                </svg>
              </div>
              <div>
                <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>Card Debugger</div>
                <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>Inspect inventory data</div>
              </div>
              <svg className="w-4 h-4 ml-auto flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
              </svg>
            </Link>
          </div>
        </div>

        {/* ── ⚠️ Danger Zone ── */}
        <div className="rounded-2xl border-2 p-6" style={{ borderColor: '#FCA5A5', backgroundColor: 'var(--color-panel)' }}>
          <div className="flex items-center gap-2 mb-1">
            <svg className="w-5 h-5" style={{ color: '#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
            </svg>
            <h2 className="font-bold text-base" style={{ color: '#DC2626' }}>Danger Zone</h2>
          </div>
          <p className="text-xs mb-5" style={{ color: 'var(--color-text-secondary)' }}>Permanently deletes data. Each action requires typed confirmation. API keys are always preserved.</p>

          {/* Targeted clear buttons */}
          <div className="grid sm:grid-cols-3 gap-3 mb-5">
            {/* Clear Users */}
            <div className="rounded-xl border p-4" style={{ borderColor: '#FCA5A5', backgroundColor: 'rgba(220,38,38,0.04)' }}>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4" style={{ color: '#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 20h5v-2a3 3 0 00-5.356-1.857M17 20H7m10 0v-2c0-.656-.126-1.283-.356-1.857M7 20H2v-2a3 3 0 015.356-1.857M7 20v-2c0-.656.126-1.283.356-1.857m0 0a5.002 5.002 0 019.288 0M15 7a3 3 0 11-6 0 3 3 0 016 0z" /></svg>
                <span className="font-bold text-sm" style={{ color: '#DC2626' }}>Clear Users</span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>Deletes all customer accounts and carts. Admin &amp; seller accounts and API keys are kept.</p>
              <button onClick={handleClearUsers} disabled={clearingUsers}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs text-white hover:opacity-90 disabled:opacity-50 transition-all"
                style={{ backgroundColor: '#DC2626' }}>
                {clearingUsers ? <><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Clearing…</> : 'Delete All Users'}
              </button>
            </div>

            {/* Clear Cards */}
            <div className="rounded-xl border p-4" style={{ borderColor: '#FCA5A5', backgroundColor: 'rgba(220,38,38,0.04)' }}>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4" style={{ color: '#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 11H5m14 0a2 2 0 012 2v6a2 2 0 01-2 2H5a2 2 0 01-2-2v-6a2 2 0 012-2m14 0V9a2 2 0 00-2-2M5 11V9a2 2 0 012-2m0 0V5a2 2 0 012-2h6a2 2 0 012 2v2M7 7h10" /></svg>
                <span className="font-bold text-sm" style={{ color: '#DC2626' }}>Clear Cards</span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>Deletes all cards, prices, carousel images, and featured content. Pricing settings kept.</p>
              <button onClick={handleClearCards} disabled={clearingCards}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs text-white hover:opacity-90 disabled:opacity-50 transition-all"
                style={{ backgroundColor: '#DC2626' }}>
                {clearingCards ? <><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Clearing…</> : 'Delete All Cards'}
              </button>
            </div>

            {/* Clear Orders */}
            <div className="rounded-xl border p-4" style={{ borderColor: '#FCA5A5', backgroundColor: 'rgba(220,38,38,0.04)' }}>
              <div className="flex items-center gap-2 mb-1">
                <svg className="w-4 h-4" style={{ color: '#DC2626' }} fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" /></svg>
                <span className="font-bold text-sm" style={{ color: '#DC2626' }}>Clear Orders</span>
              </div>
              <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>Deletes all orders, carts, and TikTok orders. Cards and users are kept.</p>
              <button onClick={handleClearOrders} disabled={clearingOrders}
                className="w-full flex items-center justify-center gap-1.5 px-3 py-2 rounded-lg font-bold text-xs text-white hover:opacity-90 disabled:opacity-50 transition-all"
                style={{ backgroundColor: '#DC2626' }}>
                {clearingOrders ? <><svg className="animate-spin w-3 h-3" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Clearing…</> : 'Delete All Orders'}
              </button>
            </div>
          </div>

          {/* Nuclear option */}
          <div className="border-t pt-4" style={{ borderColor: '#FCA5A5' }}>
            <p className="text-xs font-semibold mb-2" style={{ color: '#DC2626' }}>☢️ Nuclear option — deletes everything above at once</p>
            <button onClick={handleClearDatabase} disabled={clearing}
              className="flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white hover:opacity-90 disabled:opacity-50 transition-all shadow"
              style={{ backgroundColor: '#7F1D1D' }}>
              {clearing
                ? <><svg className="animate-spin w-4 h-4" fill="none" viewBox="0 0 24 24"><circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"/><path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4z"/></svg>Clearing Everything…</>
                : <><svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" /></svg>Clear Entire Database</>
              }
            </button>
          </div>
        </div>

      </div>
    </div>
  );
};

export default AdminDashboardPage;
