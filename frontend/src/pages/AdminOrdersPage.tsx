import React, { useEffect, useState, useCallback } from 'react';
import { Link } from 'react-router-dom';
import { adminApi } from '../api/admin';
import { toast } from '../utils/toast';

type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

interface AdminOrder {
  _id: string;
  orderNumber?: string;
  user?: { name: string; email: string };
  createdAt: string;
  items: any[];
  totalAmount: number;
  status: OrderStatus;
  paymentStatus: string;
}

const STATUS_OPTIONS: OrderStatus[] = ['pending', 'processing', 'shipped', 'delivered', 'cancelled'];

const getStatusStyle = (status: string): React.CSSProperties => {
  const map: Record<string, React.CSSProperties> = {
    pending:    { backgroundColor: '#FEF3C7', color: '#92400E' },
    processing: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
    shipped:    { backgroundColor: '#F3E8FF', color: '#6B21A8' },
    delivered:  { backgroundColor: '#D1FAE5', color: '#065F46' },
    cancelled:  { backgroundColor: '#FEE2E2', color: '#991B1B' },
  };
  return map[status] ?? { backgroundColor: '#F3F4F6', color: '#374151' };
};

const getPaymentStyle = (status: string): React.CSSProperties => {
  const map: Record<string, React.CSSProperties> = {
    unpaid:     { backgroundColor: '#FEE2E2', color: '#991B1B' },
    paid:       { backgroundColor: '#D1FAE5', color: '#065F46' },
    pending:    { backgroundColor: '#FEF3C7', color: '#92400E' },
    refunded:   { backgroundColor: '#F3F4F6', color: '#374151' },
  };
  return map[status] ?? { backgroundColor: '#F3F4F6', color: '#374151' };
};

const AdminOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<AdminOrder[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [filterStatus, setFilterStatus] = useState<string>('all');
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkStatus, setBulkStatus] = useState<OrderStatus>('processing');
  const [bulkLoading, setBulkLoading] = useState(false);

  const fetchOrders = useCallback(async () => {
    setLoading(true);
    setSelected(new Set());
    try {
      const res = await adminApi.getAdminOrders({
        page,
        status: filterStatus !== 'all' ? filterStatus : undefined,
      });
      setOrders(res.orders as AdminOrder[]);
      setTotalPages(res.pagination.totalPages);
      setTotal(res.pagination.total);
    } catch {
      toast.error('Failed to load orders');
    } finally {
      setLoading(false);
    }
  }, [page, filterStatus]);

  useEffect(() => { fetchOrders(); }, [fetchOrders]);

  const toggleSelect = (id: string) => {
    setSelected(prev => {
      const next = new Set(prev);
      next.has(id) ? next.delete(id) : next.add(id);
      return next;
    });
  };

  const toggleAll = () => {
    if (selected.size === orders.length) {
      setSelected(new Set());
    } else {
      setSelected(new Set(orders.map(o => o._id)));
    }
  };

  const handleBulkUpdate = async () => {
    if (selected.size === 0) return;
    setBulkLoading(true);
    try {
      const res = await adminApi.bulkUpdateOrderStatus(Array.from(selected), bulkStatus);
      toast.success(res.message);
      fetchOrders();
    } catch {
      toast.error('Failed to update orders');
    } finally {
      setBulkLoading(false);
    }
  };

  return (
    <div className="min-h-screen p-6" style={{ background: 'var(--color-background)', color: 'var(--color-text)' }}>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Order Management</h1>
          <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
            {total} total order{total !== 1 ? 's' : ''}
          </p>
        </div>
        <Link
          to="/admin"
          className="text-sm px-3 py-1.5 rounded-lg"
          style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
        >
          ← Dashboard
        </Link>
      </div>

      {/* Status filter tabs */}
      <div className="flex flex-wrap gap-2 mb-4">
        {['all', ...STATUS_OPTIONS].map(s => (
          <button
            key={s}
            onClick={() => { setFilterStatus(s); setPage(1); }}
            className="px-3 py-1.5 rounded-full text-sm font-medium capitalize transition-colors"
            style={
              filterStatus === s
                ? { background: 'var(--color-accent)', color: 'white' }
                : { background: 'var(--color-panel)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }
            }
          >
            {s}
          </button>
        ))}
      </div>

      {/* Bulk action bar */}
      {selected.size > 0 && (
        <div
          className="flex flex-wrap items-center gap-3 px-4 py-3 rounded-lg mb-4"
          style={{ background: 'var(--color-panel)', border: '1px solid var(--color-accent)' }}
        >
          <span className="text-sm font-semibold">{selected.size} selected</span>
          <select
            value={bulkStatus}
            onChange={e => setBulkStatus(e.target.value as OrderStatus)}
            className="text-sm rounded px-2 py-1 border"
            style={{ background: 'var(--color-background)', color: 'var(--color-text)', borderColor: 'var(--color-border)' }}
          >
            {STATUS_OPTIONS.map(s => (
              <option key={s} value={s}>{s.charAt(0).toUpperCase() + s.slice(1)}</option>
            ))}
          </select>
          <button
            onClick={handleBulkUpdate}
            disabled={bulkLoading}
            className="px-4 py-1.5 rounded-full text-sm font-semibold text-white disabled:opacity-50"
            style={{ background: 'var(--color-accent)' }}
          >
            {bulkLoading ? 'Updating…' : 'Apply'}
          </button>
          <button
            onClick={() => setSelected(new Set())}
            className="px-3 py-1.5 rounded-full text-sm"
            style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
          >
            Clear
          </button>
        </div>
      )}

      {/* Table */}
      <div className="rounded-xl overflow-hidden" style={{ border: '1px solid var(--color-border)' }}>
        <div className="overflow-x-auto">
          <table className="w-full text-sm">
            <thead>
              <tr style={{ background: 'var(--color-panel)' }}>
                <th className="p-3 text-left">
                  <input
                    type="checkbox"
                    checked={orders.length > 0 && selected.size === orders.length}
                    onChange={toggleAll}
                    className="w-4 h-4 cursor-pointer"
                  />
                </th>
                <th className="p-3 text-left font-semibold">Order</th>
                <th className="p-3 text-left font-semibold">Customer</th>
                <th className="p-3 text-left font-semibold">Date</th>
                <th className="p-3 text-right font-semibold">Items</th>
                <th className="p-3 text-right font-semibold">Total</th>
                <th className="p-3 text-left font-semibold">Status</th>
                <th className="p-3 text-left font-semibold">Payment</th>
              </tr>
            </thead>
            <tbody>
              {loading && (
                Array.from({ length: 6 }).map((_, i) => (
                  <tr key={i} className="border-t animate-pulse" style={{ borderColor: 'var(--color-border)' }}>
                    {Array.from({ length: 8 }).map((__, j) => (
                      <td key={j} className="p-3">
                        <div className="h-4 rounded" style={{ background: 'var(--color-panel)' }} />
                      </td>
                    ))}
                  </tr>
                ))
              )}
              {!loading && orders.length === 0 && (
                <tr>
                  <td colSpan={8} className="p-8 text-center" style={{ color: 'var(--color-text-secondary)' }}>
                    No orders found
                  </td>
                </tr>
              )}
              {!loading && orders.map(order => (
                <tr
                  key={order._id}
                  className="border-t transition-colors"
                  style={{
                    borderColor: 'var(--color-border)',
                    background: selected.has(order._id) ? 'rgba(227,30,36,0.06)' : undefined,
                  }}
                >
                  <td className="p-3">
                    <input
                      type="checkbox"
                      checked={selected.has(order._id)}
                      onChange={() => toggleSelect(order._id)}
                      className="w-4 h-4 cursor-pointer"
                    />
                  </td>
                  <td className="p-3 font-mono text-xs">
                    #{order.orderNumber || order._id.slice(-6).toUpperCase()}
                  </td>
                  <td className="p-3">
                    <div className="font-medium">{order.user?.name || 'Guest'}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{order.user?.email}</div>
                  </td>
                  <td className="p-3 text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                    {new Date(order.createdAt).toLocaleDateString('id-ID', {
                      day: 'numeric', month: 'short', year: 'numeric',
                    })}
                  </td>
                  <td className="p-3 text-right">{order.items?.length || 0}</td>
                  <td className="p-3 text-right font-semibold" style={{ color: 'var(--color-accent)' }}>
                    Rp {(order.totalAmount || 0).toLocaleString('id-ID')}
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize" style={getStatusStyle(order.status)}>
                      {order.status}
                    </span>
                  </td>
                  <td className="p-3">
                    <span className="px-2 py-0.5 rounded-full text-xs font-semibold capitalize" style={getPaymentStyle(order.paymentStatus)}>
                      {order.paymentStatus}
                    </span>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      {totalPages > 1 && (
        <div className="flex items-center justify-center gap-2 mt-4">
          <button
            onClick={() => setPage(p => Math.max(1, p - 1))}
            disabled={page === 1}
            className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40"
            style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
          >
            ← Prev
          </button>
          <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
            Page {page} of {totalPages}
          </span>
          <button
            onClick={() => setPage(p => Math.min(totalPages, p + 1))}
            disabled={page === totalPages}
            className="px-3 py-1.5 rounded-lg text-sm disabled:opacity-40"
            style={{ background: 'var(--color-panel)', border: '1px solid var(--color-border)' }}
          >
            Next →
          </button>
        </div>
      )}
    </div>
  );
};

export default AdminOrdersPage;
