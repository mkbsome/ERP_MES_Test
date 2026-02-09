/**
 * Quality React Query Hooks
 */
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import {
  getInspections,
  createInspection,
  getInspection,
  getDefects,
  createDefect,
  getDefectAnalysis,
  getDefectPareto,
  getSPCData,
  getSPCChartData,
  getTraceability,
} from '../api';

// Query Keys
export const qualityKeys = {
  all: ['quality'] as const,
  inspections: (params?: any) => [...qualityKeys.all, 'inspections', params] as const,
  inspection: (id: string) => [...qualityKeys.all, 'inspection', id] as const,
  defects: (params?: any) => [...qualityKeys.all, 'defects', params] as const,
  defectAnalysis: (params?: any) => [...qualityKeys.all, 'defect-analysis', params] as const,
  defectPareto: (params?: any) => [...qualityKeys.all, 'defect-pareto', params] as const,
  spcData: (params?: any) => [...qualityKeys.all, 'spc-data', params] as const,
  spcChart: (type: string, params?: any) => [...qualityKeys.all, 'spc-chart', type, params] as const,
  traceability: (lotNo: string) => [...qualityKeys.all, 'traceability', lotNo] as const,
};

// Inspections
export const useInspections = (params?: {
  page?: number;
  page_size?: number;
  inspection_type?: string;
  lot_no?: string;
  product_code?: string;
  result?: string;
}) => {
  return useQuery({
    queryKey: qualityKeys.inspections(params),
    queryFn: () => getInspections(params),
  });
};

export const useInspection = (inspectionId: string) => {
  return useQuery({
    queryKey: qualityKeys.inspection(inspectionId),
    queryFn: () => getInspection(inspectionId),
    enabled: !!inspectionId,
  });
};

export const useCreateInspection = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createInspection,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qualityKeys.inspections() });
    },
  });
};

// Defects
export const useDefects = (params?: {
  page?: number;
  page_size?: number;
  line_code?: string;
  product_code?: string;
  defect_category?: string;
  defect_code?: string;
}) => {
  return useQuery({
    queryKey: qualityKeys.defects(params),
    queryFn: () => getDefects(params),
  });
};

export const useCreateDefect = () => {
  const queryClient = useQueryClient();
  return useMutation({
    mutationFn: createDefect,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: qualityKeys.defects() });
      queryClient.invalidateQueries({ queryKey: qualityKeys.defectAnalysis() });
    },
  });
};

// Defect Analysis
export const useDefectAnalysis = (params?: {
  line_code?: string;
  product_code?: string;
  start_date?: string;
  end_date?: string;
  limit?: number;
}) => {
  return useQuery({
    queryKey: qualityKeys.defectAnalysis(params),
    queryFn: () => getDefectAnalysis(params),
  });
};

export const useDefectPareto = (params?: {
  line_code?: string;
  product_code?: string;
  start_date?: string;
  end_date?: string;
}) => {
  return useQuery({
    queryKey: qualityKeys.defectPareto(params),
    queryFn: () => getDefectPareto(params),
  });
};

// SPC
export const useSPCData = (params?: {
  line_code?: string;
  product_code?: string;
  measurement_type?: string;
  start_date?: string;
  end_date?: string;
}) => {
  return useQuery({
    queryKey: qualityKeys.spcData(params),
    queryFn: () => getSPCData(params),
  });
};

export const useSPCChartData = (
  measurementType: string,
  params?: {
    line_code?: string;
    product_code?: string;
    limit?: number;
  }
) => {
  return useQuery({
    queryKey: qualityKeys.spcChart(measurementType, params),
    queryFn: () => getSPCChartData(measurementType, params),
    enabled: !!measurementType,
  });
};

// Traceability
export const useTraceability = (lotNo: string) => {
  return useQuery({
    queryKey: qualityKeys.traceability(lotNo),
    queryFn: () => getTraceability(lotNo),
    enabled: !!lotNo,
  });
};
