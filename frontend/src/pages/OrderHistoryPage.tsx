import React, { useState, useEffect } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { orderApi, Order } from '../api/order';

const OrderHistoryPage: React.FC = () => {
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const navigate = useNavigate();

  useEffect(() => {
    loadOrders();
  }, []);

  const loadOrders = async () => {
    try {
      setLoading(true);
      const data = await orderApi.getUserOrders();
      setOrders(data);
    } catch (err: any) {
      setError('Failed to load order history');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number): string => {
    return `Rp. ${price.toLocaleString('id-ID')}`;
  };

  const formatDate = (dateString: string): string => {
    return new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric',
      month: 'long',
      day: 'numeric',
    });
  };

  const getStatusStyle = (status: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      pending:    { backgroundColor: '#FEF3C7', color: '#92400E' },
      processing: { backgroundColor: '#DBEAFE', color: '#1E40AF' },
      shipped:    { backgroundColor: '#EDE9FE', color: '#5B21B6' },
      delivered:  { backgroundColor: '#D1FAE5', color: '#065F46' },
      cancelled:  { backgroundColor: '#FEE2E2', color: '#991B1B' },
    };
    return map[status] ?? { backgroundColor: '#F3F4F6', color: '#374151' };
  };

  const getPaymentStyle = (status: string): React.CSSProperties => {
    const map: Record<string, React.CSSProperties> = {
      paid:     { backgroundColor: '#D1FAE5', color: '#065F46' },
      unpaid:   { backgroundColor: '#FEE2E2', color: '#991B1B' },
      refunded: { backgroundColor: '#F3F4F6', color: '#374151' },
    };
    return map[status] ?? { backgroundColor: '#F3F4F6', color: '#374151' };
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 mb-4"
            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
          />
          <div className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>Loading orders...</div>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-28 md:pb-0" style={{ backgroundColor: 'var(--color-background)' }}>

      {/* ── Branded header banner ── */}
      <div className="relative overflow-hidden" style={{ background: 'linear-gradient(135deg, #060918 0%, #0d1440 60%, #111e55 100%)' }}>
        <div className="absolute -top-12 -right-12 w-48 h-48 rounded-full opacity-[0.07]" style={{ backgroundColor: '#E31E24' }} />
        <div className="container mx-auto px-4 py-8 max-w-6xl">
          <div className="flex flex-col sm:flex-row sm:items-end sm:justify-between gap-3">
            <div>
              <p className="text-xs font-semibold uppercase tracking-widest mb-1" style={{ color: '#fca5a5' }}>MTG Singles</p>
              <h1 className="text-3xl md:text-4xl font-extrabold text-white">📦 Order History</h1>
              <p className="text-sm mt-1" style={{ color: 'rgba(255,255,255,0.6)' }}>View all your past MTG card orders</p>
            </div>
            <Link to="/profile" className="self-start sm:self-auto px-4 py-2 rounded-xl text-sm font-semibold transition-all hover:opacity-80"
              style={{ backgroundColor: 'rgba(255,255,255,0.15)', color: 'white', border: '1px solid rgba(255,255,255,0.25)' }}>
              ← My Profile
            </Link>
          </div>
        </div>
      </div>

      <div className="container mx-auto px-4 py-8 max-w-6xl">

        {error && (
          <div className="mb-4 px-4 py-3 rounded-xl text-sm font-medium" style={{ backgroundColor: '#FEE2E2', color: '#DC2626', border: '1px solid #FCA5A5' }}>
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-lg shadow-md p-8 text-center" style={{ backgroundColor: 'var(--color-panel)' }}>
            <p className="text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>You haven't placed any orders yet</p>
            <Link to="/catalog" className="btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="rounded-lg shadow-md p-6" style={{ backgroundColor: 'var(--color-panel)' }}>
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg" style={{ color: 'var(--color-text)' }}>{order.orderNumber}</h3>
                    <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(order.createdAt)}</p>
                  </div>
                  <div className="flex gap-2">
                    <span className="px-3 py-1 rounded-full text-sm font-semibold" style={getStatusStyle(order.status)}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className="px-3 py-1 rounded-full text-sm font-semibold" style={getPaymentStyle(order.paymentStatus)}>
                      {order.paymentStatus.charAt(0).toUpperCase() + order.paymentStatus.slice(1)}
                    </span>
                  </div>
                </div>

                <div className="border-t border-b py-4 mb-4" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Shipping Address</p>
                      <p className="font-medium" style={{ color: 'var(--color-text)' }}>{order.shippingAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Phone Number</p>
                      <p className="font-medium" style={{ color: 'var(--color-text)' }}>{order.phoneNumber}</p>
                    </div>
                    {order.courierNotes && (
                      <div className="md:col-span-2">
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Courier Notes</p>
                        <p className="font-medium" style={{ color: 'var(--color-text)' }}>{order.courierNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <p className="font-semibold text-sm" style={{ color: 'var(--color-text)' }}>
                    Items ({order.items.length})
                  </p>
                  {order.items.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center">
                      {item.card?.imageUrl ? (
                        <img
                          src={item.card.imageUrl}
                          alt={item.cardName}
                          className="w-16 h-16 object-cover rounded border"
                          style={{ borderColor: 'var(--color-border)' }}
                        />
                      ) : (
                        <div
                          className="w-16 h-16 rounded border flex items-center justify-center"
                          style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
                        >
                          <svg className="w-8 h-8" style={{ color: 'var(--color-text-secondary)' }} fill="currentColor" viewBox="0 0 20 20">
                            <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                          </svg>
                        </div>
                      )}
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{item.cardName}</p>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {item.card?.setName} • {item.condition} • {item.finish}
                        </p>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {item.quantity} × {formatPrice(item.pricePerUnit)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold" style={{ color: 'var(--color-accent)' }}>{formatPrice(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                    Total: {formatPrice(order.totalAmount)}
                  </div>
                  <button
                    onClick={() => navigate(`/orders/${order._id}`)}
                    className="btn-secondary"
                  >
                    View Details
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

export default OrderHistoryPage;
