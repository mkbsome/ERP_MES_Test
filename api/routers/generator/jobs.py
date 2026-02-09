"""
Generator Jobs API
Endpoints for managing data generation jobs
"""
import uuid
import asyncio
from datetime import datetime
from typing import Dict, List
from fastapi import APIRouter, HTTPException, BackgroundTasks
from api.schemas.generator import (
    GeneratorJobCreate,
    GeneratorJobResponse,
    GeneratorProgress,
    GeneratorSummary,
    ModuleSummary,
    JobStatus,
    RecordCounts,
    MESRecordCounts,
    ERPRecordCounts,
    ApiResponse
)
from api.routers.generator.websocket import (
    send_progress_update,
    send_log_message,
    send_job_started,
    send_job_completed,
    send_job_failed
)

router = APIRouter()

# In-memory job storage
JOBS: Dict[str, dict] = {}


def create_job(config: GeneratorJobCreate) -> dict:
    """Create a new generator job"""
    job_id = str(uuid.uuid4())[:8]
    job = {
        "id": job_id,
        "status": JobStatus.PENDING,
        "config": config.model_dump(),
        "progress": GeneratorProgress().model_dump(),
        "created_at": datetime.now(),
        "started_at": None,
        "completed_at": None,
        "error_message": None
    }
    JOBS[job_id] = job
    return job


async def run_generation(job_id: str):
    """Background task to run data generation with WebSocket updates"""
    job = JOBS.get(job_id)
    if not job:
        return

    job["status"] = JobStatus.RUNNING
    job["started_at"] = datetime.now()

    # Send job started notification via WebSocket
    await send_job_started(job_id, {
        "job_id": job_id,
        "config": job["config"],
        "started_at": job["started_at"].isoformat()
    })
    await send_log_message(job_id, "info", f"데이터 생성 작업 시작 (Job ID: {job_id})")

    try:
        config = job["config"]
        start_date = datetime.strptime(config["start_date"], "%Y-%m-%d")
        end_date = datetime.strptime(config["end_date"], "%Y-%m-%d")
        total_days = (end_date - start_date).days + 1

        await send_log_message(job_id, "info", f"기간: {config['start_date']} ~ {config['end_date']} ({total_days}일)")

        for day in range(1, total_days + 1):
            # Check if cancelled
            if job["status"] == JobStatus.CANCELLED:
                await send_log_message(job_id, "warning", "작업이 사용자에 의해 취소되었습니다.")
                break

            current_date = start_date.replace(day=start_date.day + day - 1)
            current_module = "MES" if day % 2 == 0 else "ERP"

            # Simulate data generation
            await asyncio.sleep(0.05)  # Small delay for simulation

            # Update progress
            progress_data = {
                "current_day": day,
                "total_days": total_days,
                "current_date": current_date.strftime("%Y-%m-%d"),
                "percentage": (day / total_days) * 100,
                "current_module": current_module,
                "records_generated": {
                    "mes": {
                        "production_orders": day * 80,
                        "production_results": day * 2400,
                        "equipment_status": day * 140,
                        "quality_inspections": day * 650,
                        "defect_records": day * 100,
                        "material_consumption": day * 430
                    },
                    "erp": {
                        "sales_orders": day * 45,
                        "purchase_orders": day * 30,
                        "inventory_transactions": day * 190,
                        "journal_entries": day * 245,
                        "attendance_records": day * 350
                    }
                }
            }
            job["progress"] = progress_data

            # Send progress update via WebSocket
            await send_progress_update(job_id, progress_data)

            # Log milestone messages
            if day == 1:
                await send_log_message(job_id, "info", f"첫 번째 날 데이터 생성 시작: {current_date.strftime('%Y-%m-%d')}")
            elif day % 30 == 0:
                await send_log_message(job_id, "info", f"{day}일 처리 완료 ({progress_data['percentage']:.1f}%)")
            elif day == total_days:
                await send_log_message(job_id, "success", f"마지막 날 데이터 생성 완료: {current_date.strftime('%Y-%m-%d')}")

        if job["status"] != JobStatus.CANCELLED:
            job["status"] = JobStatus.COMPLETED
            job["completed_at"] = datetime.now()

            # Calculate summary
            progress = job["progress"]
            mes_records = progress["records_generated"]["mes"]
            erp_records = progress["records_generated"]["erp"]
            total_records = sum(mes_records.values()) + sum(erp_records.values())
            duration = (job["completed_at"] - job["started_at"]).total_seconds()

            # Send completion notification
            await send_job_completed(job_id, {
                "job_id": job_id,
                "total_records": total_records,
                "duration_seconds": duration,
                "completed_at": job["completed_at"].isoformat()
            })
            await send_log_message(job_id, "success", f"데이터 생성 완료! 총 {total_records:,}건 생성 ({duration:.1f}초 소요)")

    except Exception as e:
        job["status"] = JobStatus.FAILED
        job["error_message"] = str(e)
        await send_job_failed(job_id, str(e))
        await send_log_message(job_id, "error", f"데이터 생성 실패: {str(e)}")


@router.post("/jobs", response_model=ApiResponse)
async def create_generation_job(
    config: GeneratorJobCreate,
    background_tasks: BackgroundTasks
):
    """Create and start a new data generation job"""
    job = create_job(config)
    background_tasks.add_task(run_generation, job["id"])
    return ApiResponse(success=True, data=job)


@router.get("/jobs", response_model=ApiResponse)
async def get_jobs():
    """Get all jobs"""
    jobs = list(JOBS.values())
    # Sort by created_at descending
    jobs.sort(key=lambda x: x["created_at"], reverse=True)
    return ApiResponse(success=True, data=jobs)


@router.get("/jobs/{job_id}", response_model=ApiResponse)
async def get_job(job_id: str):
    """Get a specific job by ID"""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")
    return ApiResponse(success=True, data=job)


@router.post("/jobs/{job_id}/cancel", response_model=ApiResponse)
async def cancel_job(job_id: str):
    """Cancel a running job"""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    if job["status"] != JobStatus.RUNNING:
        raise HTTPException(status_code=400, detail="Job is not running")

    job["status"] = JobStatus.CANCELLED
    return ApiResponse(success=True, data=job)


@router.delete("/jobs/{job_id}", response_model=ApiResponse)
async def delete_job(job_id: str):
    """Delete a job"""
    if job_id not in JOBS:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    del JOBS[job_id]
    return ApiResponse(success=True)


@router.get("/jobs/{job_id}/summary", response_model=ApiResponse)
async def get_job_summary(job_id: str):
    """Get summary of a completed job"""
    job = JOBS.get(job_id)
    if not job:
        raise HTTPException(status_code=404, detail=f"Job {job_id} not found")

    if job["status"] != JobStatus.COMPLETED:
        raise HTTPException(status_code=400, detail="Job is not completed")

    progress = job["progress"]
    mes_records = progress["records_generated"]["mes"]
    erp_records = progress["records_generated"]["erp"]

    summary = GeneratorSummary(
        mes={
            "production": ModuleSummary(
                total_records=mes_records["production_orders"] + mes_records["production_results"],
                tables={
                    "production_orders": mes_records["production_orders"],
                    "production_results": mes_records["production_results"]
                }
            ),
            "equipment": ModuleSummary(
                total_records=mes_records["equipment_status"],
                tables={"equipment_status": mes_records["equipment_status"]}
            ),
            "quality": ModuleSummary(
                total_records=mes_records["quality_inspections"] + mes_records["defect_records"],
                tables={
                    "quality_inspections": mes_records["quality_inspections"],
                    "defect_records": mes_records["defect_records"]
                }
            ),
            "material": ModuleSummary(
                total_records=mes_records["material_consumption"],
                tables={"material_consumption": mes_records["material_consumption"]}
            )
        },
        erp={
            "sales": ModuleSummary(
                total_records=erp_records["sales_orders"],
                tables={"sales_orders": erp_records["sales_orders"]}
            ),
            "purchase": ModuleSummary(
                total_records=erp_records["purchase_orders"],
                tables={"purchase_orders": erp_records["purchase_orders"]}
            ),
            "inventory": ModuleSummary(
                total_records=erp_records["inventory_transactions"],
                tables={"inventory_transactions": erp_records["inventory_transactions"]}
            ),
            "accounting": ModuleSummary(
                total_records=erp_records["journal_entries"],
                tables={"journal_entries": erp_records["journal_entries"]}
            ),
            "hr": ModuleSummary(
                total_records=erp_records["attendance_records"],
                tables={"attendance_records": erp_records["attendance_records"]}
            )
        },
        total_records=sum(mes_records.values()) + sum(erp_records.values()),
        duration_seconds=(job["completed_at"] - job["started_at"]).total_seconds() if job["completed_at"] else 0
    )

    return ApiResponse(success=True, data=summary.model_dump())
