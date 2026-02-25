import React, { useState, useEffect, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { sellerApi, Seller } from '../api/seller';
import { adminApi } from '../api/admin';
import {
  offlineBuyApi,
  BuySearchedCard,
  OfflineBuy,
  CreateOfflineBuyPayload,
} from '../api/offlineBuy';

// ─── Types ────────────────────────────────────────────────────────────────────

interface CartItem {
  cardId: string;
  cardName: string;
  setCode: string;
  setName: string;
  collectorNumber: string;
  imageUrl?: string;
  condition: string;
  finish: string;
  quantity: number;
  pricePerUnit: number;
}

interface AddForm {
  cardId: string;
  condition: string;
  finish: string;
  quantity: number;
  pricePerUnit: number;
}

// ─── Helpers ──────────────────────────────────────────────────────────────────

const fmt = (n: number) => '$' + n.toFixed(2);

const PAYMENT_LABELS: Record<string, string> = {
  cash: '💵 Cash',
  transfer: '🏦 Transfer',
  'store-credit': '💳 Store Credit',
  other: 'Other',
};

const CONDITIONS = ['NM', 'LP', 'P'] as const;
const FINISHES = ['nonfoil', 'foil', 'etched'] as const;

const cartKey = (item: CartItem) => `${item.cardId}-${item.condition}-${item.finish}`;

// ─── Component ────────────────────────────────────────────────────────────────

const AdminOfflineBuyPage: React.FC = () => {
  const [tab, setTab] = useState<'new' | 'history'>('new');

  // ── Form state ────────────────────────────────────────────────────────────
  const [sellers, setSellers] = useState<Seller[]>([]);
  const [members, setMembers] = useState<any[]>([]);

  const [memberName, setMemberName] = useState('');
  const [memberId, setMemberId] = useState('');
  const [memberSearch, setMemberSearch] = useState('');
  const [showMemberDropdown, setShowMemberDropdown] = useState(false);

  const [destSellerId, setDestSellerId] = useState('');
  const [destSellerName, setDestSellerName] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'cash' | 'transfer' | 'store-credit' | 'other'>('cash');
  const [notes, setNotes] = useState('');

  // ── Search state ─────────────────────────────────────────────────────────
  const [searchQuery, setSearchQuery] = useState('');
  const [searchResults, setSearchResults] = useState<BuySearchedCard[]>([]);
  const [searching, setSearching] = useState(false);
  const [addingCardId, setAddingCardId] = useState<string | null>(null);
  const [addForm, setAddForm] = useState<AddForm>({
    cardId: '',
    condition: 'NM',
    finish: 'nonfoil',
    quantity: 1,
    pricePerUnit: 0,
  });

  // ── Cart ──────────────────────────────────────────────────────────────────
  const [cart, setCart] = useState<CartItem[]>([]);
  const [submitting, setSubmitting] = useState(false);
  const [successBuy, setSuccessBuy] = useState<OfflineBuy | null>(null);

  // ── History ───────────────────────────────────────────────────────────────
  const [buys, setBuys] = useState<OfflineBuy[]>([]);
  const [historyLoading, setHistoryLoading] = useState(false);
  const [historyPage, setHistoryPage] = useState(1);
  const [historyTotal, setHistoryTotal] = useState(0);
  const [historyStatusFilter, setHistoryStatusFilter] = useState('');
  const [expandedBuy, setExpandedBuy] = useState<string | null>(null);
  const [voidingId, setVoidingId] = useState<string | null>(null);

  const LIMIT = 10;

  // ── Init ──────────────────────────────────────────────────────────────────
  useEffect(() => {
    sellerApi.getSellers().then((d) => setSellers(d.sellers)).catch(console.error);
    adminApi.getMembers().then((d) => setMembers(d.members || [])).catch(console.error);
  }, []);

  // ── Load history ──────────────────────────────────────────────────────────
  const loadHistory = useCallback(async () => {
    setHistoryLoading(true);
    try {
      const data = await offlineBuyApi.listBuys({
        status: historyStatusFilter || undefined,
        page: historyPage,
        limit: LIMIT,
      });
      setBuys(data.buys);
      setHistoryTotal(data.pagination.total);
    } catch (err: any) {
      console.error('Load history error:', err);
    } finally {
      setHistoryLoading(false);
    }
  }, [historyStatusFilter, historyPage]);

  useEffect(() => {
    if (tab === 'history') loadHistory();
  }, [tab, loadHistory]);

  // ── Member search ─────────────────────────────────────────────────────────
  const filteredMembers = memberSearch.trim()
    ? members.filter(
        (m) =>
          (m.name || '').toLowerCase().includes(memberSearch.toLowerCase()) ||
          m.email.toLowerCase().includes(memberSearch.toLowerCase())
      )
    : members.slice(0, 8);

  // ── Card search ───────────────────────────────────────────────────────────
  const handleSearch = async () => {
    if (!searchQuery.trim()) return;
    setSearching(true);
    setSearchResults([]);
    setAddingCardId(null);
    try {
      const data = await offlineBuyApi.searchCards(searchQuery);
      setSearchResults(data.cards);
    } catch (err: any) {
      alert('Search failed: ' + (err.response?.data?.error || err.message));
    } finally {
      setSearching(false);
    }
  };

  // ── Open add-form for a card ───────────────────────────────────────────────
  const openAddForm = (card: BuySearchedCard) => {
    setAddingCardId(card._id);
    setAddForm({
      cardId: card._id,
      condition: 'NM',
      finish: 'nonfoil',
      quantity: 1,
      pricePerUnit: card.ckBuyPrice.normal || 0,
    });
  };

  const confirmAdd = (card: BuySearchedCard) => {
    const key = `${addForm.cardId}-${addForm.condition}-${addForm.finish}`;
    const existing = cart.find((c) => cartKey(c) === key);
    if (existing) {
      setCart((prev) =>
        prev.map((c) =>
          cartKey(c) === key
            ? { ...c, quantity: c.quantity + addForm.quantity, pricePerUnit: addForm.pricePerUnit }
            : c
        )
      );
    } else {
      setCart((prev) => [
        ...prev,
        {
          cardId: card._id,
          cardName: card.name,
          setCode: card.setCode,
          setName: card.setName,
          collectorNumber: card.collectorNumber,
          imageUrl: card.imageUrl,
          condition: addForm.condition,
          finish: addForm.finish,
          quantity: addForm.quantity,
          pricePerUnit: addForm.pricePerUnit,
        },
      ]);
    }
    setAddingCardId(null);
  };

  const removeFromCart = (key: string) => setCart((prev) => prev.filter((c) => cartKey(c) !== key));

  const updateCartQty = (key: string, qty: number) =>
    setCart((prev) => prev.map((c) => (cartKey(c) === key ? { ...c, quantity: Math.max(1, qty) } : c)));

  const updateCartPrice = (key: string, price: number) =>
    setCart((prev) => prev.map((c) => (cartKey(c) === key ? { ...c, pricePerUnit: Math.max(0, price) } : c)));

  const cartTotal = cart.reduce((s, c) => s + c.quantity * c.pricePerUnit, 0);

  // ── Complete buy ──────────────────────────────────────────────────────────
  const handleCompleteBuy = async () => {
    if (!memberName.trim()) { alert('Please enter a member name.'); return; }
    if (!destSellerId) { alert('Please select a destination seller.'); return; }
    if (cart.length === 0) { alert('No items in the buy list.'); return; }

    if (!window.confirm(
      `Complete offline buy?\n\n${cart.length} item(s)\nFrom: ${memberName}\nTo: ${destSellerName} inventory\nTotal: ${fmt(cartTotal)}\nPayment: ${PAYMENT_LABELS[paymentMethod]}`
    )) return;

    setSubmitting(true);
    try {
      const payload: CreateOfflineBuyPayload = {
        memberName: memberName.trim(),
        memberId: memberId || undefined,
        destinationSellerId: destSellerId,
        destinationSellerName: destSellerName,
        paymentMethod,
        notes: notes || undefined,
        items: cart.map((c) => ({
          cardId: c.cardId,
          condition: c.condition,
          finish: c.finish,
          quantity: c.quantity,
          pricePerUnit: c.pricePerUnit,
        })),
      };
      const result = await offlineBuyApi.createBuy(payload);
      setSuccessBuy(result.buy);
      setCart([]);
      setSearchResults([]);
      setSearchQuery('');
      setMemberName('');
      setMemberId('');
      setMemberSearch('');
      setNotes('');
    } catch (err: any) {
      alert('Failed to complete buy: ' + (err.response?.data?.error || err.message));
    } finally {
      setSubmitting(false);
    }
  };

  const handleStartNew = () => setSuccessBuy(null);

  // ── Void ──────────────────────────────────────────────────────────────────
  const handleVoid = async (buyId: string, buyNumber: string) => {
    if (!window.confirm(`Void buy ${buyNumber}? Inventory will be reversed.`)) return;
    setVoidingId(buyId);
    try {
      await offlineBuyApi.voidBuy(buyId);
      loadHistory();
    } catch (err: any) {
      alert('Failed to void: ' + (err.response?.data?.error || err.message));
    } finally {
      setVoidingId(null);
    }
  };

  const conditionColor: Record<string, string> = { NM: '#d1fae5', LP: '#dbeafe', P: '#fee2e2' };
  const finishColor: Record<string, string> = { foil: '#fdf4ff', etched: '#fff7ed', nonfoil: 'var(--color-background)' };

  // ─ Render ──────────────────────────────────────────────────────────────────

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="max-w-6xl mx-auto px-4 py-8">

        {/* Header */}
        <div className="mb-6">
          <Link to="/admin/dashboard" className="inline-flex items-center gap-1.5 text-sm mb-3 hover:opacity-80" style={{ color: 'var(--color-accent)' }}>
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" /></svg>
            Back to Dashboard
          </Link>
          <h1 className="text-3xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>
            🛒 Buy From Member
          </h1>
          <p style={{ color: 'var(--color-text-secondary)' }}>
            Record cards bought from a walk-in member — adds stock to a seller's inventory.
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
              {t === 'new' ? '➕ New Buy' : '📋 Buy History'}
            </button>
          ))}
        </div>

        {/* ── New Buy Tab ─────────────────────────────────────────────────── */}
        {tab === 'new' && (
          <>
            {/* Success banner */}
            {successBuy && (
              <div
                className="rounded-xl p-6 mb-6 shadow"
                style={{ backgroundColor: '#dbeafe', border: '1.5px solid #93c5fd' }}
              >
                <div className="flex items-start gap-4">
                  <div className="text-4xl">✅</div>
                  <div className="flex-1">
                    <h2 className="text-xl font-bold mb-1" style={{ color: '#1e40af' }}>
                      Buy Recorded — {successBuy.buyNumber}
                    </h2>
                    <p style={{ color: '#1e40af' }}>
                      {successBuy.items.length} item(s) · Total:{' '}
                      <strong>{fmt(successBuy.totalAmount)}</strong> ·{' '}
                      {PAYMENT_LABELS[successBuy.paymentMethod]}
                    </p>
                    <p className="text-sm mt-1" style={{ color: '#1e40af' }}>
                      From: <strong>{successBuy.memberName}</strong> → To: <strong>{successBuy.destinationSellerName}</strong> inventory
                    </p>
                    <div className="mt-3 flex gap-2">
                      <button
                        onClick={handleStartNew}
                        className="px-4 py-2 rounded-lg font-medium text-white text-sm"
                        style={{ backgroundColor: '#2563eb' }}
                      >
                        + New Buy
                      </button>
                      <button
                        onClick={() => { setTab('history'); setSuccessBuy(null); }}
                        className="px-4 py-2 rounded-lg font-medium text-sm border"
                        style={{ borderColor: '#2563eb', color: '#1e40af' }}
                      >
                        View History
                      </button>
                    </div>
                  </div>
                </div>
              </div>
            )}

            {/* ── Transaction Details ─────────────────────────────────────── */}
            <div
              className="rounded-xl p-5 mb-5 shadow-sm"
              style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
            >
              <h2 className="font-bold text-base mb-4" style={{ color: 'var(--color-text)' }}>
                📋 Transaction Details
              </h2>
              <div className="grid md:grid-cols-2 lg:grid-cols-4 gap-4">

                {/* Member Name (with autocomplete) */}
                <div className="relative lg:col-span-2">
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                    Source Member *
                  </label>
                  <input
                    type="text"
                    placeholder="Search or type member name…"
                    value={memberSearch || memberName}
                    onChange={(e) => {
                      setMemberSearch(e.target.value);
                      setMemberName(e.target.value);
                      setMemberId('');
                      setShowMemberDropdown(true);
                    }}
                    onFocus={() => setShowMemberDropdown(true)}
                    onBlur={() => setTimeout(() => setShowMemberDropdown(false), 150)}
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      borderColor: memberName ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                  />
                  {showMemberDropdown && filteredMembers.length > 0 && (
                    <div
                      className="absolute top-full left-0 right-0 z-20 rounded-lg shadow-xl border mt-1 max-h-52 overflow-y-auto"
                      style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}
                    >
                      {filteredMembers.map((m) => (
                        <button
                          key={m._id}
                          onMouseDown={() => {
                            setMemberName(m.name || m.email);
                            setMemberId(m._id);
                            setMemberSearch('');
                            setShowMemberDropdown(false);
                          }}
                          className="w-full text-left px-3 py-2.5 text-sm hover:opacity-80 flex items-center gap-2 border-b last:border-0"
                          style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                        >
                          <div className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-bold text-white flex-shrink-0" style={{ backgroundColor: 'var(--color-accent)' }}>
                            {(m.name || m.email).charAt(0).toUpperCase()}
                          </div>
                          <div>
                            <div className="font-medium">{m.name || '—'}</div>
                            <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                              {m.email}
                              {m.storeCredit ? ` · Credit: $${m.storeCredit.toFixed(2)}` : ''}
                            </div>
                          </div>
                        </button>
                      ))}
                    </div>
                  )}
                  {memberId && (
                    <div className="mt-1 text-xs" style={{ color: '#16a34a' }}>
                      ✓ Linked to registered member
                    </div>
                  )}
                </div>

                {/* Destination Seller */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                    Add Stock To *
                  </label>
                  <select
                    value={destSellerId}
                    onChange={(e) => {
                      setDestSellerId(e.target.value);
                      const s = sellers.find((s) => s._id === e.target.value);
                      setDestSellerName(s?.name || '');
                    }}
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{
                      backgroundColor: 'var(--color-background)',
                      color: 'var(--color-text)',
                      borderColor: destSellerId ? 'var(--color-accent)' : 'var(--color-border)',
                    }}
                  >
                    <option value="">— Select seller —</option>
                    {sellers.map((s) => (
                      <option key={s._id} value={s._id}>{s.name}</option>
                    ))}
                  </select>
                </div>

                {/* Payment Method */}
                <div>
                  <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                    Payment Method
                  </label>
                  <select
                    value={paymentMethod}
                    onChange={(e) => setPaymentMethod(e.target.value as any)}
                    className="w-full px-3 py-2 rounded-lg text-sm border"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                  >
                    {Object.entries(PAYMENT_LABELS).map(([v, l]) => (
                      <option key={v} value={v}>{l}</option>
                    ))}
                  </select>
                  {paymentMethod === 'store-credit' && memberId && (() => {
                    const m = members.find((m) => m._id === memberId);
                    return m ? (
                      <div className="mt-1 text-xs font-medium" style={{ color: '#7c3aed' }}>
                        Available credit: ${(m.storeCredit || 0).toFixed(2)}
                      </div>
                    ) : null;
                  })()}
                </div>
              </div>

              {/* Notes */}
              <div className="mt-3">
                <label className="block text-xs font-semibold mb-1.5 uppercase tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                  Notes
                </label>
                <input
                  type="text"
                  value={notes}
                  onChange={(e) => setNotes(e.target.value)}
                  placeholder="Optional notes about this purchase…"
                  className="w-full px-3 py-2 rounded-lg text-sm border"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                />
              </div>
            </div>

            {/* ── Main area: search + cart ────────────────────────────────── */}
            <div className="grid lg:grid-cols-5 gap-6">

              {/* Left: Card Search */}
              <div className="lg:col-span-3 space-y-5">
                <div
                  className="rounded-xl p-5 shadow-sm"
                  style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
                >
                  <h2 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text)' }}>
                    🔍 Search Cards to Buy
                  </h2>
                  <p className="text-xs mb-3" style={{ color: 'var(--color-text-secondary)' }}>
                    Search the catalog, then specify condition/finish/qty/price for each card.
                  </p>
                  <div className="flex gap-2 mb-4">
                    <input
                      autoFocus
                      type="text"
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      onKeyDown={(e) => e.key === 'Enter' && handleSearch()}
                      placeholder="Card name or set…"
                      className="flex-1 px-3 py-2 rounded-lg text-sm border"
                      style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
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
                    <div className="space-y-2 max-h-[32rem] overflow-y-auto">
                      {searchResults.map((card) => (
                        <div
                          key={card._id}
                          className="rounded-lg border overflow-hidden"
                          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
                        >
                          {/* Card header */}
                          <div className="flex items-center gap-3 p-3">
                            {card.imageUrl ? (
                              <img src={card.imageUrl} alt={card.name} className="w-10 h-14 object-cover rounded" />
                            ) : (
                              <div className="w-10 h-14 rounded flex items-center justify-center" style={{ backgroundColor: 'var(--color-panel)' }}>
                                <span className="text-lg">🃏</span>
                              </div>
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-sm truncate" style={{ color: 'var(--color-text)' }}>{card.name}</div>
                              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                {card.setName} · {card.setCode.toUpperCase()} #{card.collectorNumber}
                              </div>
                              <div className="text-xs mt-0.5" style={{ color: '#059669' }}>
                                CK Buy: NM {fmt(card.ckBuyPrice.normal)} · Foil {fmt(card.ckBuyPrice.foil)}
                                {card.ckBuyPrice.etched > 0 ? ` · Etched ${fmt(card.ckBuyPrice.etched)}` : ''}
                              </div>
                            </div>
                            <button
                              onClick={() => openAddForm(card)}
                              className="flex-shrink-0 px-3 py-1.5 rounded-lg text-xs font-bold text-white"
                              style={{ backgroundColor: '#2563eb' }}
                            >
                              + Add
                            </button>
                          </div>

                          {/* Inline add form */}
                          {addingCardId === card._id && (
                            <div
                              className="border-t p-4 space-y-3"
                              style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-panel)' }}
                            >
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Condition</label>
                                  <div className="flex gap-1">
                                    {CONDITIONS.map((c) => (
                                      <button
                                        key={c}
                                        onClick={() => setAddForm((f) => ({ ...f, condition: c }))}
                                        className="flex-1 py-1.5 rounded text-xs font-bold border-2 transition-all"
                                        style={{
                                          backgroundColor: addForm.condition === c ? conditionColor[c] : 'var(--color-background)',
                                          borderColor: addForm.condition === c ? '#6b7280' : 'var(--color-border)',
                                          color: 'var(--color-text)',
                                        }}
                                      >
                                        {c}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Finish</label>
                                  <div className="flex gap-1">
                                    {FINISHES.map((f) => (
                                      <button
                                        key={f}
                                        onClick={() => {
                                          setAddForm((af) => ({
                                            ...af,
                                            finish: f,
                                            pricePerUnit:
                                              f === 'foil'
                                                ? card.ckBuyPrice.foil
                                                : f === 'etched'
                                                ? card.ckBuyPrice.etched || card.ckBuyPrice.foil
                                                : card.ckBuyPrice.normal,
                                          }));
                                        }}
                                        className="flex-1 py-1.5 rounded text-xs font-bold border-2 transition-all"
                                        style={{
                                          backgroundColor: addForm.finish === f ? finishColor[f] : 'var(--color-background)',
                                          borderColor: addForm.finish === f ? '#6b7280' : 'var(--color-border)',
                                          color: 'var(--color-text)',
                                        }}
                                      >
                                        {f === 'nonfoil' ? 'NF' : f.charAt(0).toUpperCase() + f.slice(1)}
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              </div>
                              <div className="grid grid-cols-2 gap-3">
                                <div>
                                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Quantity</label>
                                  <input
                                    type="number"
                                    min={1}
                                    value={addForm.quantity}
                                    onChange={(e) => setAddForm((f) => ({ ...f, quantity: Math.max(1, parseInt(e.target.value) || 1) }))}
                                    className="w-full px-2 py-1.5 rounded border text-sm"
                                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                                  />
                                </div>
                                <div>
                                  <label className="block text-xs font-semibold mb-1" style={{ color: 'var(--color-text-secondary)' }}>Buy Price (USD)</label>
                                  <input
                                    type="number"
                                    min={0}
                                    step={0.01}
                                    value={addForm.pricePerUnit}
                                    onChange={(e) => setAddForm((f) => ({ ...f, pricePerUnit: Math.max(0, parseFloat(e.target.value) || 0) }))}
                                    className="w-full px-2 py-1.5 rounded border text-sm"
                                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                                  />
                                </div>
                              </div>
                              <div className="flex gap-2">
                                <button
                                  onClick={() => confirmAdd(card)}
                                  className="flex-1 py-2 rounded-lg text-sm font-bold text-white"
                                  style={{ backgroundColor: '#2563eb' }}
                                >
                                  ✓ Add to Buy List ({fmt(addForm.pricePerUnit * addForm.quantity)})
                                </button>
                                <button
                                  onClick={() => setAddingCardId(null)}
                                  className="px-4 py-2 rounded-lg text-sm font-bold border"
                                  style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}
                                >
                                  Cancel
                                </button>
                              </div>
                            </div>
                          )}
                        </div>
                      ))}
                    </div>
                  )}
                  {!searching && searchResults.length === 0 && searchQuery && (
                    <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-secondary)' }}>No cards found for "{searchQuery}"</p>
                  )}
                </div>
              </div>

              {/* Right: Buy Cart */}
              <div className="lg:col-span-2">
                <div
                  className="rounded-xl p-5 shadow-sm sticky top-4"
                  style={{ backgroundColor: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
                >
                  <h2 className="font-bold text-lg mb-3" style={{ color: 'var(--color-text)' }}>
                    🛒 Buy List
                    {cart.length > 0 && (
                      <span className="ml-2 px-2 py-0.5 rounded-full text-xs font-bold text-white" style={{ backgroundColor: '#2563eb' }}>
                        {cart.length}
                      </span>
                    )}
                  </h2>

                  {cart.length === 0 ? (
                    <p className="text-center py-8 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      No items yet. Search and add cards above.
                    </p>
                  ) : (
                    <div className="space-y-3 max-h-[26rem] overflow-y-auto mb-4">
                      {cart.map((item) => {
                        const key = cartKey(item);
                        return (
                          <div
                            key={key}
                            className="flex gap-2 p-3 rounded-lg border"
                            style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
                          >
                            {item.imageUrl && (
                              <img src={item.imageUrl} alt={item.cardName} className="w-8 h-11 object-cover rounded flex-shrink-0" />
                            )}
                            <div className="flex-1 min-w-0">
                              <div className="font-semibold text-xs truncate" style={{ color: 'var(--color-text)' }}>{item.cardName}</div>
                              <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                {item.setCode.toUpperCase()} ·{' '}
                                <span className="px-1 rounded text-xs font-bold" style={{ backgroundColor: conditionColor[item.condition] }}>{item.condition}</span>{' '}
                                {item.finish !== 'nonfoil' && <span className="px-1 rounded text-xs font-bold" style={{ backgroundColor: finishColor[item.finish] }}>{item.finish}</span>}
                              </div>
                              <div className="flex items-center gap-2 mt-1">
                                <input
                                  type="number"
                                  min={1}
                                  value={item.quantity}
                                  onChange={(e) => updateCartQty(key, parseInt(e.target.value) || 1)}
                                  className="w-12 px-1.5 py-0.5 rounded border text-xs"
                                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                                />
                                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>×</span>
                                <span className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>$</span>
                                <input
                                  type="number"
                                  min={0}
                                  step={0.01}
                                  value={item.pricePerUnit}
                                  onChange={(e) => updateCartPrice(key, parseFloat(e.target.value) || 0)}
                                  className="w-16 px-1.5 py-0.5 rounded border text-xs"
                                  style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
                                />
                              </div>
                            </div>
                            <div className="flex flex-col items-end gap-1">
                              <div className="text-sm font-bold" style={{ color: '#2563eb' }}>
                                {fmt(item.quantity * item.pricePerUnit)}
                              </div>
                              <button
                                onClick={() => removeFromCart(key)}
                                className="text-xs font-bold hover:opacity-80"
                                style={{ color: '#dc2626' }}
                              >
                                ✕
                              </button>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}

                  {cart.length > 0 && (
                    <>
                      <div
                        className="flex items-center justify-between py-3 border-t border-b mb-4"
                        style={{ borderColor: 'var(--color-border)' }}
                      >
                        <span className="font-bold" style={{ color: 'var(--color-text)' }}>Total Buy Price</span>
                        <span className="text-xl font-extrabold" style={{ color: '#2563eb' }}>
                          {fmt(cartTotal)}
                        </span>
                      </div>
                      <button
                        onClick={handleCompleteBuy}
                        disabled={submitting || !memberName.trim() || !destSellerId}
                        className="w-full py-3 rounded-xl font-bold text-white text-sm hover:opacity-90 disabled:opacity-50 transition-all shadow"
                        style={{ backgroundColor: '#2563eb' }}
                      >
                        {submitting ? '⏳ Processing…' : `✓ Complete Buy (${fmt(cartTotal)})`}
                      </button>
                      {(!memberName.trim() || !destSellerId) && (
                        <p className="text-xs mt-2 text-center" style={{ color: '#f59e0b' }}>
                          ⚠ Fill in member name and destination seller first.
                        </p>
                      )}
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
            <div className="flex flex-wrap gap-3 mb-5">
              <select
                value={historyStatusFilter}
                onChange={(e) => { setHistoryStatusFilter(e.target.value); setHistoryPage(1); }}
                className="px-3 py-2 rounded-lg text-sm border"
                style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
              >
                <option value="">All statuses</option>
                <option value="completed">Completed</option>
                <option value="voided">Voided</option>
              </select>
            </div>

            {historyLoading ? (
              <div className="py-16 flex items-center justify-center">
                <div className="animate-spin rounded-full h-10 w-10 border-4 border-t-transparent" style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }} />
              </div>
            ) : buys.length === 0 ? (
              <div className="py-16 text-center" style={{ color: 'var(--color-text-secondary)' }}>No buy records found.</div>
            ) : (
              <div className="space-y-3">
                {buys.map((buy) => (
                  <div
                    key={buy._id}
                    className="rounded-xl border overflow-hidden shadow-sm"
                    style={{ backgroundColor: 'var(--color-panel)', borderColor: buy.status === 'voided' ? '#fca5a5' : 'var(--color-border)' }}
                  >
                    {/* Summary row */}
                    <div
                      className="flex items-center gap-3 px-4 py-3 cursor-pointer hover:opacity-90"
                      onClick={() => setExpandedBuy(expandedBuy === buy._id ? null : buy._id)}
                    >
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 flex-wrap">
                          <span className="font-mono font-bold text-sm" style={{ color: 'var(--color-text)' }}>{buy.buyNumber}</span>
                          <span
                            className="px-2 py-0.5 rounded-full text-xs font-bold text-white"
                            style={{ backgroundColor: buy.status === 'voided' ? '#dc2626' : '#2563eb' }}
                          >
                            {buy.status}
                          </span>
                        </div>
                        <div className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                          From: <strong>{buy.memberName}</strong> → To: {buy.destinationSellerName} ·{' '}
                          {new Date(buy.createdAt).toLocaleString('id-ID')}
                        </div>
                      </div>
                      <div className="text-right flex-shrink-0">
                        <div className="font-bold" style={{ color: '#2563eb' }}>{fmt(buy.totalAmount)}</div>
                        <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                          {buy.items.length} item(s) · {PAYMENT_LABELS[buy.paymentMethod]}
                        </div>
                      </div>
                      <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${expandedBuy === buy._id ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-secondary)' }}>
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                      </svg>
                    </div>

                    {/* Details */}
                    {expandedBuy === buy._id && (
                      <div className="border-t px-4 py-3" style={{ borderColor: 'var(--color-border)' }}>
                        {buy.notes && (
                          <p className="text-xs mb-3 italic" style={{ color: 'var(--color-text-secondary)' }}>
                            📝 {buy.notes}
                          </p>
                        )}
                        <table className="w-full text-xs mb-3">
                          <thead>
                            <tr style={{ color: 'var(--color-text-secondary)' }}>
                              <th className="text-left pb-2">Card</th>
                              <th className="text-left pb-2">Condition</th>
                              <th className="text-left pb-2">Finish</th>
                              <th className="text-right pb-2">Qty</th>
                              <th className="text-right pb-2">Buy Price</th>
                              <th className="text-right pb-2">Subtotal</th>
                            </tr>
                          </thead>
                          <tbody>
                            {buy.items.map((item, i) => (
                              <tr key={i} className="border-t" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                                <td className="py-1.5 pr-2">
                                  <div className="font-medium">{item.cardName}</div>
                                  <div style={{ color: 'var(--color-text-secondary)' }}>{item.setCode.toUpperCase()} #{item.collectorNumber}</div>
                                </td>
                                <td className="py-1.5">{item.condition}</td>
                                <td className="py-1.5">{item.finish}</td>
                                <td className="py-1.5 text-right">{item.quantity}</td>
                                <td className="py-1.5 text-right">{fmt(item.pricePerUnit)}</td>
                                <td className="py-1.5 text-right font-semibold">{fmt(item.subtotal)}</td>
                              </tr>
                            ))}
                          </tbody>
                        </table>
                        {buy.status === 'completed' && (
                          <button
                            onClick={() => handleVoid(buy._id, buy.buyNumber)}
                            disabled={voidingId === buy._id}
                            className="px-4 py-2 rounded-lg text-xs font-bold text-white hover:opacity-80 disabled:opacity-50"
                            style={{ backgroundColor: '#dc2626' }}
                          >
                            {voidingId === buy._id ? 'Voiding…' : 'Void Buy'}
                          </button>
                        )}
                      </div>
                    )}
                  </div>
                ))}

                {/* Pagination */}
                {historyTotal > LIMIT && (
                  <div className="flex items-center justify-between pt-2">
                    <button
                      disabled={historyPage <= 1}
                      onClick={() => setHistoryPage((p) => p - 1)}
                      className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                      style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
                    >
                      ← Prev
                    </button>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Page {historyPage} · {historyTotal} records
                    </span>
                    <button
                      disabled={historyPage * LIMIT >= historyTotal}
                      onClick={() => setHistoryPage((p) => p + 1)}
                      className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-40"
                      style={{ backgroundColor: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
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

export default AdminOfflineBuyPage;
