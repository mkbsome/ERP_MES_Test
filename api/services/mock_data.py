"""
Mock Data Service for Demo Mode
Provides realistic demo data without database connection
"""
import random
from datetime import datetime, timedelta
from typing import List, Dict, Any, Optional


class MockDataService:
    """Generate mock data for MES/ERP demo"""

    # Production Lines
    LINES = [
        {"code": "SMT-L01", "name": "SMT 1호기", "type": "SMT"},
        {"code": "SMT-L02", "name": "SMT 2호기", "type": "SMT"},
        {"code": "SMT-L03", "name": "SMT 3호기", "type": "SMT"},
        {"code": "THT-L01", "name": "THT 1호기", "type": "THT"},
        {"code": "ASM-L01", "name": "조립 1호기", "type": "ASSEMBLY"},
    ]

    # Products
    PRODUCTS = [
        {"code": "MB-001", "name": "스마트폰 메인보드 A", "type": "finished"},
        {"code": "MB-002", "name": "스마트폰 메인보드 B", "type": "finished"},
        {"code": "PB-001", "name": "전원보드 표준형", "type": "finished"},
        {"code": "LED-001", "name": "LED 드라이버 모듈", "type": "finished"},
        {"code": "ECU-001", "name": "자동차 ECU 보드", "type": "finished"},
        {"code": "IOT-001", "name": "IoT 통신 모듈", "type": "finished"},
    ]

    # Equipment
    EQUIPMENT = [
        {"code": "EQ-SMT-001", "name": "솔더 프린터 #1", "type": "SMT_PRINT", "line": "SMT-L01"},
        {"code": "EQ-SMT-002", "name": "칩마운터 #1", "type": "SMT_MOUNT", "line": "SMT-L01"},
        {"code": "EQ-SMT-003", "name": "리플로우 오븐 #1", "type": "SMT_REFLOW", "line": "SMT-L01"},
        {"code": "EQ-SMT-004", "name": "AOI 검사기 #1", "type": "SMT_AOI", "line": "SMT-L01"},
        {"code": "EQ-SMT-011", "name": "솔더 프린터 #2", "type": "SMT_PRINT", "line": "SMT-L02"},
        {"code": "EQ-SMT-012", "name": "칩마운터 #2", "type": "SMT_MOUNT", "line": "SMT-L02"},
        {"code": "EQ-THT-001", "name": "삽입기 #1", "type": "THT_INSERT", "line": "THT-L01"},
        {"code": "EQ-THT-002", "name": "웨이브 솔더링 #1", "type": "THT_WAVE", "line": "THT-L01"},
    ]

    # Defect Types
    DEFECT_TYPES = [
        {"code": "DEF-001", "name": "솔더 브릿지", "category": "solder"},
        {"code": "DEF-002", "name": "냉납", "category": "solder"},
        {"code": "DEF-003", "name": "부품 누락", "category": "component"},
        {"code": "DEF-004", "name": "부품 오삽입", "category": "component"},
        {"code": "DEF-005", "name": "극성 오류", "category": "component"},
        {"code": "DEF-006", "name": "PCB 스크래치", "category": "pcb"},
    ]

    @classmethod
    def get_realtime_production(cls) -> List[Dict[str, Any]]:
        """실시간 생산 현황"""
        now = datetime.now()
        results = []

        for line in cls.LINES:
            product = random.choice(cls.PRODUCTS)
            target_qty = random.randint(800, 1200)
            produced_qty = int(target_qty * random.uniform(0.7, 0.95))
            good_qty = int(produced_qty * random.uniform(0.97, 0.995))

            results.append({
                "line_code": line["code"],
                "line_name": line["name"],
                "product_code": product["code"],
                "product_name": product["name"],
                "work_order_no": f"WO-{now.strftime('%Y%m%d')}-{line['code'][-3:]}",
                "target_qty": target_qty,
                "produced_qty": produced_qty,
                "good_qty": good_qty,
                "defect_qty": produced_qty - good_qty,
                "defect_rate": round((produced_qty - good_qty) / produced_qty * 100, 2) if produced_qty > 0 else 0,
                "progress_rate": round(produced_qty / target_qty * 100, 1),
                "status": random.choice(["running", "running", "running", "idle", "maintenance"]),
                "start_time": (now - timedelta(hours=random.randint(1, 6))).isoformat(),
                "updated_at": now.isoformat(),
            })

        return results

    @classmethod
    def get_equipment_status(cls) -> List[Dict[str, Any]]:
        """전체 설비 상태"""
        results = []

        for eq in cls.EQUIPMENT:
            status = random.choices(
                ["running", "idle", "maintenance", "alarm"],
                weights=[70, 15, 10, 5]
            )[0]

            results.append({
                "equipment_code": eq["code"],
                "equipment_name": eq["name"],
                "equipment_type": eq["type"],
                "line_code": eq["line"],
                "status": status,
                "temperature": round(random.uniform(20, 35), 1) if status == "running" else None,
                "cycle_time": round(random.uniform(10, 30), 1) if status == "running" else None,
                "uptime_hours": round(random.uniform(100, 500), 1),
                "last_maintenance": (datetime.now() - timedelta(days=random.randint(1, 30))).isoformat(),
                "updated_at": datetime.now().isoformat(),
            })

        return results

    @classmethod
    def get_oee_data(cls) -> List[Dict[str, Any]]:
        """OEE 데이터"""
        results = []

        for line in cls.LINES:
            availability = random.uniform(0.85, 0.98)
            performance = random.uniform(0.88, 0.98)
            quality = random.uniform(0.96, 0.995)
            oee = availability * performance * quality

            results.append({
                "line_code": line["code"],
                "line_name": line["name"],
                "date": datetime.now().strftime("%Y-%m-%d"),
                "availability": round(availability * 100, 1),
                "performance": round(performance * 100, 1),
                "quality": round(quality * 100, 1),
                "oee": round(oee * 100, 1),
                "target_oee": 85.0,
                "planned_production_time": 480,  # 8 hours
                "actual_production_time": int(480 * availability),
                "ideal_cycle_time": 15,  # seconds
                "total_count": random.randint(800, 1200),
                "good_count": random.randint(750, 1150),
            })

        return results

    @classmethod
    def get_daily_production_analysis(cls) -> Dict[str, Any]:
        """일별 생산 분석"""
        now = datetime.now()

        # 최근 7일 트렌드
        daily_trend = []
        for i in range(7):
            date = now - timedelta(days=6-i)
            daily_trend.append({
                "date": date.strftime("%Y-%m-%d"),
                "target_qty": random.randint(5000, 6000),
                "produced_qty": random.randint(4500, 5800),
                "good_qty": random.randint(4400, 5700),
                "defect_rate": round(random.uniform(0.8, 2.5), 2),
            })

        return {
            "date": now.strftime("%Y-%m-%d"),
            "total_target": sum(d["target_qty"] for d in daily_trend[-1:]),
            "total_produced": sum(d["produced_qty"] for d in daily_trend[-1:]),
            "total_good": sum(d["good_qty"] for d in daily_trend[-1:]),
            "overall_defect_rate": round(random.uniform(1.0, 2.0), 2),
            "daily_trend": daily_trend,
            "by_line": [
                {
                    "line_code": line["code"],
                    "line_name": line["name"],
                    "target_qty": random.randint(800, 1200),
                    "produced_qty": random.randint(750, 1150),
                    "defect_rate": round(random.uniform(0.8, 2.5), 2),
                }
                for line in cls.LINES
            ],
        }

    @classmethod
    def get_defect_analysis(cls) -> Dict[str, Any]:
        """불량 분석"""
        total_defects = random.randint(50, 150)
        defect_distribution = []
        remaining = total_defects

        for i, defect in enumerate(cls.DEFECT_TYPES):
            if i == len(cls.DEFECT_TYPES) - 1:
                count = remaining
            else:
                count = random.randint(0, remaining // 2)
                remaining -= count

            defect_distribution.append({
                "defect_code": defect["code"],
                "defect_name": defect["name"],
                "category": defect["category"],
                "count": count,
                "ratio": round(count / total_defects * 100, 1) if total_defects > 0 else 0,
            })

        # 누적 비율 계산 (파레토)
        sorted_defects = sorted(defect_distribution, key=lambda x: x["count"], reverse=True)
        cumulative = 0
        for d in sorted_defects:
            cumulative += d["ratio"]
            d["cumulative_ratio"] = round(cumulative, 1)

        return {
            "date": datetime.now().strftime("%Y-%m-%d"),
            "total_defects": total_defects,
            "total_inspected": random.randint(4000, 5000),
            "defect_rate": round(total_defects / random.randint(4000, 5000) * 100, 2),
            "by_type": sorted_defects,
            "by_line": [
                {
                    "line_code": line["code"],
                    "line_name": line["name"],
                    "defect_count": random.randint(5, 30),
                    "defect_rate": round(random.uniform(0.5, 3.0), 2),
                }
                for line in cls.LINES
            ],
        }

    @classmethod
    def get_defect_pareto(cls) -> List[Dict[str, Any]]:
        """파레토 분석 데이터"""
        defect_counts = []
        for defect in cls.DEFECT_TYPES:
            defect_counts.append({
                "defect_code": defect["code"],
                "defect_name": defect["name"],
                "count": random.randint(5, 50),
            })

        # 내림차순 정렬
        sorted_defects = sorted(defect_counts, key=lambda x: x["count"], reverse=True)

        # 비율 및 누적비율 계산
        total = sum(d["count"] for d in sorted_defects)
        cumulative = 0
        for d in sorted_defects:
            d["ratio"] = round(d["count"] / total * 100, 1)
            cumulative += d["ratio"]
            d["cumulative_ratio"] = round(cumulative, 1)

        return sorted_defects

    @classmethod
    def get_mes_dashboard_summary(cls) -> Dict[str, Any]:
        """MES 대시보드 요약"""
        now = datetime.now()

        return {
            "timestamp": now.isoformat(),
            "production": {
                "today_target": 5500,
                "today_produced": random.randint(4800, 5300),
                "today_good": random.randint(4700, 5200),
                "defect_rate": round(random.uniform(1.0, 2.0), 2),
                "running_lines": random.randint(3, 5),
                "total_lines": 5,
            },
            "equipment": {
                "total": len(cls.EQUIPMENT),
                "running": random.randint(5, 7),
                "idle": random.randint(0, 2),
                "maintenance": random.randint(0, 1),
                "alarm": random.randint(0, 1),
                "average_oee": round(random.uniform(82, 92), 1),
            },
            "quality": {
                "today_inspected": random.randint(4500, 5500),
                "today_defects": random.randint(50, 150),
                "defect_rate": round(random.uniform(1.0, 2.5), 2),
                "top_defect": "솔더 브릿지",
            },
            "alerts": [
                {"type": "warning", "message": "SMT-L02 라인 온도 상승 감지", "time": now.isoformat()},
                {"type": "info", "message": "MB-001 작업지시 완료", "time": (now - timedelta(minutes=15)).isoformat()},
            ],
        }

    @classmethod
    def get_erp_dashboard_summary(cls) -> Dict[str, Any]:
        """ERP 대시보드 요약"""
        now = datetime.now()

        return {
            "timestamp": now.isoformat(),
            "sales": {
                "monthly_revenue": random.randint(15000000000, 18000000000),  # 150-180억
                "monthly_target": 17000000000,
                "orders_count": random.randint(80, 120),
                "pending_shipments": random.randint(10, 25),
            },
            "purchase": {
                "pending_orders": random.randint(30, 50),
                "pending_receipts": random.randint(10, 20),
                "overdue_payments": random.randint(0, 5),
            },
            "inventory": {
                "total_value": random.randint(8000000000, 12000000000),  # 80-120억
                "below_safety": random.randint(5, 15),
                "excess_stock": random.randint(3, 10),
                "turnover_rate": round(random.uniform(10, 14), 1),
            },
            "production": {
                "active_work_orders": random.randint(20, 40),
                "completed_today": random.randint(15, 30),
                "delayed": random.randint(0, 5),
            },
            "kpis": [
                {"title": "월 매출", "value": "165억원", "change": 5.2, "trend": "up"},
                {"title": "수주잔고", "value": "82억원", "change": -2.1, "trend": "down"},
                {"title": "재고회전율", "value": "12.5회", "change": 0.8, "trend": "up"},
                {"title": "납기준수율", "value": "96.8%", "change": 1.2, "trend": "up"},
            ],
        }


    @classmethod
    def get_all_equipment_status_formatted(cls, line_code: Optional[str] = None) -> Dict[str, Any]:
        """설비 상태 - Dashboard 형식으로 반환

        Dashboard expects: { lines: [...], equipment: [...], summary: {...} }
        """
        equipment_data = cls.get_equipment_status()
        if line_code:
            equipment_data = [eq for eq in equipment_data if eq["line_code"] == line_code]

        # 라인별 상태 집계
        lines_dict = {}
        for eq in equipment_data:
            lc = eq["line_code"]
            if lc not in lines_dict:
                line_info = next((l for l in cls.LINES if l["code"] == lc), {"code": lc, "name": lc, "type": "unknown"})
                lines_dict[lc] = {
                    "line_id": lc,
                    "line_code": lc,
                    "line_name": line_info["name"],
                    "line_type": line_info["type"],
                    "status": "running",
                    "current_product": random.choice(cls.PRODUCTS)["name"],
                    "current_oee": round(random.uniform(78, 95), 1),
                    "today_production": random.randint(800, 1200),
                    "today_defect_rate": round(random.uniform(0.8, 2.5), 2),
                    "equipment_count": 0,
                    "running_count": 0,
                    "down_count": 0,
                }
            lines_dict[lc]["equipment_count"] += 1
            if eq["status"] == "running":
                lines_dict[lc]["running_count"] += 1
            elif eq["status"] in ["alarm", "maintenance"]:
                lines_dict[lc]["down_count"] += 1
                lines_dict[lc]["status"] = "down" if eq["status"] == "alarm" else "maintenance"

        lines = list(lines_dict.values())

        # Summary 계산
        running = sum(1 for eq in equipment_data if eq["status"] == "running")
        idle = sum(1 for eq in equipment_data if eq["status"] == "idle")
        maintenance = sum(1 for eq in equipment_data if eq["status"] == "maintenance")
        alarm = sum(1 for eq in equipment_data if eq["status"] == "alarm")

        return {
            "lines": lines,
            "equipment": equipment_data,
            "summary": {
                "total": len(equipment_data),
                "running": running,
                "idle": idle,
                "maintenance": maintenance,
                "alarm": alarm,
            }
        }

    @classmethod
    def get_oee_data_formatted(cls, line_code: Optional[str] = None) -> Dict[str, Any]:
        """OEE 데이터 - Dashboard 형식으로 반환

        Dashboard expects: { summary: {...}, trend: [...], by_line: [...] }
        """
        oee_list = cls.get_oee_data()
        if line_code:
            oee_list = [d for d in oee_list if d["line_code"] == line_code]

        # Summary 계산
        avg_oee = sum(d["oee"] for d in oee_list) / len(oee_list) if oee_list else 0
        avg_availability = sum(d["availability"] for d in oee_list) / len(oee_list) if oee_list else 0
        avg_performance = sum(d["performance"] for d in oee_list) / len(oee_list) if oee_list else 0
        avg_quality = sum(d["quality"] for d in oee_list) / len(oee_list) if oee_list else 0

        # 7일 추이 데이터 생성
        now = datetime.now()
        trend = []
        for i in range(7):
            date = now - timedelta(days=6-i)
            trend.append({
                "date": date.strftime("%Y-%m-%d"),
                "availability": round(random.uniform(88, 96), 1),
                "performance": round(random.uniform(85, 95), 1),
                "quality": round(random.uniform(96, 99.5), 1),
                "oee": round(random.uniform(78, 92), 1),
            })

        return {
            "summary": {
                "avg_oee": round(avg_oee, 1),
                "avg_availability": round(avg_availability, 1),
                "avg_performance": round(avg_performance, 1),
                "avg_quality": round(avg_quality, 1),
                "target_oee": 85.0,
            },
            "trend": trend,
            "by_line": oee_list,
        }

    @classmethod
    def get_daily_production_analysis_formatted(cls) -> Dict[str, Any]:
        """일별 생산 분석 - Dashboard 형식으로 반환

        Dashboard expects: { daily_data: [...], product_distribution: [...], by_line: [...] }
        """
        now = datetime.now()
        analysis = cls.get_daily_production_analysis()

        # 금일 데이터
        today_production = random.randint(4800, 5500)
        today_defect = random.randint(50, 150)
        today_target = 5500

        daily_data = [{
            "date": now.strftime("%Y-%m-%d"),
            "total_production": today_production,
            "total_target": today_target,
            "total_good": today_production - today_defect,
            "total_defect": today_defect,
            "defect_rate": round(today_defect / today_production * 100, 2),
            "achievement_rate": round(today_production / today_target * 100, 1),
            "completed_lots": random.randint(15, 30),
            "production_trend": round(random.uniform(-5, 10), 1),
        }]

        # 제품군별 생산 비율
        product_distribution = [
            {"product_group": "스마트폰 메인보드", "production": random.randint(1500, 2000)},
            {"product_group": "전원보드", "production": random.randint(800, 1200)},
            {"product_group": "LED 드라이버", "production": random.randint(600, 900)},
            {"product_group": "자동차 ECU", "production": random.randint(400, 700)},
            {"product_group": "IoT 모듈", "production": random.randint(300, 500)},
        ]

        return {
            "daily_data": daily_data,
            "product_distribution": product_distribution,
            "by_line": analysis.get("by_line", []),
            "daily_trend": analysis.get("daily_trend", []),
        }

    @classmethod
    def get_realtime_production_formatted(cls, line_code: Optional[str] = None) -> Dict[str, Any]:
        """실시간 생산 - Dashboard 형식으로 반환

        Dashboard expects: { hourly: [...], lines: [...], summary: {...} }
        """
        production_data = cls.get_realtime_production()
        if line_code:
            production_data = [d for d in production_data if d["line_code"] == line_code]

        # 시간대별 생산량 (8:00 ~ 현재 시간)
        now = datetime.now()
        current_hour = now.hour
        hourly = []
        for hour in range(8, current_hour + 1):
            target = random.randint(450, 550)
            actual = int(target * random.uniform(0.85, 1.05))
            hourly.append({
                "hour": f"{hour:02d}:00",
                "production": actual,
                "target": target,
                "achievement": round(actual / target * 100, 1) if target > 0 else 0,
            })

        # Summary
        total_produced = sum(h["production"] for h in hourly)
        total_target = sum(h["target"] for h in hourly)

        return {
            "hourly": hourly,
            "lines": production_data,
            "summary": {
                "total_produced": total_produced,
                "total_target": total_target,
                "achievement_rate": round(total_produced / total_target * 100, 1) if total_target > 0 else 0,
                "running_lines": sum(1 for d in production_data if d["status"] == "running"),
                "total_lines": len(production_data),
            }
        }

    @classmethod
    def get_defect_analysis_formatted(cls, line_code: Optional[str] = None) -> Dict[str, Any]:
        """불량 분석 - Dashboard 형식으로 반환

        Dashboard expects: { trend: [...], by_type: [...], summary: {...} }
        """
        analysis = cls.get_defect_analysis()
        now = datetime.now()

        # 7일 추이 데이터
        trend = []
        for i in range(7):
            date = now - timedelta(days=6-i)
            trend.append({
                "date": date.strftime("%Y-%m-%d"),
                "defect_rate": round(random.uniform(1.0, 2.5), 2),
                "defect_count": random.randint(40, 150),
            })

        return {
            "trend": trend,
            "by_type": analysis.get("by_type", []),
            "by_line": analysis.get("by_line", []),
            "summary": {
                "total_defects": analysis.get("total_defects", 0),
                "total_inspected": analysis.get("total_inspected", 0),
                "defect_rate": analysis.get("defect_rate", 0),
            }
        }

    @classmethod
    def get_defect_pareto_formatted(cls) -> Dict[str, Any]:
        """파레토 분석 - Dashboard 형식으로 반환

        Dashboard expects: { items: [...], summary: {...} }
        """
        pareto_data = cls.get_defect_pareto()

        return {
            "items": [
                {
                    "defect_code": d["defect_code"],
                    "defect_name": d["defect_name"],
                    "count": d["count"],
                    "qty": d["count"],  # alias
                    "percentage": d["ratio"],
                    "cumulative_percentage": d["cumulative_ratio"],
                }
                for d in pareto_data
            ],
            "summary": {
                "total_defects": sum(d["count"] for d in pareto_data),
                "defect_types": len(pareto_data),
            }
        }


# Singleton instance
mock_data = MockDataService()
