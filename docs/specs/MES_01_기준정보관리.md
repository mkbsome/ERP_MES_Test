# MES 기준정보관리 모듈 기능정의서

## 모듈 개요

| 항목 | 내용 |
|------|------|
| **모듈ID** | MES-BAS |
| **모듈명** | 기준정보관리 |
| **화면수** | 12개 |
| **목적** | MES 운영에 필요한 기초 마스터 데이터 관리 |

---

## 화면 목록

| No | 화면ID | 화면명 | 개발우선순위 |
|----|--------|--------|-------------|
| 1 | MES-BAS-001 | 코드그룹관리 | P1 |
| 2 | MES-BAS-002 | 공통코드관리 | P1 |
| 3 | MES-BAS-003 | 공장관리 | P1 |
| 4 | MES-BAS-004 | 라인관리 | P1 |
| 5 | MES-BAS-005 | 공정관리 | P1 |
| 6 | MES-BAS-006 | 품목관리 | P1 |
| 7 | MES-BAS-007 | 품목별공정관리 | P2 |
| 8 | MES-BAS-008 | 품목별불량유형 | P2 |
| 9 | MES-BAS-009 | 작업자관리 | P1 |
| 10 | MES-BAS-010 | 검사항목관리 | P2 |
| 11 | MES-BAS-011 | 불량유형관리 | P1 |
| 12 | MES-BAS-012 | 고객사관리 | P2 |

---

## 화면별 상세 기능정의

### MES-BAS-001 코드그룹관리

#### 기본정보
| 항목 | 내용 |
|------|------|
| **화면ID** | MES-BAS-001 |
| **화면명** | 코드그룹관리 |
| **화면유형** | CRUD (등록/조회/수정/삭제) |
| **접근권한** | 시스템관리자 |

#### 기능설명
시스템에서 사용하는 공통코드의 그룹(분류)을 관리한다.

#### 데이터 항목
| 필드명 | 필드ID | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| 코드그룹ID | code_group_id | VARCHAR(20) | Y | PK |
| 코드그룹명 | code_group_name | VARCHAR(100) | Y | |
| 설명 | description | VARCHAR(500) | N | |
| 사용여부 | is_active | BOOLEAN | Y | 기본값: true |
| 등록일시 | created_at | TIMESTAMP | Y | 자동 |
| 수정일시 | updated_at | TIMESTAMP | Y | 자동 |

#### 화면 레이아웃
```
┌─────────────────────────────────────────────────────────────┐
│ [검색조건]                                                   │
│ 코드그룹ID: [________] 코드그룹명: [________] [검색] [초기화] │
├─────────────────────────────────────────────────────────────┤
│ [그리드 - 코드그룹 목록]                                      │
│ ┌─────────────────────────────────────────────────────────┐ │
│ │ □ │ 코드그룹ID │ 코드그룹명 │ 설명 │ 사용여부 │ 등록일시 │ │
│ ├───┼────────────┼───────────┼──────┼─────────┼─────────┤ │
│ │   │            │           │      │         │         │ │
│ └─────────────────────────────────────────────────────────┘ │
│ [신규] [저장] [삭제]                                         │
└─────────────────────────────────────────────────────────────┘
```

#### 기능 버튼
| 버튼 | 기능 |
|------|------|
| 검색 | 조건에 맞는 코드그룹 조회 |
| 초기화 | 검색조건 초기화 |
| 신규 | 그리드에 빈 행 추가 |
| 저장 | 변경사항 일괄 저장 |
| 삭제 | 선택 행 삭제 (하위 코드 있으면 불가) |

#### 비즈니스 로직
1. 코드그룹ID는 영문 대문자 + 숫자만 허용
2. 삭제 시 하위 공통코드가 있으면 삭제 불가
3. 사용여부 'N' 변경 시 하위 코드도 일괄 비활성화 확인

---

### MES-BAS-002 공통코드관리

#### 기본정보
| 항목 | 내용 |
|------|------|
| **화면ID** | MES-BAS-002 |
| **화면명** | 공통코드관리 |
| **화면유형** | CRUD |
| **접근권한** | 시스템관리자 |

#### 기능설명
코드그룹에 속하는 상세 공통코드를 관리한다.

#### 데이터 항목
| 필드명 | 필드ID | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| 코드그룹ID | code_group_id | VARCHAR(20) | Y | FK |
| 코드 | code | VARCHAR(20) | Y | PK |
| 코드명 | code_name | VARCHAR(100) | Y | |
| 코드영문명 | code_name_en | VARCHAR(100) | N | |
| 정렬순서 | sort_order | INT | N | |
| 비고1 | attr1 | VARCHAR(100) | N | 추가속성 |
| 비고2 | attr2 | VARCHAR(100) | N | 추가속성 |
| 사용여부 | is_active | BOOLEAN | Y | |

#### 화면 레이아웃
```
┌─────────────────────────────────────────────────────────────┐
│ [검색조건]                                                   │
│ 코드그룹: [드롭다운____▼] 코드/코드명: [________] [검색]     │
├───────────────────────┬─────────────────────────────────────┤
│ [코드그룹 트리]        │ [상세코드 그리드]                    │
│ ├─ PLANT (공장)       │ 코드│코드명│영문명│순서│사용│비고   │
│ ├─ LINE (라인)        │ ───┼─────┼─────┼───┼───┼────      │
│ ├─ PROCESS (공정)     │    │     │     │   │   │          │
│ ├─ DEFECT (불량유형)  │                                     │
│ └─ ...                │ [신규] [저장] [삭제]                 │
└───────────────────────┴─────────────────────────────────────┘
```

#### 초기 데이터 (PCB/SMT 특화)
```
코드그룹: DEFECT_TYPE (불량유형)
├── DF01: 솔더브릿지 (Bridge)
├── DF02: 미납 (Open)
├── DF03: 직립 (Tombstone)
├── DF04: 부품누락 (Missing)
├── DF05: 위치이탈 (Shift)
├── DF06: 오삽 (Wrong Part)
├── DF07: 극성반대 (Polarity)
├── DF08: 냉납 (Cold Solder)
├── DF09: 크랙 (Crack)
├── DF10: 보이드 (Void)
├── DF11: 들뜸 (Lifted)
└── DF12: 이물 (Foreign Material)

코드그룹: EQUIPMENT_TYPE (설비유형)
├── LOADER: Loader
├── PRINTER: Screen Printer
├── SPI: SPI
├── CHIP_MOUNTER: Chip Mounter
├── MULTI_MOUNTER: Multi Mounter
├── REFLOW: Reflow Oven
├── AOI: AOI
└── UNLOADER: Unloader
```

---

### MES-BAS-003 공장관리

#### 기본정보
| 항목 | 내용 |
|------|------|
| **화면ID** | MES-BAS-003 |
| **화면명** | 공장관리 |
| **화면유형** | CRUD |
| **접근권한** | 시스템관리자, 생산관리자 |

#### 데이터 항목
| 필드명 | 필드ID | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| 공장코드 | plant_code | VARCHAR(10) | Y | PK |
| 공장명 | plant_name | VARCHAR(100) | Y | |
| 주소 | address | VARCHAR(500) | N | |
| 전화번호 | phone | VARCHAR(20) | N | |
| 공장장 | manager_name | VARCHAR(50) | N | |
| 사용여부 | is_active | BOOLEAN | Y | |

#### 초기 데이터
| 공장코드 | 공장명 | 비고 |
|----------|--------|------|
| PT | 평택공장 | 메인공장 |
| AS | 안성공장 | 제2공장 |

---

### MES-BAS-004 라인관리

#### 기본정보
| 항목 | 내용 |
|------|------|
| **화면ID** | MES-BAS-004 |
| **화면명** | 라인관리 |
| **화면유형** | CRUD |
| **접근권한** | 시스템관리자, 생산관리자 |

#### 데이터 항목
| 필드명 | 필드ID | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| 라인코드 | line_code | VARCHAR(20) | Y | PK |
| 라인명 | line_name | VARCHAR(100) | Y | |
| 공장코드 | plant_code | VARCHAR(10) | Y | FK |
| 라인유형 | line_type | VARCHAR(20) | Y | SMT/THT/ASSY |
| 가동시작시간 | start_time | TIME | N | |
| 가동종료시간 | end_time | TIME | N | |
| 목표OEE | target_oee | DECIMAL(5,2) | N | % |
| 담당자 | manager_id | VARCHAR(20) | N | |
| 사용여부 | is_active | BOOLEAN | Y | |

#### 초기 데이터 (평택공장)
| 라인코드 | 라인명 | 유형 | 목표OEE |
|----------|--------|------|---------|
| SMT-L01 | SMT 1라인 | SMT | 85% |
| SMT-L02 | SMT 2라인 | SMT | 85% |
| SMT-L03 | SMT 3라인 | SMT | 85% |
| SMT-L04 | SMT 4라인 | SMT | 85% |
| SMT-L05 | SMT 5라인 | SMT | 85% |
| THT-L01 | THT 1라인 | THT | 80% |
| ASSY-L01 | 조립 1라인 | ASSY | 80% |

---

### MES-BAS-005 공정관리

#### 기본정보
| 항목 | 내용 |
|------|------|
| **화면ID** | MES-BAS-005 |
| **화면명** | 공정관리 |
| **화면유형** | CRUD |
| **접근권한** | 시스템관리자, 생산관리자 |

#### 데이터 항목
| 필드명 | 필드ID | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| 공정코드 | process_code | VARCHAR(20) | Y | PK |
| 공정명 | process_name | VARCHAR(100) | Y | |
| 공정유형 | process_type | VARCHAR(20) | Y | 가공/검사/이동 |
| 표준작업시간 | std_cycle_time | INT | N | 초 단위 |
| 검사여부 | is_inspection | BOOLEAN | Y | |
| 자동화여부 | is_automated | BOOLEAN | Y | |
| 정렬순서 | sort_order | INT | N | |
| 사용여부 | is_active | BOOLEAN | Y | |

#### 초기 데이터 (SMT 공정)
| 공정코드 | 공정명 | 유형 | 검사 | 자동화 | 순서 |
|----------|--------|------|------|--------|------|
| LOAD | PCB투입 | 가공 | N | Y | 10 |
| PRINT | 솔더인쇄 | 가공 | N | Y | 20 |
| SPI | SPI검사 | 검사 | Y | Y | 30 |
| CHIP_MT | 칩마운트 | 가공 | N | Y | 40 |
| MULTI_MT | 이형마운트 | 가공 | N | Y | 50 |
| REFLOW | 리플로우 | 가공 | N | Y | 60 |
| AOI | AOI검사 | 검사 | Y | Y | 70 |
| UNLOAD | PCB취출 | 가공 | N | Y | 80 |
| REPAIR | 수리 | 가공 | N | N | 90 |
| FINAL_INSP | 최종검사 | 검사 | Y | N | 100 |

---

### MES-BAS-006 품목관리

#### 기본정보
| 항목 | 내용 |
|------|------|
| **화면ID** | MES-BAS-006 |
| **화면명** | 품목관리 |
| **화면유형** | CRUD + ERP연동 |
| **접근권한** | 시스템관리자, 생산관리자 |

#### 데이터 항목
| 필드명 | 필드ID | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| 품목코드 | item_code | VARCHAR(30) | Y | PK, ERP동기화 |
| 품목명 | item_name | VARCHAR(200) | Y | |
| 품목유형 | item_type | VARCHAR(20) | Y | 완제품/반제품/자재 |
| 제품군 | product_group | VARCHAR(20) | N | |
| 고객사 | customer_code | VARCHAR(20) | N | |
| 단위 | unit | VARCHAR(10) | Y | PCS/EA |
| UPH | uph | INT | N | Unit Per Hour |
| 표준불량률 | std_defect_rate | DECIMAL(5,2) | N | % |
| ERP연동여부 | is_erp_sync | BOOLEAN | Y | |
| 사용여부 | is_active | BOOLEAN | Y | |

#### 화면 레이아웃
```
┌─────────────────────────────────────────────────────────────┐
│ [검색조건]                                                   │
│ 품목코드: [______] 품목명: [______] 품목유형: [전체▼]        │
│ 제품군: [전체▼] 고객사: [전체▼] [검색] [초기화] [ERP동기화]  │
├─────────────────────────────────────────────────────────────┤
│ [품목 목록 그리드]                                           │
│ 품목코드│품목명│유형│제품군│고객사│UPH│표준불량률│사용      │
│ ────────┼─────┼───┼─────┼─────┼───┼────────┼────          │
│         │     │   │     │     │   │        │                │
├─────────────────────────────────────────────────────────────┤
│ [상세정보 탭]                                                │
│ ┌─────────┬─────────┬─────────┐                            │
│ │ 기본정보 │ 공정정보 │ 불량유형 │                            │
│ └─────────┴─────────┴─────────┘                            │
│ [상세 입력 폼]                                               │
└─────────────────────────────────────────────────────────────┘
```

#### 비즈니스 로직
1. ERP동기화 버튼 클릭 시 ERP 품목마스터에서 데이터 수신
2. MES 고유 필드(UPH, 표준불량률)는 MES에서만 관리
3. 품목 삭제 시 생산이력 있으면 비활성화만 가능

---

### MES-BAS-007 품목별공정관리

#### 기본정보
| 항목 | 내용 |
|------|------|
| **화면ID** | MES-BAS-007 |
| **화면명** | 품목별공정관리 |
| **화면유형** | Master-Detail |
| **접근권한** | 시스템관리자, 생산관리자 |

#### 데이터 항목 (품목별 공정 라우팅)
| 필드명 | 필드ID | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| 품목코드 | item_code | VARCHAR(30) | Y | FK |
| 공정순서 | seq_no | INT | Y | |
| 공정코드 | process_code | VARCHAR(20) | Y | FK |
| 표준CT | std_cycle_time | INT | N | 초 |
| 필수여부 | is_required | BOOLEAN | Y | |
| 검사여부 | is_inspection | BOOLEAN | Y | |

#### 화면 레이아웃
```
┌─────────────────────────────────────────────────────────────┐
│ [품목 검색]                                                  │
│ 품목코드: [______] 품목명: [______] [검색]                   │
├───────────────────────┬─────────────────────────────────────┤
│ [품목 목록]            │ [공정 라우팅]                        │
│ 품목코드 │ 품목명      │ 순서│공정코드│공정명│CT│필수│검사   │
│ ─────────┼────────    │ ───┼──────┼─────┼──┼───┼────       │
│ GB-MB-001│ 메인보드A   │ 10 │LOAD  │PCB투입│5│ Y │ N        │
│ GB-MB-002│ 메인보드B   │ 20 │PRINT │솔더인쇄│30│Y │ N       │
│          │            │ 30 │SPI   │SPI검사│10│Y │ Y        │
│          │            │ ...│      │      │  │   │          │
│          │            │                                     │
│          │            │ [추가] [삭제] [저장]                 │
└───────────────────────┴─────────────────────────────────────┘
```

---

### MES-BAS-008 품목별불량유형

#### 기본정보
| 항목 | 내용 |
|------|------|
| **화면ID** | MES-BAS-008 |
| **화면명** | 품목별불량유형 |
| **화면유형** | Master-Detail |
| **접근권한** | 품질관리자, 생산관리자 |

#### 데이터 항목
| 필드명 | 필드ID | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| 품목코드 | item_code | VARCHAR(30) | Y | FK |
| 불량코드 | defect_code | VARCHAR(10) | Y | FK |
| 허용불량률 | allow_defect_rate | DECIMAL(5,2) | N | % |
| 중요도 | severity | VARCHAR(10) | Y | HIGH/MEDIUM/LOW |
| 적용여부 | is_active | BOOLEAN | Y | |

#### 기능설명
- 품목별로 발생 가능한 불량유형을 매핑
- 품목 특성에 따라 중요 불량유형 설정
- AI 품질판단 시 참조 데이터로 활용

---

### MES-BAS-009 작업자관리

#### 기본정보
| 항목 | 내용 |
|------|------|
| **화면ID** | MES-BAS-009 |
| **화면명** | 작업자관리 |
| **화면유형** | CRUD |
| **접근권한** | 시스템관리자, 생산관리자 |

#### 데이터 항목
| 필드명 | 필드ID | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| 작업자ID | worker_id | VARCHAR(20) | Y | PK |
| 작업자명 | worker_name | VARCHAR(50) | Y | |
| 사번 | emp_no | VARCHAR(20) | Y | ERP 사번 |
| 소속공장 | plant_code | VARCHAR(10) | Y | FK |
| 소속라인 | line_code | VARCHAR(20) | N | FK |
| 직급 | position | VARCHAR(20) | N | |
| 숙련도 | skill_level | VARCHAR(10) | Y | 초급/중급/고급 |
| 입사일 | hire_date | DATE | N | |
| 연락처 | phone | VARCHAR(20) | N | |
| 사용여부 | is_active | BOOLEAN | Y | |

#### 추가 기능: 스킬매트릭스
| 필드명 | 필드ID | 타입 | 설명 |
|--------|--------|------|------|
| 작업자ID | worker_id | VARCHAR(20) | FK |
| 공정코드 | process_code | VARCHAR(20) | FK |
| 숙련도 | skill_level | INT | 1~5 |
| 자격취득일 | cert_date | DATE | |

---

### MES-BAS-010 검사항목관리

#### 기본정보
| 항목 | 내용 |
|------|------|
| **화면ID** | MES-BAS-010 |
| **화면명** | 검사항목관리 |
| **화면유형** | CRUD |
| **접근권한** | 품질관리자 |

#### 데이터 항목
| 필드명 | 필드ID | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| 검사항목코드 | insp_item_code | VARCHAR(20) | Y | PK |
| 검사항목명 | insp_item_name | VARCHAR(100) | Y | |
| 검사유형 | insp_type | VARCHAR(20) | Y | 외관/치수/전기/기능 |
| 측정단위 | unit | VARCHAR(20) | N | |
| 규격하한 | spec_min | DECIMAL(15,5) | N | |
| 규격상한 | spec_max | DECIMAL(15,5) | N | |
| 목표값 | target_value | DECIMAL(15,5) | N | |
| 검사방법 | insp_method | VARCHAR(500) | N | |
| 사용여부 | is_active | BOOLEAN | Y | |

---

### MES-BAS-011 불량유형관리

#### 기본정보
| 항목 | 내용 |
|------|------|
| **화면ID** | MES-BAS-011 |
| **화면명** | 불량유형관리 |
| **화면유형** | CRUD |
| **접근권한** | 품질관리자 |

#### 데이터 항목
| 필드명 | 필드ID | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| 불량코드 | defect_code | VARCHAR(10) | Y | PK |
| 불량명 | defect_name | VARCHAR(100) | Y | |
| 불량영문명 | defect_name_en | VARCHAR(100) | N | |
| 불량분류 | defect_category | VARCHAR(20) | Y | 외관/기능/치수 |
| 원인설비 | cause_equipment | VARCHAR(50) | N | |
| 주요원인 | main_cause | VARCHAR(500) | N | |
| 조치방법 | action_guide | VARCHAR(1000) | N | |
| 심각도 | severity | VARCHAR(10) | Y | Critical/Major/Minor |
| 정렬순서 | sort_order | INT | N | |
| 사용여부 | is_active | BOOLEAN | Y | |

#### 초기 데이터 (PCB/SMT 불량)
| 코드 | 불량명 | 영문 | 분류 | 원인설비 | 심각도 |
|------|--------|------|------|----------|--------|
| DF01 | 솔더브릿지 | Bridge | 외관 | Printer,Reflow | Critical |
| DF02 | 미납 | Open | 외관 | Printer | Critical |
| DF03 | 직립 | Tombstone | 외관 | Reflow | Major |
| DF04 | 부품누락 | Missing | 외관 | Mounter | Critical |
| DF05 | 위치이탈 | Shift | 외관 | Mounter | Major |
| DF06 | 오삽 | Wrong Part | 기능 | Mounter | Critical |
| DF07 | 극성반대 | Polarity | 기능 | Mounter | Critical |
| DF08 | 냉납 | Cold Solder | 외관 | Reflow | Major |
| DF09 | 크랙 | Crack | 외관 | Reflow | Major |
| DF10 | 보이드 | Void | 외관 | Reflow | Minor |
| DF11 | 들뜸 | Lifted | 외관 | Reflow | Major |
| DF12 | 이물 | Foreign Material | 외관 | 전체 | Minor |

---

### MES-BAS-012 고객사관리

#### 기본정보
| 항목 | 내용 |
|------|------|
| **화면ID** | MES-BAS-012 |
| **화면명** | 고객사관리 |
| **화면유형** | CRUD + ERP연동 |
| **접근권한** | 시스템관리자 |

#### 데이터 항목
| 필드명 | 필드ID | 타입 | 필수 | 설명 |
|--------|--------|------|------|------|
| 고객코드 | customer_code | VARCHAR(20) | Y | PK |
| 고객명 | customer_name | VARCHAR(200) | Y | |
| 고객약칭 | short_name | VARCHAR(50) | N | |
| 담당자 | contact_name | VARCHAR(50) | N | |
| 연락처 | phone | VARCHAR(20) | N | |
| 이메일 | email | VARCHAR(100) | N | |
| 품질요구수준 | quality_level | VARCHAR(10) | N | A/B/C |
| 사용여부 | is_active | BOOLEAN | Y | |

---

## 테이블 설계

### 주요 테이블 목록
| 테이블명 | 설명 |
|----------|------|
| mes_code_group | 코드그룹 |
| mes_common_code | 공통코드 |
| mes_plant | 공장 |
| mes_line | 생산라인 |
| mes_process | 공정 |
| mes_item | 품목 |
| mes_item_process | 품목별공정 |
| mes_item_defect_type | 품목별불량유형 |
| mes_worker | 작업자 |
| mes_worker_skill | 작업자스킬 |
| mes_inspection_item | 검사항목 |
| mes_defect_type | 불량유형 |
| mes_customer | 고객사 |

---

## API 엔드포인트

| Method | Endpoint | 설명 |
|--------|----------|------|
| GET | /api/mes/code-groups | 코드그룹 목록 |
| POST | /api/mes/code-groups | 코드그룹 등록 |
| PUT | /api/mes/code-groups/{id} | 코드그룹 수정 |
| DELETE | /api/mes/code-groups/{id} | 코드그룹 삭제 |
| GET | /api/mes/common-codes | 공통코드 목록 |
| GET | /api/mes/common-codes/{groupId} | 그룹별 코드 |
| GET | /api/mes/plants | 공장 목록 |
| GET | /api/mes/lines | 라인 목록 |
| GET | /api/mes/lines/{plantCode} | 공장별 라인 |
| GET | /api/mes/processes | 공정 목록 |
| GET | /api/mes/items | 품목 목록 |
| POST | /api/mes/items/sync-erp | ERP 품목 동기화 |
| GET | /api/mes/items/{code}/processes | 품목별 공정 |
| GET | /api/mes/workers | 작업자 목록 |
| GET | /api/mes/defect-types | 불량유형 목록 |
| GET | /api/mes/customers | 고객사 목록 |

---

*문서버전: 1.0*
*작성일: 2025-01-29*
