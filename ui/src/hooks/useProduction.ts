/**
 * Production React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getWorkOrders,
  getWorkOrder,
  startWorkOrder,
  completeWorkOrder,
  getProductionResults,
  createProductionResult,
  getRealtimeProduction,
  getDailyProductionAnalysis,
  getLineProductionStatus,
} from '../api';

// Query Keys
export const productionKeys = {
  all: ['production'] as const,
  workOrders: (params?: any) => [...productionKeys.all, 'work-orders', params] as const,
  workOrder: (id: string) => [...productionKeys.all, 'work-order', id] as const,
  results: (params?: any) => [...productionKeys.all, 'results', params] as const,
  realtime: (lineCode?: string) => [...productionKeys.all, 'realtime', lineCode] as const,
  dailyAnalysis: (params?: any) => [...productionKeys.all, 'daily-analysis', params] as const,
  lineStatus: (lineCode: string) => [...productionKeys.all, 'line-status', lineCode] as const,
};

// Work Orders
export const useWorkOrders = (params?: {
  page?: number;
  page_size?: number;
  status?: string;
  line_code?: string;
  product_code?: string;
}) => {
  return useQuery({
    queryKey: productionKeys.workOrders(params),
    queryFn: () => getWorkOrders(params),
  });
};

export const useWorkOrder = (orderId: string) => {
  return useQuery({
    queryKey: productionKeys.workOrder(orderId),
    queryFn: () => getWorkOrder(orderId),
    enabled: !!orderId,
  });
};

export const useStartWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: startWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.all });
    },
  });
};

export const useCompleteWorkOrder = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: completeWorkOrder,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.all });
    },
  });
};

// Production Results
export const useProductionResults = (params?: {
  page?: number;
  page_size?: number;
  production_order_no?: string;
  line_code?: string;
  shift_code?: string;
}) => {
  return useQuery({
    queryKey: productionKeys.results(params),
    queryFn: () => getProductionResults(params),
  });
};

export const useCreateProductionResult = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createProductionResult,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.results() });
      queryClient.invalidateQueries({ queryKey: productionKeys.realtime() });
    },
  });
};

// Realtime Production
export const useRealtimeProduction = (lineCode?: string, options?: { refetchInterval?: number }) => {
  return useQuery({
    queryKey: productionKeys.realtime(lineCode),
    queryFn: () => getRealtimeProduction({ line_code: lineCode }),
    refetchInterval: options?.refetchInterval ?? 5000, // Default 5 seconds
  });
};

// Daily Analysis
export const useDailyProductionAnalysis = (params?: {
  line_code?: string;
  start_date?: string;
  end_date?: string;
}) => {
  return useQuery({
    queryKey: productionKeys.dailyAnalysis(params),
    queryFn: () => getDailyProductionAnalysis(params),
  });
};

// Line Status
export const useLineProductionStatus = (lineCode: string) => {
  return useQuery({
    queryKey: productionKeys.lineStatus(lineCode),
    queryFn: () => getLineProductionStatus(lineCode),
    enabled: !!lineCode,
    refetchInterval: 10000, // Refresh every 10 seconds
  });
};
