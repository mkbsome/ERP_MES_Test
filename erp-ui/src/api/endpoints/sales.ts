/**
 * ERP Sales API Endpoints
 */
import apiClient from '../client';

// Types
export interface SalesOrder {
  id: number;
  order_no: string;
  customer_code: string;
  customer_name: string;
  order_date: string;
  delivery_date: string;
  total_amount: number;
  status: 'draft' | 'approved' | 'in_production' | 'shipped' | 'completed' | 'cancelled';
  items_count: number;
  remarks?: string;
}

export interface SalesOrderItem {
  item_seq: number;
  product_code: string;
  product_name: string;
  qty: number;
  unit_price: number;
  amount: number;
  delivery_date: string;
}

export interface SalesOrderDetail extends SalesOrder {
  items: SalesOrderItem[];
  shipping_address: string;
  payment_terms: string;
}

export interface Shipment {
  id: number;
  shipment_no: string;
  order_no: string;
  customer_name: string;
  shipment_date: string;
  carrier: string;
  tracking_no?: string;
  status: 'preparing' | 'shipped' | 'delivered' | 'returned';
  total_amount: number;
}

export interface SalesRevenue {
  id: number;
  invoice_no: string;
  order_no: string;
  customer_name: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: 'draft' | 'issued' | 'partial' | 'paid' | 'overdue';
}

export interface SalesListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface SalesOrderCreate {
  customer_code: string;
  delivery_date: string;
  items: {
    product_code: string;
    qty: number;
    unit_price: number;
  }[];
  remarks?: string;
}

// API Functions
export const salesApi = {
  // 수주 목록
  getOrders: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    customer_code?: string;
    from_date?: string;
    to_date?: string;
  }): Promise<SalesListResponse<SalesOrder>> => {
    const response = await apiClient.get('/erp/sales/orders', { params });
    return response.data;
  },

  // 수주 상세
  getOrder: async (orderId: number): Promise<SalesOrderDetail> => {
    const response = await apiClient.get(`/erp/sales/orders/${orderId}`);
    return response.data;
  },

  // 수주 생성
  createOrder: async (data: SalesOrderCreate): Promise<SalesOrder> => {
    const response = await apiClient.post('/erp/sales/orders', data);
    return response.data;
  },

  // 수주 승인
  approveOrder: async (orderId: number): Promise<{ message: string; status: string }> => {
    const response = await apiClient.post(`/erp/sales/orders/${orderId}/approve`);
    return response.data;
  },

  // 출하 목록
  getShipments: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<SalesListResponse<Shipment>> => {
    const response = await apiClient.get('/erp/sales/shipments', { params });
    return response.data;
  },

  // 출하 생성
  createShipment: async (orderId: number, data: {
    shipment_date: string;
    carrier: string;
    items: { product_code: string; qty: number }[];
  }): Promise<Shipment> => {
    const response = await apiClient.post(`/erp/sales/orders/${orderId}/ship`, data);
    return response.data;
  },

  // 매출 목록
  getRevenues: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<SalesListResponse<SalesRevenue>> => {
    const response = await apiClient.get('/erp/sales/revenues', { params });
    return response.data;
  },

  // 매출 통계
  getStatistics: async (params?: {
    from_date?: string;
    to_date?: string;
  }): Promise<{
    total_orders: number;
    total_revenue: number;
    average_order_value: number;
    order_completion_rate: number;
  }> => {
    const response = await apiClient.get('/erp/sales/statistics', { params });
    return response.data;
  },
};

export default salesApi;
