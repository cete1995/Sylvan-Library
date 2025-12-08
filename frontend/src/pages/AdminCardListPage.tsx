import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { Card } from '../types';

const AdminCardListPage: React.FC = () => {
  const [cards, setCards] = useState<Card[]>([]);
  const [loading, setLoading] = useState(false);
  const [searchQuery, setSearchQuery] = useState('');
  const [includeInactive, setIncludeInactive] = useState(false);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(0);

  useEffect(() => {
    loadCards();
  }, [page, includeInactive]);

  const loadCards = async () => {
    setLoading(true);
    try {
      const data = await adminApi.getAdminCards({
        q: searchQuery || undefined,
        includeInactive,
        page,
        limit: 50,
      });
      setCards(data.cards);
      setTotalPages(data.pagination.totalPages);
    } catch (error) {
      console.error('Failed to load cards:', error);
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
    if (!window.confirm(`Are you sure you want to delete "${name}"?`)) {
      return;
    }

    try {
      await adminApi.deleteCard(id);
      loadCards();
    } catch (error: any) {
      alert('Failed to delete card: ' + (error.response?.data?.error || error.message));
    }
  };

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex justify-between items-center mb-6">
        <h1 className="text-4xl font-bold">Manage Cards</h1>
        <Link to="/admin/cards/new" className="btn-primary">
          + Add New Card
        </Link>
      </div>

      {/* Search and Filters */}
      <div className="bg-white rounded-lg shadow p-4 mb-6">
        <form onSubmit={handleSearch} className="flex gap-4 items-end">
          <div className="flex-1">
            <label className="label">Search</label>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by card name..."
              className="input"
            />
          </div>

          <div className="flex items-center gap-2">
            <input
              type="checkbox"
              id="includeInactive"
              checked={includeInactive}
              onChange={(e) => setIncludeInactive(e.target.checked)}
              className="w-4 h-4"
            />
            <label htmlFor="includeInactive" className="text-sm">
              Include deleted
            </label>
          </div>

          <button type="submit" className="btn-primary">
            Search
          </button>
        </form>
      </div>

      {/* Cards Table */}
      {loading ? (
        <div className="text-center py-12">Loading...</div>
      ) : cards.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-xl text-gray-600 mb-4">No cards found</p>
          <Link to="/admin/cards/new" className="btn-primary">
            Add Your First Card
          </Link>
        </div>
      ) : (
        <>
          <div className="bg-white rounded-lg shadow overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-gray-50 border-b">
                  <tr>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Name</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Set</th>
                    <th className="px-4 py-3 text-left text-sm font-semibold">Condition</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Owned</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">For Sale</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Buy Price</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Sell Price</th>
                    <th className="px-4 py-3 text-right text-sm font-semibold">Actions</th>
                  </tr>
                </thead>
                <tbody className="divide-y">
                  {cards.map((card) => {
                    const inventory = card.inventory || [];
                    const totalOwned = inventory.reduce((sum, item) => sum + item.quantityOwned, 0);
                    const totalForSale = inventory.reduce((sum, item) => sum + item.quantityForSale, 0);
                    const lowestPrice = inventory.length > 0 
                      ? Math.min(...inventory.map(item => item.sellPrice))
                      : 0;
                    const conditions = [...new Set(inventory.map(item => item.condition))].join(', ') || '-';
                    
                    return (
                      <tr
                        key={card._id}
                        className={!card.isActive ? 'bg-gray-100 opacity-60' : 'hover:bg-gray-50'}
                      >
                        <td className="px-4 py-3">
                          <div className="font-medium">{card.name}</div>
                          {!card.isActive && (
                            <span className="text-xs text-red-600">(Deleted)</span>
                          )}
                        </td>
                        <td className="px-4 py-3 text-sm">{card.setCode}</td>
                        <td className="px-4 py-3 text-sm">{conditions}</td>
                        <td className="px-4 py-3 text-right">{totalOwned}</td>
                        <td className="px-4 py-3 text-right">{totalForSale}</td>
                        <td className="px-4 py-3 text-right">-</td>
                        <td className="px-4 py-3 text-right font-medium">Rp. {lowestPrice.toFixed(0)}</td>
                        <td className="px-4 py-3 text-right">
                          <div className="flex gap-2 justify-end">
                            <Link
                              to={`/admin/cards/edit/${card._id}`}
                              className="text-primary-600 hover:underline text-sm"
                            >
                              Edit
                            </Link>
                            {card.isActive && (
                            <button
                              onClick={() => handleDelete(card._id, card.name)}
                              className="text-red-600 hover:underline text-sm"
                            >
                              Delete
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                    )
                  })}
                </tbody>
              </table>
            </div>
          </div>

          {/* Pagination */}
          {totalPages > 1 && (
            <div className="flex justify-center gap-2 mt-6">
              <button
                onClick={() => setPage((p) => Math.max(1, p - 1))}
                disabled={page === 1}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Previous
              </button>
              <span className="px-4 py-2">
                Page {page} of {totalPages}
              </span>
              <button
                onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
                disabled={page === totalPages}
                className="px-4 py-2 border rounded disabled:opacity-50"
              >
                Next
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
};

export default AdminCardListPage;
