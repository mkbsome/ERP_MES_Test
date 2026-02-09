/**
 * ERP Purchase API Endpoints
 */
import apiClient from '../client';

// Types
export interface PurchaseOrder {
  id: number;
  order_no: string;
  vendor_code: string;
  vendor_name: string;
  order_date: string;
  delivery_date: string;
  total_amount: number;
  status: 'draft' | 'approved' | 'ordered' | 'partial_received' | 'received' | 'cancelled';
  items_count: number;
  remarks?: string;
}

export interface PurchaseOrderItem {
  item_seq: number;
  item_code: string;
  item_name: string;
  qty: number;
  received_qty: number;
  unit_price: number;
  amount: number;
}

export interface PurchaseOrderDetail extends PurchaseOrder {
  items: PurchaseOrderItem[];
  payment_terms: string;
  shipping_address: string;
}

export interface GoodsReceipt {
  id: number;
  receipt_no: string;
  order_no: string;
  vendor_name: string;
  receipt_date: string;
  warehouse_code: string;
  status: 'pending_inspection' | 'inspected' | 'stocked' | 'rejected';
  total_qty: number;
  accepted_qty: number;
}

export interface PurchaseInvoice {
  id: number;
  invoice_no: string;
  vendor_invoice_no: string;
  order_no: string;
  vendor_name: string;
  invoice_date: string;
  due_date: string;
  amount: number;
  paid_amount: number;
  status: 'draft' | 'verified' | 'partial' | 'paid' | 'overdue';
}

export interface PurchaseListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

export interface PurchaseOrderCreate {
  vendor_code: string;
  delivery_date: string;
  items: {
    item_code: string;
    qty: number;
    unit_price: number;
  }[];
  remarks?: string;
}

// API Functions
export const purchaseApi = {
  // 발주 목록
  getOrders: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
    vendor_code?: string;
  }): Promise<PurchaseListResponse<PurchaseOrder>> => {
    const response = await apiClient.get('/erp/purchase/orders', { params });
    return response.data;
  },

  // 발주 상세
  getOrder: async (orderId: number): Promise<PurchaseOrderDetail> => {
    const response = await apiClient.get(`/erp/purchase/orders/${orderId}`);
    return response.data;
  },

  // 발주 생성
  createOrder: async (data: PurchaseOrderCreate): Promise<PurchaseOrder> => {
    const response = await apiClient.post('/erp/purchase/orders', data);
    return response.data;
  },

  // 발주 승인
  approveOrder: async (orderId: number): Promise<{ message: string; status: string }> => {
    const response = await apiClient.post(`/erp/purchase/orders/${orderId}/approve`);
    return response.data;
  },

  // 입고 목록
  getReceipts: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<PurchaseListResponse<GoodsReceipt>> => {
    const response = await apiClient.get('/erp/purchase/receipts', { params });
    return response.data;
  },

  // 입고 처리
  createReceipt: async (orderId: number, data: {
    receipt_date: string;
    warehouse_code: string;
    items: { item_code: string; qty: number }[];
  }): Promise<GoodsReceipt> => {
    const response = await apiClient.post(`/erp/purchase/orders/${orderId}/receive`, data);
    return response.data;
  },

  // 매입 목록
  getInvoices: async (params?: {
    page?: number;
    page_size?: number;
    status?: string;
  }): Promise<PurchaseListResponse<PurchaseInvoice>> => {
    const response = await apiClient.get('/erp/purchase/invoices', { params });
    return response.data;
  },

  // 매입 통계
  getStatistics: async (): Promise<{
    total_orders: number;
    pending_receipts: number;
    pending_payments: number;
    overdue_payments: number;
  }> => {
    const response = await apiClient.get('/erp/purchase/statistics');
    return response.data;
  },
};

export default purchaseApi;
