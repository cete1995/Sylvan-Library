import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const AdminTikTokOrdersPage: React.FC = () => {
  const [loading, setLoading] = useState(false);
  const [orderId, setOrderId] = useState('');
  const [orderDetail, setOrderDetail] = useState<any>(null);
  const [error, setError] = useState('');
  const [fullResponse, setFullResponse] = useState<any>(null);
  
  // TikTok credentials
  const [appKey, setAppKey] = useState(localStorage.getItem('tiktok_app_key') || '');
  const [appSecret, setAppSecret] = useState(localStorage.getItem('tiktok_app_secret') || '');
  const [accessToken, setAccessToken] = useState(localStorage.getItem('tiktok_access_token') || '');
  const [shopCipher, setShopCipher] = useState(localStorage.getItem('tiktok_shop_cipher') || '');

  const handleSaveCredentials = () => {
    localStorage.setItem('tiktok_app_key', appKey);
    localStorage.setItem('tiktok_app_secret', appSecret);
    localStorage.setItem('tiktok_access_token', accessToken);
    localStorage.setItem('tiktok_shop_cipher', shopCipher);
    alert('Credentials saved!');
  };

  const handleGetOrderDetail = async () => {
    if (!orderId.trim()) {
      setError('Please enter an Order ID');
      return;
    }

    if (!appKey || !appSecret || !accessToken || !shopCipher) {
      setError('Please fill in all TikTok Shop credentials');
      return;
    }

    setLoading(true);
    setError('');
    setOrderDetail(null);
    setFullResponse(null);

    try {
      const response = await api.post('/admin/tiktok/get-order-detail', {
        appKey,
        appSecret,
        accessToken,
        shopCipher,
        orderId: orderId.trim()
      });

      // Store full response for debugging
      setFullResponse({
        status: response.status,
        statusText: response.statusText,
        data: response.data
      });

      if (response.data.success) {
        // Auto-save credentials on successful fetch
        localStorage.setItem('tiktok_app_key', appKey);
        localStorage.setItem('tiktok_app_secret', appSecret);
        localStorage.setItem('tiktok_access_token', accessToken);
        localStorage.setItem('tiktok_shop_cipher', shopCipher);
        
        // Extract first order from orders array
        const tiktokResponse = response.data.data;
        const orders = tiktokResponse?.data?.orders || tiktokResponse?.orders;
        if (orders && orders.length > 0) {
          setOrderDetail(orders[0]);
        } else {
          setError('No order found in response');
        }
      } else {
        setError('Failed to fetch order detail');
      }
    } catch (err: any) {
      // Store full error response for debugging
      setFullResponse({
        error: true,
        status: err.response?.status,
        statusText: err.response?.statusText,
        data: err.response?.data,
        message: err.message,
        url: err.config?.url,
        method: err.config?.method
      });
      
      setError(err.response?.data?.error || err.message || 'Failed to fetch order detail');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen pb-20" style={{ backgroundColor: 'var(--color-background)' }}>
      {/* Header */}
      <div className="sticky top-0 z-10 border-b" style={{ backgroundColor: 'var(--color-panel)', borderColor: 'var(--color-border)' }}>
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <Link
                to="/admin/dashboard"
                className="p-2 rounded-lg hover:bg-opacity-80 transition-colors"
                style={{ backgroundColor: 'var(--color-background)' }}
              >
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text)' }}>
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 19l-7-7 7-7" />
                </svg>
              </Link>
              <div>
                <h1 className="text-2xl font-bold" style={{ color: 'var(--color-text)' }}>
                  Get TikTok Order Detail
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  Fetch detailed order information using Order ID (API 202507)
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Content */}
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Credentials Form */}
        <div className="rounded-xl shadow-md p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            TikTok Shop Credentials
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                App Key
              </label>
              <input
                type="text"
                value={appKey}
                onChange={(e) => setAppKey(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
                placeholder="Enter App Key"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                App Secret
              </label>
              <input
                type="password"
                value={appSecret}
                onChange={(e) => setAppSecret(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
                placeholder="Enter App Secret"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Access Token
              </label>
              <input
                type="text"
                value={accessToken}
                onChange={(e) => setAccessToken(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
                placeholder="Enter Access Token"
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Shop Cipher
              </label>
              <input
                type="text"
                value={shopCipher}
                onChange={(e) => setShopCipher(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
                placeholder="Enter Shop Cipher"
              />
            </div>
          </div>
          <div className="mt-4 flex justify-end">
            <button
              onClick={handleSaveCredentials}
              className="px-6 py-2 rounded-lg text-white font-medium"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              Save Credentials
            </button>
          </div>
        </div>

        {/* Order ID Input */}
        <div className="rounded-xl shadow-md p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
          <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
            Order Details
          </h2>
          <div className="flex gap-4">
            <div className="flex-1">
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Order ID
              </label>
              <input
                type="text"
                value={orderId}
                onChange={(e) => setOrderId(e.target.value)}
                className="w-full px-4 py-2 rounded-lg"
                style={{ 
                  backgroundColor: 'var(--color-background)', 
                  color: 'var(--color-text)',
                  border: '1px solid var(--color-border)'
                }}
                placeholder="Enter Order ID (e.g., 582633902771766679)"
                onKeyPress={(e) => {
                  if (e.key === 'Enter') {
                    handleGetOrderDetail();
                  }
                }}
              />
            </div>
            <div className="flex items-end">
              <button
                onClick={handleGetOrderDetail}
                disabled={loading}
                className="px-6 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {loading ? 'Fetching...' : 'Get Order Detail'}
              </button>
            </div>
          </div>
        </div>

        {/* Error Message */}
        {error && (
          <div className="rounded-xl shadow-md p-4 mb-6" style={{ backgroundColor: '#fee2e2', border: '1px solid #ef4444' }}>
            <p style={{ color: '#dc2626' }}>{error}</p>
          </div>
        )}

        {/* Full Response Terminal */}
        {fullResponse && (
          <div className="rounded-xl shadow-md p-6 mb-6" style={{ backgroundColor: 'var(--color-panel)' }}>
            <h2 className="text-lg font-semibold mb-4" style={{ color: 'var(--color-text)' }}>
              🔍 Full API Response (Debug Terminal)
            </h2>
            <pre
              className="p-4 rounded-lg overflow-auto font-mono text-xs"
              style={{ 
                backgroundColor: 'var(--color-background)',
                color: fullResponse.error ? '#dc2626' : 'var(--color-text)',
                maxHeight: '400px'
              }}
            >
              {JSON.stringify(fullResponse, null, 2)}
            </pre>
          </div>
        )}

        {/* Order Detail Result */}
        {orderDetail && (
          <div className="rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: 'var(--color-panel)' }}>
            {/* Order Header */}
            <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <div className="flex items-center gap-2 mb-3">
                <input type="checkbox" className="w-4 h-4" />
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {(orderDetail.line_items || []).length} pesanan
                </span>
              </div>
              
              <div className="flex items-center justify-between mb-4">
                <div className="flex items-center gap-2">
                  <input type="checkbox" className="w-4 h-4" />
                  <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                    ID Pesanan: {orderDetail.id || orderDetail.order_id || orderId}
                  </span>
                </div>
                <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                  {orderDetail.buyer_name || orderDetail.recipient_address?.name || 'M***********n'}
                </span>
              </div>
            </div>

            {/* Product Items */}
            <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
              {(orderDetail.line_items || []).map((item: any, index: number) => (
                <div key={index} className="p-6">
                  <div className="flex gap-4">
                    {/* Product Image */}
                    <div className="flex-shrink-0">
                      <img
                        src={item.sku_image || '/placeholder.png'}
                        alt={item.product_name}
                        className="w-16 h-16 object-cover rounded-lg border"
                        style={{ borderColor: 'var(--color-border)' }}
                        onError={(e) => {
                          (e.target as HTMLImageElement).src = '/placeholder.png';
                        }}
                      />
                    </div>

                    {/* Product Info */}
                    <div className="flex-1 min-w-0">
                      <div className="flex justify-between gap-4">
                        <div className="flex-1">
                          <h3 className="font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                            {item.product_name}
                            <span className="ml-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                              × {item.quantity}
                            </span>
                          </h3>
                          <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                            {item.sku_name || 'Default'}
                          </p>
                          <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            SKU Penjual: {item.seller_sku}
                          </p>
                        </div>

                        {/* Status Column */}
                        <div className="text-right">
                          <p className="text-sm mb-1" style={{ color: 'var(--color-text)' }}>
                            {orderDetail.status_name || orderDetail.order_status || 'Menunggu pengiriman'}
                          </p>
                        </div>
                      </div>
                    </div>

                    {/* Shipping Method */}
                    <div className="flex-shrink-0 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <p className="mb-1">
                        {orderDetail.shipping_provider || 'Dikirim melalui platform'}
                      </p>
                      <p className="mb-1">
                        {orderDetail.shipping_type || 'J&T Express'}
                      </p>
                    </div>

                    {/* Price Column */}
                    <div className="flex-shrink-0 text-right">
                      <p className="font-medium mb-1" style={{ color: 'var(--color-text)' }}>
                        Rp{(parseFloat(item.sale_price) || parseFloat(item.original_price) || 0).toLocaleString('id-ID')}
                      </p>
                      <p className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {orderDetail.payment?.payment_method_name || 'GoPay'}
                      </p>
                    </div>

                    {/* Shipping Type */}
                    <div className="flex-shrink-0 text-right text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      <p>
                        {orderDetail.delivery_option || 'Pengiriman Standar'}
                      </p>
                      <p className="flex items-center justify-end gap-1">
                        Drop off
                        <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 16h-1v-4h-1m1-4h.01M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                        </svg>
                      </p>
                    </div>
                  </div>
                </div>
              ))}
            </div>

            {/* Payment Summary */}
            {orderDetail.payment && (
              <div className="p-6 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                <div className="max-w-md ml-auto space-y-2">
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal Produk</span>
                    <span style={{ color: 'var(--color-text)' }}>
                      Rp{(parseFloat(orderDetail.payment.sub_total) || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  <div className="flex justify-between text-sm">
                    <span style={{ color: 'var(--color-text-secondary)' }}>Biaya Pengiriman</span>
                    <span style={{ color: 'var(--color-text)' }}>
                      Rp{(parseFloat(orderDetail.payment.shipping_fee) || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                  {parseFloat(orderDetail.payment.platform_discount || '0') > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Diskon Platform</span>
                      <span style={{ color: '#22c55e' }}>
                        -Rp{(parseFloat(orderDetail.payment.platform_discount) || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  {parseFloat(orderDetail.payment.seller_discount || '0') > 0 && (
                    <div className="flex justify-between text-sm">
                      <span style={{ color: 'var(--color-text-secondary)' }}>Diskon Penjual</span>
                      <span style={{ color: '#22c55e' }}>
                        -Rp{(parseFloat(orderDetail.payment.seller_discount) || 0).toLocaleString('id-ID')}
                      </span>
                    </div>
                  )}
                  <div className="flex justify-between font-semibold pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <span style={{ color: 'var(--color-text)' }}>Total Pembayaran</span>
                    <span style={{ color: 'var(--color-text)' }}>
                      Rp{(parseFloat(orderDetail.payment.total_amount) || 0).toLocaleString('id-ID')}
                    </span>
                  </div>
                </div>
              </div>
            )}

            {/* Shipping Address */}
            {orderDetail.recipient_address && (
              <div className="p-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                  Alamat Pengiriman
                </h3>
                <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                  <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                    {orderDetail.recipient_address.name}
                  </p>
                  <p>{orderDetail.recipient_address.phone}</p>
                  <p>{orderDetail.recipient_address.full_address}</p>
                  <p>
                    {[
                      orderDetail.recipient_address.district,
                      orderDetail.recipient_address.city,
                      orderDetail.recipient_address.province,
                      orderDetail.recipient_address.postal_code
                    ].filter(Boolean).join(', ')}
                  </p>
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
};

export default AdminTikTokOrdersPage;
