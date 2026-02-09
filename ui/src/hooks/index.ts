/**
 * Hooks Exports
 */

// Production hooks
export {
  productionKeys,
  useWorkOrders,
  useWorkOrder,
  useStartWorkOrder,
  useCompleteWorkOrder,
  useProductionResults,
  useCreateProductionResult,
  useRealtimeProduction,
  useDailyProductionAnalysis,
  useLineProductionStatus,
} from './useProduction';

// Equipment hooks
export {
  equipmentKeys,
  useEquipmentList,
  useEquipment,
  useEquipmentStatus,
  useUpdateEquipmentStatus,
  useAllEquipmentStatus,
  useOEEData,
  useOEETrend,
  useDowntimeEvents,
  useCreateDowntimeEvent,
  useUpdateDowntimeEvent,
  useMaintenanceHistory,
} from './useEquipment';

// Quality hooks
export {
  qualityKeys,
  useInspections,
  useInspection,
  useCreateInspection,
  useDefects,
  useCreateDefect,
  useDefectAnalysis,
  useDefectPareto,
  useSPCData,
  useSPCChartData,
  useTraceability,
} from './useQuality';

// Material hooks
export {
  materialKeys,
  useFeederSetups,
  useLineFeeders,
  useMaterialConsumption,
  useCreateMaterialConsumption,
  useMaterialRequests,
  useCreateMaterialRequest,
  useUpdateMaterialRequest,
  useMaterialInventory,
  useUpdateMaterialInventory,
  useLineMaterialSummary,
  useMaterialShortageAlerts,
} from './useMaterial';

// WebSocket hooks
export {
  useWebSocket,
  useProductionWebSocket,
  useEquipmentWebSocket,
  useAlertsWebSocket,
  useDashboardWebSocket,
} from './useWebSocket';
