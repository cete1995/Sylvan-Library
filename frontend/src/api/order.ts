import api from './client';

export interface OrderItem {
  card: {
    _id: string;
    name: string;
    imageUrl: string;
    setName: string;
  };
  cardName: string;
  condition: string;
  finish: string;
  quantity: number;
  pricePerUnit: number;
  subtotal: number;
}

export interface Order {
  _id: string;
  user: string;
  orderNumber: string;
  items: OrderItem[];
  totalAmount: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  shippingAddress: string;
  phoneNumber: string;
  courierNotes?: string;
  paymentMethod?: string;
  paymentStatus: 'unpaid' | 'paid' | 'refunded';
  createdAt: string;
  updatedAt: string;
}

export interface CreateOrderData {
  items: {
    card: string;
    cardName: string;
    condition: string;
    finish: string;
    quantity: number;
    pricePerUnit: number;
    subtotal: number;
  }[];
  shippingAddress: string;
  phoneNumber: string;
  courierNotes?: string;
  paymentMethod?: string;
}

export const orderApi = {
  getUserOrders: async (): Promise<Order[]> => {
    const response = await api.get<{ orders: Order[] }>('/orders');
    return response.data.orders;
  },

  getOrderById: async (id: string): Promise<Order> => {
    const response = await api.get<{ order: Order }>(`/orders/${id}`);
    return response.data.order;
  },

  createOrder: async (data: CreateOrderData): Promise<Order> => {
    const response = await api.post<{ order: Order; message: string }>('/orders', data);
    return response.data.order;
  },

  // Admin routes
  getAllOrders: async (filters?: { status?: string; paymentStatus?: string }): Promise<Order[]> => {
    const params = new URLSearchParams(filters as any);
    const response = await api.get<{ orders: Order[] }>(`/orders/admin/all?${params}`);
    return response.data.orders;
  },

  updateOrderStatus: async (id: string, data: { status?: string; paymentStatus?: string }): Promise<Order> => {
    const response = await api.put<{ order: Order; message: string }>(`/orders/admin/${id}`, data);
    return response.data.order;
  },
};
