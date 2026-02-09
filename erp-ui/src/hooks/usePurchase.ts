/**
 * ERP Purchase React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { purchaseApi } from '../api';
import type { PurchaseOrderCreate } from '../api';

// Query Keys
export const purchaseKeys = {
  all: ['purchase'] as const,
  orders: (params?: any) => [...purchaseKeys.all, 'orders', params] as const,
  order: (id: number) => [...purchaseKeys.all, 'order', id] as const,
  receipts: (params?: any) => [...purchaseKeys.all, 'receipts', params] as const,
  invoices: (params?: any) => [...purchaseKeys.all, 'invoices', params] as const,
  statistics: () => [...purchaseKeys.all, 'statistics'] as const,
};

// Hooks - 발주
export const usePurchaseOrders = (params?: {
  page?: number;
  page_size?: number;
  status?: string;
  vendor_code?: string;
}) => {
  return useQuery({
    queryKey: purchaseKeys.orders(params),
    queryFn: () => purchaseApi.getOrders(params),
    staleTime: 30 * 1000,
  });
};

export const usePurchaseOrder = (orderId: number) => {
  return useQuery({
    queryKey: purchaseKeys.order(orderId),
    queryFn: () => purchaseApi.getOrder(orderId),
    enabled: !!orderId,
  });
};

export const useCreatePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: PurchaseOrderCreate) => purchaseApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.orders() });
    },
  });
};

export const useApprovePurchaseOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => purchaseApi.approveOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.orders() });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.order(orderId) });
    },
  });
};

// Hooks - 입고
export const useGoodsReceipts = (params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: purchaseKeys.receipts(params),
    queryFn: () => purchaseApi.getReceipts(params),
    staleTime: 30 * 1000,
  });
};

export const useCreateReceipt = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }: {
      orderId: number;
      data: { receipt_date: string; warehouse_code: string; items: { item_code: string; qty: number }[] }
    }) => purchaseApi.createReceipt(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: purchaseKeys.receipts() });
      queryClient.invalidateQueries({ queryKey: purchaseKeys.orders() });
    },
  });
};

// Hooks - 매입
export const usePurchaseInvoices = (params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: purchaseKeys.invoices(params),
    queryFn: () => purchaseApi.getInvoices(params),
    staleTime: 30 * 1000,
  });
};

// Hooks - 통계
export const usePurchaseStatistics = () => {
  return useQuery({
    queryKey: purchaseKeys.statistics(),
    queryFn: () => purchaseApi.getStatistics(),
    staleTime: 60 * 1000,
  });
};
