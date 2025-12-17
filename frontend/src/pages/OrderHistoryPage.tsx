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

  const getStatusColor = (status: string): string => {
    switch (status) {
      case 'pending':
        return 'badge-warning';
      case 'processing':
        return 'badge-info';
      case 'shipped':
        return 'badge-info';
      case 'delivered':
        return 'badge-success';
      case 'cancelled':
        return 'badge-error';
      default:
        return 'badge-gray';
    }
  };

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'badge-success';
      case 'unpaid':
        return 'badge-error';
      case 'refunded':
        return 'badge-gray';
      default:
        return 'badge-gray';
    }
  };

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-8">
        <div className="text-center">Loading orders...</div>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="max-w-6xl mx-auto">
        <div className="mb-6 flex justify-between items-center">
          <div>
            <h1 className="text-3xl font-bold" style={{ color: 'var(--color-text)' }}>Order History</h1>
            <p className="mt-2" style={{ color: 'var(--color-text-secondary)' }}>View all your past orders</p>
          </div>
          <Link to="/profile" className="btn-secondary">
            Back to Profile
          </Link>
        </div>

        {error && (
          <div className="alert-error mb-4">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="rounded-lg shadow-md p-8 text-center" style={{ backgroundColor: 'var(--color-panel)' }}>
            <p className="text-lg mb-4" style={{ color: 'var(--color-text-secondary)' }}>You haven't placed any orders yet</p>
            <Link to="/cards" className="btn-primary">
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
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getStatusColor(order.status)}`}>
                      {order.status.charAt(0).toUpperCase() + order.status.slice(1)}
                    </span>
                    <span className={`px-3 py-1 rounded-full text-sm font-semibold ${getPaymentStatusColor(order.paymentStatus)}`}>
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
                      <img
                        src={item.card.imageUrl}
                        alt={item.cardName}
                        className="w-16 h-16 object-cover rounded border"
                        style={{ borderColor: 'var(--color-border)' }}
                      />
                      <div className="flex-1">
                        <p className="font-semibold" style={{ color: 'var(--color-text)' }}>{item.cardName}</p>
                        <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                          {item.card.setName} • {item.condition} • {item.finish}
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
