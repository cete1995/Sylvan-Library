import React, { useState, useEffect, useCallback } from 'react';
import { sellerApi, Seller } from '../api/seller';
import {
  offlineSaleApi,
  SearchedCard,
  OfflineSale,
  CreateOfflineSalePayload,
} from '../api/offlineSale';

// ─── Types ───────────────────────────────────────────────────────────────────

interface CartItem {
  cardId: string;
  cardName: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  imageUrl?: string;
  condition: string;
  finish: string;
  inventoryIndex: number;
  quantity: number;
  maxQty: number;
  pricePerUnit: number;
  sellerId: string;
  sellerName: string;
}

// ─── Helpers ─────────────────────────────────────────────────────────────────

const fmt = (n: number) =>
  'Rp ' + Math.round(n).toLocaleString('id-ID');

const PAYMENT_LABELS: Record<string, string> = {
  cash: '💵 Cash',
  transfer: '🏦 Transfer',
  other: 'Other',
};

// ─── Component ───────────────────────────────────────────────────────────────

const AdminOfflineSalePage: React.FC = () => {
  const [tab, setTab] = useState<'new' | 'history'>('new');

  // ── New Sale state ──────────────────────────────────────────────────────────
  const [sellers, setSellers] = useState<Seller[]>([]);

  const [customerName, setCustomerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'other'>('cash');
  const [notes, setNotes] = useState('');

  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<SearchedCard[]>([]);
  const [searching, setSearching] = useState(false);

  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successSale, setSuccessSale] = useState<OfflineSale | null>(null);

  // ── History state ───────────────────────────────────────────────────────────
  const [sales, setSales] = useState<OfflineSale[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historySellerFilter, setHistorySellerFilter] = useState('');
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');
  const [expandedSale, setExpandedSale] = useState<string | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);

  const LIMIT = 10;

  // ── Load sellers for history filter ────────────────────────────────────────
  useEffect(() => {
    sellerApi.getSellers().then((d) => setSellers(d.sellers)).catch(console.error);
  }, []);

  // ── Load history tab ────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await offlineSaleApi.listSales({
        sellerId: historySellerFilter || undefined,
        status: historyStatusFilter || undefined,
        page: historyPage,
        limit: LIMIT,
      });
      setSales(data.sales);
      setHistoryTotal(data.pagination.total);
    } catch (err: any) {
      console.error('Load history error:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [historySellerFilter, historyStatusFilter, historyPage]);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  // ── Card search ─────────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    try {
      const data = await offlineSaleApi.searchCards(searchQuery);
      setSearchResults(data.cards);
    } catch (err: any) {
      alert('Search failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSearching(false);
    }
  };

  // ── Add inventory slot to cart ──────────────────────────────────────────────
  const addToCart = (card: SearchedCard, invIdx: number) => {
    const inv = card.inventory.find((i) => i.inventoryIndex === invIdx);
    if (!inv) return;

    const key = `${card._id}-${invIdx}`;
    if (cart.find((c) => `${c.cardId}-${c.inventoryIndex}` === key)) {
      alert(`${card.name} (${inv.condition} ${inv.finish} – ${inv.sellerName}) is already in the sale list.`);
      return;
    }

    const newItem: CartItem = {
      cardId: card._id,
      cardName: card.name,
      setCode: card.setCode,
      setName: card.setName,
      collectorNumber: card.collectorNumber,
      imageUrl: card.imageUrl,
      condition: inv.condition,
      finish: inv.finish,
      inventoryIndex: invIdx,
      quantity: 1,
      maxQty: inv.quantityForSale,
      pricePerUnit: inv.sellPrice,
      sellerId: inv.sellerId,
      sellerName: inv.sellerName,
    };
    setCart((prev) => [...prev, newItem]);
  };

  const removeFromCart = (cardId: string, inventoryIndex: number) => {
    setCart((prev) =>
      prev.filter((c) => !(c.cardId === cardId && c.inventoryIndex === inventoryIndex))
    );
  };

  const updateCartQty = (cardId: string, inventoryIndex: number, qty: number) => {
    setCart((prev) =>
      prev.map((c) =>
        c.cardId === cardId && c.inventoryIndex === inventoryIndex
          ? { ...c, quantity: Math.max(1, Math.min(qty, c.maxQty)) }
          : c
      )
    );
  };

  const updateCartPrice = (cardId: string, inventoryIndex: number, price: number) => {
    setCart((prev) =>
      prev.map((c) =>
        c.cardId === cardId && c.inventoryIndex === inventoryIndex
          ? { ...c, pricePerUnit: Math.max(0, price) }
          : c
      )
    );
  };

  const cartTotal = cart.reduce((s, c) => s + c.quantity * c.pricePerUnit, 0);

  // Unique sellers in cart
  const cartSellers = [...new Set(cart.map((c) => c.sellerName))];

  // ── Complete sale ───────────────────────────────────────────────────────────
  const handleCompleteSale = async () => {
    if (cart.length === 0) { alert('No items in the sale.'); return; }

    const sellerLine = cartSellers.join(', ');
    if (!window.confirm(
      `Complete offline sale?\n\n${cart.length} item(s)\nSellers: ${sellerLine}\nTotal: ${fmt(cartTotal)}\nPayment: ${PAYMENT_LABELS[paymentMethod]}`
    )) return;

    setSubmitting(true);
    try {
      const payload: CreateOfflineSalePayload = {
        customerName: customerName || undefined,
        paymentMethod,
        notes: notes || undefined,
        items: cart.map((c) => ({
          cardId: c.cardId,
          inventoryIndex: c.inventoryIndex,
          quantity: c.quantity,
          pricePerUnit: c.pricePerUnit,
        })),
      };
      const result = await offlineSaleApi.createSale(payload);
      setSuccessSale(result.sale);
      // Reset form
      setCart([]);
      setSearchResults([]);
      setSearchQuery('');
      setCustomerName('');
      setNotes('');
      setPaymentMethod('cash');
    } catch (err: any) {
      alert('Failed to complete sale: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNew = () => setSuccessSale(null);

  // ── Void sale ───────────────────────────────────────────────────────────────
  const handleVoid = async (saleId: string, saleNumber: string) => {
    if (!window.confirm(`Void sale ${saleNumber}? Inventory will be restored.`)) return;
    setVoidingId(saleId);
    try {
      await offlineSaleApi.voidSale(saleId);
      loadHistory();
    } catch (err: any) {
      alert('Failed to void sale: ' + (err.response?.data?.error || err.message));
    } finally {
      setVoidingId(null);
    }
  };

  // ─ Render ─────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            🏬 Sold Offline
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Record walk-in sales for any seller's cards — single card or a full deck.
          </p>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
          {(['new', 'history'] as const).map((t) => (
            <button
              key={t}
              onClick={() => setTab(t)}
              className="px-5 py-2 font-semibold text-sm rounded-t-lg transition-colors"
              style={
                tab === t
                  ? { backgroundColor: 'var(--color-accent)', color: 'white' }
                  : { color: 'var(--color-text-secondary)' }
              }
            >
              {t === 'new' ? '➕ New Sale' : '📋 Sales History'}
            </button>
          ))}
        </div>

        {/* ── New Sale Tab ─────────────────────────────────────────────────── */}
        {tab === 'new' && (
          <>
            {/* Success banner */}
            {successSale && (
              <div
                className="rounded-xl p-6 mb-6 shadow"
                style={{ backgroundColor: '#dcfce7', border: '1.5px solid #86efac' }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">✅</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-1" style={{ color: '#166534' }}>
                      Sale Completed — {successSale.saleNumber}
                    </h2>
                    <p style={{ color: '#166534' }}>
                      {successSale.items.length} item(s) sold · Total:{' '}
                      <strong>{fmt(successSale.totalAmount)}</strong> ·{' '}
                      {PAYMENT_LABELS[successSale.paymentMethod]}
                    </p>
                    {successSale.customerName && (
                      <p className="text-sm mt-1" style={{ color: '#166534' }}>
                        Customer: {successSale.customerName}
                      </p>
                    )}
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={handleStartNew}
                        className="px-4 py-2 rounded-lg font-medium text-white text-sm"
                        style={{ backgroundColor: '#16a34a' }}
                      >
                        + New Sale
                      </button>
                      <button
                        onClick={() => { setTab('history'); setSuccessSale(null); }}
                        className="px-4 py-2 rounded-lg font-medium text-sm border"
                        style={{ borderColor: '#16a34a', color: '#166534' }}
                      >
                        View History
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            <div className="grid lg:grid-cols-5 gap-6">
              {/* Left column: Search + Sale Details */}
              <div className="lg:col-span-3 space-y-5">

                {/* Card Search – PRIMARY */}
                <div
                  className="rounded-xl p-5 shadow-sm"
                  style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
                >
                  <h2 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text)' }}>
                    🔍 Search Cards
                  </h2>
                  <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    Shows all sellers who have the card in stock.
                  </p>
                  <div className="flex gap-2 mb-4">
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Search by card name or set…"
                      className="flex-1 px-3 py-2 rounded-lg text-sm border"
                      style={{
                        backgroundColor: 'var(--color-background)',
                        color: 'var(--color-text)',
                        borderColor: 'var(--color-border)',
                      }}
                    />
                    <button
                      onClick={handleSearch}
                      disabled={searching}
                      className="px-4 py-2 rounded-lg text-sm font-medium text-white disabled:opacity-50"
                      style={{ backgroundColor: 'var(--color-accent)' }}
                    >
                      {searching ? '…' : '🔍 Search'}
                    </button>
                  </div>

                  {/* Search Results */}
                  {searchResults.length > 0 && (
                    <div className="space-y-3 max-h-96 overflow-y-auto">
                      {searchResults.map((card) => (
                        <div
                          key={card._id}
                          className="rounded-lg p-3 border"
                          style={{
                            backgroundColor: 'var(--color-background)',
                            borderColor: 'var(--color-border)',
                          }}
                        >
                          <div className="flex gap-3 mb-2">
                            {card.imageUrl ? (
                              <img
                                src={card.imageUrl}
                                alt={card.name}
                                className="w-12 h-16 object-cover rounded border flex-shrink-0"
                                style={{ borderColor: 'var(--color-border)' }}
                              />
                            ) : (
                              <div
                                className="w-12 h-16 rounded border flex items-center justify-center text-xs flex-shrink-0"
                                style={{
                                  borderColor: 'var(--color-border)',
                                  color: 'var(--color-text-secondary)',
                                }}
                              >
                                ?
                              </div>
                            )}
                            <div>
                              <div className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                                {card.name}
                              </div>
                              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                {card.setName} ({card.setCode}) #{card.collectorNumber}
                              </div>
                            </div>
                          </div>

                          {/* Inventory slots */}
                          <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {card.inventory.length} seller{card.inventory.length !== 1 ? 's' : ''} have this card
                          </div>
                          <div className="space-y-1">
                            {card.inventory.map((inv) => (
                              <div
                                key={inv.inventoryIndex}
                                className="flex items-center justify-between rounded px-3 py-2"
                                style={{ backgroundColor: 'var(--color-panel)' }}
                              >
                                <div className="flex flex-wrap items-center gap-x-3 gap-y-1">
                                  {/* Seller badge */}
                                  <span
                                    className="text-xs font-semibold px-2 py-0.5 rounded-full"
                                    style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                                  >
                                    {inv.sellerName}
                                  </span>
                                  <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                                    {inv.condition} · {inv.finish}
                                  </span>
                                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    Stock: {inv.quantityForSale} · {fmt(inv.sellPrice)}
                                  </span>
                                </div>
                                <button
                                  onClick={() => addToCart(card, inv.inventoryIndex)}
                                  className="text-xs px-3 py-1 rounded-lg text-white font-medium flex-shrink-0"
                                  style={{ backgroundColor: '#10b981' }}
                                >
                                  + Add
                                </button>
                              </div>
                            ))}
                          </div>
                        </div>
                      ))}
                    </div>
                  )}

                  {searchResults.length === 0 && !searching && searchQuery && (
                    <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
                      No cards found. Try a different search term.
                    </p>
                  )}
                </div>

                {/* Sale Details – SECONDARY */}
                <div
                  className="rounded-xl p-5 shadow-sm"
                  style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
                >
                  <h2 className="font-bold text-lg mb-4" style={{ color: 'var(--color-text)' }}>
                    Sale Details
                  </h2>
                  <div className="grid sm:grid-cols-2 gap-4">
                    {/* Customer Name */}
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Customer Name (optional)
                      </label>
                      <input
                        type="text"
                        value={customerName}
                        onChange={(e) => setCustomerName(e.target.value)}
                        placeholder="Walk-in customer name…"
                        className="w-full px-3 py-2 rounded-lg text-sm border"
                        style={{
                          backgroundColor: 'var(--color-background)',
                          color: 'var(--color-text)',
                          borderColor: 'var(--color-border)',
                        }}
                      />
                    </div>

                    {/* Notes */}
                    <div>
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Notes (optional)
                      </label>
                      <input
                        type="text"
                        value={notes}
                        onChange={(e) => setNotes(e.target.value)}
                        placeholder="Any notes…"
                        className="w-full px-3 py-2 rounded-lg text-sm border"
                        style={{
                          backgroundColor: 'var(--color-background)',
                          color: 'var(--color-text)',
                          borderColor: 'var(--color-border)',
                        }}
                      />
                    </div>

                    {/* Payment Method */}
                    <div className="sm:col-span-2">
                      <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        Payment Method
                      </label>
                      <div className="flex gap-2">
                        {(['cash', 'transfer', 'other'] as const).map((pm) => (
                          <button
                            key={pm}
                            onClick={() => setPaymentMethod(pm)}
                            className="flex-1 py-2 rounded-lg text-sm font-medium border transition-colors"
                            style={
                              paymentMethod === pm
                                ? { backgroundColor: 'var(--color-accent)', color: 'white', borderColor: 'var(--color-accent)' }
                                : { borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }
                            }
                          >
                            {PAYMENT_LABELS[pm]}
                          </button>
                        ))}
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              {/* Right column: Cart / Sale Summary */}
              <div className="lg:col-span-2">
                <div
                  className="rounded-xl p-5 shadow-sm sticky top-4"
                  style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
                >
                  <h2 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text)' }}>
                    🛒 Sale Items ({cart.length})
                  </h2>
                  {cartSellers.length > 0 && (
                    <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                      Sellers: {cartSellers.join(', ')}
                    </p>
                  )}

                  {cart.length === 0 ? (
                    <div className="text-center py-10" style={{ color: 'var(--color-text-secondary)' }}>
                      <div className="text-4xl mb-2">🃏</div>
                      <p className="text-sm">Search and add cards to the sale</p>
                    </div>
                  ) : (
                    <>
                      <div className="space-y-3 max-h-[50vh] overflow-y-auto mb-4">
                        {cart.map((item) => (
                          <div
                            key={`${item.cardId}-${item.inventoryIndex}`}
                            className="rounded-lg p-3 border"
                            style={{ backgroundColor: 'var(--color-background)', borderColor: 'var(--color-border)' }}
                          >
                            <div className="flex justify-between items-start mb-2">
                              <div className="flex-1 mr-2">
                                <div className="font-medium text-sm" style={{ color: 'var(--color-text)' }}>
                                  {item.cardName}
                                </div>
                                <div className="flex flex-wrap items-center gap-1 mt-0.5">
                                  <span
                                    className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                    style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                                  >
                                    {item.sellerName}
                                  </span>
                                  <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    {item.setCode} · {item.condition} · {item.finish}
                                  </span>
                                </div>
                              </div>
                              <button
                                onClick={() => removeFromCart(item.cardId, item.inventoryIndex)}
                                className="text-xs px-2 py-1 rounded"
                                style={{ backgroundColor: '#fee2e2', color: '#dc2626' }}
                              >
                                ✕
                              </button>
                            </div>

                            <div className="flex gap-2 items-center">
                              {/* Quantity */}
                              <div className="flex items-center gap-1">
                                <button
                                  onClick={() => updateCartQty(item.cardId, item.inventoryIndex, item.quantity - 1)}
                                  className="w-6 h-6 rounded text-sm font-bold flex items-center justify-center"
                                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}
                                >
                                  −
                                </button>
                                <input
                                  type="number"
                                  value={item.quantity}
                                  min={1}
                                  max={item.maxQty}
                                  onChange={(e) => updateCartQty(item.cardId, item.inventoryIndex, parseInt(e.target.value) || 1)}
                                  className="w-12 text-center text-sm rounded border"
                                  style={{
                                    backgroundColor: 'var(--color-background)',
                                    color: 'var(--color-text)',
                                    borderColor: 'var(--color-border)',
                                  }}
                                />
                                <button
                                  onClick={() => updateCartQty(item.cardId, item.inventoryIndex, item.quantity + 1)}
                                  className="w-6 h-6 rounded text-sm font-bold flex items-center justify-center"
                                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)' }}
                                >
                                  +
                                </button>
                              </div>

                              {/* Price */}
                              <div className="flex items-center gap-1 flex-1">
                                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Rp</span>
                                <input
                                  type="number"
                                  value={item.pricePerUnit}
                                  min={0}
                                  onChange={(e) => updateCartPrice(item.cardId, item.inventoryIndex, parseInt(e.target.value) || 0)}
                                  className="flex-1 px-2 py-1 text-sm rounded border"
                                  style={{
                                    backgroundColor: 'var(--color-background)',
                                    color: 'var(--color-text)',
                                    borderColor: 'var(--color-border)',
                                  }}
                                />
                              </div>

                              {/* Subtotal */}
                              <div className="text-sm font-semibold whitespace-nowrap" style={{ color: 'var(--color-accent)' }}>
                                {fmt(item.quantity * item.pricePerUnit)}
                              </div>
                            </div>
                          </div>
                        ))}
                      </div>

                      {/* Total */}
                      <div
                        className="rounded-lg px-4 py-3 mb-4 flex justify-between items-center"
                        style={{ backgroundColor: 'var(--color-highlight)' }}
                      >
                        <span className="font-semibold" style={{ color: 'var(--color-text)' }}>Total</span>
                        <span className="text-xl font-bold" style={{ color: 'var(--color-accent)' }}>
                          {fmt(cartTotal)}
                        </span>
                      </div>

                      {/* Complete button */}
                      <button
                        onClick={handleCompleteSale}
                        disabled={submitting || cart.length === 0}
                        className="w-full py-3 rounded-xl text-white font-bold text-base shadow-md hover:opacity-90 disabled:opacity-50 transition-opacity"
                        style={{ backgroundColor: '#16a34a' }}
                      >
                        {submitting ? '⏳ Processing…' : '✅ Complete Sale'}
                      </button>
                    </>
                  )}
                </div>
              </div>
            </div>
          </>
        )}

        {/* ── History Tab ──────────────────────────────────────────────────── */}
        {tab === 'history' && (
          <div>
            {/* Filters */}
            <div
              className="rounded-xl p-4 mb-5 flex flex-wrap gap-3"
              style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
            >
              <select
                value={historySellerFilter}
                onChange={(e) => { setHistorySellerFilter(e.target.value); setHistoryPage(1); }}
                className="px-3 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <option value="">All Sellers</option>
                {sellers.map((s) => (
                  <option key={s._id} value={s._id}>
                    {s.name || s.email}
                  </option>
                ))}
              </select>

              <select
                value={historyStatusFilter}
                onChange={(e) => { setHistoryStatusFilter(e.target.value); setHistoryPage(1); }}
                className="px-3 py-2 rounded-lg text-sm border"
                style={{
                  backgroundColor: 'var(--color-background)',
                  color: 'var(--color-text)',
                  borderColor: 'var(--color-border)',
                }}
              >
                <option value="">All Status</option>
                <option value="completed">Completed</option>
                <option value="voided">Voided</option>
              </select>

              <button
                onClick={loadHistory}
                className="px-4 py-2 rounded-lg text-sm font-medium text-white"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                🔄 Refresh
              </button>

              <span className="ml-auto self-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                {historyTotal} sale{historyTotal !== 1 ? 's' : ''}
              </span>
            </div>

            {historyLoading ? (
              <div className="text-center py-16" style={{ color: 'var(--color-text-secondary)' }}>
                Loading…
              </div>
            ) : sales.length === 0 ? (
              <div className="text-center py-16" style={{ color: 'var(--color-text-secondary)' }}>
                <div className="text-4xl mb-2">📭</div>
                <p>No offline sales found.</p>
              </div>
            ) : (
              <div className="space-y-3">
                {sales.map((sale) => (
                  <div
                    key={sale._id}
                    className="rounded-xl shadow-sm overflow-hidden"
                    style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
                  >
                    {/* Sale header row */}
                    <div
                      className="flex flex-wrap gap-3 items-center px-5 py-4 cursor-pointer hover:opacity-90"
                      onClick={() => setExpandedSale(expandedSale === sale._id ? null : sale._id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>
                            {sale.saleNumber}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full font-medium"
                            style={
                              sale.status === 'completed'
                                ? { backgroundColor: '#dcfce7', color: '#166534' }
                                : { backgroundColor: '#fee2e2', color: '#991b1b' }
                            }
                          >
                            {sale.status}
                          </span>
                          <span
                            className="text-xs px-2 py-0.5 rounded-full"
                            style={{ backgroundColor: 'var(--color-highlight)', color: 'var(--color-text-secondary)' }}
                          >
                            {PAYMENT_LABELS[sale.paymentMethod]}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5 flex gap-3 flex-wrap" style={{ color: 'var(--color-text-secondary)' }}>
                          <span>Sellers: <strong>{sale.sellerSummary || sale.sellerName}</strong></span>
                          {sale.customerName && <span>Customer: {sale.customerName}</span>}
                          <span>{new Date(sale.createdAt).toLocaleString('id-ID')}</span>
                        </div>
                      </div>

                      <div className="flex items-center gap-4">
                        <div className="text-right">
                          <div className="font-bold text-sm" style={{ color: 'var(--color-accent)' }}>
                            {fmt(sale.totalAmount)}
                          </div>
                          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                            {sale.items.length} item{sale.items.length !== 1 ? 's' : ''}
                          </div>
                        </div>

                        {sale.status === 'completed' && (
                          <button
                            onClick={(e) => { e.stopPropagation(); handleVoid(sale._id, sale.saleNumber); }}
                            disabled={voidingId === sale._id}
                            className="text-xs px-3 py-1.5 rounded-lg font-medium border disabled:opacity-50"
                            style={{ borderColor: '#ef4444', color: '#ef4444' }}
                          >
                            {voidingId === sale._id ? '…' : '↩️ Void'}
                          </button>
                        )}

                        <span style={{ color: 'var(--color-text-secondary)' }}>
                          {expandedSale === sale._id ? '▲' : '▼'}
                        </span>
                      </div>
                    </div>

                    {/* Expanded items */}
                    {expandedSale === sale._id && (
                      <div
                        className="px-5 pb-4 border-t"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        {sale.notes && (
                          <p className="text-sm italic mt-3 mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                            📝 {sale.notes}
                          </p>
                        )}
                        <div className="overflow-x-auto mt-3">
                          <table className="w-full text-sm">
                            <thead>
                              <tr style={{ color: 'var(--color-text-secondary)' }}>
                                <th className="text-left py-1 pr-4">Card</th>
                                <th className="text-left py-1 pr-4">Set</th>
                                <th className="text-left py-1 pr-4">Seller</th>
                                <th className="text-left py-1 pr-4">Cond</th>
                                <th className="text-right py-1 pr-4">Qty</th>
                                <th className="text-right py-1 pr-4">Price</th>
                                <th className="text-right py-1">Subtotal</th>
                              </tr>
                            </thead>
                            <tbody>
                              {sale.items.map((item, i) => (
                                <tr
                                  key={i}
                                  className="border-t"
                                  style={{ borderColor: 'var(--color-border)' }}
                                >
                                  <td className="py-2 pr-4 font-medium" style={{ color: 'var(--color-text)' }}>
                                    {item.cardName}
                                  </td>
                                  <td className="py-2 pr-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    {item.setCode} #{item.collectorNumber}
                                  </td>
                                  <td className="py-2 pr-4">
                                    <span
                                      className="text-xs px-2 py-0.5 rounded-full font-semibold"
                                      style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
                                    >
                                      {item.sellerName}
                                    </span>
                                  </td>
                                  <td className="py-2 pr-4 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                    {item.condition} · {item.finish}
                                  </td>
                                  <td className="py-2 pr-4 text-right" style={{ color: 'var(--color-text)' }}>
                                    {item.quantity}
                                  </td>
                                  <td className="py-2 pr-4 text-right" style={{ color: 'var(--color-text)' }}>
                                    {fmt(item.pricePerUnit)}
                                  </td>
                                  <td className="py-2 text-right font-semibold" style={{ color: 'var(--color-accent)' }}>
                                    {fmt(item.subtotal)}
                                  </td>
                                </tr>
                              ))}
                            </tbody>
                            <tfoot>
                              <tr className="border-t" style={{ borderColor: 'var(--color-border)' }}>
                                <td colSpan={6} className="pt-2 font-bold text-right pr-4" style={{ color: 'var(--color-text)' }}>
                                  Total
                                </td>
                                <td className="pt-2 font-bold text-right" style={{ color: 'var(--color-accent)' }}>
                                  {fmt(sale.totalAmount)}
                                </td>
                              </tr>
                            </tfoot>
                          </table>
                        </div>
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                {historyTotal > LIMIT && (
                  <div className="flex justify-center gap-2 pt-4">
                    <button
                      disabled={historyPage === 1}
                      onClick={() => setHistoryPage((p) => p - 1)}
                      className="px-4 py-2 rounded-lg text-sm border disabled:opacity-40"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                      ← Prev
                    </button>
                    <span className="px-4 py-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Page {historyPage} / {Math.ceil(historyTotal / LIMIT)}
                    </span>
                    <button
                      disabled={historyPage >= Math.ceil(historyTotal / LIMIT)}
                      onClick={() => setHistoryPage((p) => p + 1)}
                      className="px-4 py-2 rounded-lg text-sm border disabled:opacity-40"
                      style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                    >
                      Next →
                    </button>
                  </div>
                )}
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminOfflineSalePage;
