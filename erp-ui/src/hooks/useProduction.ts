/**
 * ERP Production React Query Hooks (BOM, Routing, Work Orders)
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { productionApi } from '../api';
import type { WorkOrderCreate } from '../api';

// Query Keys
export const productionKeys = {
  all: ['production'] as const,
  boms: (params?: any) => [...productionKeys.all, 'boms', params] as const,
  bom: (id: number) => [...productionKeys.all, 'bom', id] as const,
  bomExplosion: (productCode: string, level?: number) => [...productionKeys.all, 'bomExplosion', productCode, level] as const,
  routings: (params?: any) => [...productionKeys.all, 'routings', params] as const,
  routing: (id: number) => [...productionKeys.all, 'routing', id] as const,
  workOrders: (params?: any) => [...productionKeys.all, 'workOrders', params] as const,
  workOrder: (id: number) => [...productionKeys.all, 'workOrder', id] as const,
  weeklyPlan: () => [...productionKeys.all, 'weeklyPlan'] as const,
};

// Hooks - BOM
export const useBOMs = (params?: {
  page?: number;
  page_size?: number;
  product_code?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: productionKeys.boms(params),
    queryFn: () => productionApi.getBOMs(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useBOM = (bomId: number) => {
  return useQuery({
    queryKey: productionKeys.bom(bomId),
    queryFn: () => productionApi.getBOM(bomId),
    enabled: !!bomId,
  });
};

export const useBOMExplosion = (productCode: string, level?: number) => {
  return useQuery({
    queryKey: productionKeys.bomExplosion(productCode, level),
    queryFn: () => productionApi.getBOMExplosion(productCode, level),
    enabled: !!productCode,
  });
};

// Hooks - Routing
export const useRoutings = (params?: {
  page?: number;
  page_size?: number;
  product_code?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: productionKeys.routings(params),
    queryFn: () => productionApi.getRoutings(params),
    staleTime: 5 * 60 * 1000,
  });
};

export const useRouting = (routingId: number) => {
  return useQuery({
    queryKey: productionKeys.routing(routingId),
    queryFn: () => productionApi.getRouting(routingId),
    enabled: !!routingId,
  });
};

// Hooks - Work Orders
export const useWorkOrders = (params?: {
  page?: number;
  page_size?: number;
  status?: string;
  line_code?: string;
}) => {
  return useQuery({
    queryKey: productionKeys.workOrders(params),
    queryFn: () => productionApi.getWorkOrders(params),
    staleTime: 30 * 1000,
  });
};

export const useWorkOrder = (orderId: number) => {
  return useQuery({
    queryKey: productionKeys.workOrder(orderId),
    queryFn: () => productionApi.getWorkOrder(orderId),
    enabled: !!orderId,
  });
};

export const useCreateWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (data: WorkOrderCreate) => productionApi.createWorkOrder(data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: productionKeys.workOrders() });
    },
  });
};

export const useReleaseWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => productionApi.releaseWorkOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: productionKeys.workOrders() });
      queryClient.invalidateQueries({ queryKey: productionKeys.workOrder(orderId) });
    },
  });
};

export const useStartWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => productionApi.startWorkOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: productionKeys.workOrders() });
      queryClient.invalidateQueries({ queryKey: productionKeys.workOrder(orderId) });
    },
  });
};

export const useCompleteWorkOrder = () => {
  const queryClient = useQueryClient();

  return useMutation({
    mutationFn: (orderId: number) => productionApi.completeWorkOrder(orderId),
    onSuccess: (_, orderId) => {
      queryClient.invalidateQueries({ queryKey: productionKeys.workOrders() });
      queryClient.invalidateQueries({ queryKey: productionKeys.workOrder(orderId) });
    },
  });
};

export const useWeeklyPlan = () => {
  return useQuery({
    queryKey: productionKeys.weeklyPlan(),
    queryFn: () => productionApi.getWeeklyPlan(),
    staleTime: 5 * 60 * 1000,
  });
};
