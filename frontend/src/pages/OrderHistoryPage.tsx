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
        return 'bg-yellow-100 text-yellow-700';
      case 'processing':
        return 'bg-blue-100 text-blue-700';
      case 'shipped':
        return 'bg-purple-100 text-purple-700';
      case 'delivered':
        return 'bg-green-100 text-green-700';
      case 'cancelled':
        return 'bg-red-100 text-red-700';
      default:
        return 'bg-gray-100 text-gray-700';
    }
  };

  const getPaymentStatusColor = (status: string): string => {
    switch (status) {
      case 'paid':
        return 'bg-green-100 text-green-700';
      case 'unpaid':
        return 'bg-red-100 text-red-700';
      case 'refunded':
        return 'bg-gray-100 text-gray-700';
      default:
        return 'bg-gray-100 text-gray-700';
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
            <h1 className="text-3xl font-bold">Order History</h1>
            <p className="text-gray-600 mt-2">View all your past orders</p>
          </div>
          <Link to="/profile" className="btn-secondary">
            Back to Profile
          </Link>
        </div>

        {error && (
          <div className="bg-red-50 text-red-600 p-4 rounded-lg mb-4">
            {error}
          </div>
        )}

        {orders.length === 0 ? (
          <div className="bg-white rounded-lg shadow-md p-8 text-center">
            <p className="text-gray-500 text-lg mb-4">You haven't placed any orders yet</p>
            <Link to="/cards" className="btn-primary">
              Start Shopping
            </Link>
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order._id} className="bg-white rounded-lg shadow-md p-6">
                <div className="flex justify-between items-start mb-4">
                  <div>
                    <h3 className="font-bold text-lg">{order.orderNumber}</h3>
                    <p className="text-gray-600 text-sm">{formatDate(order.createdAt)}</p>
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

                <div className="border-t border-b py-4 mb-4">
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm text-gray-600">Shipping Address</p>
                      <p className="font-medium">{order.shippingAddress}</p>
                    </div>
                    <div>
                      <p className="text-sm text-gray-600">Phone Number</p>
                      <p className="font-medium">{order.phoneNumber}</p>
                    </div>
                    {order.courierNotes && (
                      <div className="md:col-span-2">
                        <p className="text-sm text-gray-600">Courier Notes</p>
                        <p className="font-medium">{order.courierNotes}</p>
                      </div>
                    )}
                  </div>
                </div>

                <div className="space-y-3 mb-4">
                  <p className="font-semibold text-sm text-gray-700">
                    Items ({order.items.length})
                  </p>
                  {order.items.map((item, index) => (
                    <div key={index} className="flex gap-4 items-center">
                      <img
                        src={item.card.imageUrl}
                        alt={item.cardName}
                        className="w-16 h-16 object-cover rounded border"
                      />
                      <div className="flex-1">
                        <p className="font-semibold">{item.cardName}</p>
                        <p className="text-sm text-gray-600">
                          {item.card.setName} • {item.condition} • {item.finish}
                        </p>
                        <p className="text-sm text-gray-600">
                          {item.quantity} × {formatPrice(item.pricePerUnit)}
                        </p>
                      </div>
                      <div className="text-right">
                        <p className="font-bold text-blue-600">{formatPrice(item.subtotal)}</p>
                      </div>
                    </div>
                  ))}
                </div>

                <div className="flex justify-between items-center pt-4 border-t">
                  <div className="text-xl font-bold">
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
