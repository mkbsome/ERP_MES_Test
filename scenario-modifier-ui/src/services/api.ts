import axios from 'axios';
import type {
  BaseDataSummary,
  BaseDataGenerateRequest,
  BaseDataStatus,
  ScenarioApplyRequest,
  ScenarioApplyResponse,
  ModificationHistory,
  AnomalyTypeInfo,
  RevertResponse,
} from '../types/api';

const API_BASE_URL = 'http://localhost:8000/api/v1/generator';

const api = axios.create({
  baseURL: API_BASE_URL,
  headers: {
    'Content-Type': 'application/json',
  },
});

// ============ Base Data API ============

export const baseDataApi = {
  getSummary: async (): Promise<BaseDataSummary> => {
    const response = await api.get<BaseDataSummary>('/base-data/summary');
    return response.data;
  },

  generate: async (request: BaseDataGenerateRequest): Promise<{ job_id: string }> => {
    const response = await api.post<{ job_id: string }>('/base-data/generate', request);
    return response.data;
  },

  getStatus: async (jobId: string): Promise<BaseDataStatus> => {
    const response = await api.get<BaseDataStatus>(`/base-data/status/${jobId}`);
    return response.data;
  },

  clearData: async (startDate?: string, endDate?: string): Promise<{ message: string }> => {
    const params = new URLSearchParams();
    if (startDate) params.append('start_date', startDate);
    if (endDate) params.append('end_date', endDate);
    const response = await api.delete<{ message: string }>(`/base-data/clear?${params}`);
    return response.data;
  },
};

// ============ Scenario Modifier API ============

export const scenarioModifierApi = {
  getAnomalyTypes: async (): Promise<AnomalyTypeInfo[]> => {
    const response = await api.get<AnomalyTypeInfo[]>('/scenario-modifier/anomaly-types');
    return response.data;
  },

  apply: async (request: ScenarioApplyRequest): Promise<ScenarioApplyResponse> => {
    const response = await api.post<ScenarioApplyResponse>('/scenario-modifier/apply', request);
    return response.data;
  },

  getHistory: async (limit: number = 50): Promise<ModificationHistory[]> => {
    const response = await api.get<ModificationHistory[]>(`/scenario-modifier/history?limit=${limit}`);
    return response.data;
  },

  revert: async (modificationId: string): Promise<RevertResponse> => {
    const response = await api.post<RevertResponse>(`/scenario-modifier/revert/${modificationId}`);
    return response.data;
  },
};

export default api;
