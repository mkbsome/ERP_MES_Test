/**
 * ERP Dashboard React Query Hooks
 */
import { useQuery } from '@tanstack/react-query';
import { dashboardApi } from '../api';

// Query Keys
export const dashboardKeys = {
  all: ['dashboard'] as const,
  summary: () => [...dashboardKeys.all, 'summary'] as const,
  kpis: () => [...dashboardKeys.all, 'kpis'] as const,
  salesSummary: () => [...dashboardKeys.all, 'salesSummary'] as const,
  inventorySummary: () => [...dashboardKeys.all, 'inventorySummary'] as const,
  purchaseSummary: () => [...dashboardKeys.all, 'purchaseSummary'] as const,
  alerts: (limit?: number) => [...dashboardKeys.all, 'alerts', limit] as const,
  monthlyTrend: (months?: number) => [...dashboardKeys.all, 'monthlyTrend', months] as const,
  customerRanking: (limit?: number) => [...dashboardKeys.all, 'customerRanking', limit] as const,
  productRanking: (limit?: number) => [...dashboardKeys.all, 'productRanking', limit] as const,
};

// Hooks
export const useDashboardSummary = () => {
  return useQuery({
    queryKey: dashboardKeys.summary(),
    queryFn: () => dashboardApi.getSummary(),
    staleTime: 30 * 1000, // 30초
    refetchInterval: 60 * 1000, // 1분마다 갱신
  });
};

export const useDashboardKPIs = () => {
  return useQuery({
    queryKey: dashboardKeys.kpis(),
    queryFn: () => dashboardApi.getKPIs(),
    staleTime: 30 * 1000,
    refetchInterval: 60 * 1000,
  });
};

export const useSalesSummary = () => {
  return useQuery({
    queryKey: dashboardKeys.salesSummary(),
    queryFn: () => dashboardApi.getSalesSummary(),
    staleTime: 60 * 1000,
  });
};

export const useInventorySummary = () => {
  return useQuery({
    queryKey: dashboardKeys.inventorySummary(),
    queryFn: () => dashboardApi.getInventorySummary(),
    staleTime: 60 * 1000,
  });
};

export const usePurchaseSummary = () => {
  return useQuery({
    queryKey: dashboardKeys.purchaseSummary(),
    queryFn: () => dashboardApi.getPurchaseSummary(),
    staleTime: 60 * 1000,
  });
};

export const useDashboardAlerts = (limit: number = 10) => {
  return useQuery({
    queryKey: dashboardKeys.alerts(limit),
    queryFn: () => dashboardApi.getAlerts(limit),
    staleTime: 30 * 1000,
    refetchInterval: 30 * 1000,
  });
};

export const useMonthlyTrend = (months: number = 6) => {
  return useQuery({
    queryKey: dashboardKeys.monthlyTrend(months),
    queryFn: () => dashboardApi.getMonthlyTrend(months),
    staleTime: 5 * 60 * 1000, // 5분
  });
};

export const useCustomerRanking = (limit: number = 5) => {
  return useQuery({
    queryKey: dashboardKeys.customerRanking(limit),
    queryFn: () => dashboardApi.getCustomerRanking(limit),
    staleTime: 5 * 60 * 1000,
  });
};

export const useProductRanking = (limit: number = 5) => {
  return useQuery({
    queryKey: dashboardKeys.productRanking(limit),
    queryFn: () => dashboardApi.getProductRanking(limit),
    staleTime: 5 * 60 * 1000,
  });
};
