import React, { useState, useEffect, useMemo } from 'react';
import { Link, useSearchParams } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { Card } from '../types';

type SortField = 'name' | 'setCode' | 'owned' | 'forSale' | 'webPrice' | 'marketplace';
type SortDir = 'asc' | 'desc';

const SortIcon: React.FC<{ active: boolean; dir: SortDir }> = ({ active, dir }) => (
  <svg
    className={`w-3.5 h-3.5 transition-opacity ${active ? 'opacity-100' : 'opacity-30'}`}
    fill="none" stroke="currentColor" viewBox="0 0 24 24"
  >
    {active && dir === 'asc'
      ? <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 15l7-7 7 7" />
      : <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M19 9l-7 7-7-7" />}
  </svg>
);

const AdminCardListPage: React.FC = () => {
  const [searchParams] = useSearchParams();
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState(searchParams.get('set') || '');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [missingImages, setMissingImages] = useState(searchParams.get('missingImages') === 'true');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);
  const [expandedCards, setExpandedCards] = useState<Set<string>>(new Set());
  const [sortField, setSortField] = useState<SortField>('name');
  const [sortDir, setSortDir] = useState<SortDir>('asc');

  const toggleCardExpansion = (cardId: string) => {
    setExpandedCards(prev => {
      const next = new Set(prev);
      next.has(cardId) ? next.delete(cardId) : next.add(cardId);
      return next;
    });
  };

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortDir(d => d === 'asc' ? 'desc' : 'asc');
    } else {
      setSortField(field);
      setSortDir('asc');
    }
  };

  useEffect(() => { loadCards(); }, [page, includeInactive, missingImages]);

  useEffect(() => {
    const setParam = searchParams.get('set');
    const missingParam = searchParams.get('missingImages');
    if (setParam) setSearchQuery(setParam);
    if (missingParam === 'true') setMissingImages(true);
  }, [searchParams]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAdminCards({
        q: searchQuery || undefined,
        includeInactive,
        missingImages,
        page,
        limit: 50,
      });
      setCards(data.cards);
      setTotalPages(data.pagination.totalPages);
    } catch {
      // error shown via empty state
    } finally {
      setLoading(false);
    }
  };

  const handleSearch = (e: React.FormEvent) => {
    e.preventDefault();
    setPage(1);
    loadCards();
  };

  const handleDelete = async (id: string, name: string) => {
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) return;
    try {
      await adminApi.deleteCard(id);
      loadCards();
    } catch (error: any) {
      alert('Failed to delete card: ' + (error.response?.data?.error || error.message));
    }
  };

  const sortedCards = useMemo(() => {
    const getStats = (card: Card) => {
      const inv = card.inventory || [];
      const owned = inv.reduce((s, i) => s + i.quantityOwned, 0);
      const forSale = inv.reduce((s, i) => s + i.quantityForSale, 0);
      const webPrice = inv.length > 0 ? Math.min(...inv.map(i => i.sellPrice)) : 0;
      const marketplace = inv.length > 0 ? Math.min(...inv.map(i => i.marketplacePrice || 0)) : 0;
      return { owned, forSale, webPrice, marketplace };
    };
    return [...cards].sort((a, b) => {
      let cmp = 0;
      if (sortField === 'name') cmp = a.name.localeCompare(b.name);
      else if (sortField === 'setCode') cmp = a.setCode.localeCompare(b.setCode);
      else {
        const sa = getStats(a);
        const sb = getStats(b);
        if (sortField === 'owned') cmp = sa.owned - sb.owned;
        else if (sortField === 'forSale') cmp = sa.forSale - sb.forSale;
        else if (sortField === 'webPrice') cmp = sa.webPrice - sb.webPrice;
        else if (sortField === 'marketplace') cmp = sa.marketplace - sb.marketplace;
      }
      return sortDir === 'asc' ? cmp : -cmp;
    });
  }, [cards, sortField, sortDir]);

  const thClass = "px-5 py-3.5 text-xs font-bold uppercase tracking-wider select-none cursor-pointer transition-colors hover:opacity-80";

  return (
    <div className="min-h-screen" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 py-8 max-w-7xl">

        {/* Back link */}
        <Link
          to="/admin/dashboard"
          className="inline-flex items-center gap-1.5 text-sm mb-4 hover:opacity-80"
          style={{ color: 'var(--color-accent)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
          </svg>
          Back to Dashboard
        </Link>

        {/* Header */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-8">
          <div>
            <div className="flex items-center gap-3 mb-1">
              <div className="w-2 h-6 rounded-full" style={{ backgroundColor: '#7C3AED' }}></div>
              <h1 className="text-3xl font-extrabold tracking-tight" style={{ color: 'var(--color-text)' }}>Card Inventory</h1>
            </div>
            <p className="text-sm ml-5" style={{ color: 'var(--color-text-secondary)' }}>Browse and manage your MTG card collection</p>
          </div>
          <Link
            to="/admin/cards/new"
            className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow hover:opacity-90 transition-all"
            style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M12 4v16m8-8H4" />
            </svg>
            Add New Card
          </Link>
        </div>

        {/* Search and Filters */}
        <div className="rounded-2xl shadow-sm border p-5 mb-6" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
          <form onSubmit={handleSearch} className="flex flex-col md:flex-row gap-3 items-end">
            <div className="flex-1">
              <label className="block text-xs font-semibold uppercase tracking-wide mb-1.5" style={{ color: 'var(--color-text-secondary)' }}>
                Search Cards
              </label>
              <div className="relative">
                <svg className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                </svg>
                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Card name, set code..."
                  className="w-full pl-9 pr-4 py-2.5 rounded-xl text-sm focus:ring-2 focus:ring-purple-500 focus:outline-none transition-all"
                  style={{
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)'
                  }}
                />
              </div>
            </div>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer hover:opacity-80 transition-all"
              style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
              <input
                type="checkbox"
                checked={includeInactive}
                onChange={(e) => setIncludeInactive(e.target.checked)}
                className="w-4 h-4 accent-purple-600"
              />
              <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--color-text)' }}>Include deleted</span>
            </label>

            <label className="flex items-center gap-2 px-4 py-2.5 rounded-xl cursor-pointer hover:opacity-80 transition-all"
              style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
              <input
                type="checkbox"
                checked={missingImages}
                onChange={(e) => setMissingImages(e.target.checked)}
                className="w-4 h-4 accent-red-600"
              />
              <svg className="w-3.5 h-3.5 text-red-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
              </svg>
              <span className="text-sm font-medium whitespace-nowrap" style={{ color: 'var(--color-text)' }}>Missing images</span>
            </label>

            <button
              type="submit"
              className="px-6 py-2.5 rounded-xl font-bold text-sm hover:opacity-90 transition-all shadow-sm"
              style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}
            >
              Search
            </button>
          </form>
        </div>

        {/* Table Area */}
        {loading ? (
          <div className="rounded-2xl border p-16 text-center" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
            <div className="inline-block animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600 mb-4"></div>
            <div className="text-base font-medium" style={{ color: 'var(--color-text-secondary)' }}>Loading cards...</div>
          </div>
        ) : cards.length === 0 ? (
          <div className="rounded-2xl border p-16 text-center" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
            <div className="w-16 h-16 rounded-2xl flex items-center justify-center mx-auto mb-4" style={{ backgroundColor: '#EDE9FE' }}>
              <svg className="w-8 h-8" style={{ color: '#7C3AED' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={1.5} d="M20 13V6a2 2 0 00-2-2H6a2 2 0 00-2 2v7m16 0v5a2 2 0 01-2 2H6a2 2 0 01-2-2v-5m16 0h-2.586a1 1 0 00-.707.293l-2.414 2.414a1 1 0 01-.707.293h-3.172a1 1 0 01-.707-.293l-2.414-2.414A1 1 0 006.586 13H4" />
              </svg>
            </div>
            <p className="text-lg font-bold mb-1" style={{ color: 'var(--color-text)' }}>No cards found</p>
            <p className="text-sm mb-6" style={{ color: 'var(--color-text-secondary)' }}>Start your collection by adding the first card</p>
            <Link
              to="/admin/cards/new"
              className="inline-flex items-center gap-2 px-5 py-2.5 rounded-xl font-bold text-sm text-white shadow hover:opacity-90"
              style={{ background: 'linear-gradient(135deg,#2563EB,#7C3AED)' }}
            >
              <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
              </svg>
              Add Your First Card
            </Link>
          </div>
        ) : (
          <>
            {/* Result count + hint */}
            <div className="flex items-center justify-between mb-3">
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{cards.length}</span> cards on this page
                {totalPages > 1 && <> &middot; page <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{page}</span> of <span className="font-semibold" style={{ color: 'var(--color-text)' }}>{totalPages}</span></>}
              </p>
              <p className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>Click column headers to sort &middot; Click a row to expand sellers</p>
            </div>

            <div className="rounded-2xl border overflow-hidden shadow-sm" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr style={{ backgroundColor: 'var(--color-background)', borderBottom: '1px solid var(--color-border)' }}>
                      <th className={`${thClass} text-left`} style={{ color: 'var(--color-text-secondary)' }} onClick={() => handleSort('name')}>
                        <div className="flex items-center gap-1.5">Card <SortIcon active={sortField === 'name'} dir={sortDir} /></div>
                      </th>
                      <th className={`${thClass} text-left`} style={{ color: 'var(--color-text-secondary)' }} onClick={() => handleSort('setCode')}>
                        <div className="flex items-center gap-1.5">Set <SortIcon active={sortField === 'setCode'} dir={sortDir} /></div>
                      </th>
                      <th className={`${thClass} text-right`} style={{ color: '#8B5CF6' }} onClick={() => handleSort('owned')}>
                        <div className="flex items-center justify-end gap-1.5">Owned <SortIcon active={sortField === 'owned'} dir={sortDir} /></div>
                      </th>
                      <th className={`${thClass} text-right`} style={{ color: '#10B981' }} onClick={() => handleSort('forSale')}>
                        <div className="flex items-center justify-end gap-1.5">For Sale <SortIcon active={sortField === 'forSale'} dir={sortDir} /></div>
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Buy Price
                      </th>
                      <th className={`${thClass} text-right`} style={{ color: '#10B981' }} onClick={() => handleSort('webPrice')}>
                        <div className="flex items-center justify-end gap-1.5">Web Price <SortIcon active={sortField === 'webPrice'} dir={sortDir} /></div>
                      </th>
                      <th className={`${thClass} text-right`} style={{ color: '#3B82F6' }} onClick={() => handleSort('marketplace')}>
                        <div className="flex items-center justify-end gap-1.5">Marketplace <SortIcon active={sortField === 'marketplace'} dir={sortDir} /></div>
                      </th>
                      <th className="px-5 py-3.5 text-right text-xs font-bold uppercase tracking-wider" style={{ color: 'var(--color-text-secondary)' }}>
                        Actions
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {sortedCards.map((card) => {
                      const inventory = card.inventory || [];
                      const totalOwned = inventory.reduce((s, i) => s + i.quantityOwned, 0);
                      const totalForSale = inventory.reduce((s, i) => s + i.quantityForSale, 0);

                      const nonfoilInv = inventory.filter(i => i.finish === 'nonfoil');
                      const foilInv = inventory.filter(i => i.finish !== 'nonfoil');
                      const lowestNonfoilPrice = nonfoilInv.length > 0 ? Math.min(...nonfoilInv.map(i => i.sellPrice)) : null;
                      const lowestFoilPrice = foilInv.length > 0 ? Math.min(...foilInv.map(i => i.sellPrice)) : null;
                      const nonfoilMarketPrices = nonfoilInv.map(i => i.marketplacePrice || 0).filter(p => p > 0);
                      const foilMarketPrices = foilInv.map(i => i.marketplacePrice || 0).filter(p => p > 0);
                      const lowestNonfoilMarket = nonfoilMarketPrices.length > 0 ? Math.min(...nonfoilMarketPrices) : null;
                      const lowestFoilMarket = foilMarketPrices.length > 0 ? Math.min(...foilMarketPrices) : null;

                      const sellerMap = inventory.reduce((acc, item) => {
                        if (!item.sellerId) return acc;
                        if (!acc[item.sellerId]) acc[item.sellerId] = { sellerId: item.sellerId, sellerName: item.sellerName || item.sellerId, items: [] };
                        acc[item.sellerId].items.push(item);
                        return acc;
                      }, {} as Record<string, { sellerId: string; sellerName: string; items: typeof inventory }>);
                      const sellers = Object.values(sellerMap);
                      const isExpanded = expandedCards.has(card._id);
                      const isDeleted = !card.isActive;

                      return (
                        <React.Fragment key={card._id}>
                          <tr
                            className="transition-colors cursor-pointer"
                            style={{
                              borderBottom: '1px solid var(--color-border)',
                              backgroundColor: isDeleted
                                ? 'rgba(220,38,38,0.05)'
                                : isExpanded
                                  ? 'rgba(124,58,237,0.05)'
                                  : undefined,
                            }}
                            onMouseEnter={e => { if (!isDeleted && !isExpanded) (e.currentTarget as HTMLElement).style.backgroundColor = 'rgba(124,58,237,0.04)'; }}
                            onMouseLeave={e => { if (!isDeleted && !isExpanded) (e.currentTarget as HTMLElement).style.backgroundColor = ''; }}
                            onClick={() => toggleCardExpansion(card._id)}
                          >
                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-3">
                                <svg className={`w-4 h-4 flex-shrink-0 transition-transform ${isExpanded ? 'rotate-90' : ''}`}
                                  style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                                </svg>
                                {card.imageUrl ? (
                                  <img src={card.imageUrl} alt={card.name}
                                    className="w-12 h-16 object-cover rounded-lg flex-shrink-0 shadow-sm"
                                    style={{ border: '1px solid var(--color-border)' }} />
                                ) : (
                                  <div className="w-12 h-16 rounded-lg flex items-center justify-center flex-shrink-0 shadow-sm"
                                    style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                                    <svg className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} fill="currentColor" viewBox="0 0 20 20">
                                      <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                                    </svg>
                                  </div>
                                )}
                                <div className="min-w-0">
                                  <div className="font-semibold text-sm leading-tight" style={{ color: 'var(--color-text)' }}>{card.name}</div>
                                  <div className="flex flex-wrap gap-1 mt-1">
                                    {sellers.length > 0 && (
                                      <span className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold text-white" style={{ backgroundColor: '#7C3AED' }}>
                                        {sellers.length}s
                                      </span>
                                    )}
                                    {Array.from(new Set(inventory.map(i => i.finish))).map(finish => (
                                      finish === 'nonfoil' ? (
                                        <span key={finish} className="inline-flex items-center px-1.5 py-0.5 rounded-full text-xs font-semibold" style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}>
                                          Normal
                                        </span>
                                      ) : finish === 'foil' ? (
                                        <span key={finish} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#FEF9C3', color: '#B45309' }}>
                                          &#10022; Foil
                                        </span>
                                      ) : (
                                        <span key={finish} className="inline-flex items-center gap-0.5 px-1.5 py-0.5 rounded-full text-xs font-bold" style={{ backgroundColor: '#EEF2FF', color: '#4F46E5' }}>
                                          &#10022; {finish.charAt(0).toUpperCase() + finish.slice(1)}
                                        </span>
                                      )
                                    ))}
                                    {!card.imageUrl && (
                                      <span className="inline-flex px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">No img</span>
                                    )}
                                    {isDeleted && (
                                      <span className="inline-flex px-1.5 py-0.5 rounded-full text-xs font-semibold bg-red-100 text-red-700">Deleted</span>
                                    )}
                                  </div>
                                </div>
                              </div>
                            </td>

                            <td className="px-5 py-3.5">
                              <div className="flex items-center gap-2">
                                <i className={`ss ss-${card.setCode.toLowerCase()} ss-${card.rarity.toLowerCase()} ss-2x flex-shrink-0`}
                                  style={{ color: card.rarity.toLowerCase() === 'common' ? 'var(--color-text)' : undefined }} />
                                <span className="text-xs font-bold tracking-wide" style={{ color: 'var(--color-text-secondary)' }}>
                                  {card.setCode.toUpperCase()}
                                </span>
                              </div>
                            </td>

                            <td className="px-5 py-3.5 text-right">
                              <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg text-xs font-bold"
                                style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}>{totalOwned}</span>
                            </td>

                            <td className="px-5 py-3.5 text-right">
                              <span className="inline-flex items-center justify-center min-w-[2rem] px-2 py-0.5 rounded-lg text-xs font-bold"
                                style={{ backgroundColor: '#D1FAE5', color: '#059669' }}>{totalForSale}</span>
                            </td>

                            <td className="px-5 py-3.5 text-right text-xs" style={{ color: 'var(--color-text-secondary)' }}>&mdash;</td>

                            <td className="px-5 py-3.5 text-right">
                              {lowestNonfoilPrice !== null ? (
                                <div className="text-sm font-semibold" style={{ color: '#10B981' }}>
                                  Rp {lowestNonfoilPrice.toLocaleString('id-ID')}
                                </div>
                              ) : (
                                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>&mdash;</div>
                              )}
                              {lowestFoilPrice !== null && (
                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                  <span className="text-xs px-1 py-0.5 rounded font-bold" style={{ backgroundColor: '#FEF9C3', color: '#B45309' }}>&#10022; Foil</span>
                                  <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>Rp {lowestFoilPrice.toLocaleString('id-ID')}</span>
                                </div>
                              )}
                            </td>

                            <td className="px-5 py-3.5 text-right">
                              {lowestNonfoilMarket !== null ? (
                                <div className="text-sm font-semibold" style={{ color: '#3B82F6' }}>
                                  Rp {lowestNonfoilMarket.toLocaleString('id-ID')}
                                </div>
                              ) : (
                                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>&mdash;</div>
                              )}
                              {lowestFoilMarket !== null && (
                                <div className="flex items-center justify-end gap-1 mt-0.5">
                                  <span className="text-xs px-1 py-0.5 rounded font-bold" style={{ backgroundColor: '#FEF9C3', color: '#B45309' }}>&#10022; Foil</span>
                                  <span className="text-xs font-semibold" style={{ color: '#F59E0B' }}>Rp {lowestFoilMarket.toLocaleString('id-ID')}</span>
                                </div>
                              )}
                            </td>

                            <td className="px-5 py-3.5 text-right" onClick={e => e.stopPropagation()}>
                              <div className="flex gap-1.5 justify-end">
                                <Link to={`/admin/cards/edit/${card._id}`}
                                  className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-all"
                                  style={{ backgroundColor: '#EDE9FE', color: '#7C3AED' }}>
                                  <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                                  </svg>
                                  Edit
                                </Link>
                                {card.isActive && (
                                  <button
                                    onClick={e => { e.stopPropagation(); handleDelete(card._id, card.name); }}
                                    className="inline-flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-semibold hover:opacity-80 transition-all"
                                    style={{ backgroundColor: '#FEE2E2', color: '#DC2626' }}>
                                    <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                                    </svg>
                                    Del
                                  </button>
                                )}
                              </div>
                            </td>
                          </tr>

                          {/* Expanded row */}
                          {isExpanded && (
                            <tr>
                              <td colSpan={8} style={{ backgroundColor: 'rgba(124,58,237,0.03)', borderBottom: '1px solid var(--color-border)' }}>
                                <div className="px-6 py-4 ml-10">
                                  {sellers.length === 0 ? (
                                    <p className="text-sm italic" style={{ color: 'var(--color-text-secondary)' }}>No seller inventory &mdash; admin-only stock.</p>
                                  ) : (
                                    <>
                                      <div className="flex items-center gap-2 mb-3">
                                        <div className="w-1.5 h-4 rounded-full" style={{ backgroundColor: '#7C3AED' }}></div>
                                        <h4 className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>Seller Inventory Breakdown</h4>
                                      </div>
                                      <div className="grid gap-3">
                                        {sellers.map(seller => {
                                          const sOwned = seller.items.reduce((s, i) => s + i.quantityOwned, 0);
                                          const sForSale = seller.items.reduce((s, i) => s + i.quantityForSale, 0);
                                          return (
                                            <div key={seller.sellerId} className="rounded-xl border p-4"
                                              style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
                                              <div className="flex items-center justify-between mb-3">
                                                <div className="flex items-center gap-2">
                                                  <div className="w-7 h-7 rounded-lg flex items-center justify-center" style={{ backgroundColor: '#EDE9FE' }}>
                                                    <svg className="w-4 h-4" style={{ color: '#7C3AED' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 7a4 4 0 11-8 0 4 4 0 018 0zM12 14a7 7 0 00-7 7h14a7 7 0 00-7-7z" />
                                                    </svg>
                                                  </div>
                                                  <span className="font-bold text-sm" style={{ color: 'var(--color-text)' }}>{seller.sellerName}</span>
                                                </div>
                                                <div className="flex gap-4">
                                                  <div className="text-center">
                                                    <div className="text-xs mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>Owned</div>
                                                    <div className="font-bold text-base" style={{ color: '#7C3AED' }}>{sOwned}</div>
                                                  </div>
                                                  <div className="text-center">
                                                    <div className="text-xs mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>For Sale</div>
                                                    <div className="font-bold text-base" style={{ color: '#10B981' }}>{sForSale}</div>
                                                  </div>
                                                </div>
                                              </div>
                                              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-2">
                                                {seller.items.map((item, i) => (
                                                  <div key={i} className="rounded-lg p-3 text-xs"
                                                    style={{ backgroundColor: 'var(--color-background)', border: '1px solid var(--color-border)' }}>
                                                    <div className="flex gap-1.5 mb-2">
                                                      <span className={`px-1.5 py-0.5 rounded font-bold ${
                                                        item.condition === 'NM' ? 'bg-green-100 text-green-700' :
                                                        item.condition === 'LP' ? 'bg-yellow-100 text-yellow-700' :
                                                        'bg-orange-100 text-orange-700'}`}>
                                                        {item.condition}
                                                      </span>
                                                      <span className={`px-1.5 py-0.5 rounded font-semibold ${
                                                        item.finish === 'foil' ? 'bg-purple-100 text-purple-700' :
                                                        item.finish === 'etched' ? 'bg-blue-100 text-blue-700' :
                                                        'bg-gray-100 text-gray-600'}`}>
                                                        {item.finish}
                                                      </span>
                                                    </div>
                                                    <div className="grid grid-cols-2 gap-x-3 gap-y-1.5">
                                                      <div>
                                                        <div style={{ color: 'var(--color-text-secondary)' }}>Owned</div>
                                                        <div className="font-semibold" style={{ color: 'var(--color-text)' }}>{item.quantityOwned}</div>
                                                      </div>
                                                      <div>
                                                        <div style={{ color: 'var(--color-text-secondary)' }}>For Sale</div>
                                                        <div className="font-semibold" style={{ color: 'var(--color-text)' }}>{item.quantityForSale}</div>
                                                      </div>
                                                      <div>
                                                        <div style={{ color: 'var(--color-text-secondary)' }}>Buy</div>
                                                        <div className="font-semibold" style={{ color: 'var(--color-text)' }}>Rp {item.buyPrice.toLocaleString('id-ID')}</div>
                                                      </div>
                                                      <div>
                                                        <div style={{ color: 'var(--color-text-secondary)' }}>Web</div>
                                                        <div className="font-semibold" style={{ color: '#10B981' }}>Rp {item.sellPrice.toLocaleString('id-ID')}</div>
                                                      </div>
                                                      <div className="col-span-2">
                                                        <div style={{ color: 'var(--color-text-secondary)' }}>Marketplace</div>
                                                        <div className="font-semibold" style={{ color: '#3B82F6' }}>Rp {(item.marketplacePrice || 0).toLocaleString('id-ID')}</div>
                                                      </div>
                                                    </div>
                                                  </div>
                                                ))}
                                              </div>
                                            </div>
                                          );
                                        })}
                                      </div>
                                    </>
                                  )}
                                </div>
                              </td>
                            </tr>
                          )}
                        </React.Fragment>
                      );
                    })}
                  </tbody>
                </table>
              </div>
            </div>

            {/* Pagination */}
            {totalPages > 1 && (
              <div className="flex flex-col sm:flex-row items-center justify-between gap-3 mt-5 rounded-2xl border p-4"
                style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
                <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  Page <span className="font-bold" style={{ color: 'var(--color-text)' }}>{page}</span> of <span className="font-bold" style={{ color: 'var(--color-text)' }}>{totalPages}</span>
                </p>
                <div className="flex gap-2">
                  <button onClick={() => setPage(p => Math.max(1, p - 1))} disabled={page === 1}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 hover:opacity-80 transition-all"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                    </svg>
                    Prev
                  </button>
                  <button onClick={() => setPage(p => Math.min(totalPages, p + 1))} disabled={page === totalPages}
                    className="inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-sm font-semibold disabled:opacity-40 hover:opacity-80 transition-all"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}>
                    Next
                    <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5l7 7-7 7" />
                    </svg>
                  </button>
                </div>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
};

export default AdminCardListPage;
