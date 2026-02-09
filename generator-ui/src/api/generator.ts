import apiClient from './client';
import type {
  Scenario,
  GeneratorConfig,
  GeneratorJob,
  GeneratorSummary,
  ApiResponse
} from '../types/generator';

const BASE_URL = '/generator';

/**
 * Generator API endpoints
 */
export const generatorApi = {
  // 시나리오 목록 조회
  getScenarios: async (): Promise<Scenario[]> => {
    const response = await apiClient.get<ApiResponse<Scenario[]>>(`${BASE_URL}/scenarios`);
    return response.data.data || [];
  },

  // 시나리오 활성화/비활성화
  toggleScenario: async (scenarioId: string, enabled: boolean): Promise<void> => {
    await apiClient.patch(`${BASE_URL}/scenarios/${scenarioId}`, { enabled });
  },

  // 생성 작업 시작
  startGeneration: async (config: GeneratorConfig): Promise<GeneratorJob> => {
    const response = await apiClient.post<ApiResponse<GeneratorJob>>(`${BASE_URL}/jobs`, config);
    return response.data.data!;
  },

  // 작업 상태 조회
  getJob: async (jobId: string): Promise<GeneratorJob> => {
    const response = await apiClient.get<ApiResponse<GeneratorJob>>(`${BASE_URL}/jobs/${jobId}`);
    return response.data.data!;
  },

  // 작업 목록 조회
  getJobs: async (): Promise<GeneratorJob[]> => {
    const response = await apiClient.get<ApiResponse<GeneratorJob[]>>(`${BASE_URL}/jobs`);
    return response.data.data || [];
  },

  // 작업 취소
  cancelJob: async (jobId: string): Promise<void> => {
    await apiClient.post(`${BASE_URL}/jobs/${jobId}/cancel`);
  },

  // 생성 요약 조회
  getSummary: async (jobId: string): Promise<GeneratorSummary> => {
    const response = await apiClient.get<ApiResponse<GeneratorSummary>>(`${BASE_URL}/jobs/${jobId}/summary`);
    return response.data.data!;
  },

  // JSON 내보내기
  exportJson: async (jobId: string): Promise<Blob> => {
    const response = await apiClient.get(`${BASE_URL}/jobs/${jobId}/export`, {
      responseType: 'blob'
    });
    return response.data;
  },

  // 설정 조회
  getConfig: async (): Promise<GeneratorConfig> => {
    const response = await apiClient.get<ApiResponse<GeneratorConfig>>(`${BASE_URL}/config`);
    return response.data.data!;
  },

  // 설정 저장
  saveConfig: async (config: Partial<GeneratorConfig>): Promise<void> => {
    await apiClient.put(`${BASE_URL}/config`, config);
  },
};

export default generatorApi;
