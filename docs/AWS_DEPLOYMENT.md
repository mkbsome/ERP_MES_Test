# AWS 배포 가이드

ERP/MES 시뮬레이터를 AWS에 배포하고 TriFlow-AI와 연동하는 방법입니다.

## 아키텍처

```
┌─────────────────────────────────────────────────────────────────┐
│                         AWS Cloud                                │
├─────────────────────────────────────────────────────────────────┤
│                                                                  │
│  ┌────────────────┐     ┌────────────────┐                      │
│  │   EventBridge  │────▶│    Lambda      │                      │
│  │  (스케줄러)     │     │ (Start/Stop)   │                      │
│  └────────────────┘     └───────┬────────┘                      │
│                                 │                                │
│                                 ▼                                │
│  ┌────────────────────────────────────────────┐                 │
│  │              ECS Fargate                    │                 │
│  │  ┌────────────────────────────────────┐    │                 │
│  │  │     erp-mes-simulator API          │    │                 │
│  │  │     (온디맨드 실행)                  │    │                 │
│  │  └────────────────────────────────────┘    │                 │
│  └─────────────────────┬──────────────────────┘                 │
│                        │                                         │
│                        ▼                                         │
│  ┌────────────────────────────────────────────┐                 │
│  │              RDS PostgreSQL                 │                 │
│  │  (erp_mes_db - 데이터 영구 저장)            │                 │
│  └────────────────────┬───────────────────────┘                 │
│                        │                                         │
│                        │ FDW (Foreign Data Wrapper)             │
│                        ▼                                         │
│  ┌────────────────────────────────────────────┐                 │
│  │              TriFlow-AI                     │                 │
│  │  (FDW로 실시간 데이터 조회)                  │                 │
│  └────────────────────────────────────────────┘                 │
│                                                                  │
└─────────────────────────────────────────────────────────────────┘
```

## 예상 비용 (온디맨드 방식)

| 구성요소 | 사양 | 월 비용 (예상) |
|----------|------|---------------|
| RDS PostgreSQL | db.t3.micro, 20GB | ~$15-20 |
| ECS Fargate | 0.25 vCPU, 0.5GB, 4시간/일 | ~$5-10 |
| ECR | 이미지 저장 | ~$1 |
| Lambda | 시작/종료 함수 | ~$0 (무료 티어) |
| EventBridge | 스케줄 | ~$0 |
| **합계** | | **~$20-35/월** |

## 1단계: RDS 생성

### AWS Console에서:

1. **RDS > Create database**
2. **설정:**
   - Engine: PostgreSQL 15
   - Template: Free tier (또는 Production)
   - Instance: db.t3.micro
   - Storage: 20GB gp2
   - VPC: Default VPC
   - Public access: Yes (개발용) / No (프로덕션)

3. **보안 그룹:**
   - Inbound: PostgreSQL (5432) from ECS Security Group
   - Inbound: PostgreSQL (5432) from TriFlow-AI IP (FDW용)

4. **연결 정보 메모:**
   ```
   Endpoint: your-db.xxxxxxxx.ap-northeast-2.rds.amazonaws.com
   Port: 5432
   Database: erp_mes_db
   Username: postgres
   Password: (설정한 비밀번호)
   ```

### 스키마 생성:
```bash
psql -h your-db.xxxxxxxx.rds.amazonaws.com -U postgres -d erp_mes_db -f database/schema/001_init.sql
```

## 2단계: ECR 리포지토리 생성

```bash
# AWS CLI로 리포지토리 생성
aws ecr create-repository \
    --repository-name erp-mes-simulator \
    --region ap-northeast-2

# Docker 이미지 빌드 및 푸시
aws ecr get-login-password --region ap-northeast-2 | docker login --username AWS --password-stdin YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com

docker build -t erp-mes-simulator .
docker tag erp-mes-simulator:latest YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/erp-mes-simulator:latest
docker push YOUR_ACCOUNT_ID.dkr.ecr.ap-northeast-2.amazonaws.com/erp-mes-simulator:latest
```

## 3단계: ECS 클러스터 및 태스크 정의

### Task Definition (task-definition.json):
```json
{
  "family": "erp-mes-simulator",
  "networkMode": "awsvpc",
  "requiresCompatibilities": ["FARGATE"],
  "cpu": "256",
  "memory": "512",
  "executionRoleArn": "arn:aws:iam::YOUR_ACCOUNT:role/ecsTaskExecutionRole",
  "containerDefinitions": [
    {
      "name": "api",
      "image": "YOUR_ACCOUNT.dkr.ecr.ap-northeast-2.amazonaws.com/erp-mes-simulator:latest",
      "portMappings": [
        {
          "containerPort": 8000,
          "protocol": "tcp"
        }
      ],
      "environment": [
        {"name": "MES_DEBUG", "value": "false"},
        {"name": "MES_CORS_ORIGINS", "value": "https://your-triflow-domain.com"}
      ],
      "secrets": [
        {
          "name": "MES_DATABASE_URL",
          "valueFrom": "arn:aws:secretsmanager:ap-northeast-2:YOUR_ACCOUNT:secret:erp-mes/database-url"
        }
      ],
      "healthCheck": {
        "command": ["CMD-SHELL", "curl -f http://localhost:8000/health || exit 1"],
        "interval": 30,
        "timeout": 10,
        "retries": 3,
        "startPeriod": 10
      },
      "logConfiguration": {
        "logDriver": "awslogs",
        "options": {
          "awslogs-group": "/ecs/erp-mes-simulator",
          "awslogs-region": "ap-northeast-2",
          "awslogs-stream-prefix": "api"
        }
      }
    }
  ]
}
```

## 4단계: Lambda 함수 (시작/종료 제어)

### start_simulator.py:
```python
import boto3
import json

ecs = boto3.client('ecs')
CLUSTER = 'erp-mes-cluster'
SERVICE = 'erp-mes-simulator'

def lambda_handler(event, context):
    """시뮬레이터 시작 (Desired count = 1)"""
    response = ecs.update_service(
        cluster=CLUSTER,
        service=SERVICE,
        desiredCount=1
    )
    return {
        'statusCode': 200,
        'body': json.dumps('Simulator started')
    }
```

### stop_simulator.py:
```python
import boto3
import json

ecs = boto3.client('ecs')
CLUSTER = 'erp-mes-cluster'
SERVICE = 'erp-mes-simulator'

def lambda_handler(event, context):
    """시뮬레이터 종료 (Desired count = 0)"""
    response = ecs.update_service(
        cluster=CLUSTER,
        service=SERVICE,
        desiredCount=0
    )
    return {
        'statusCode': 200,
        'body': json.dumps('Simulator stopped')
    }
```

## 5단계: EventBridge 스케줄 설정

### 업무 시간만 실행 (09:00-18:00 KST):
```bash
# 시작 스케줄 (09:00 KST = 00:00 UTC)
aws events put-rule \
    --name "start-erp-mes-simulator" \
    --schedule-expression "cron(0 0 ? * MON-FRI *)" \
    --state ENABLED

# 종료 스케줄 (18:00 KST = 09:00 UTC)
aws events put-rule \
    --name "stop-erp-mes-simulator" \
    --schedule-expression "cron(0 9 ? * MON-FRI *)" \
    --state ENABLED
```

## 6단계: TriFlow-AI FDW 연동

### TriFlow-AI PostgreSQL에서:
```sql
-- FDW 확장 설치
CREATE EXTENSION IF NOT EXISTS postgres_fdw;

-- 외부 서버 생성 (ERP-MES RDS)
CREATE SERVER erp_mes_server
FOREIGN DATA WRAPPER postgres_fdw
OPTIONS (
    host 'your-db.xxxxxxxx.rds.amazonaws.com',
    port '5432',
    dbname 'erp_mes_db'
);

-- 사용자 매핑
CREATE USER MAPPING FOR postgres
SERVER erp_mes_server
OPTIONS (user 'postgres', password 'YOUR_PASSWORD');

-- 스키마 임포트
CREATE SCHEMA erp_mes;
IMPORT FOREIGN SCHEMA public
FROM SERVER erp_mes_server
INTO erp_mes;

-- 테스트 쿼리
SELECT COUNT(*) FROM erp_mes.mes_production_result;
SELECT * FROM erp_mes.mes_realtime_production
ORDER BY created_at DESC LIMIT 10;
```

## 7단계: 수동 실행 방법

### AWS Console:
1. ECS > Clusters > erp-mes-cluster
2. Services > erp-mes-simulator
3. Update > Desired tasks: 1 (시작) 또는 0 (종료)

### AWS CLI:
```bash
# 시작
aws ecs update-service \
    --cluster erp-mes-cluster \
    --service erp-mes-simulator \
    --desired-count 1

# 종료
aws ecs update-service \
    --cluster erp-mes-cluster \
    --service erp-mes-simulator \
    --desired-count 0
```

### API 호출 (시뮬레이션 제어):
```bash
# 시뮬레이션 시작 (Gap-Fill 자동 실행)
curl -X POST http://your-api-endpoint/api/v1/generator/simulation/start

# Gap 확인
curl http://your-api-endpoint/api/v1/generator/simulation/gaps

# 상태 확인
curl http://your-api-endpoint/api/v1/generator/simulation/status

# 시뮬레이션 종료
curl -X POST http://your-api-endpoint/api/v1/generator/simulation/stop
```

## 운영 시나리오

### 시나리오 1: 데모/테스트
1. 필요할 때 ECS 서비스 시작
2. 시뮬레이션 API로 데이터 생성 시작
3. Gap-Fill이 자동으로 중단 기간 데이터 채움
4. 테스트 완료 후 ECS 서비스 종료

### 시나리오 2: 정기 데이터 생성
1. EventBridge로 업무 시간에만 ECS 실행
2. 시뮬레이터 자동 시작/종료
3. Gap-Fill로 야간/주말 데이터 자동 보완

### 시나리오 3: 대량 히스토리 데이터
1. ECS 서비스 시작
2. Gap-Fill API로 특정 기간 데이터 일괄 생성
3. 생성 완료 후 ECS 서비스 종료

## 모니터링

### CloudWatch 대시보드:
- ECS 서비스 상태
- RDS 연결 수, CPU, 메모리
- API 응답 시간 (Health check)
- 에러 로그

### 알람 설정:
```bash
# RDS CPU 알람
aws cloudwatch put-metric-alarm \
    --alarm-name "erp-mes-rds-cpu" \
    --metric-name CPUUtilization \
    --namespace AWS/RDS \
    --statistic Average \
    --period 300 \
    --threshold 80 \
    --comparison-operator GreaterThanThreshold \
    --evaluation-periods 2
```

## 문제 해결

### ECS 태스크 시작 실패
1. CloudWatch 로그 확인: `/ecs/erp-mes-simulator`
2. 보안 그룹 확인: ECS → RDS 연결 허용
3. Secrets Manager 권한 확인

### RDS 연결 실패
1. 보안 그룹 인바운드 규칙 확인
2. VPC 서브넷 라우팅 테이블 확인
3. RDS 퍼블릭 액세스 설정 확인

### Gap-Fill 데이터 불일치
1. 타임존 확인: DB는 UTC 저장
2. `detect_gaps` API로 현재 상태 확인
3. 필요 시 수동 Gap-Fill 실행
