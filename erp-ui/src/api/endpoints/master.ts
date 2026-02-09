/**
 * ERP Master Data API Endpoints
 */
import apiClient from '../client';

// Types
export interface Product {
  id: number;
  product_code: string;
  product_name: string;
  product_type: 'finished_goods' | 'semi_finished' | 'raw_material';
  category: string;
  unit: string;
  standard_cost: number;
  selling_price: number;
  safety_stock: number;
  lead_time: number;
  status: 'active' | 'inactive' | 'discontinued';
  created_at: string;
  updated_at: string;
}

export interface Customer {
  id: number;
  customer_code: string;
  customer_name: string;
  customer_type: 'domestic' | 'export';
  business_no: string;
  ceo_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  payment_terms: string;
  credit_limit: number;
  status: 'active' | 'inactive';
  created_at: string;
  updated_at: string;
}

export interface Vendor {
  id: number;
  vendor_code: string;
  vendor_name: string;
  vendor_type: 'manufacturer' | 'distributor' | 'service';
  business_no: string;
  ceo_name: string;
  contact_person: string;
  phone: string;
  email: string;
  address: string;
  payment_terms: string;
  lead_time: number;
  quality_rating: number;
  status: 'active' | 'inactive' | 'blacklisted';
  created_at: string;
  updated_at: string;
}

export interface Warehouse {
  id: number;
  warehouse_code: string;
  warehouse_name: string;
  warehouse_type: 'raw_material' | 'wip' | 'finished_goods' | 'mixed';
  location: string;
  capacity: number;
  current_usage: number;
  manager: string;
  status: 'active' | 'inactive';
}

export interface MasterListResponse<T> {
  items: T[];
  total: number;
  page: number;
  page_size: number;
}

// API Functions
export const masterApi = {
  // 품목 마스터
  getProducts: async (params?: {
    page?: number;
    page_size?: number;
    product_type?: string;
    status?: string;
    search?: string;
  }): Promise<MasterListResponse<Product>> => {
    const response = await apiClient.get('/erp/master/products', { params });
    return response.data;
  },

  getProduct: async (productId: number): Promise<Product> => {
    const response = await apiClient.get(`/erp/master/products/${productId}`);
    return response.data;
  },

  createProduct: async (data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.post('/erp/master/products', data);
    return response.data;
  },

  updateProduct: async (productId: number, data: Partial<Product>): Promise<Product> => {
    const response = await apiClient.put(`/erp/master/products/${productId}`, data);
    return response.data;
  },

  // 고객 마스터
  getCustomers: async (params?: {
    page?: number;
    page_size?: number;
    customer_type?: string;
    status?: string;
    search?: string;
  }): Promise<MasterListResponse<Customer>> => {
    const response = await apiClient.get('/erp/master/customers', { params });
    return response.data;
  },

  getCustomer: async (customerId: number): Promise<Customer> => {
    const response = await apiClient.get(`/erp/master/customers/${customerId}`);
    return response.data;
  },

  createCustomer: async (data: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.post('/erp/master/customers', data);
    return response.data;
  },

  updateCustomer: async (customerId: number, data: Partial<Customer>): Promise<Customer> => {
    const response = await apiClient.put(`/erp/master/customers/${customerId}`, data);
    return response.data;
  },

  // 공급업체 마스터
  getVendors: async (params?: {
    page?: number;
    page_size?: number;
    vendor_type?: string;
    status?: string;
    search?: string;
  }): Promise<MasterListResponse<Vendor>> => {
    const response = await apiClient.get('/erp/master/vendors', { params });
    return response.data;
  },

  getVendor: async (vendorId: number): Promise<Vendor> => {
    const response = await apiClient.get(`/erp/master/vendors/${vendorId}`);
    return response.data;
  },

  createVendor: async (data: Partial<Vendor>): Promise<Vendor> => {
    const response = await apiClient.post('/erp/master/vendors', data);
    return response.data;
  },

  updateVendor: async (vendorId: number, data: Partial<Vendor>): Promise<Vendor> => {
    const response = await apiClient.put(`/erp/master/vendors/${vendorId}`, data);
    return response.data;
  },

  // 창고 마스터
  getWarehouses: async (params?: {
    page?: number;
    page_size?: number;
    warehouse_type?: string;
    status?: string;
  }): Promise<MasterListResponse<Warehouse>> => {
    const response = await apiClient.get('/erp/master/warehouses', { params });
    return response.data;
  },

  getWarehouse: async (warehouseId: number): Promise<Warehouse> => {
    const response = await apiClient.get(`/erp/master/warehouses/${warehouseId}`);
    return response.data;
  },
};

export default masterApi;
