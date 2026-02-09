/**
 * Material Management React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getFeederSetups,
  getLineFeeders,
  createFeederSetup,
  updateFeederSetup,
  getMaterialConsumption,
  createMaterialConsumption,
  getMaterialRequests,
  createMaterialRequest,
  updateMaterialRequest,
  getMaterialInventory,
  createMaterialInventory,
  updateMaterialInventory,
  getLineMaterialSummary,
  getMaterialShortageAlerts,
} from '../api/endpoints/material';

// Query Keys
export const materialKeys = {
  all: ['material'] as const,
  feeders: (params?: any) => [...materialKeys.all, 'feeders', params] as const,
  lineFeeders: (lineCode: string) => [...materialKeys.all, 'lineFeeders', lineCode] as const,
  consumption: (params?: any) => [...materialKeys.all, 'consumption', params] as const,
  requests: (params?: any) => [...materialKeys.all, 'requests', params] as const,
  inventory: (params?: any) => [...materialKeys.all, 'inventory', params] as const,
  lineSummary: () => [...materialKeys.all, 'lineSummary'] as const,
  shortageAlerts: () => [...materialKeys.all, 'shortageAlerts'] as const,
};

// Feeder Hooks
export const useFeederSetups = (params?: {
  line_code?: string;
  status?: string;
  material_code?: string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: materialKeys.feeders(params),
    queryFn: () => getFeederSetups(params),
  });
};

export const useLineFeeders = (lineCode: string) => {
  return useQuery({
    queryKey: materialKeys.lineFeeders(lineCode),
    queryFn: () => getLineFeeders(lineCode),
    enabled: !!lineCode,
  });
};

export const useCreateFeederSetup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createFeederSetup,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.feeders() });
    },
  });
};

export const useUpdateFeederSetup = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ setupId, data }: { setupId: string; data: any }) =>
      updateFeederSetup(setupId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.feeders() });
    },
  });
};

// Consumption Hooks
export const useMaterialConsumption = (params?: {
  line_code?: string;
  material_code?: string;
  start_date?: string;
  end_date?: string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: materialKeys.consumption(params),
    queryFn: () => getMaterialConsumption(params),
  });
};

export const useCreateMaterialConsumption = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMaterialConsumption,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.consumption() });
    },
  });
};

// Request Hooks
export const useMaterialRequests = (params?: {
  line_code?: string;
  status?: string;
  urgency?: string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: materialKeys.requests(params),
    queryFn: () => getMaterialRequests(params),
  });
};

export const useCreateMaterialRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMaterialRequest,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.requests() });
    },
  });
};

export const useUpdateMaterialRequest = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ requestId, data }: { requestId: string; data: any }) =>
      updateMaterialRequest(requestId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.requests() });
    },
  });
};

// Inventory Hooks
export const useMaterialInventory = (params?: {
  location_code?: string;
  material_code?: string;
  low_stock?: boolean;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: materialKeys.inventory(params),
    queryFn: () => getMaterialInventory(params),
  });
};

export const useCreateMaterialInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createMaterialInventory,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.inventory() });
    },
  });
};

export const useUpdateMaterialInventory = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ inventoryId, data }: { inventoryId: string; data: any }) =>
      updateMaterialInventory(inventoryId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: materialKeys.inventory() });
    },
  });
};

// Summary & Alerts Hooks
export const useLineMaterialSummary = () => {
  return useQuery({
    queryKey: materialKeys.lineSummary(),
    queryFn: getLineMaterialSummary,
    refetchInterval: 30000, // 30초마다 갱신
  });
};

export const useMaterialShortageAlerts = () => {
  return useQuery({
    queryKey: materialKeys.shortageAlerts(),
    queryFn: getMaterialShortageAlerts,
    refetchInterval: 10000, // 10초마다 갱신
  });
};
