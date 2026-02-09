# ERP/MES 시뮬레이터 시나리오 명세서

## 개요

이 문서는 AI 플랫폼 테스트를 위한 ERP/MES 시뮬레이터의 모든 시나리오를 정의합니다.

### 목적
1. **AI 플랫폼 테스트**: Judgment Engine, Workflow, BI Service 검증용 데이터
2. **데모/영업용**: 고객 시연을 위한 현실적인 시나리오
3. **통합 테스트**: End-to-End 시스템 검증 환경

### AI 사용 케이스 (V7 Intent System)
| Intent | 설명 | 예시 |
|--------|------|------|
| CHECK | 현황 확인 | "오늘 생산 실적은?" |
| TREND | 추세 분석 | "불량률 추이가 어때?" |
| COMPARE | 비교 분석 | "라인별 OEE 비교" |
| RANK | 순위 분석 | "불량 TOP 5는?" |
| FIND_CAUSE | 원인 분석 | "불량 원인이 뭐야?" |
| DETECT_ANOMALY | 이상 감지 | "이상 패턴 있어?" |
| PREDICT | 예측 | "내일 생산량 예측" |
| WHAT_IF | 시뮬레이션 | "라인 증설하면?" |
| REPORT | 보고서 생성 | "월간 보고서 만들어줘" |
| NOTIFY | 알림/경고 | "재고 부족 알림" |

### 전역 설정
```yaml
default_enabled: true
random_seed: 42
base_defect_rate: 0.015  # 1.5%
base_oee: 0.85
```

---

## MES 모듈 시나리오

### MES-1. 생산관리 시나리오 (Production Management)

#### 1.1 생산 목표 미달 (production_target_miss)
| 항목 | 내용 |
|------|------|
| **설명** | 일일 생산 목표 대비 실적이 부족한 상황 |
| **AI 사용케이스** | CHECK, FIND_CAUSE, COMPARE |
| **트리거** | scheduled: 2024-08-01 ~ 5일간 |
| **대상 라인** | SMT-L01, SMT-L02 |

**파라미터**:
- 목표 달성율: 75%
- 주요 원인:
  - equipment_downtime (40%)
  - material_shortage (35%)
  - quality_issue (25%)

**기대 AI 응답**:
```yaml
judgment: "UNDERPERFORMING"
severity: "warning"
root_causes: ["equipment_downtime", "material_shortage"]
```

---

#### 1.2 생산성 급증 (productivity_spike)
| 항목 | 내용 |
|------|------|
| **설명** | 예상보다 높은 생산성을 보이는 상황 (긍정적) |
| **AI 사용케이스** | DETECT_ANOMALY, FIND_CAUSE, TREND |
| **트리거** | scheduled: 2024-09-15 ~ 7일간 |
| **대상 라인** | SMT-L03 |

**파라미터**:
- 생산성 배수: 1.25배
- 원인: 신규 작업자 교육 완료, 공정 최적화

**기대 AI 응답**:
```yaml
anomaly_type: "positive"
recommendation: "document_best_practices"
```

---

#### 1.3 사이클 타임 증가 (cycle_time_increase)
| 항목 | 내용 |
|------|------|
| **설명** | 표준 사이클 타임보다 실제 사이클 타임이 증가 |
| **AI 사용케이스** | TREND, FIND_CAUSE, PREDICT |
| **트리거** | condition: cycle_time > standard * 1.15 |
| **대상 설비** | SMT-L01-MOUNTER-01 |

**파라미터**:
- 사이클 타임 증가율: 18%
- 저하 패턴: gradual (점진적)
- 원인: 설비 노후화

**기대 AI 응답**:
```yaml
trend: "increasing"
recommendation: "equipment_tuning"
```

---

#### 1.4 작업지시 지연 누적 (work_order_delay)
| 항목 | 내용 |
|------|------|
| **설명** | 작업지시 완료 지연이 누적되는 상황 |
| **AI 사용케이스** | TREND, PREDICT, NOTIFY |
| **트리거** | scheduled: 2024-10-10 ~ 10일간 |

**파라미터**:
- 지연 누적율: 일 10%
- 영향 주문 비율: 30%

**기대 AI 응답**:
```yaml
prediction: "delivery_delay_risk"
notification: "schedule_adjustment_needed"
```

---

#### 1.5 야간 생산 효율 저하 (night_shift_efficiency_drop)
| 항목 | 내용 |
|------|------|
| **설명** | 야간 시프트의 생산 효율이 주간 대비 현저히 낮음 |
| **AI 사용케이스** | COMPARE, FIND_CAUSE, WHAT_IF |
| **트리거** | always (상시) |

**파라미터**:
- 야간/주간 효율비: 72%
- 원인: 감독 부재, 피로, 기술 격차

**기대 AI 응답**:
```yaml
comparison_result: "significant_gap"
recommendation: "night_shift_improvement_plan"
```

---

### MES-2. 설비관리 시나리오 (Equipment Management)

#### 2.1 예지보전 필요 (predictive_maintenance_needed)
| 항목 | 내용 |
|------|------|
| **설명** | 센서 데이터 기반 고장 예측 가능한 상황 |
| **AI 사용케이스** | PREDICT, DETECT_ANOMALY, CHECK |
| **트리거** | condition: run_hours / mtbf > 0.85 |
| **대상 설비** | SMT-L01-MOUNTER-01, SMT-L02-REFLOW-01 |

**센서 패턴**:
| 센서 | 패턴 | 일일 증가량 | 임계값 |
|------|------|------------|--------|
| 온도 | increasing | 2.0°C | 280°C |
| 진동 | increasing | 0.15 mm/s | 2.0 mm/s |
| 전류 | fluctuating | 분산 1.5배 증가 | - |

**기대 AI 응답**:
```yaml
prediction: "failure_within_48h"
confidence: 0.85
recommendation: "immediate_maintenance"
```

---

#### 2.2 돌발 고장 (sudden_breakdown)
| 항목 | 내용 |
|------|------|
| **설명** | 예기치 않은 설비 고장 발생 |
| **AI 사용케이스** | DETECT_ANOMALY, FIND_CAUSE, NOTIFY |
| **트리거** | random: 2% 확률 |
| **대상 설비 유형** | MOUNTER, REFLOW |

**고장 코드 분포**:
| 코드 | 확률 |
|------|------|
| MOTOR_FAULT | 30% |
| SENSOR_ERROR | 25% |
| BOARD_FAULT | 20% |
| PNEUMATIC_FAIL | 15% |
| POWER_ISSUE | 10% |

**다운타임**: 60~240분

**기대 AI 응답**:
```yaml
alert_type: "equipment_down"
notification: "immediate"
```

---

#### 2.3 OEE 저하 (oee_degradation)
| 항목 | 내용 |
|------|------|
| **설명** | 특정 라인의 OEE 점진적 저하 |
| **AI 사용케이스** | TREND, CHECK, COMPARE |
| **트리거** | scheduled: 2024-10-01 ~ 7일간 |
| **대상 라인** | SMT-L02 |

**파라미터**:
- 가동률 저하: 10%
- 성능 저하: 8%
- 품질은 안정적

**주요 다운타임 원인**:
| 원인 | 증가 계수 |
|------|----------|
| changeover | 2.0배 |
| material_wait | 1.5배 |

**기대 AI 응답**:
```yaml
trend: "decreasing"
primary_cause: "changeover_time"
```

---

#### 2.4 설비 가동률 편차 (equipment_utilization_variance)
| 항목 | 내용 |
|------|------|
| **설명** | 동일 유형 설비간 가동률 차이 발생 |
| **AI 사용케이스** | COMPARE, RANK, FIND_CAUSE |
| **트리거** | always (상시) |
| **대상 설비 유형** | MOUNTER |

**가동률 편차**:
| 설비 ID | 가동률 |
|---------|--------|
| SMT-L01-MOUNTER-01 | 92% |
| SMT-L01-MOUNTER-02 | 88% |
| SMT-L02-MOUNTER-01 | 75% |
| SMT-L02-MOUNTER-02 | 82% |

**기대 AI 응답**:
```yaml
lowest_performer: "SMT-L02-MOUNTER-01"
recommendation: "investigate_root_cause"
```

---

#### 2.5 보전 주기 초과 (maintenance_overdue)
| 항목 | 내용 |
|------|------|
| **설명** | 예방보전 주기를 초과한 설비 존재 |
| **AI 사용케이스** | CHECK, PREDICT, NOTIFY |
| **트리거** | condition: days_since_maintenance > interval * 1.2 |
| **대상 설비** | SMT-L01-PRINTER-01, SMT-L02-AOI-01 |

**파라미터**:
- 초과 일수: 15일
- 일일 위험 증가율: 2%

**기대 AI 응답**:
```yaml
alert: "maintenance_overdue"
risk_level: "high"
recommendation: "schedule_immediate_pm"
```

---

### MES-3. 품질관리 시나리오 (Quality Management)

#### 3.1 불량률 급증 (defect_rate_spike)
| 항목 | 내용 |
|------|------|
| **설명** | 특정 라인에서 불량률이 급격히 증가하는 상황 |
| **AI 사용케이스** | DETECT_ANOMALY, FIND_CAUSE, CHECK |
| **트리거** | scheduled: 2024-08-15 ~ 3일간 |
| **대상 라인** | SMT-L01 |

**파라미터**:
- 불량률: 6% (기준 1.5% 대비 4배)
- 주요 불량: BRIDGE (솔더 브릿지)
- 부차 불량: INSUFFICIENT (솔더 부족)

**상관관계**:
- 원인 유형: material_lot
- 원인 LOT: LOT-2024-0815
- 문제 공급업체: VENDOR-003

**기대 AI 응답**:
```yaml
judgment: "HIGH_DEFECT"
severity: "critical"
root_cause: "material_lot_quality"
```

---

#### 3.2 점진적 품질 저하 (gradual_quality_degradation)
| 항목 | 내용 |
|------|------|
| **설명** | 설비 마모로 인한 품질 점진적 저하 |
| **AI 사용케이스** | TREND, PREDICT, FIND_CAUSE |
| **트리거** | scheduled: 2024-09-01 ~ 14일간 |
| **대상 설비** | SMT-L01-PRINTER-01 |

**파라미터**:
- 초기 불량률: 1.5%
- 최종 불량률: 3.5%
- 저하 패턴: linear (선형)
- 관련 불량: INSUFFICIENT
- 지표: 스텐실 인쇄 횟수

**기대 AI 응답**:
```yaml
judgment: "DEGRADING"
recommendation: "schedule_maintenance"
```

---

#### 3.3 SPC 이탈 (spc_out_of_control)
| 항목 | 내용 |
|------|------|
| **설명** | 통계적 공정 관리 한계 이탈 |
| **AI 사용케이스** | DETECT_ANOMALY, NOTIFY, FIND_CAUSE |
| **트리거** | condition: spc_value > ucl OR spc_value < lcl |
| **대상 파라미터** | solder_volume, solder_height, component_offset |

**파라미터**:
- 위반 유형: consecutive (연속)
- 연속 위반 횟수: 7회
- UCL 위반: 3회

**기대 AI 응답**:
```yaml
alert: "spc_violation"
rule_violated: "7_consecutive_above_mean"
recommendation: "process_investigation"
```

---

#### 3.4 제품별 품질 편차 (product_quality_variance)
| 항목 | 내용 |
|------|------|
| **설명** | 특정 제품의 불량률이 다른 제품보다 높음 |
| **AI 사용케이스** | COMPARE, RANK, FIND_CAUSE |
| **트리거** | always (상시) |

**제품별 불량률**:
| 제품 | 불량률 |
|------|--------|
| SMARTPHONE-MB | 1.2% |
| POWER-BOARD | 1.5% |
| LED-DRIVER | 1.8% |
| IOT-MODULE | 2.8% |
| AUTOMOTIVE-ECU | 0.8% |

**기대 AI 응답**:
```yaml
highest_defect: "IOT-MODULE"
recommendation: "process_review"
```

---

#### 3.5 검사 오류 (inspection_error)
| 항목 | 내용 |
|------|------|
| **설명** | AOI 검사 오탐지(False Positive/Negative) 증가 |
| **AI 사용케이스** | DETECT_ANOMALY, FIND_CAUSE, CHECK |
| **트리거** | scheduled: 2024-11-01 ~ 5일간 |
| **대상 설비** | SMT-L01-AOI-01 |

**파라미터**:
- 오탐지율(FP): 8%
- 누락율(FN): 2%
- 원인: 조명 열화, 알고리즘 드리프트

**기대 AI 응답**:
```yaml
issue: "inspection_accuracy_degraded"
recommendation: "aoi_recalibration"
```

---

### MES-4. 자재관리 시나리오 (Material Management)

#### 4.1 공급업체 품질 문제 (vendor_quality_issue)
| 항목 | 내용 |
|------|------|
| **설명** | 특정 공급업체 자재의 품질 문제 |
| **AI 사용케이스** | FIND_CAUSE, DETECT_ANOMALY, COMPARE |
| **트리거** | scheduled: 2024-08-20 ~ 5일간 |
| **대상 공급업체** | VENDOR-003 |

**파라미터**:
- 대상 자재: IC-ARM-CORTEX-M4, CAPACITOR-0402-100NF
- LOT 접두사: LOT-V003-0820
- 불량률 배수: 3.0배
- 영향 제품: SMARTPHONE-MB, IOT-MODULE

**기대 AI 응답**:
```yaml
root_cause: "vendor_material_quality"
recommendation: "vendor_audit"
```

---

#### 4.2 피더 에러 증가 (feeder_error_increase)
| 항목 | 내용 |
|------|------|
| **설명** | SMT 피더 에러로 인한 부품 누락 증가 |
| **AI 사용케이스** | DETECT_ANOMALY, FIND_CAUSE, TREND |
| **트리거** | condition: feeder_error_count > daily_average * 2 |
| **대상 설비/피더** | SMT-L01-MOUNTER-01 / FEEDER-001, 015, 023 |

**에러 유형별 증가율**:
| 에러 유형 | 증가 배수 |
|----------|----------|
| PICKUP_FAIL | 2.5배 |
| RECOGNITION_FAIL | 1.8배 |
| PLACEMENT_ERROR | 1.5배 |

**상관관계**: 피더 마모 → MISSING 불량

**기대 AI 응답**:
```yaml
alert: "feeder_performance_degraded"
recommendation: "feeder_maintenance"
```

---

#### 4.3 자재 LOT 추적성 이슈 (material_traceability_issue)
| 항목 | 내용 |
|------|------|
| **설명** | 불량 발생 시 LOT 추적이 필요한 상황 |
| **AI 사용케이스** | FIND_CAUSE, CHECK, REPORT |
| **트리거** | scheduled: 2024-09-05 ~ 3일간 |
| **대상 LOT** | LOT-2024-0905-A |

**파라미터**:
- 영향 생산량: 5,000개
- 불량률: 4.5%
- 근본 원인 부품: IC-POWER-MGMT

**기대 AI 응답**:
```yaml
traceability_report: true
affected_range: "2024-09-05 ~ 2024-09-07"
recommendation: "recall_assessment"
```

---

#### 4.4 자재 투입 오류 (material_input_error)
| 항목 | 내용 |
|------|------|
| **설명** | 잘못된 자재가 투입된 상황 |
| **AI 사용케이스** | DETECT_ANOMALY, NOTIFY, FIND_CAUSE |
| **트리거** | random: 0.5% 확률 |

**오류 유형**:
| 유형 | 확률 |
|------|------|
| WRONG_COMPONENT | 40% |
| WRONG_ORIENTATION | 30% |
| MIXED_LOT | 30% |

**기대 AI 응답**:
```yaml
alert: "material_mismatch"
severity: "critical"
action: "stop_production"
```

---

#### 4.5 재고 부족 예측 (inventory_shortage_prediction)
| 항목 | 내용 |
|------|------|
| **설명** | 특정 자재의 재고 부족 예측 |
| **AI 사용케이스** | PREDICT, NOTIFY, CHECK |
| **트리거** | condition: inventory_level < safety_stock * 1.2 |
| **대상 자재** | CAPACITOR-0402-100NF, RESISTOR-0603-10K, IC-ARM-CORTEX-M4 |

**파라미터**:
- 소비 추세: 증가
- 재고 소진 예상일: 5일
- 리드타임: 7일

**기대 AI 응답**:
```yaml
prediction: "stockout_within_5_days"
recommendation: "emergency_order"
```

---

### MES-5. 시스템/환경 시나리오 (System/Environment)

#### 5.1 계절적 영향 (seasonal_effect)
| 항목 | 내용 |
|------|------|
| **설명** | 계절에 따른 환경 변화가 품질에 미치는 영향 |
| **AI 사용케이스** | FIND_CAUSE, TREND, PREDICT |
| **트리거** | always (상시) |

**계절별 영향**:

| 계절 | 온도 범위 | 습도 범위 | 영향 불량 |
|------|----------|----------|----------|
| 여름 | 28~35°C | 60~80% | TOMBSTONE 1.5배, SOLDER_BALL 1.3배 |
| 겨울 | 15~22°C | 30~50% | COLD_SOLDER 1.4배, CRACK 1.2배 |

**기대 AI 응답**:
```yaml
correlation_detected: true
recommendation: "environment_control"
```

---

#### 5.2 온도 급변 (temperature_fluctuation)
| 항목 | 내용 |
|------|------|
| **설명** | 공장 내 온도 급격한 변화 |
| **AI 사용케이스** | DETECT_ANOMALY, FIND_CAUSE |
| **트리거** | random: 5% 확률 |

**파라미터**:
- 온도 변화량: 5°C
- 지속 시간: 2시간
- 영향 설비: REFLOW
- 프로파일 편차: 10%

**기대 AI 응답**:
```yaml
anomaly_type: "temperature_fluctuation"
impact: "reflow_profile_deviation"
```

---

#### 5.3 시스템 지연/장애 (system_latency)
| 항목 | 내용 |
|------|------|
| **설명** | MES 시스템 응답 지연 또는 장애 |
| **AI 사용케이스** | DETECT_ANOMALY, NOTIFY, CHECK |
| **트리거** | random: 1% 확률 |

**파라미터**:
- 지연 증가: 5,000ms
- 데이터 손실 확률: 2%
- 영향 기능: production_report, quality_check

**기대 AI 응답**:
```yaml
alert: "system_performance_degraded"
recommendation: "check_infrastructure"
```

---

#### 5.4 교대 인수인계 이슈 (shift_handover_issue)
| 항목 | 내용 |
|------|------|
| **설명** | 교대 시점에 정보 전달 누락으로 인한 문제 |
| **AI 사용케이스** | DETECT_ANOMALY, FIND_CAUSE, COMPARE |
| **트리거** | always (상시) |

**파라미터**:
- 교대 시간: 08:00, 16:00, 00:00
- 이슈 발생 구간: ±30분
- 생산성 저하: 15%
- 오류 증가: 1.3배

**기대 AI 응답**:
```yaml
pattern: "shift_transition_issues"
recommendation: "improve_handover_process"
```

---

#### 5.5 작업자 숙련도 영향 (worker_skill_impact)
| 항목 | 내용 |
|------|------|
| **설명** | 작업자 숙련도에 따른 품질/생산성 차이 |
| **AI 사용케이스** | COMPARE, FIND_CAUSE, WHAT_IF |
| **트리거** | always (상시) |

**숙련도별 영향**:
| 숙련도 | 불량 계수 | 생산성 계수 |
|--------|----------|------------|
| 숙련자 (expert) | 0.8배 | 1.1배 |
| 중급자 (intermediate) | 1.0배 | 1.0배 |
| 초급자 (beginner) | 1.4배 | 0.85배 |

**기대 AI 응답**:
```yaml
correlation: "skill_to_quality"
recommendation: "training_program"
```

---

## ERP 모듈 시나리오

### ERP-1. 영업관리 시나리오 (Sales Management)

#### 1.1 긴급 대량 수주 (urgent_large_order)
| 항목 | 내용 |
|------|------|
| **설명** | 예상치 못한 대량 주문이 들어온 상황 |
| **AI 사용케이스** | WHAT_IF, PREDICT, NOTIFY |
| **트리거** | scheduled: 2024-09-10 ~ 3일간 |

**파라미터**:
- 주문량 배수: 3.0배
- 납기: 10일
- 고객: CUSTOMER-VIP-001
- 제품: SMARTPHONE-MB, IOT-MODULE

**기대 AI 응답**:
```yaml
capacity_assessment: "insufficient"
recommendation: "overtime_or_outsource"
delivery_risk: "high"
```

---

#### 1.2 주문 취소 급증 (order_cancellation_spike)
| 항목 | 내용 |
|------|------|
| **설명** | 주문 취소가 급격히 증가하는 상황 |
| **AI 사용케이스** | DETECT_ANOMALY, TREND, FIND_CAUSE |
| **트리거** | scheduled: 2024-11-15 ~ 7일간 |

**파라미터**:
- 취소율: 15% (정상 3%)
- 영향 고객: CUSTOMER-003, CUSTOMER-007
- 외부 요인: 경기 침체, 경쟁사 프로모션

**기대 AI 응답**:
```yaml
trend: "cancellation_increasing"
root_cause: "external_market"
recommendation: "customer_retention"
```

---

#### 1.3 납기 지연 위험 (delivery_delay_risk)
| 항목 | 내용 |
|------|------|
| **설명** | 여러 주문의 납기일 준수가 어려운 상황 |
| **AI 사용케이스** | PREDICT, CHECK, NOTIFY |
| **트리거** | condition: pending_orders > production_capacity * 1.3 |

**파라미터**:
- 위험 주문 비율: 25%
- 평균 지연일: 5일
- 패널티 위험: 있음

**기대 AI 응답**:
```yaml
risk_level: "high"
affected_orders: 12
recommendation: "prioritize_and_communicate"
```

---

#### 1.4 계절성 수요 변동 (seasonal_demand_variation)
| 항목 | 내용 |
|------|------|
| **설명** | 계절에 따른 수요 패턴 변화 |
| **AI 사용케이스** | TREND, PREDICT, REPORT |
| **트리거** | always (상시) |

**분기별 수요 계수**:
| 분기 | 계수 | 비고 |
|------|------|------|
| Q1 | 0.85 | 설 연휴 |
| Q2 | 1.00 | 정상 |
| Q3 | 1.15 | 성수기 |
| Q4 | 1.25 | 연말 특수 |

**기대 AI 응답**:
```yaml
pattern: "seasonal"
forecast_accuracy: 0.85
```

---

#### 1.5 고객 신용 위험 (customer_credit_risk)
| 항목 | 내용 |
|------|------|
| **설명** | 특정 고객의 결제 지연이 증가 |
| **AI 사용케이스** | DETECT_ANOMALY, PREDICT, NOTIFY |
| **트리거** | condition: overdue_amount > credit_limit * 0.8 |
| **대상 고객** | CUSTOMER-005, CUSTOMER-012 |

**파라미터**:
- 평균 연체일: 45일
- 연체액 월간 증가율: 20%

**기대 AI 응답**:
```yaml
risk_level: "high"
recommendation: "credit_review"
```

---

### ERP-2. 구매관리 시나리오 (Purchase Management)

#### 2.1 공급업체 납기 지연 (supplier_delivery_delay)
| 항목 | 내용 |
|------|------|
| **설명** | 주요 공급업체의 납기 지연 발생 |
| **AI 사용케이스** | DETECT_ANOMALY, PREDICT, NOTIFY |
| **트리거** | scheduled: 2024-08-25 ~ 10일간 |
| **대상 공급업체** | VENDOR-002, VENDOR-004 |

**파라미터**:
- 지연 일수: 7일
- 영향 자재: PCB-MAIN-4L, IC-ARM-CORTEX-M4
- 생산 영향: 있음

**기대 AI 응답**:
```yaml
alert: "supply_chain_disruption"
affected_production: "SMARTPHONE-MB"
recommendation: "alternative_supplier"
```

---

#### 2.2 원자재 가격 급등 (material_price_surge)
| 항목 | 내용 |
|------|------|
| **설명** | 특정 원자재의 가격이 급등하는 상황 |
| **AI 사용케이스** | DETECT_ANOMALY, TREND, WHAT_IF |
| **트리거** | scheduled: 2024-10-01 ~ 30일간 |

**파라미터**:
- 가격 인상률: 25%
- 영향 자재: GOLD, COPPER, IC-MEMORY

**원가 영향**:
| 제품 | 원가 영향 |
|------|----------|
| SMARTPHONE-MB | +8% |
| AUTOMOTIVE-ECU | +12% |

**기대 AI 응답**:
```yaml
impact: "margin_reduction"
recommendation: "price_negotiation_or_redesign"
```

---

#### 2.3 발주 최적화 필요 (purchase_optimization_needed)
| 항목 | 내용 |
|------|------|
| **설명** | 발주 패턴이 비효율적인 상황 |
| **AI 사용케이스** | FIND_CAUSE, WHAT_IF, REPORT |
| **트리거** | always (상시) |

**비효율 패턴**:
| 이슈 유형 | 현재 | 최적 |
|----------|------|------|
| 소량 빈번 발주 | 일별 | 주별 |
| 긴급 발주 비율 | 30% | 10% |

**기대 AI 응답**:
```yaml
inefficiency_detected: true
savings_potential: 0.15
recommendation: "consolidate_orders"
```

---

#### 2.4 공급업체 품질 등급 변동 (vendor_quality_grade_change)
| 항목 | 내용 |
|------|------|
| **설명** | 공급업체의 품질 등급이 변동되는 상황 |
| **AI 사용케이스** | TREND, COMPARE, NOTIFY |
| **트리거** | scheduled: 2024-09-01 ~ 60일간 |
| **대상 공급업체** | VENDOR-003 |

**파라미터**:
- 등급 변동: B → C
- 불합격률 증가: 5%p
- 품질 이슈: 치수 편차, 코팅 불량

**기대 AI 응답**:
```yaml
alert: "vendor_quality_downgrade"
recommendation: "vendor_development_or_replace"
```

---

#### 2.5 수입 통관 지연 (import_clearance_delay)
| 항목 | 내용 |
|------|------|
| **설명** | 수입 자재의 통관이 지연되는 상황 |
| **AI 사용케이스** | DETECT_ANOMALY, PREDICT, NOTIFY |
| **트리거** | random: 3% 확률 |
| **대상 공급업체** | VENDOR-004 (중국) |

**파라미터**:
- 지연 범위: 3~14일
- 원인: 세관 검사, 서류 문제, 휴일

**기대 AI 응답**:
```yaml
alert: "import_delay"
production_risk: true
recommendation: "safety_stock_review"
```

---

### ERP-3. 재고관리 시나리오 (Inventory Management)

#### 3.1 과잉 재고 발생 (excess_inventory)
| 항목 | 내용 |
|------|------|
| **설명** | 특정 자재/제품의 재고가 과다하게 쌓인 상황 |
| **AI 사용케이스** | DETECT_ANOMALY, FIND_CAUSE, REPORT |
| **트리거** | condition: inventory_level > max_stock * 1.5 |
| **대상 자재** | CAPACITOR-0805-10UF, LED-0603-WHITE |

**파라미터**:
- 초과율: 80%
- 보관 비용 영향: 월 2%
- 진부화 위험: 중간

**기대 AI 응답**:
```yaml
issue: "excess_inventory"
recommendation: "reduce_orders_or_promotion"
```

---

#### 3.2 재고 정확도 불일치 (inventory_accuracy_issue)
| 항목 | 내용 |
|------|------|
| **설명** | 시스템 재고와 실물 재고의 차이 발생 |
| **AI 사용케이스** | DETECT_ANOMALY, FIND_CAUSE, CHECK |
| **트리거** | scheduled: 2024-08-01 ~ 30일간 |

**파라미터**:
- 정확도: 92% (목표 99%)
- 불일치 위치: WH-01-A, WH-02-B
- 불일치 자재: RESISTOR-0603-10K, CAPACITOR-0402-100NF

**기대 AI 응답**:
```yaml
accuracy_gap: 0.07
root_causes: ["counting_error", "transaction_miss"]
recommendation: "cycle_count"
```

---

#### 3.3 재고 회전율 저하 (inventory_turnover_decline)
| 항목 | 내용 |
|------|------|
| **설명** | 재고 회전율이 목표 대비 낮아지는 상황 |
| **AI 사용케이스** | TREND, COMPARE, FIND_CAUSE |
| **트리거** | scheduled: 2024-10-01 ~ 90일간 |

**파라미터**:
- 현재 회전율: 8회/년
- 목표 회전율: 12회/년
- 장기 재고 증가: 15%

**기대 AI 응답**:
```yaml
trend: "turnover_declining"
recommendation: "inventory_reduction_program"
```

---

#### 3.4 안전재고 부족 (safety_stock_shortage)
| 항목 | 내용 |
|------|------|
| **설명** | 주요 자재의 안전재고 수준 미달 |
| **AI 사용케이스** | CHECK, PREDICT, NOTIFY |
| **트리거** | condition: inventory_level < safety_stock |
| **대상 자재** | IC-ARM-CORTEX-M4, CAPACITOR-0402-100NF |

**파라미터**:
- 재고 수준: 안전재고의 60%
- 품절 확률: 25%
- 리드타임: 7일

**기대 AI 응답**:
```yaml
alert: "safety_stock_breach"
stockout_risk: "high"
recommendation: "expedite_order"
```

---

#### 3.5 창고 공간 부족 (warehouse_space_shortage)
| 항목 | 내용 |
|------|------|
| **설명** | 창고 저장 공간이 부족해지는 상황 |
| **AI 사용케이스** | PREDICT, WHAT_IF, NOTIFY |
| **트리거** | condition: warehouse_utilization > 0.95 |
| **대상 창고** | WH-01, WH-02 |

**파라미터**:
- 현재 이용률: 97%
- 입고 예정: 500 파렛
- 포화 예상일: 3일

**기대 AI 응답**:
```yaml
alert: "space_critical"
recommendation: "expedite_shipment_or_external_storage"
```

---

### ERP-4. 회계관리 시나리오 (Accounting Management)

#### 4.1 원가 상승 추이 (cost_increase_trend)
| 항목 | 내용 |
|------|------|
| **설명** | 제품 원가가 지속적으로 상승하는 상황 |
| **AI 사용케이스** | TREND, FIND_CAUSE, PREDICT |
| **트리거** | scheduled: 2024-07-01 ~ 180일간 |

**파라미터**:
- 월간 증가율: 2%
- 원가 구성: 재료비 60%, 노무비 25%, 경비 15%
- 영향 제품: SMARTPHONE-MB, AUTOMOTIVE-ECU

**기대 AI 응답**:
```yaml
trend: "increasing"
primary_driver: "material_cost"
forecast_6m: 0.12  # 6개월 후 12% 증가
```

---

#### 4.2 원가 차이 분석 (cost_variance_analysis)
| 항목 | 내용 |
|------|------|
| **설명** | 표준원가와 실제원가의 차이가 큰 상황 |
| **AI 사용케이스** | COMPARE, FIND_CAUSE, REPORT |
| **트리거** | always (상시) |

**원가 차이 (임계값 5% 초과)**:
| 차이 항목 | 차이율 |
|----------|--------|
| 재료 가격 차이 | 8% |
| 재료 수량 차이 | 3% |
| 노무 임률 차이 | 2% |
| 노무 능률 차이 | 6% |
| 제조경비 차이 | 4% |

**기대 AI 응답**:
```yaml
significant_variances: ["material_price", "labor_efficiency"]
recommendation: "investigate_causes"
```

---

#### 4.3 수익성 악화 (profitability_decline)
| 항목 | 내용 |
|------|------|
| **설명** | 특정 제품/고객의 수익성이 악화되는 상황 |
| **AI 사용케이스** | TREND, COMPARE, FIND_CAUSE |
| **트리거** | scheduled: 2024-09-01 ~ 90일간 |

**마진 감소**:
| 제품 | 마진 변화 |
|------|----------|
| IOT-MODULE | -5%p |
| LED-DRIVER | -3%p |

- 적자 고객: CUSTOMER-008

**기대 AI 응답**:
```yaml
alert: "margin_erosion"
recommendation: "pricing_review"
```

---

#### 4.4 매출채권 연체 증가 (ar_aging_increase)
| 항목 | 내용 |
|------|------|
| **설명** | 매출채권 연체가 증가하는 상황 |
| **AI 사용케이스** | TREND, PREDICT, NOTIFY |
| **트리거** | scheduled: 2024-10-01 ~ 60일간 |

**채권 연령 분포**:
| 구간 | 비율 |
|------|------|
| 당월 | 60% |
| 30일 | 20% |
| 60일 | 12% |
| 90일 | 5% |
| 90일 초과 | 3% |

- 대손 위험: 2%

**기대 AI 응답**:
```yaml
trend: "aging_increasing"
cash_flow_impact: "negative"
recommendation: "collection_focus"
```

---

#### 4.5 예산 초과 경고 (budget_overrun)
| 항목 | 내용 |
|------|------|
| **설명** | 특정 비용 항목이 예산을 초과하는 상황 |
| **AI 사용케이스** | CHECK, PREDICT, NOTIFY |
| **트리거** | condition: actual_expense > budget * 0.9 |

**초과 부서**: 생산부, 품질관리부

**초과 항목**:
| 항목 | 예산 | 실적 |
|------|------|------|
| 유지보수비 | 5,000만원 | 5,800만원 |
| 외주가공비 | 3,000만원 | 3,500만원 |

**기대 AI 응답**:
```yaml
alert: "budget_warning"
forecast_year_end: "exceed_by_15%"
recommendation: "cost_control"
```

---

### ERP-5. 인사급여관리 시나리오 (HR & Payroll Management)

#### 5.1 인력 부족 예측 (workforce_shortage_prediction)
| 항목 | 내용 |
|------|------|
| **설명** | 생산 증가 대비 인력이 부족해질 예측 |
| **AI 사용케이스** | PREDICT, WHAT_IF, NOTIFY |
| **트리거** | condition: planned_production > current_capacity * 1.2 |

**부족 인력**:
| 직책 | 부족 인원 |
|------|----------|
| SMT 오퍼레이터 | 5명 |
| 품질검사원 | 3명 |

- 채용 리드타임: 30일

**기대 AI 응답**:
```yaml
prediction: "workforce_shortage"
impact: "production_constraint"
recommendation: "start_recruitment"
```

---

#### 5.2 초과근무 급증 (overtime_surge)
| 항목 | 내용 |
|------|------|
| **설명** | 초과근무가 급격히 증가하는 상황 |
| **AI 사용케이스** | TREND, DETECT_ANOMALY, FIND_CAUSE |
| **트리거** | scheduled: 2024-09-15 ~ 14일간 |

**파라미터**:
- 초과근무 증가: 평소 대비 2.5배
- 영향 부서: 생산1팀, 생산2팀
- 원인: 긴급 주문, 설비 이슈

**기대 AI 응답**:
```yaml
trend: "overtime_increasing"
labor_cost_impact: 0.15
recommendation: "root_cause_resolution"
```

---

#### 5.3 이직률 상승 (turnover_rate_increase)
| 항목 | 내용 |
|------|------|
| **설명** | 특정 부서/직급의 이직률이 상승 |
| **AI 사용케이스** | TREND, FIND_CAUSE, PREDICT |
| **트리거** | scheduled: 2024-08-01 ~ 120일간 |

**파라미터**:
- 현재 이직률: 18%/년 (목표 10%)

**고이직 그룹**:
| 그룹 | 이직률 |
|------|--------|
| 신입사원 1년 미만 | 25% |
| 야간근무자 | 22% |

**기대 AI 응답**:
```yaml
trend: "turnover_increasing"
cost_impact: "training_and_recruitment"
recommendation: "retention_program"
```

---

#### 5.4 결근율 이상 (absenteeism_anomaly)
| 항목 | 내용 |
|------|------|
| **설명** | 결근율이 비정상적으로 높아지는 상황 |
| **AI 사용케이스** | DETECT_ANOMALY, FIND_CAUSE, COMPARE |
| **트리거** | condition: absence_rate > normal_rate * 1.5 |

**파라미터**:
- 현재 결근율: 8% (정상 4%)
- 피크 요일: 월요일, 금요일
- 영향 부서: 생산3팀

**기대 AI 응답**:
```yaml
anomaly: "high_absenteeism"
pattern: "weekend_adjacent"
recommendation: "investigate_causes"
```

---

#### 5.5 급여 계산 오류 (payroll_calculation_error)
| 항목 | 내용 |
|------|------|
| **설명** | 급여 계산에 오류가 발생하는 상황 |
| **AI 사용케이스** | DETECT_ANOMALY, CHECK, NOTIFY |
| **트리거** | random: 2% 확률 |

**오류 유형**:
| 유형 | 확률 |
|------|------|
| 초과근무 계산 오류 | 40% |
| 수당 누락 | 30% |
| 세금 공제 오류 | 20% |
| 상여금 계산 오류 | 10% |

- 영향 직원: 1~10명

**기대 AI 응답**:
```yaml
alert: "payroll_error"
severity: "high"
recommendation: "immediate_correction"
```

---

### ERP-6. 기준정보관리 시나리오 (Master Data Management)

#### 6.1 BOM 변경 영향 분석 (bom_change_impact)
| 항목 | 내용 |
|------|------|
| **설명** | BOM 변경이 원가/재고에 미치는 영향 분석 |
| **AI 사용케이스** | WHAT_IF, REPORT, PREDICT |
| **트리거** | scheduled: 2024-09-01 ~ 7일간 |

**BOM 변경 내용**:
- 제품: SMARTPHONE-MB
- 변경 유형: 부품 대체
- 기존 부품: CAPACITOR-0402-100NF
- 신규 부품: CAPACITOR-0402-100NF-V2
- 원가 영향: +2%

**기대 AI 응답**:
```yaml
impact_analysis:
  cost_change: 0.02
  inventory_obsolescence: 5000
recommendation: "phase_transition_plan"
```

---

#### 6.2 마스터 데이터 불일치 (master_data_inconsistency)
| 항목 | 내용 |
|------|------|
| **설명** | ERP-MES간 마스터 데이터 불일치 |
| **AI 사용케이스** | DETECT_ANOMALY, CHECK, NOTIFY |
| **트리거** | always (상시) |

**불일치 유형**:
| 유형 | 건수 |
|------|------|
| 품명 불일치 | 15건 |
| 단위 상이 | 8건 |
| 단가 불일치 | 23건 |

**기대 AI 응답**:
```yaml
data_quality_score: 0.85
critical_issues: 5
recommendation: "data_cleansing"
```

---

#### 6.3 신규 제품 도입 (new_product_introduction)
| 항목 | 내용 |
|------|------|
| **설명** | 신규 제품 도입 시 준비 상태 점검 |
| **AI 사용케이스** | CHECK, REPORT, NOTIFY |
| **트리거** | scheduled: 2024-10-15 ~ 30일간 |

**신규 제품**: SMARTPHONE-MB-V2

**체크리스트**:
| 항목 | 상태 |
|------|------|
| BOM 등록 | ✅ 완료 |
| 라우팅 설정 | ⏳ 대기 |
| 품질기준 수립 | ⏳ 대기 |
| 원가 산정 | ✅ 완료 |

**기대 AI 응답**:
```yaml
readiness_score: 0.65
blockers: ["routing", "quality_standard"]
recommendation: "complete_pending_items"
```

---

#### 6.4 공급업체 마스터 변경 (vendor_master_change)
| 항목 | 내용 |
|------|------|
| **설명** | 공급업체 정보 변경이 필요한 상황 |
| **AI 사용케이스** | CHECK, NOTIFY, REPORT |
| **트리거** | random: 5% 확률 |

**변경 유형**:
- 연락처 변경
- 결제조건 변경
- 인증 만료
- 가격 계약 갱신

**기대 AI 응답**:
```yaml
pending_updates: 12
urgent_items: 3
recommendation: "vendor_review_meeting"
```

---

#### 6.5 단가 갱신 필요 (price_update_required)
| 항목 | 내용 |
|------|------|
| **설명** | 자재/제품 단가 갱신이 필요한 상황 |
| **AI 사용케이스** | CHECK, COMPARE, NOTIFY |
| **트리거** | condition: days_since_price_update > 180 |

**파라미터**:
- 갱신 필요 품목: 150개
- 대상 카테고리: 원자재, 포장재, 외주가공
- 시장가 대비 차이: 8%

**기대 AI 응답**:
```yaml
alert: "price_review_needed"
cost_impact_risk: "underestimated_costs"
recommendation: "price_negotiation"
```

---

## 상관관계 규칙 (Correlation Rules)

### MES 상관관계

#### 자재/공급업체 → 품질
| Source | Target | 유형 | 파라미터 |
|--------|--------|------|----------|
| vendor_quality_grade | defect_rate | multiplicative | A=0.8, B=1.0, C=1.5 |

#### 설비 → 품질
| Source | Target | 유형 | 파라미터 |
|--------|--------|------|----------|
| equipment.temperature | defect_rate | threshold | threshold=270, below=1.0, above=1.5 |
| equipment.vibration | defect_rate | linear | coefficient=0.02, intercept=1.0 |
| equipment.run_hours_ratio | failure_probability | exponential | base=2.0, scale=0.01 |

#### 환경 → 품질
| Source | Target | 유형 | 파라미터 |
|--------|--------|------|----------|
| environment.humidity | defect.TOMBSTONE | exponential | base=1.02, reference=50 |
| environment.temperature_delta | defect.COLD_SOLDER | threshold | threshold=5, below=1.0, above=1.8 |

### ERP 상관관계

#### 영업 → 생산
| Source | Target | 유형 | 파라미터 |
|--------|--------|------|----------|
| sales.order_volume | production.planned_quantity | linear | coefficient=1.05, intercept=0 |

#### 구매 → 원가
| Source | Target | 유형 | 파라미터 |
|--------|--------|------|----------|
| purchase.material_price_index | accounting.product_cost | linear | coefficient=0.6, intercept=0 |

#### 재고 → 구매
| Source | Target | 유형 | 파라미터 |
|--------|--------|------|----------|
| inventory.stock_level | purchase.order_quantity | threshold | threshold=1.0, below=2.0, above=0.5 |

#### 인사 → 품질
| Source | Target | 유형 | 파라미터 |
|--------|--------|------|----------|
| hr.overtime_hours | quality.defect_rate | linear | coefficient=0.001, intercept=1.0 |

---

## 시나리오 요약

### MES 시나리오 (25개)
| 모듈 | 시나리오 수 |
|------|------------|
| 생산관리 | 5개 |
| 설비관리 | 5개 |
| 품질관리 | 5개 |
| 자재관리 | 5개 |
| 시스템/환경 | 5개 |

### ERP 시나리오 (30개)
| 모듈 | 시나리오 수 |
|------|------------|
| 영업관리 | 5개 |
| 구매관리 | 5개 |
| 재고관리 | 5개 |
| 회계관리 | 5개 |
| 인사급여관리 | 5개 |
| 기준정보관리 | 5개 |

### 총계: 55개 시나리오

---

## 버전 이력

| 버전 | 날짜 | 변경 내용 |
|------|------|----------|
| 1.0 | 2025-01-XX | 초기 버전 - 55개 시나리오 정의 |
