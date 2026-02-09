import { create } from 'zustand';
import type {
  Scenario,
  GeneratorConfig,
  GeneratorJob,
  GeneratorProgress,
  ScenarioCategory
} from '../types/generator';

interface GeneratorState {
  // 시나리오
  scenarios: Scenario[];
  selectedScenarios: Set<string>;

  // 설정
  config: GeneratorConfig;

  // 현재 작업
  currentJob: GeneratorJob | null;
  progress: GeneratorProgress | null;

  // 작업 이력
  jobHistory: GeneratorJob[];

  // 로그
  logs: string[];

  // Actions
  setScenarios: (scenarios: Scenario[]) => void;
  toggleScenario: (scenarioId: string) => void;
  selectAllScenarios: (category?: ScenarioCategory) => void;
  deselectAllScenarios: (category?: ScenarioCategory) => void;

  setConfig: (config: Partial<GeneratorConfig>) => void;

  setCurrentJob: (job: GeneratorJob | null) => void;
  setProgress: (progress: GeneratorProgress | null) => void;

  addJobToHistory: (job: GeneratorJob) => void;
  setJobHistory: (jobs: GeneratorJob[]) => void;

  addLog: (message: string) => void;
  clearLogs: () => void;
}

const defaultConfig: GeneratorConfig = {
  start_date: '2024-07-01',
  end_date: '2024-12-31',
  tenant_id: 'T001',
  random_seed: 42,
  enabled_scenarios: [],
  output_format: 'json',
};

export const useGeneratorStore = create<GeneratorState>((set, get) => ({
  // Initial state
  scenarios: [],
  selectedScenarios: new Set(),
  config: defaultConfig,
  currentJob: null,
  progress: null,
  jobHistory: [],
  logs: [],

  // Scenario actions
  setScenarios: (scenarios) => {
    const enabled = scenarios.filter(s => s.enabled).map(s => s.id);
    set({
      scenarios,
      selectedScenarios: new Set(enabled),
      config: { ...get().config, enabled_scenarios: enabled }
    });
  },

  toggleScenario: (scenarioId) => {
    const { selectedScenarios, config } = get();
    const newSelected = new Set(selectedScenarios);

    if (newSelected.has(scenarioId)) {
      newSelected.delete(scenarioId);
    } else {
      newSelected.add(scenarioId);
    }

    set({
      selectedScenarios: newSelected,
      config: { ...config, enabled_scenarios: Array.from(newSelected) }
    });
  },

  selectAllScenarios: (category) => {
    const { scenarios, config } = get();
    const filtered = category
      ? scenarios.filter(s => s.category === category)
      : scenarios;
    const ids = filtered.map(s => s.id);
    const newSelected = new Set([...get().selectedScenarios, ...ids]);

    set({
      selectedScenarios: newSelected,
      config: { ...config, enabled_scenarios: Array.from(newSelected) }
    });
  },

  deselectAllScenarios: (category) => {
    const { scenarios, selectedScenarios, config } = get();
    const toRemove = category
      ? new Set(scenarios.filter(s => s.category === category).map(s => s.id))
      : new Set(scenarios.map(s => s.id));

    const newSelected = new Set(
      Array.from(selectedScenarios).filter(id => !toRemove.has(id))
    );

    set({
      selectedScenarios: newSelected,
      config: { ...config, enabled_scenarios: Array.from(newSelected) }
    });
  },

  // Config actions
  setConfig: (newConfig) => {
    set({ config: { ...get().config, ...newConfig } });
  },

  // Job actions
  setCurrentJob: (job) => set({ currentJob: job }),
  setProgress: (progress) => set({ progress }),

  addJobToHistory: (job) => {
    set({ jobHistory: [job, ...get().jobHistory].slice(0, 20) });
  },

  setJobHistory: (jobs) => set({ jobHistory: jobs }),

  // Log actions
  addLog: (message) => {
    const timestamp = new Date().toLocaleTimeString();
    set({ logs: [...get().logs, `[${timestamp}] ${message}`].slice(-100) });
  },

  clearLogs: () => set({ logs: [] }),
}));

export default useGeneratorStore;
