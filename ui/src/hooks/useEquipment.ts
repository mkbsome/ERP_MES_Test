/**
 * Equipment React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getEquipmentList,
  getEquipment,
  getEquipmentStatus,
  updateEquipmentStatus,
  getAllEquipmentStatus,
  getOEEData,
  getOEETrend,
  getDowntimeEvents,
  createDowntimeEvent,
  updateDowntimeEvent,
  getMaintenanceHistory,
} from '../api';

// Query Keys
export const equipmentKeys = {
  all: ['equipment'] as const,
  list: (params?: any) => [...equipmentKeys.all, 'list', params] as const,
  detail: (id: string) => [...equipmentKeys.all, 'detail', id] as const,
  status: (id: string) => [...equipmentKeys.all, 'status', id] as const,
  allStatus: (lineCode?: string) => [...equipmentKeys.all, 'all-status', lineCode] as const,
  oee: (params?: any) => [...equipmentKeys.all, 'oee', params] as const,
  oeeTrend: (code: string, days?: number) => [...equipmentKeys.all, 'oee-trend', code, days] as const,
  downtime: (params?: any) => [...equipmentKeys.all, 'downtime', params] as const,
  maintenance: (params?: any) => [...equipmentKeys.all, 'maintenance', params] as const,
};

// Equipment List
export const useEquipmentList = (params?: {
  line_code?: string;
  equipment_type?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: equipmentKeys.list(params),
    queryFn: () => getEquipmentList(params),
  });
};

// Equipment Detail
export const useEquipment = (equipmentId: string) => {
  return useQuery({
    queryKey: equipmentKeys.detail(equipmentId),
    queryFn: () => getEquipment(equipmentId),
    enabled: !!equipmentId,
  });
};

// Equipment Status
export const useEquipmentStatus = (equipmentId: string) => {
  return useQuery({
    queryKey: equipmentKeys.status(equipmentId),
    queryFn: () => getEquipmentStatus(equipmentId),
    enabled: !!equipmentId,
    refetchInterval: 5000,
  });
};

export const useUpdateEquipmentStatus = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ equipmentId, data }: { equipmentId: string; data: any }) =>
      updateEquipmentStatus(equipmentId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.all });
    },
  });
};

// All Equipment Status
export const useAllEquipmentStatus = (lineCode?: string, options?: { refetchInterval?: number }) => {
  return useQuery({
    queryKey: equipmentKeys.allStatus(lineCode),
    queryFn: () => getAllEquipmentStatus({ line_code: lineCode }),
    refetchInterval: options?.refetchInterval ?? 5000,
  });
};

// OEE
export const useOEEData = (params?: {
  line_code?: string;
  equipment_code?: string;
  start_date?: string;
  end_date?: string;
}) => {
  return useQuery({
    queryKey: equipmentKeys.oee(params),
    queryFn: () => getOEEData(params),
  });
};

export const useOEETrend = (equipmentCode: string, days?: number) => {
  return useQuery({
    queryKey: equipmentKeys.oeeTrend(equipmentCode, days),
    queryFn: () => getOEETrend(equipmentCode, days),
    enabled: !!equipmentCode,
  });
};

// Downtime
export const useDowntimeEvents = (params?: {
  page?: number;
  page_size?: number;
  equipment_code?: string;
  line_code?: string;
  status?: string;
}) => {
  return useQuery({
    queryKey: equipmentKeys.downtime(params),
    queryFn: () => getDowntimeEvents(params),
  });
};

export const useCreateDowntimeEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDowntimeEvent,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.downtime() });
    },
  });
};

export const useUpdateDowntimeEvent = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: ({ eventId, data }: { eventId: string; data: any }) =>
      updateDowntimeEvent(eventId, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: equipmentKeys.downtime() });
    },
  });
};

// Maintenance
export const useMaintenanceHistory = (params?: {
  equipment_code?: string;
  page?: number;
  page_size?: number;
}) => {
  return useQuery({
    queryKey: equipmentKeys.maintenance(params),
    queryFn: () => getMaintenanceHistory(params),
  });
};
