import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

interface OrderItem {
  productId: string;
  productName: string;
  skuId: string;
  skuName: string;
  skuImage: string;
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
    currency: string;
    subTotal?: number;
    shippingFee?: number;
    platformDiscount?: number;
    sellerDiscount?: number;
  };
  recipientAddress?: {
    name: string;
    phone: string;
    fullAddress?: string;
  };
  itemList?: OrderItem[];
  syncedAt: string;
  lastFetchedDetailAt?: string;
}

const AdminTikTokOrdersPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orders, setOrders] = useState<TikTokOrder[]>([]);
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [expandedOrders, setExpandedOrders] = useState<Set<string>>(new Set());

  // Filters
  const [statusFilter, setStatusFilter] = useState<string>('');
  const [searchOrderId, setSearchOrderId] = useState<string>('');

  useEffect(() => {
    loadOrders();
  }, [page, statusFilter, searchOrderId]);



  const loadOrders = async () => {
    setLoading(true);
    try {
      const params: any = {
        page,
        limit: 20
      };
      
      if (statusFilter) {
        params.status = statusFilter;
      }
      
      if (searchOrderId) {
        params.orderId = searchOrderId;
      }

      const response = await api.get('/admin/tiktok/orders', { params });
      
      if (response.data.success) {
        setOrders(response.data.data.orders);
        setTotal(response.data.data.pagination.total);
        setTotalPages(response.data.data.pagination.totalPages);
      }
    } catch (error: any) {
      console.error('Error loading orders:', error);
      alert('Failed to load orders: ' + (error.response?.data?.error || error.message));
    } finally {
      setLoading(false);
    }
  };

  const handleClearFilters = () => {
    setStatusFilter('');
    setSearchOrderId('');
    setPage(1);
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

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/admin"
                className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
                style={{ backgroundColor: 'var(--color-background)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  Saved TikTok Shop Orders
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  View and manage synced orders from database
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">

        {/* Filters */}
        <div className="rounded-xl shadow-md p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Filter Saved Orders
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Search by Order ID
              </label>
              <input
                type="text"
                value={searchOrderId}
                onChange={(e) => {
                  setSearchOrderId(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
                placeholder="Enter Order ID"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Order Status
              </label>
              <select
                value={statusFilter}
                onChange={(e) => {
                  setStatusFilter(e.target.value);
                  setPage(1);
                }}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
              >
                <option value="">All Statuses</option>
                <option value="UNPAID">Unpaid</option>
                <option value="AWAITING_SHIPMENT">Awaiting Shipment</option>
                <option value="PARTIALLY_SHIPPING">Partially Shipping</option>
                <option value="AWAITING_COLLECTION">Awaiting Collection</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end">
              <button
                onClick={handleClearFilters}
                className="w-full px-6 py-2 rounded-lg font-medium"
                style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)', border: '1px solid var(--color-border)' }}
              >
                Clear Filters
              </button>
            </div>
          </div>
        </div>

        {/* Orders List */}
        <div className="rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: 'var(--color-panel)' }}>
          <div className="px-6 py-4 border-b flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
            <h2 className="text-lg font-semibold" style={{ color: 'var(--color-text)' }}>
              Orders ({total})
            </h2>
            <button
              onClick={loadOrders}
              disabled={loading}
              className="px-4 py-2 rounded-lg text-sm font-medium"
              style={{ backgroundColor: 'var(--color-accent)', color: 'white' }}
            >
              {loading ? 'Refreshing...' : 'Refresh'}
            </button>
          </div>

          {loading ? (
            <div className="flex justify-center py-12">
              <div className="animate-spin rounded-full h-12 w-12 border-b-2" style={{ borderColor: 'var(--color-accent)' }}></div>
            </div>
          ) : orders.length > 0 ? (
            <>
              <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                {orders.map((order) => {
                  const isExpanded = expandedOrders.has(order.orderId);
                  
                  return (
                    <div key={order._id} className="px-6 py-4">
                      <div 
                        className="cursor-pointer"
                        onClick={() => {
                          const newExpanded = new Set(expandedOrders);
                          if (isExpanded) {
                            newExpanded.delete(order.orderId);
                          } else {
                            newExpanded.add(order.orderId);
                          }
                          setExpandedOrders(newExpanded);
                        }}
                      >
                        <div className="flex items-start justify-between">
                          <div className="flex-1">
                            <div className="flex items-center gap-3 mb-2">
                              <span className="font-semibold" style={{ color: 'var(--color-text)' }}>
                                {order.orderId}
                              </span>
                              <span
                                className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium text-white"
                                style={{ backgroundColor: getStatusColor(order.orderStatus) }}
                              >
                                {getStatusLabel(order.orderStatus)}
                              </span>
                              <svg className={`w-5 h-5 transition-transform ${isExpanded ? 'rotate-180' : ''}`} fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text-secondary)' }}>
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 9l-7 7-7-7" />
                              </svg>
                            </div>
                            <div className="grid grid-cols-2 gap-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              <div>
                                <span className="font-medium">Created:</span> {formatDate(order.createTime)}
                              </div>
                              {order.payment && (
                                <div>
                                  <span className="font-medium">Total:</span> {order.payment.currency || 'IDR'} {order.payment.totalAmount?.toLocaleString() || 0}
                                </div>
                              )}
                            </div>
                          </div>
                        </div>
                      </div>
                      
                      {/* Expanded Details */}
                      {isExpanded && (
                        <div className="mt-4 pt-4 border-t" style={{ borderColor: 'var(--color-border)' }}>
                          {/* Product Items */}
                          {order.itemList && order.itemList.length > 0 && (
                            <div className="mb-4">
                              <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                                Products
                              </h4>
                              <div className="space-y-3">
                                {order.itemList.map((item, idx) => (
                                  <div key={idx} className="flex gap-3 p-3 rounded-lg" style={{ backgroundColor: 'var(--color-background)' }}>
                                    {item.skuImage && (
                                      <img 
                                        src={item.skuImage} 
                                        alt={item.productName}
                                        className="w-16 h-16 object-cover rounded"
                                        onError={(e) => {
                                          e.currentTarget.src = 'data:image/svg+xml,%3Csvg xmlns=%22http://www.w3.org/2000/svg%22 width=%2264%22 height=%2264%22%3E%3Crect fill=%22%23ddd%22 width=%2264%22 height=%2264%22/%3E%3C/svg%3E';
                                        }}
                                      />
                                    )}
                                    <div className="flex-1">
                                      <div className="font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                                        {item.productName}
                                      </div>
                                      <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                        SKU: {item.sellerSku}
                                      </div>
                                      {item.skuName && (
                                        <div className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                          {item.skuName}
                                        </div>
                                      )}
                                      <div className="flex items-center gap-4 mt-2">
                                        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                          × {item.quantity}
                                        </span>
                                        {item.originalPrice !== item.salePrice && (
                                          <span className="text-xs line-through" style={{ color: 'var(--color-text-secondary)' }}>
                                            {order.payment?.currency || 'IDR'} {item.originalPrice?.toLocaleString()}
                                          </span>
                                        )}
                                        <span className="text-sm font-semibold" style={{ color: 'var(--color-accent)' }}>
                                          {order.payment?.currency || 'IDR'} {item.salePrice?.toLocaleString()}
                                        </span>
                                      </div>
                                    </div>
                                  </div>
                                ))}
                              </div>
                            </div>
                          )}
                          
                          {/* Order Details Grid */}
                          <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mb-4">
                            {/* Shipping Info */}
                            <div>
                              <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                                Shipping
                              </h4>
                              <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                                {order.shippingType && (
                                  <div>Type: {order.shippingType}</div>
                                )}
                                {order.recipientAddress && (
                                  <>
                                    {order.recipientAddress.name && (
                                      <div><strong>Name:</strong> {order.recipientAddress.name}</div>
                                    )}
                                    {order.recipientAddress.phone && (
                                      <div><strong>Phone:</strong> {order.recipientAddress.phone}</div>
                                    )}
                                    {order.recipientAddress.fullAddress && (
                                      <div><strong>Address:</strong> {order.recipientAddress.fullAddress}</div>
                                    )}
                                  </>
                                )}
                              </div>
                            </div>
                            
                            {/* Payment Info */}
                            {order.payment && (
                              <div>
                                <h4 className="text-sm font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                                  Payment
                                </h4>
                                <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                                  {order.payment.subTotal && (
                                    <div className="flex justify-between">
                                      <span>Subtotal:</span>
                                      <span>{order.payment.currency || 'IDR'} {order.payment.subTotal.toLocaleString()}</span>
                                    </div>
                                  )}
                                  {order.payment.shippingFee && (
                                    <div className="flex justify-between">
                                      <span>Shipping:</span>
                                      <span>{order.payment.currency || 'IDR'} {order.payment.shippingFee.toLocaleString()}</span>
                                    </div>
                                  )}
                                  {order.payment.platformDiscount && order.payment.platformDiscount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                      <span>Platform Discount:</span>
                                      <span>-{order.payment.currency || 'IDR'} {order.payment.platformDiscount.toLocaleString()}</span>
                                    </div>
                                  )}
                                  {order.payment.sellerDiscount && order.payment.sellerDiscount > 0 && (
                                    <div className="flex justify-between text-green-600">
                                      <span>Seller Discount:</span>
                                      <span>-{order.payment.currency || 'IDR'} {order.payment.sellerDiscount.toLocaleString()}</span>
                                    </div>
                                  )}
                                  <div className="flex justify-between font-semibold pt-2 border-t" style={{ borderColor: 'var(--color-border)', color: 'var(--color-text)' }}>
                                    <span>Total:</span>
                                    <span>{order.payment.currency || 'IDR'} {order.payment.totalAmount.toLocaleString()}</span>
                                  </div>
                                </div>
                              </div>
                            )}
                          </div>
                          
                          {/* Action Button */}
                          <Link
                            to={`/admin/tiktok-orders/${order.orderId}`}
                            className="inline-block px-4 py-2 rounded-lg text-sm font-medium text-white"
                            style={{ backgroundColor: 'var(--color-accent)' }}
                          >
                            View Full Details
                          </Link>
                        </div>
                      )}
                    </div>
                  );
                })}
              </div>

              {/* Pagination */}
              {totalPages > 1 && (
                <div className="px-6 py-4 border-t flex items-center justify-between" style={{ borderColor: 'var(--color-border)' }}>
                  <button
                    onClick={() => setPage(p => Math.max(1, p - 1))}
                    disabled={page === 1}
                    className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                  >
                    Previous
                  </button>
                  <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    Page {page} of {totalPages}
                  </span>
                  <button
                    onClick={() => setPage(p => Math.min(totalPages, p + 1))}
                    disabled={page === totalPages}
                    className="px-4 py-2 rounded-lg text-sm font-medium disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-background)', color: 'var(--color-text)' }}
                  >
                    Next
                  </button>
                </div>
              )}
            </>
          ) : (
            <div className="text-center py-12">
              <svg className="w-16 h-16 mx-auto mb-4" style={{ color: 'var(--color-text-secondary)' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2" />
              </svg>
              <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--color-text)' }}>
                No Orders Found
              </h3>
              <p className="text-sm mb-4" style={{ color: 'var(--color-text-secondary)' }}>
                No orders in database. Use the sync page to import orders from TikTok Shop.
              </p>
              <Link
                to="/admin/tiktok-get-orders"
                className="inline-block px-6 py-2 rounded-lg text-white font-medium"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                Go to Sync Page
              </Link>
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default AdminTikTokOrdersPage;
