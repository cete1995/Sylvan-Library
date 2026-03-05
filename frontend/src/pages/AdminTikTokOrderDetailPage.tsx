import React, { useState, useEffect } from 'react';
import { Link, useParams } from 'react-router-dom';
import api from '../api/client';

interface OrderItem {
  productId: string;
  productName: string;
  skuId: string;
  skuName: string;
  skuImage?: string;
  sellerSku: string;
  quantity: number;
  originalPrice: number;
  salePrice: number;
}

interface TikTokOrder {
  _id: string;
  orderId: string;
  orderStatus: string;
  createTime: number;
  updateTime: number;
  buyerUserId?: string;
  shippingType?: string;
  payment?: {
    totalAmount: number;
    subTotal: number;
    shippingFee: number;
    platformDiscount: number;
    sellerDiscount: number;
    currency: string;
  };
  recipientAddress?: {
    name: string;
    phone: string;
    fullAddress?: string;
    district?: string;
    city?: string;
    province?: string;
    postalCode?: string;
  };
  itemList?: OrderItem[];
  syncedAt: string;
  lastFetchedDetailAt?: string;
}

const AdminTikTokOrderDetailPage: React.FC = () => {
  const { orderId } = useParams<{ orderId: string }>();
  const [loading, setLoading] = useState(false);
  const [fetching, setFetching] = useState(false);
  const [order, setOrder] = useState<TikTokOrder | null>(null);
  
  // Debug terminal
  const [showDebug, setShowDebug] = useState(true);
  const [debugLogs, setDebugLogs] = useState<string[]>([]);
  
  // Credentials
  const [appKey] = useState(localStorage.getItem('tiktok_app_key') || '');
  const [appSecret] = useState(localStorage.getItem('tiktok_app_secret') || '');
  const [accessToken] = useState(localStorage.getItem('tiktok_access_token') || '');
  const [shopCipher] = useState(localStorage.getItem('tiktok_shop_cipher') || '');

  useEffect(() => {
    loadOrder();
  }, [orderId]);

  const loadOrder = async () => {
    if (!orderId) return;
    
    setLoading(true);
    try {
      const response = await api.get(`/admin/tiktok/orders?orderId=${orderId}`);
      
      if (response.data.success && response.data.data.orders.length > 0) {
        setOrder(response.data.data.orders[0]);
      }
    } catch (error: any) {
      console.error('Error loading order:', error);
      alert('Failed to load order: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFetchOrderDetail = async () => {
    if (!appKey || !appSecret || !accessToken || !shopCipher) {
      alert('Please ensure TikTok API credentials are saved');
      return;
    }

    if (!orderId) return;

    setFetching(true);
    setDebugLogs([]);
    
    try {
      const response = await api.post('/admin/tiktok/fetch-order-detail', {
        appKey,
        appSecret,
        accessToken,
        shopCipher,
        orderId
      });
      
      if (response.data.success) {
        setDebugLogs(response.data.logs || []);
        setOrder(response.data.data);
        alert('Order details fetched and updated successfully!');
      } else {
        setDebugLogs(response.data.logs || [`ERROR: ${response.data.error}`]);
        alert('Failed to fetch order details: ' + response.data.error);
      }
    } catch (error: any) {
      console.error('Error fetching order detail:', error);
      const errorLogs = error.response?.data?.logs || [`ERROR: ${error.response?.data?.error || error.message}`];
      setDebugLogs(errorLogs);
      alert('Failed to fetch order details: ' + (error.response?.data?.error || error.message));
    } finally {
      setFetching(false);
    }
  };

  const formatDate = (timestamp: number) => {
    if (!timestamp) return 'N/A';
    try {
      return new Date(timestamp * 1000).toLocaleString();
    } catch (error) {
      return 'Invalid Date';
    }
  };

  const getStatusColor = (status: string) => {
    if (!status) return '#6b7280';
    const colors: Record<string, string> = {
      'UNPAID': '#ef4444',
      'ON_HOLD': '#f59e0b',
      'AWAITING_SHIPMENT': '#3b82f6',
      'PARTIALLY_SHIPPING': '#8b5cf6',
      'AWAITING_COLLECTION': '#06b6d4',
      'IN_TRANSIT': '#10b981',
      'DELIVERED': '#22c55e',
      'COMPLETED': '#6b7280',
      'CANCELLED': '#dc2626'
    };
    return colors[status] || '#6b7280';
  };

  const getStatusLabel = (status: string) => {
    if (!status) return 'Unknown';
    return status.replace(/_/g, ' ');
  };

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 mx-auto mb-4" style={{ borderColor: 'var(--color-accent)' }}></div>
          <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>Loading order...</p>
        </div>
      </div>
    );
  }

  if (!order) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-background)' }}>
        <div className="text-center">
          <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
          </svg>
          <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
            Order Not Found
          </h3>
          <Link to="/admin/tiktok-orders" className="text-sm" style={{ color: 'var(--color-accent)' }}>
            Back to Orders
          </Link>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/admin/tiktok-orders"
                className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
                style={{ backgroundColor: 'var(--color-background)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  Order {order.orderId}
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Created {formatDate(order.createTime)}
                </p>
              </div>
            </div>
            <button
              onClick={handleFetchOrderDetail}
              disabled={fetching}
              className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              {fetching ? 'Fetching...' : 'Fetch Latest Details'}
            </button>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Debug Terminal */}
        {debugLogs.length > 0 && (
          <div className="rounded-xl shadow-md mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
            <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-lg font-semibold flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M8 9l3 3-3 3m5 0h3M5 20h14a2 2 0 002-2V6a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
                Debug Terminal
              </h2>
              <div className="flex gap-2">
                <button
                  onClick={() => {
                    navigator.clipboard.writeText(debugLogs.join('\n'));
                    alert('Logs copied to clipboard!');
                  }}
                  className="px-3 py-1 rounded text-xs"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                >
                  Copy
                </button>
                <button
                  onClick={() => setDebugLogs([])}
                  className="px-3 py-1 rounded text-xs"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                >
                  Clear
                </button>
                <button
                  onClick={() => setShowDebug(!showDebug)}
                  className="px-3 py-1 rounded text-xs"
                  style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                >
                  {showDebug ? 'Hide' : 'Show'}
                </button>
              </div>
            </div>
            {showDebug && (
              <div 
                className="p-6 font-mono text-xs overflow-auto max-h-96"
                style={{ 
                  backgroundColor: '#1e1e1e', 
                  color: '#d4d4d4'
                }}
              >
                {debugLogs.map((log, idx) => (
                  <div key={idx} className="mb-1">
                    {log}
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Order Info */}
        <div className="rounded-xl shadow-md p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Order Information
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Order ID
              </label>
              <div className="text-base font-mono" style={{ color: 'var(--color-text)' }}>
                {order.orderId}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Status
              </label>
              <span
                className="inline-flex items-center px-3 py-1 rounded-full text-sm font-medium text-white"
                style={{ backgroundColor: getStatusColor(order.orderStatus) }}
              >
                {getStatusLabel(order.orderStatus)}
              </span>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Created
              </label>
              <div className="text-base" style={{ color: 'var(--color-text)' }}>
                {formatDate(order.createTime)}
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                Last Updated
              </label>
              <div className="text-base" style={{ color: 'var(--color-text)' }}>
                {formatDate(order.updateTime)}
              </div>
            </div>
            {order.buyerUserId && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Buyer ID
                </label>
                <div className="text-base font-mono" style={{ color: 'var(--color-text)' }}>
                  {order.buyerUserId}
                </div>
              </div>
            )}
            {order.shippingType && (
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Shipping Type
                </label>
                <div className="text-base" style={{ color: 'var(--color-text)' }}>
                  {order.shippingType}
                </div>
              </div>
            )}
          </div>
        </div>

        {/* Shipping Address */}
        {order.recipientAddress && (
          <div className="rounded-xl shadow-md p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
              Shipping Address
            </h2>
            <div className="space-y-2">
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Recipient Name
                </label>
                <div className="text-base" style={{ color: 'var(--color-text)' }}>
                  {order.recipientAddress.name || 'N/A'}
                </div>
              </div>
              <div>
                <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Phone
                </label>
                <div className="text-base" style={{ color: 'var(--color-text)' }}>
                  {order.recipientAddress.phone || 'N/A'}
                </div>
              </div>
              {order.recipientAddress.fullAddress && (
                <div>
                  <label className="block text-sm font-medium mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                    Full Address
                  </label>
                  <div className="text-base" style={{ color: 'var(--color-text)' }}>
                    {order.recipientAddress.fullAddress}
                  </div>
                </div>
              )}
            </div>
          </div>
        )}

        {/* Order Items */}
        {order.itemList && order.itemList.length > 0 && (
          <div className="rounded-xl shadow-md p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
              </svg>
              Order Items ({order.itemList.length})
            </h2>
            <div className="space-y-4">
              {order.itemList.map((item, idx) => (
                <div 
                  key={idx} 
                  className="flex gap-4 p-4 rounded-lg border"
                  style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}
                >
                  {/* Product Image */}
                  <div className="flex-shrink-0">
                    {item.skuImage ? (
                      <img 
                        src={item.skuImage} 
                        alt={item.productName}
                        className="w-20 h-20 object-cover rounded"
                      />
                    ) : (
                      <div 
                        className="w-20 h-20 rounded flex items-center justify-center" 
                        style={{ backgroundColor: 'var(--color-panel)' }}
                      >
                        <svg className="w-10 h-10" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-secondary)' }}>
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                        </svg>
                      </div>
                    )}
                  </div>
                  
                  {/* Product Info */}
                  <div className="flex-1">
                    <div className="font-semibold text-lg mb-2" style={{ color: 'var(--color-text)' }}>
                      {item.productName}
                    </div>
                    {item.skuName && (
                      <div className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                        {item.skuName}
                      </div>
                    )}
                    <div className="text-sm font-mono" style={{ color: 'var(--color-text-secondary)' }}>
                      SKU: {item.sellerSku}
                    </div>
                    <div className="mt-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      Quantity: <span className="font-semibold" style={{ color: 'var(--color-text)' }}>× {item.quantity}</span>
                    </div>
                  </div>

                  {/* Price */}
                  <div className="text-right">
                    <div className="text-lg font-semibold mb-1" style={{ color: 'var(--color-text)' }}>
                      {order.payment?.currency || 'IDR'} {item.salePrice.toLocaleString()}
                    </div>
                    {item.originalPrice !== item.salePrice && (
                      <div className="text-sm line-through" style={{ color: 'var(--color-text-secondary)' }}>
                        {order.payment?.currency || 'IDR'} {item.originalPrice.toLocaleString()}
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Payment Summary */}
        {order.payment && (
          <div className="rounded-xl shadow-md p-6" style={{ backgroundColor: 'var(--color-panel)' }}>
            <h2 className="text-lg font-semibold mb-4 flex items-center gap-2" style={{ color: 'var(--color-text)' }}>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
              </svg>
              Payment Summary
            </h2>
            <div className="space-y-3">
              <div className="flex justify-between text-base" style={{ color: 'var(--color-text-secondary)' }}>
                <span>Subtotal</span>
                <span>{order.payment.currency} {order.payment.subTotal?.toLocaleString() || 0}</span>
              </div>
              {order.payment.shippingFee > 0 && (
                <div className="flex justify-between text-base" style={{ color: 'var(--color-text-secondary)' }}>
                  <span>Shipping Fee</span>
                  <span>{order.payment.currency} {order.payment.shippingFee.toLocaleString()}</span>
                </div>
              )}
              {order.payment.platformDiscount > 0 && (
                <div className="flex justify-between text-base text-green-600">
                  <span>Platform Discount</span>
                  <span>-{order.payment.currency} {order.payment.platformDiscount.toLocaleString()}</span>
                </div>
              )}
              {order.payment.sellerDiscount > 0 && (
                <div className="flex justify-between text-base text-green-600">
                  <span>Seller Discount</span>
                  <span>-{order.payment.currency} {order.payment.sellerDiscount.toLocaleString()}</span>
                </div>
              )}
              <div className="border-t pt-3 mt-3 flex justify-between text-xl font-bold" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                <span>Total</span>
                <span>{order.payment.currency} {order.payment.totalAmount.toLocaleString()}</span>
              </div>
            </div>
          </div>
        )}

        {/* Sync Status */}
        <div className="mt-6 text-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
          <div>Synced: {new Date(order.syncedAt).toLocaleString()}</div>
          {order.lastFetchedDetailAt && (
            <div>Details Fetched: {new Date(order.lastFetchedDetailAt).toLocaleString()}</div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTikTokOrderDetailPage;
