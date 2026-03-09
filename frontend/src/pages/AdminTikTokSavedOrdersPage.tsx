import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';
import api from '../api/client';

const AdminTikTokSavedOrdersPage: React.FC = () => {
  const [orders, setOrders] = useState<any[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [page, setPage] = useState(1);
  const [totalPages, setTotalPages] = useState(1);
  const [total, setTotal] = useState(0);
  const [statusFilter, setStatusFilter] = useState('');
  const [orderIdSearch, setOrderIdSearch] = useState('');
  
  // Seller search state - now stores found sellers per order
  const [foundSellers, setFoundSellers] = useState<Record<string, Record<number, any[]>>>({});
  const [findingOrderId, setFindingOrderId] = useState<string | null>(null);
  
  // Modal state for changing seller
  const [showSellerModal, setShowSellerModal] = useState(false);
  const [modalItem, setModalItem] = useState<{ orderId: string; itemIndex: number; currentSellers: any[] } | null>(null);
  const [cardSearchTerm, setCardSearchTerm] = useState('');
  
  // Edit stock state
  const [editingStock, setEditingStock] = useState<{ cardId: string; inventoryIndex: number; currentQty: number } | null>(null);
  const [newStockQty, setNewStockQty] = useState(0);

  const fetchOrders = async () => {
    setLoading(true);
    setError('');
    
    try {
      const params: any = {
        page,
        limit: 20
      };
      
      if (statusFilter) params.status = statusFilter;
      if (orderIdSearch) params.orderId = orderIdSearch;
      
      const response = await api.get('/admin/tiktok/orders', { params });
      
      if (response.data.success) {
        setOrders(response.data.data.orders);
        setTotalPages(response.data.data.pagination.totalPages);
        setTotal(response.data.data.pagination.total);
      } else {
        setError('Failed to fetch orders');
      }
    } catch (err: any) {
      setError(err.response?.data?.error || err.message || 'Failed to fetch orders');
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchOrders();
  }, [page, statusFilter]);

  const handleSearch = () => {
    setPage(1);
    fetchOrders();
  };

  const handleDeleteAllOrders = async () => {
    const confirmDelete = window.confirm(
      `⚠️ WARNING: This will DELETE ALL ${total} orders from the database!\n\nThis action cannot be undone. Are you absolutely sure?`
    );

    if (!confirmDelete) return;

    const doubleConfirm = window.confirm(
      'This is your last chance. Click OK to permanently delete all orders.'
    );

    if (!doubleConfirm) return;

    setLoading(true);
    try {
      const response = await api.delete('/admin/tiktok/delete-all-orders');
      
      if (response.data.success) {
        alert(`✅ Successfully deleted ${response.data.deletedCount} orders`);
        setOrders([]);
        setTotal(0);
        setPage(1);
        fetchOrders();
      } else {
        alert('Failed to delete orders: ' + response.data.error);
      }
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleResyncOrders = async () => {
    const appKey = localStorage.getItem('tiktok_app_key');
    const appSecret = localStorage.getItem('tiktok_app_secret');
    const accessToken = localStorage.getItem('tiktok_access_token');
    const shopCipher = localStorage.getItem('tiktok_shop_cipher');

    if (!appKey || !appSecret || !accessToken || !shopCipher) {
      alert('⚠️ TikTok credentials not found!\n\nPlease go to TikTok Shop → Get Orders page and save your credentials first.');
      return;
    }

    const confirm = window.confirm(
      `🔄 Re-sync All Orders\n\nThis will:\n1. Delete ALL ${total} existing orders\n2. Fetch fresh orders from TikTok (last 7 days)\n3. Save with complete data including quantities\n\nContinue?`
    );

    if (!confirm) return;

    setLoading(true);
    try {
      // Step 1: Delete all orders
      const deleteResponse = await api.delete('/admin/tiktok/delete-all-orders');
      if (!deleteResponse.data.success) {
        throw new Error('Failed to delete orders: ' + deleteResponse.data.error);
      }

      // Step 2: Sync new orders (last 7 days)
      const endDate = new Date().toISOString().split('T')[0];
      const startDate = new Date(Date.now() - 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0];

      const syncResponse = await api.post('/admin/tiktok/sync-orders', {
        appKey,
        appSecret,
        accessToken,
        shopCipher,
        startDate,
        endDate
      });

      if (syncResponse.data.success) {
        const summary = syncResponse.data.summary;
        alert(`✅ Re-sync completed!\n\nTotal Fetched: ${summary.totalFetched}\nNew Orders: ${summary.newOrders}\nSkipped: ${summary.skippedOrders}\n\nAll orders now have complete data with quantities.`);
        setPage(1);
        fetchOrders();
      } else {
        throw new Error(syncResponse.data.error || 'Sync failed');
      }
    } catch (err: any) {
      alert('❌ Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleFindAllSellers = async (orderId: string, items: any[]) => {
    setFindingOrderId(orderId);
    setLoading(true);
    
    try {
      const sellersMap: Record<number, any[]> = {};
      
      // Search for sellers for each item
      for (let i = 0; i < items.length; i++) {
        const item = items[i];
        
        // Skip if already assigned
        if (item.assignedSeller) {
          continue;
        }
        
        try {
          const response = await api.post('/admin/tiktok/find-sellers-with-card', { 
            sellerSku: item.sellerSku 
          });
          
          if (response.data.success && response.data.data.length > 0) {
            sellersMap[i] = response.data.data;
          }
        } catch {
          // skip items where no sellers are found
        }
      }
      
      // Update state with found sellers
      setFoundSellers(prev => ({
        ...prev,
        [orderId]: sellersMap
      }));
      
      const totalFound = Object.keys(sellersMap).length;
      if (totalFound === 0) {
        alert('No sellers found for any items in this order');
      }
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
      setFindingOrderId(null);
    }
  };

  const handleChangeSeller = (orderId: string, itemIndex: number, currentSellers: any[], sellerSku: string) => {
    setModalItem({ orderId, itemIndex, currentSellers });
    setCardSearchTerm(sellerSku);
    setShowSellerModal(true);
  };

  const handleRefineSearch = async () => {
    if (!cardSearchTerm.trim() || !modalItem) {
      alert('Please enter a search term');
      return;
    }
    
    setLoading(true);
    try {
      const response = await api.post('/admin/tiktok/find-sellers-with-card', { 
        sellerSku: cardSearchTerm 
      });
      
      if (response.data.success) {
        // Update found sellers for this specific item
        setFoundSellers(prev => ({
          ...prev,
          [modalItem.orderId]: {
            ...prev[modalItem.orderId],
            [modalItem.itemIndex]: response.data.data
          }
        }));
        setShowSellerModal(false);
        setModalItem(null);
      } else {
        alert('Failed to find sellers: ' + response.data.error);
      }
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleAssignCard = async (orderId: string, itemIndex: number, cardId: string, inventoryIndex: number) => {
    setLoading(true);
    try {
      // Get the order to find the quantity being assigned
      const order = orders.find(o => o.orderId === orderId);
      const assignedQuantity = order?.itemList?.[itemIndex]?.quantity || 1;
      
      // Backend automatically handles undo of previous assignment
      const response = await api.post('/admin/tiktok/assign-card-to-order', {
        orderId,
        itemIndex,
        cardId,
        inventoryIndex
      });
      
      if (response.data.success) {
        // Remove this item from found sellers after assignment
        setFoundSellers(prev => {
          const orderSellers = { ...prev[orderId] };
          delete orderSellers[itemIndex];
          return {
            ...prev,
            [orderId]: orderSellers
          };
        });
        
        // Update stock quantities for this card in ALL other found sellers
        setFoundSellers(prev => {
          const updatedSellers = { ...prev };
          
          // Loop through all orders
          Object.keys(updatedSellers).forEach(oId => {
            // Loop through all items in each order
            Object.keys(updatedSellers[oId]).forEach(iIdx => {
              // Loop through all cards for each item
              updatedSellers[oId][Number(iIdx)] = updatedSellers[oId][Number(iIdx)].map((card: any) => {
                if (card.cardId === cardId) {
                  // Update inventory for this card
                  return {
                    ...card,
                    inventory: card.inventory.map((inv: any) => {
                      if (inv.inventoryIndex === inventoryIndex) {
                        // Reduce stock by assigned quantity
                        const newQty = Math.max(0, inv.quantityForSale - assignedQuantity);
                        return {
                          ...inv,
                          quantityForSale: newQty
                        };
                      }
                      return inv;
                    })
                  };
                }
                return card;
              });
            });
          });
          
          return updatedSellers;
        });
        
        fetchOrders(); // Refresh orders to show assignment
      } else {
        alert('Failed to assign: ' + response.data.error);
      }
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleUndoAssignment = async (orderId: string, itemIndex: number) => {
    const confirm = window.confirm('Are you sure you want to undo this assignment? Stock will be restored.');
    if (!confirm) return;
    
    // Get assignment details before undoing
    const order = orders.find(o => o.orderId === orderId);
    const item = order?.itemList?.[itemIndex];
    const assignedSeller = item?.assignedSeller;
    const quantity = item?.quantity || 1;
    
    setLoading(true);
    try {
      const response = await api.post('/admin/tiktok/undo-card-assignment', {
        orderId,
        itemIndex
      });
      
      if (response.data.success) {
        // Restore stock quantities in foundSellers state
        if (assignedSeller) {
          setFoundSellers(prev => {
            const updatedSellers = { ...prev };
            
            // Loop through all orders
            Object.keys(updatedSellers).forEach(oId => {
              // Loop through all items in each order
              Object.keys(updatedSellers[oId]).forEach(iIdx => {
                // Loop through all cards for each item
                updatedSellers[oId][Number(iIdx)] = updatedSellers[oId][Number(iIdx)].map((card: any) => {
                  if (card.cardId === assignedSeller.cardId) {
                    // Update inventory for this card
                    return {
                      ...card,
                      inventory: card.inventory.map((inv: any) => {
                        if (inv.inventoryIndex === assignedSeller.inventoryIndex) {
                          // Restore stock by adding back the quantity
                          return {
                            ...inv,
                            quantityForSale: inv.quantityForSale + quantity
                          };
                        }
                        return inv;
                      })
                    };
                  }
                  return card;
                });
              });
            });
            
            return updatedSellers;
          });
        }
        
        alert(`✅ ${response.data.message}`);
        fetchOrders(); // Refresh orders
      } else {
        alert('Failed to undo: ' + response.data.error);
      }
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const handleEditStock = async () => {
    if (!editingStock) return;
    
    setLoading(true);
    try {
      const response = await api.post('/admin/tiktok/edit-inventory-stock', {
        cardId: editingStock.cardId,
        inventoryIndex: editingStock.inventoryIndex,
        newQuantity: newStockQty
      });
      
      if (response.data.success) {
        // Update stock quantities in foundSellers state
        setFoundSellers(prev => {
          const updatedSellers = { ...prev };
          
          // Loop through all orders
          Object.keys(updatedSellers).forEach(oId => {
            // Loop through all items in each order
            Object.keys(updatedSellers[oId]).forEach(iIdx => {
              // Loop through all cards for each item
              updatedSellers[oId][Number(iIdx)] = updatedSellers[oId][Number(iIdx)].map((card: any) => {
                if (card.cardId === editingStock.cardId) {
                  // Update inventory for this card
                  return {
                    ...card,
                    inventory: card.inventory.map((inv: any) => {
                      if (inv.inventoryIndex === editingStock.inventoryIndex) {
                        // Set to new quantity
                        return {
                          ...inv,
                          quantityForSale: newStockQty
                        };
                      }
                      return inv;
                    })
                  };
                }
                return card;
              });
            });
          });
          
          return updatedSellers;
        });
        
        alert(`✅ ${response.data.message}`);
        setEditingStock(null);
        setNewStockQty(0);
        // Refresh seller list if modal is open
        if (modalItem) {
          handleRefineSearch();
        }
      } else {
        alert('Failed to edit stock: ' + response.data.error);
      }
    } catch (err: any) {
      alert('Error: ' + (err.response?.data?.error || err.message));
    } finally {
      setLoading(false);
    }
  };

  const formatDate = (timestamp: number) => {
    return new Date(timestamp * 1000).toLocaleString('id-ID', {
      year: 'numeric',
      month: 'short',
      day: 'numeric',
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatPrice = (price: number | string) => {
    const numPrice = typeof price === 'string' ? parseFloat(price) : price;
    return `Rp${numPrice.toLocaleString('id-ID')}`;
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
                  Saved TikTok Orders
                </h1>
                <p className="text-sm mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                  View all orders synced from TikTok Shop ({total} total)
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
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Order ID
              </label>
              <div className="flex gap-2">
                <input
                  type="text"
                  value={orderIdSearch}
                  onChange={(e) => setOrderIdSearch(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--color-background)', 
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)'
                  }}
                  placeholder="Search by Order ID"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleSearch();
                    }
                  }}
                />
                <button
                  onClick={handleSearch}
                  className="px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  Search
                </button>
              </div>
            </div>
            <div>
              <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                Status Filter
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
                <option value="">All Status</option>
                <option value="UNPAID">Unpaid</option>
                <option value="AWAITING_SHIPMENT">Awaiting Shipment</option>
                <option value="AWAITING_COLLECTION">Awaiting Collection</option>
                <option value="IN_TRANSIT">In Transit</option>
                <option value="DELIVERED">Delivered</option>
                <option value="COMPLETED">Completed</option>
                <option value="CANCELLED">Cancelled</option>
              </select>
            </div>
            <div className="flex items-end gap-2">
              <button
                onClick={fetchOrders}
                disabled={loading}
                className="flex-1 px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: 'var(--color-accent)' }}
              >
                {loading ? 'Loading...' : 'Refresh'}
              </button>
              <button
                onClick={handleResyncOrders}
                disabled={loading}
                className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: '#8b5cf6' }}
                title="Delete all and fetch fresh orders from TikTok (last 7 days)"
              >
                🔄 Re-sync
              </button>
              <button
                onClick={handleDeleteAllOrders}
                disabled={loading || total === 0}
                className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
                style={{ backgroundColor: '#dc2626' }}
                title="Delete all orders from database"
              >
                🗑️ Delete All
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

        {/* Orders List */}
        {loading && orders.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
            Loading orders...
          </div>
        ) : orders.length === 0 ? (
          <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
            No orders found. Try syncing orders from TikTok Shop first.
          </div>
        ) : (
          <div className="space-y-4">
            {orders.map((order) => (
              <div key={order.orderId} className="rounded-xl shadow-md overflow-hidden" style={{ backgroundColor: 'var(--color-panel)' }}>
                {/* Order Header */}
                <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                        {order.itemList?.length || 0} pesanan
                      </span>
                    </div>
                    <span className="text-sm px-3 py-1 rounded-full" style={{
                      backgroundColor: order.orderStatus === 'COMPLETED' ? '#dcfce7' : 
                                     order.orderStatus === 'CANCELLED' ? '#fee2e2' : '#dbeafe',
                      color: order.orderStatus === 'COMPLETED' ? '#166534' : 
                             order.orderStatus === 'CANCELLED' ? '#dc2626' : '#1e40af'
                    }}>
                      {order.orderStatus}
                    </span>
                  </div>
                  
                  <div className="flex items-center justify-between mb-2">
                    <div className="flex items-center gap-2">
                      <input type="checkbox" className="w-4 h-4" />
                      <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                        ID Pesanan: {order.orderId}
                      </span>
                    </div>
                    <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                      {order.recipientAddress?.name || 'N/A'}
                    </span>
                  </div>

                  <div className="flex justify-between items-center text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                    <span>Dibuat: {formatDate(order.createTime)}</span>
                    <div className="flex gap-2 items-center">
                      {order.lastFetchedDetailAt && (
                        <span className="text-xs px-2 py-1 rounded" style={{ backgroundColor: 'var(--color-background)' }}>
                          ✓ Detail tersimpan
                        </span>
                      )}
                      {/* Find All Sellers Button */}
                      {order.itemList && order.itemList.some((item: any) => !item.assignedSeller) && (
                        <button
                          onClick={() => handleFindAllSellers(order.orderId, order.itemList)}
                          disabled={loading || findingOrderId === order.orderId}
                          className="text-xs px-3 py-1 rounded text-white font-medium disabled:opacity-50"
                          style={{ backgroundColor: 'var(--color-accent)' }}
                        >
                          {findingOrderId === order.orderId ? '⏳ Finding...' : '🔍 Find All Sellers'}
                        </button>
                      )}
                    </div>
                  </div>
                </div>

                {/* Product Items */}
                {order.itemList && order.itemList.length > 0 && (
                  <div className="divide-y" style={{ borderColor: 'var(--color-border)' }}>
                    {order.itemList.map((item: any, index: number) => (
                      <div key={index} className="p-6">
                        <div className="flex gap-4">
                          {/* Product Image */}
                          <div className="flex-shrink-0">
                            <img
                              src={item.skuImage || '/placeholder.png'}
                              alt={item.productName}
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
                                  {item.productName}
                                  <span className="ml-2 text-sm" style={{ color: 'var(--color-text-secondary)' }}>
                                    × {item.quantity}
                                  </span>
                                </h3>
                                <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                                  {item.skuName || 'Default'}
                                </p>
                                <p className="text-xs mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                                  SKU Penjual: {item.sellerSku}
                                </p>
                              </div>

                              {/* Middle column: Assigned Seller OR Available Sellers */}
                              <div className="w-64 flex-shrink-0">
                                {item.assignedSeller ? (
                                  (() => {
                                    return (
                                      <div className="flex flex-col gap-3">
                                        <div
                                          className="flex items-center gap-2 px-4 py-3 rounded-lg"
                                          style={{ backgroundColor: '#dcfce7', border: '1.5px solid #86efac' }}
                                        >
                                          <svg className="w-5 h-5 flex-shrink-0" style={{ color: '#166534' }} fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2.5} d="M5 13l4 4L19 7" />
                                          </svg>
                                          <span className="text-sm font-bold" style={{ color: '#166534' }}>
                                            {item.assignedSeller.sellerName}
                                          </span>
                                        </div>
                                        <button
                                          onClick={() => handleUndoAssignment(order.orderId, index)}
                                          className="flex items-center justify-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold text-white w-full"
                                          style={{ backgroundColor: '#f59e0b' }}
                                        >
                                          ↩️ Undo Assignment
                                        </button>
                                      </div>
                                    );
                                  })()
                                ) : foundSellers[order.orderId]?.[index] && foundSellers[order.orderId][index].length > 0 ? (
                                  <div>
                                    <p className="text-xs mb-2" style={{ color: 'var(--color-text-secondary)' }}>Available Sellers:</p>
                                    <div className="space-y-2">
                                      {foundSellers[order.orderId][index].map((card: any) => (
                                        <div key={card.cardId}>
                                          {card.inventory.map((inv: any) => {
                                            return (
                                              <div
                                                key={inv.inventoryIndex}
                                                className="flex items-center gap-2 p-2 rounded-lg"
                                                style={{ backgroundColor: 'var(--color-background)' }}
                                              >
                                                <div className="flex-1 min-w-0">
                                                  <div className="text-xs font-medium" style={{ color: 'var(--color-text)' }}>
                                                    {inv.sellerName}
                                                  </div>
                                                  <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                                                    {inv.condition} • {inv.finish} • Stock: {inv.quantityForSale}
                                                  </div>
                                                </div>
                                                <div className="flex gap-1">
                                                  <button
                                                    onClick={() => handleAssignCard(order.orderId, index, card.cardId, inv.inventoryIndex)}
                                                    disabled={loading}
                                                    className="text-xs px-2 py-1 rounded text-white font-medium disabled:opacity-50"
                                                    style={{ backgroundColor: '#10b981' }}
                                                  >
                                                    ✓ Check
                                                  </button>
                                                  <button
                                                    onClick={() => handleChangeSeller(order.orderId, index, foundSellers[order.orderId][index], item.sellerSku)}
                                                    disabled={loading}
                                                    className="text-xs px-2 py-1 rounded text-white disabled:opacity-50"
                                                    style={{ backgroundColor: '#6366f1' }}
                                                  >
                                                    Change
                                                  </button>
                                                </div>
                                              </div>
                                            );
                                          })}
                                        </div>
                                      ))}
                                    </div>
                                  </div>
                                ) : null}
                              </div>

                              {/* Right side: Price */}
                              <div className="text-right flex flex-col items-end gap-2">
                                <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                                  {formatPrice(item.salePrice || item.originalPrice)}
                                </p>
                              </div>
                            </div>
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                )}

                {/* Payment Summary */}
                {order.payment && (
                  <div className="p-6 border-t" style={{ borderColor: 'var(--color-border)', backgroundColor: 'var(--color-background)' }}>
                    <div className="max-w-md ml-auto space-y-2">
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--color-text-secondary)' }}>Subtotal Produk</span>
                        <span style={{ color: 'var(--color-text)' }}>
                          {formatPrice(order.payment.subTotal)}
                        </span>
                      </div>
                      <div className="flex justify-between text-sm">
                        <span style={{ color: 'var(--color-text-secondary)' }}>Biaya Pengiriman</span>
                        <span style={{ color: 'var(--color-text)' }}>
                          {formatPrice(order.payment.shippingFee)}
                        </span>
                      </div>
                      {parseFloat(order.payment.platformDiscount || '0') > 0 && (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--color-text-secondary)' }}>Diskon Platform</span>
                          <span style={{ color: '#22c55e' }}>
                            -{formatPrice(order.payment.platformDiscount)}
                          </span>
                        </div>
                      )}
                      {parseFloat(order.payment.sellerDiscount || '0') > 0 && (
                        <div className="flex justify-between text-sm">
                          <span style={{ color: 'var(--color-text-secondary)' }}>Diskon Penjual</span>
                          <span style={{ color: '#22c55e' }}>
                            -{formatPrice(order.payment.sellerDiscount)}
                          </span>
                        </div>
                      )}
                      <div className="flex justify-between font-semibold pt-2 border-t" style={{ borderColor: 'var(--color-border)' }}>
                        <span style={{ color: 'var(--color-text)' }}>Total Pembayaran</span>
                        <span style={{ color: 'var(--color-text)' }}>
                          {formatPrice(order.payment.totalAmount)}
                        </span>
                      </div>
                    </div>
                  </div>
                )}

                {/* Shipping Address */}
                {order.recipientAddress && (
                  <div className="p-6 border-t" style={{ borderColor: 'var(--color-border)' }}>
                    <h3 className="font-semibold mb-3" style={{ color: 'var(--color-text)' }}>
                      Alamat Pengiriman
                    </h3>
                    <div className="text-sm space-y-1" style={{ color: 'var(--color-text-secondary)' }}>
                      <p className="font-medium" style={{ color: 'var(--color-text)' }}>
                        {order.recipientAddress.name}
                      </p>
                      <p>{order.recipientAddress.phone}</p>
                      {order.recipientAddress.fullAddress && <p>{order.recipientAddress.fullAddress}</p>}
                      <p>
                        {[
                          order.recipientAddress.district,
                          order.recipientAddress.city,
                          order.recipientAddress.province,
                          order.recipientAddress.postalCode
                        ].filter(Boolean).join(', ')}
                      </p>
                    </div>
                  </div>
                )}
              </div>
            ))}
          </div>
        )}

        {/* Pagination */}
        {totalPages > 1 && (
          <div className="mt-6 flex justify-center gap-2">
            <button
              onClick={() => setPage(p => Math.max(1, p - 1))}
              disabled={page === 1}
              className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              Previous
            </button>
            <span className="px-4 py-2" style={{ color: 'var(--color-text)' }}>
              Page {page} of {totalPages}
            </span>
            <button
              onClick={() => setPage(p => Math.min(totalPages, p + 1))}
              disabled={page === totalPages}
              className="px-4 py-2 rounded-lg text-white font-medium disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-accent)' }}
            >
              Next
            </button>
          </div>
        )}
      </div>

      {/* Seller Selection Modal - for changing seller */}
      {showSellerModal && modalItem && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => {
            setShowSellerModal(false);
            setModalItem(null);
            setCardSearchTerm('');
          }}
        >
          <div 
            className="rounded-xl shadow-2xl max-w-4xl w-full max-h-[80vh] overflow-auto"
            style={{ backgroundColor: 'var(--color-panel)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b sticky top-0 z-10" style={{ 
              borderColor: 'var(--color-border)',
              backgroundColor: 'var(--color-panel)'
            }}>
              <div className="flex justify-between items-center mb-4">
                <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                  Change Seller - Search Alternative
                </h2>
                <button
                  onClick={() => {
                    setShowSellerModal(false);
                    setModalItem(null);
                    setCardSearchTerm('');
                  }}
                  className="p-2 rounded-lg hover:bg-opacity-80"
                  style={{ backgroundColor: 'var(--color-background)' }}
                >
                  <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" style={{ color: 'var(--color-text)' }}>
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>
              
              {/* Search refinement */}
              <div className="flex gap-2">
                <input
                  type="text"
                  value={cardSearchTerm}
                  onChange={(e) => setCardSearchTerm(e.target.value)}
                  className="flex-1 px-4 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--color-background)', 
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)'
                  }}
                  placeholder="Refine search by Seller SKU (e.g., OTJ-0142-N-EN-Uncommon)"
                  onKeyPress={(e) => {
                    if (e.key === 'Enter') {
                      handleRefineSearch();
                    }
                  }}
                />
                <button
                  onClick={handleRefineSearch}
                  disabled={loading}
                  className="px-4 py-2 rounded-lg text-white font-medium whitespace-nowrap disabled:opacity-50"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  🔍 Update Results
                </button>
              </div>
            </div>

            <div className="p-6">
              {!modalItem.currentSellers || modalItem.currentSellers.length === 0 ? (
                <div className="text-center py-12" style={{ color: 'var(--color-text-secondary)' }}>
                  <p className="mb-2">No sellers found with matching Seller SKU in stock</p>
                  <p className="text-xs">Searching for: <span className="font-mono font-bold" style={{ color: 'var(--color-text)' }}>{cardSearchTerm}</span></p>
                  <p className="text-xs mt-2">Make sure the SKU format matches your database (e.g., OTJ-0142-N-EN-Uncommon)</p>
                </div>
              ) : (
                <div className="space-y-4">
                  {modalItem.currentSellers.map((card) => (
                    <div key={card.cardId} className="border rounded-lg p-4" style={{ borderColor: 'var(--color-border)' }}>
                      <div className="flex gap-4 mb-4">
                        {card.imageUrl && (
                          <img 
                            src={card.imageUrl} 
                            alt={card.name}
                            className="w-24 h-32 object-cover rounded border"
                            style={{ borderColor: 'var(--color-border)' }}
                          />
                        )}
                        <div>
                          <h3 className="font-bold text-lg mb-1" style={{ color: 'var(--color-text)' }}>
                            {card.name}
                          </h3>
                          <p className="text-sm mb-1" style={{ color: 'var(--color-text-secondary)' }}>
                            {card.setName} ({card.setCode}) #{card.collectorNumber}
                          </p>
                        </div>
                      </div>

                      <div className="space-y-2">
                        {card.inventory.map((inv: any) => (
                          <div 
                            key={inv.inventoryIndex}
                            className="flex justify-between items-center p-3 rounded-lg"
                            style={{ backgroundColor: 'var(--color-background)' }}
                          >
                            <div>
                              <span className="font-medium" style={{ color: 'var(--color-text)' }}>
                                {inv.sellerEmail || inv.sellerName || 'Unknown Seller'}
                              </span>
                              <span className="text-sm ml-3" style={{ color: 'var(--color-text-secondary)' }}>
                                {inv.condition} • {inv.finish}
                              </span>
                              <span className="text-sm ml-3 font-semibold" style={{ color: inv.quantityForSale > 0 ? '#22c55e' : '#dc2626' }}>
                                Stock: {inv.quantityForSale}
                              </span>
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={() => {
                                  setEditingStock({
                                    cardId: card.cardId,
                                    inventoryIndex: inv.inventoryIndex,
                                    currentQty: inv.quantityForSale
                                  });
                                  setNewStockQty(inv.quantityForSale);
                                }}
                                className="text-xs px-3 py-1 rounded text-white"
                                style={{ backgroundColor: '#64748b' }}
                              >
                                ✏️ Edit Stock
                              </button>
                              <button
                                onClick={() => {
                                  if (modalItem) {
                                    handleAssignCard(modalItem.orderId, modalItem.itemIndex, card.cardId, inv.inventoryIndex);
                                    setShowSellerModal(false);
                                    setModalItem(null);
                                  }
                                }}
                                disabled={loading}
                                className="px-4 py-1 rounded text-white disabled:opacity-50"
                                style={{ backgroundColor: 'var(--color-accent)' }}
                              >
                                Assign This
                              </button>
                            </div>
                          </div>
                        ))}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}

      {/* Edit Stock Modal */}
      {editingStock && (
        <div 
          className="fixed inset-0 z-50 flex items-center justify-center p-4"
          style={{ backgroundColor: 'rgba(0, 0, 0, 0.7)' }}
          onClick={() => {
            setEditingStock(null);
            setNewStockQty(0);
          }}
        >
          <div 
            className="rounded-xl shadow-2xl max-w-md w-full"
            style={{ backgroundColor: 'var(--color-panel)' }}
            onClick={(e) => e.stopPropagation()}
          >
            <div className="p-6 border-b" style={{ borderColor: 'var(--color-border)' }}>
              <h2 className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>
                Edit Stock Quantity
              </h2>
            </div>

            <div className="p-6">
              <div className="mb-4">
                <p className="text-sm mb-2" style={{ color: 'var(--color-text-secondary)' }}>
                  Current Stock: <span className="font-bold" style={{ color: 'var(--color-text)' }}>{editingStock.currentQty}</span>
                </p>
                <label className="block text-sm font-medium mb-2" style={{ color: 'var(--color-text)' }}>
                  New Quantity
                </label>
                <input
                  type="number"
                  value={newStockQty}
                  onChange={(e) => setNewStockQty(parseInt(e.target.value) || 0)}
                  min="0"
                  className="w-full px-4 py-2 rounded-lg"
                  style={{ 
                    backgroundColor: 'var(--color-background)', 
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)'
                  }}
                />
              </div>

              <div className="flex gap-2">
                <button
                  onClick={() => {
                    setEditingStock(null);
                    setNewStockQty(0);
                  }}
                  className="flex-1 px-4 py-2 rounded-lg font-medium"
                  style={{ 
                    backgroundColor: 'var(--color-background)',
                    color: 'var(--color-text)',
                    border: '1px solid var(--color-border)'
                  }}
                >
                  Cancel
                </button>
                <button
                  onClick={handleEditStock}
                  className="flex-1 px-4 py-2 rounded-lg text-white font-medium"
                  style={{ backgroundColor: 'var(--color-accent)' }}
                >
                  Save
                </button>
              </div>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

export default AdminTikTokSavedOrdersPage;
