/**
 * ERP Inventory React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { inventoryApi } from '../api';
import type { TransactionCreate } from '../api';

// Query Keys
export const inventoryKeys = {
  all: ['inventory'] as const,
  stocks: (params?: any) => [...inventoryKeys.all, 'stocks', params] as const,
  stockByItem: (itemCode: string) => [...inventoryKeys.all, 'stock', itemCode] as const,
  transactions: (params?: any) => [...inventoryKeys.all, 'transactions', params] as const,
  analysis: () => [...inventoryKeys.all, 'analysis'] as const,
  belowSafety: () => [...inventoryKeys.all, 'belowSafety'] as const,
  excess: () => [...inventoryKeys.all, 'excess'] as const,
  summary: () => [...inventoryKeys.all, 'summary'] as const,
};

// Hooks - 재고 현황
export const useInventoryStocks = (params?: {
  page?: number;
  page_size?: number;
  item_type?: string;
  warehouse_code?: string;
  status?: string;
  search?: string;
}) => {
  return useQuery({
    queryKey: inventoryKeys.stocks(params),
    queryFn: () => inventoryApi.getStocks(params),
    staleTime: 30 * 1000,
  });
};

export const useStockByItem = (itemCode: string) => {
  return useQuery({
    queryKey: inventoryKeys.stockByItem(itemCode),
    queryFn: () => inventoryApi.getStockByItem(itemCode),
    enabled: !!itemCode,
  });
};

// Hooks - 재고 이동/조정
export const useInventoryTransactions = (params?: {
  page?: number;
  page_size?: number;
  transaction_type?: string;
  item_code?: string;
  from_date?: string;
  to_date?: string;
}) => {
  return useQuery({
    queryKey: inventoryKeys.transactions(params),
    queryFn: () => inventoryApi.getTransactions(params),
    staleTime: 30 * 1000,
  });
};

export const useCreateTransaction = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: TransactionCreate) => inventoryApi.createTransaction(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: inventoryKeys.stocks() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.transactions() });
      queryClient.invalidateQueries({ queryKey: inventoryKeys.summary() });
    },
  });
};

// Hooks - 분석
export const useInventoryAnalysis = () => {
  return useQuery({
    queryKey: inventoryKeys.analysis(),
    queryFn: () => inventoryApi.getAnalysis(),
    staleTime: 5 * 60 * 1000, // 5분
  });
};

export const useBelowSafetyStock = () => {
  return useQuery({
    queryKey: inventoryKeys.belowSafety(),
    queryFn: () => inventoryApi.getBelowSafetyStock(),
    staleTime: 60 * 1000,
  });
};

export const useExcessStock = () => {
  return useQuery({
    queryKey: inventoryKeys.excess(),
    queryFn: () => inventoryApi.getExcessStock(),
    staleTime: 60 * 1000,
  });
};

export const useInventorySummary = () => {
  return useQuery({
    queryKey: inventoryKeys.summary(),
    queryFn: () => inventoryApi.getSummary(),
    staleTime: 60 * 1000,
  });
};
