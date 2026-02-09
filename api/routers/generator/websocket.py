"""
Generator WebSocket API
Real-time progress updates for data generation
"""
import asyncio
import json
from datetime import datetime
from typing import Dict, Set, Any
from fastapi import APIRouter, WebSocket, WebSocketDisconnect
from api.schemas.generator import WSMessageType

router = APIRouter()


class ConnectionManager:
    """WebSocket connection manager for generator progress"""

    def __init__(self):
        # job_id -> set of websocket connections
        self.active_connections: Dict[str, Set[WebSocket]] = {}
        # All connections (for broadcast)
        self.all_connections: Set[WebSocket] = set()

    async def connect(self, websocket: WebSocket, job_id: str = None):
        """Accept and register a WebSocket connection"""
        await websocket.accept()
        self.all_connections.add(websocket)

        if job_id:
            if job_id not in self.active_connections:
                self.active_connections[job_id] = set()
            self.active_connections[job_id].add(websocket)

    def disconnect(self, websocket: WebSocket, job_id: str = None):
        """Remove a WebSocket connection"""
        self.all_connections.discard(websocket)

        if job_id and job_id in self.active_connections:
            self.active_connections[job_id].discard(websocket)
            if not self.active_connections[job_id]:
                del self.active_connections[job_id]

    async def send_to_job(self, job_id: str, message: Dict[str, Any]):
        """Send message to all connections watching a specific job"""
        if job_id in self.active_connections:
            disconnected = set()
            for connection in self.active_connections[job_id]:
                try:
                    await connection.send_json(message)
                except Exception:
                    disconnected.add(connection)

            # Clean up disconnected
            for conn in disconnected:
                self.disconnect(conn, job_id)

    async def broadcast(self, message: Dict[str, Any]):
        """Broadcast message to all connections"""
        disconnected = set()
        for connection in self.all_connections:
            try:
                await connection.send_json(message)
            except Exception:
                disconnected.add(connection)

        # Clean up disconnected
        for conn in disconnected:
            self.all_connections.discard(conn)


# Global connection manager
manager = ConnectionManager()


@router.websocket("/ws/generator")
async def websocket_endpoint(websocket: WebSocket):
    """Main WebSocket endpoint for generator updates"""
    await manager.connect(websocket)

    try:
        # Send initial connection message
        await websocket.send_json({
            "type": WSMessageType.CONNECTED,
            "data": {
                "message": "Connected to generator WebSocket",
                "timestamp": datetime.now().isoformat()
            }
        })

        while True:
            # Receive messages from client
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                msg_type = message.get("type")

                if msg_type == "subscribe":
                    # Subscribe to job updates
                    job_id = message.get("job_id")
                    if job_id:
                        if job_id not in manager.active_connections:
                            manager.active_connections[job_id] = set()
                        manager.active_connections[job_id].add(websocket)
                        await websocket.send_json({
                            "type": "subscribed",
                            "data": {"job_id": job_id}
                        })

                elif msg_type == "unsubscribe":
                    # Unsubscribe from job updates
                    job_id = message.get("job_id")
                    if job_id and job_id in manager.active_connections:
                        manager.active_connections[job_id].discard(websocket)
                        await websocket.send_json({
                            "type": "unsubscribed",
                            "data": {"job_id": job_id}
                        })

                elif msg_type == "ping":
                    # Heartbeat
                    await websocket.send_json({
                        "type": "pong",
                        "data": {"timestamp": datetime.now().isoformat()}
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "data": {"message": "Invalid JSON"}
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket)


@router.websocket("/ws/generator/{job_id}")
async def websocket_job_endpoint(websocket: WebSocket, job_id: str):
    """WebSocket endpoint for specific job updates"""
    await manager.connect(websocket, job_id)

    try:
        # Send initial connection message
        await websocket.send_json({
            "type": WSMessageType.CONNECTED,
            "data": {
                "message": f"Connected to job {job_id}",
                "job_id": job_id,
                "timestamp": datetime.now().isoformat()
            }
        })

        while True:
            # Keep connection alive and handle messages
            data = await websocket.receive_text()

            try:
                message = json.loads(data)
                msg_type = message.get("type")

                if msg_type == "ping":
                    await websocket.send_json({
                        "type": "pong",
                        "data": {"timestamp": datetime.now().isoformat()}
                    })

            except json.JSONDecodeError:
                await websocket.send_json({
                    "type": "error",
                    "data": {"message": "Invalid JSON"}
                })

    except WebSocketDisconnect:
        manager.disconnect(websocket, job_id)


# Helper functions for sending progress updates
async def send_progress_update(job_id: str, progress: Dict[str, Any]):
    """Send progress update to all subscribers of a job"""
    await manager.send_to_job(job_id, {
        "type": WSMessageType.PROGRESS,
        "data": progress,
        "timestamp": datetime.now().isoformat()
    })


async def send_log_message(job_id: str, level: str, message: str):
    """Send log message to all subscribers of a job"""
    await manager.send_to_job(job_id, {
        "type": WSMessageType.LOG,
        "data": {
            "level": level,
            "message": message,
            "timestamp": datetime.now().isoformat()
        }
    })


async def send_job_started(job_id: str, job_data: Dict[str, Any]):
    """Send job started notification"""
    await manager.send_to_job(job_id, {
        "type": WSMessageType.STARTED,
        "data": job_data,
        "timestamp": datetime.now().isoformat()
    })


async def send_job_completed(job_id: str, summary: Dict[str, Any]):
    """Send job completed notification"""
    await manager.send_to_job(job_id, {
        "type": WSMessageType.COMPLETED,
        "data": summary,
        "timestamp": datetime.now().isoformat()
    })


async def send_job_failed(job_id: str, error: str):
    """Send job failed notification"""
    await manager.send_to_job(job_id, {
        "type": WSMessageType.ERROR,
        "data": {"error": error},
        "timestamp": datetime.now().isoformat()
    })


async def broadcast_system_message(message: str):
    """Broadcast system message to all connected clients"""
    await manager.broadcast({
        "type": "system",
        "data": {"message": message},
        "timestamp": datetime.now().isoformat()
    })
