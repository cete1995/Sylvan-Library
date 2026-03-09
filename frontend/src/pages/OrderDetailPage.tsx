import React, { useState, useEffect } from 'react';
import { useParams, useNavigate } from 'react-router-dom';
import { orderApi, Order } from '../api/order';

const statusConfig: Record<string, { label: string; bg: string; color: string }> = {
  pending:    { label: 'Pending',    bg: '#FEF3C7', color: '#92400E' },
  processing: { label: 'Processing', bg: '#DBEAFE', color: '#1E40AF' },
  shipped:    { label: 'Shipped',    bg: '#EDE9FE', color: '#5B21B6' },
  delivered:  { label: 'Delivered',  bg: '#D1FAE5', color: '#065F46' },
  cancelled:  { label: 'Cancelled',  bg: '#FEE2E2', color: '#991B1B' },
};

const paymentConfig: Record<string, { label: string; bg: string; color: string }> = {
  paid:     { label: 'Paid',     bg: '#D1FAE5', color: '#065F46' },
  unpaid:   { label: 'Unpaid',   bg: '#FEE2E2', color: '#991B1B' },
  refunded: { label: 'Refunded', bg: '#F3F4F6', color: '#374151' },
};

const OrderDetailPage: React.FC = () => {
  const { id } = useParams<{ id: string }>();
  const navigate = useNavigate();
  const [order, setOrder] = useState<Order | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    if (id) loadOrder(id);
  }, [id]);

  const loadOrder = async (orderId: string) => {
    try {
      const data = await orderApi.getOrderById(orderId);
      setOrder(data);
    } catch {
      setError('Order not found or you do not have permission to view it.');
    } finally {
      setLoading(false);
    }
  };

  const formatPrice = (price: number) => `Rp. ${price.toLocaleString('id-ID')}`;

  const formatDate = (dateString: string) =>
    new Date(dateString).toLocaleDateString('id-ID', {
      year: 'numeric', month: 'long', day: 'numeric',
      hour: '2-digit', minute: '2-digit',
    });

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <div
            className="inline-block animate-spin rounded-full h-12 w-12 border-4 mb-4"
            style={{ borderColor: 'var(--color-accent)', borderTopColor: 'transparent' }}
          />
          <div className="text-xl" style={{ color: 'var(--color-text-secondary)' }}>Loading order...</div>
        </div>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center max-w-md px-4">
          <div className="text-6xl mb-4">📦</div>
          <h1 className="text-2xl font-bold mb-2" style={{ color: 'var(--color-text)' }}>Order Not Found</h1>
          <p className="mb-6" style={{ color: 'var(--color-text-secondary)' }}>{error}</p>
          <button
            onClick={() => navigate('/orders')}
            className="inline-flex items-center gap-2 px-6 py-3 rounded-xl font-semibold transition-all hover:opacity-80"
            style={{ backgroundColor: 'var(--color-accent)', color: 'var(--color-panel)' }}
          >
            ← Back to Orders
          </button>
        </div>
      </div>
    );
  }

  const sc = statusConfig[order.status] ?? statusConfig.pending;
  const pc = paymentConfig[order.paymentStatus] ?? paymentConfig.unpaid;

  return (
    <div className="min-h-screen pt-8 pb-28 md:pb-8" style={{ backgroundColor: 'var(--color-background)' }}>
      <div className="container mx-auto px-4 max-w-4xl">

        {/* Back */}
        <button
          onClick={() => navigate('/orders')}
          className="flex items-center gap-2 mb-6 text-sm font-semibold hover:opacity-70 transition-opacity"
          style={{ color: 'var(--color-accent)' }}
        >
          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M10 19l-7-7m0 0l7-7m-7 7h18" />
          </svg>
          Back to Orders
        </button>

        {/* Header */}
        <div className="rounded-2xl shadow-lg p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div>
              <h1 className="text-2xl font-bold mb-1" style={{ color: 'var(--color-text)' }}>{order.orderNumber}</h1>
              <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                Placed on {formatDate(order.createdAt)}
              </p>
            </div>
            <div className="flex gap-2 flex-wrap">
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: sc.bg, color: sc.color }}
              >
                {sc.label}
              </span>
              <span
                className="px-3 py-1 rounded-full text-sm font-semibold"
                style={{ backgroundColor: pc.bg, color: pc.color }}
              >
                {pc.label}
              </span>
            </div>
          </div>
        </div>

        <div className="grid md:grid-cols-3 gap-6">
          {/* Items */}
          <div className="md:col-span-2 space-y-4">
            <h2 className="text-lg font-bold" style={{ color: 'var(--color-text)' }}>
              Items ({order.items.length})
            </h2>
            {order.items.map((item, idx) => (
              <div
                key={idx}
                className="flex gap-4 rounded-xl p-4 shadow"
                style={{ backgroundColor: 'var(--color-panel)' }}
              >
                {/* Image with fallback */}
                <div
                  className="w-16 flex-shrink-0 rounded-lg overflow-hidden"
                  style={{ backgroundColor: 'var(--color-background)', minHeight: '5.5rem' }}
                >
                  {item.card.imageUrl ? (
                    <img
                      src={item.card.imageUrl}
                      alt={item.cardName}
                      className="w-full h-full object-cover"
                    />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center" style={{ minHeight: '5.5rem' }}>
                      <svg className="w-8 h-8" style={{ color: 'var(--color-text-secondary)' }} fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M4 3a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V5a2 2 0 00-2-2H4zm12 12H4l4-8 3 6 2-4 3 6z" clipRule="evenodd" />
                      </svg>
                    </div>
                  )}
                </div>

                <div className="flex-1 min-w-0">
                  <p className="font-bold mb-0.5 truncate" style={{ color: 'var(--color-text)' }}>{item.cardName}</p>
                  <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.card.setName} • {item.condition} • {item.finish}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    {item.quantity} × {formatPrice(item.pricePerUnit)}
                  </p>
                </div>

                <div className="text-right flex-shrink-0">
                  <p className="font-bold text-lg" style={{ color: 'var(--color-accent)' }}>
                    {formatPrice(item.subtotal)}
                  </p>
                </div>
              </div>
            ))}
          </div>

          {/* Summary + Shipping */}
          <div className="space-y-4">
            {/* Order Summary */}
            <div className="rounded-2xl shadow p-5" style={{ backgroundColor: 'var(--color-panel)' }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>Summary</h2>
              <div className="space-y-3 text-sm">
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal</span>
                  <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span style={{ color: 'var(--color-text-secondary)' }}>Shipping</span>
                  <span style={{ color: 'var(--color-text-secondary)' }}>Contact seller</span>
                </div>
                <div
                  className="pt-3 border-t flex justify-between"
                  style={{ borderColor: 'var(--color-border)' }}
                >
                  <span className="font-bold" style={{ color: 'var(--color-text)' }}>Total</span>
                  <span className="font-bold text-lg" style={{ color: 'var(--color-accent)' }}>
                    {formatPrice(order.totalAmount)}
                  </span>
                </div>
              </div>
            </div>

            {/* Shipping Info */}
            <div className="rounded-2xl shadow p-5" style={{ backgroundColor: 'var(--color-panel)' }}>
              <h2 className="text-lg font-bold mb-4" style={{ color: 'var(--color-text)' }}>Shipping Info</h2>
              <div className="space-y-3 text-sm">
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Address</p>
                  <p style={{ color: 'var(--color-text)' }}>{order.shippingAddress}</p>
                </div>
                <div>
                  <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Phone</p>
                  <p style={{ color: 'var(--color-text)' }}>{order.phoneNumber}</p>
                </div>
                {order.courierNotes && (
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Notes</p>
                    <p style={{ color: 'var(--color-text)' }}>{order.courierNotes}</p>
                  </div>
                )}
                {order.paymentMethod && (
                  <div>
                    <p className="text-xs font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>Payment Method</p>
                    <p className="capitalize" style={{ color: 'var(--color-text)' }}>{order.paymentMethod}</p>
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default OrderDetailPage;
