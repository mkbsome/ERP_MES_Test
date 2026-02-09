/**
 * ERP Sales React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { salesApi } from '../api';
import type { SalesOrderCreate } from '../api';

// Query Keys
export const salesKeys = {
  all: ['sales'] as const,
  orders: (params?: any) => [...salesKeys.all, 'orders', params] as const,
  order: (id: number) => [...salesKeys.all, 'order', id] as const,
  shipments: (params?: any) => [...salesKeys.all, 'shipments', params] as const,
  revenues: (params?: any) => [...salesKeys.all, 'revenues', params] as const,
  statistics: (params?: any) => [...salesKeys.all, 'statistics', params] as const,
};

// Hooks - 수주
export const useSalesOrders = (params?: {
  page?: number;
  page_size?: number;
  status?: string;
  customer_code?: string;
  from_date?: string;
  to_date?: string;
}) => {
  return useQuery({
    queryKey: salesKeys.orders(params),
    queryFn: () => salesApi.getOrders(params),
    staleTime: 30 * 1000,
  });
};

export const useSalesOrder = (orderId: number) => {
  return useQuery({
    queryKey: salesKeys.order(orderId),
    queryFn: () => salesApi.getOrder(orderId),
    enabled: !!orderId,
  });
};

export const useCreateSalesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: SalesOrderCreate) => salesApi.createOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.orders() });
    },
  });
};

export const useApproveSalesOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => salesApi.approveOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: salesKeys.orders() });
      queryClient.invalidateQueries({ queryKey: salesKeys.order(orderId) });
    },
  });
};

// Hooks - 출하
export const useShipments = (params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: salesKeys.shipments(params),
    queryFn: () => salesApi.getShipments(params),
    staleTime: 30 * 1000,
  });
};

export const useCreateShipment = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: ({ orderId, data }: {
      orderId: number;
      data: { shipment_date: string; carrier: string; items: { product_code: string; qty: number }[] }
    }) => salesApi.createShipment(orderId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: salesKeys.shipments() });
      queryClient.invalidateQueries({ queryKey: salesKeys.orders() });
    },
  });
};

// Hooks - 매출
export const useSalesRevenues = (params?: {
  page?: number;
  page_size?: number;
  status?: string;
}) => {
  return useQuery({
    queryKey: salesKeys.revenues(params),
    queryFn: () => salesApi.getRevenues(params),
    staleTime: 30 * 1000,
  });
};

// Hooks - 통계
export const useSalesStatistics = (params?: { from_date?: string; to_date?: string }) => {
  return useQuery({
    queryKey: salesKeys.statistics(params),
    queryFn: () => salesApi.getStatistics(params),
    staleTime: 60 * 1000,
  });
};
