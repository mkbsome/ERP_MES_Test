"""
WebSocket Route Handlers
"""
import asyncio
import json
from datetime import datetime
from typing import Optional
from uuid import uuid4

from fastapi import APIRouter, WebSocket, WebSocketDisconnect, Query

from api.websocket.manager import manager


router = APIRouter(tags=["WebSocket"])


# ==================== Production Channel ====================

@router.websocket("/ws/production")
async def websocket_production(
    websocket: WebSocket,
    line_code: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for real-time production data.

    Subscribe to production updates for all lines or a specific line.

    Message Types:
    - production_update: New production data
    - order_status: Order status changes
    - line_status: Line status changes
    """
    client_id = str(uuid4())
    channel = f"production:{line_code}" if line_code else "production:all"

    await manager.connect(websocket, client_id, [channel, "production:all"])

    # Send initial connection confirmation
    await manager.send_personal_message({
        "type": "connected",
        "client_id": client_id,
        "channel": channel,
        "timestamp": datetime.utcnow().isoformat(),
    }, websocket)

    try:
        while True:
            # Wait for messages from client
            data = await websocket.receive_json()

            # Handle client commands
            if data.get("type") == "subscribe":
                new_channel = f"production:{data.get('line_code', 'all')}"
                await manager.subscribe(client_id, new_channel, websocket)
                await manager.send_personal_message({
                    "type": "subscribed",
                    "channel": new_channel,
                }, websocket)

            elif data.get("type") == "unsubscribe":
                old_channel = f"production:{data.get('line_code', 'all')}"
                await manager.unsubscribe(client_id, old_channel)
                await manager.send_personal_message({
                    "type": "unsubscribed",
                    "channel": old_channel,
                }, websocket)

            elif data.get("type") == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat(),
                }, websocket)

    except WebSocketDisconnect:
        await manager.disconnect(client_id)


# ==================== Equipment Channel ====================

@router.websocket("/ws/equipment")
async def websocket_equipment(
    websocket: WebSocket,
    line_code: Optional[str] = Query(None),
    equipment_code: Optional[str] = Query(None),
):
    """
    WebSocket endpoint for real-time equipment status.

    Subscribe to equipment updates for all equipment, a specific line, or specific equipment.

    Message Types:
    - status_change: Equipment status changed
    - alarm: New alarm triggered
    - oee_update: OEE metrics updated
    """
    client_id = str(uuid4())

    # Determine channel
    if equipment_code:
        channel = f"equipment:{equipment_code}"
    elif line_code:
        channel = f"equipment:line:{line_code}"
    else:
        channel = "equipment:all"

    await manager.connect(websocket, client_id, [channel, "equipment:all"])

    await manager.send_personal_message({
        "type": "connected",
        "client_id": client_id,
        "channel": channel,
        "timestamp": datetime.utcnow().isoformat(),
    }, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "subscribe":
                if data.get("equipment_code"):
                    new_channel = f"equipment:{data['equipment_code']}"
                elif data.get("line_code"):
                    new_channel = f"equipment:line:{data['line_code']}"
                else:
                    new_channel = "equipment:all"

                await manager.subscribe(client_id, new_channel, websocket)
                await manager.send_personal_message({
                    "type": "subscribed",
                    "channel": new_channel,
                }, websocket)

            elif data.get("type") == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat(),
                }, websocket)

    except WebSocketDisconnect:
        await manager.disconnect(client_id)


# ==================== Alerts Channel ====================

@router.websocket("/ws/alerts")
async def websocket_alerts(
    websocket: WebSocket,
    severity: Optional[str] = Query(None),  # critical, warning, info
):
    """
    WebSocket endpoint for real-time alerts and notifications.

    Subscribe to alerts by severity level.

    Message Types:
    - alarm: Equipment alarm
    - quality_alert: Quality issue detected
    - downtime_alert: Downtime started/ended
    - system_alert: System notification
    """
    client_id = str(uuid4())

    # Channels based on severity
    channels = ["alerts:all"]
    if severity:
        channels.append(f"alerts:{severity}")
    else:
        channels.extend(["alerts:critical", "alerts:warning", "alerts:info"])

    await manager.connect(websocket, client_id, channels)

    await manager.send_personal_message({
        "type": "connected",
        "client_id": client_id,
        "channels": channels,
        "timestamp": datetime.utcnow().isoformat(),
    }, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "acknowledge":
                # Handle alert acknowledgment
                alert_id = data.get("alert_id")
                await manager.send_personal_message({
                    "type": "acknowledged",
                    "alert_id": alert_id,
                    "timestamp": datetime.utcnow().isoformat(),
                }, websocket)

            elif data.get("type") == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat(),
                }, websocket)

    except WebSocketDisconnect:
        await manager.disconnect(client_id)


# ==================== Dashboard Channel ====================

@router.websocket("/ws/dashboard")
async def websocket_dashboard(websocket: WebSocket):
    """
    WebSocket endpoint for dashboard data aggregation.

    Receives consolidated updates for dashboard display.

    Message Types:
    - kpi_update: KPI metrics updated
    - production_summary: Production summary updated
    - equipment_summary: Equipment status summary
    - quality_summary: Quality metrics updated
    """
    client_id = str(uuid4())

    # Subscribe to all relevant channels
    channels = [
        "dashboard:kpi",
        "dashboard:production",
        "dashboard:equipment",
        "dashboard:quality",
        "alerts:critical",
    ]

    await manager.connect(websocket, client_id, channels)

    await manager.send_personal_message({
        "type": "connected",
        "client_id": client_id,
        "channels": channels,
        "timestamp": datetime.utcnow().isoformat(),
    }, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat(),
                }, websocket)

            elif data.get("type") == "refresh":
                # Client requesting data refresh
                await manager.send_personal_message({
                    "type": "refresh_ack",
                    "timestamp": datetime.utcnow().isoformat(),
                }, websocket)

    except WebSocketDisconnect:
        await manager.disconnect(client_id)


# ==================== Utility Functions ====================

async def broadcast_production_update(line_code: str, data: dict):
    """Broadcast production update to relevant channels"""
    channels = [
        f"production:{line_code}",
        "production:all",
        "dashboard:production",
    ]
    for channel in channels:
        await manager.broadcast(channel, {
            "type": "production_update",
            "line_code": line_code,
            **data,
        })


async def broadcast_equipment_status(equipment_code: str, line_code: str, data: dict):
    """Broadcast equipment status change"""
    channels = [
        f"equipment:{equipment_code}",
        f"equipment:line:{line_code}",
        "equipment:all",
        "dashboard:equipment",
    ]
    for channel in channels:
        await manager.broadcast(channel, {
            "type": "status_change",
            "equipment_code": equipment_code,
            "line_code": line_code,
            **data,
        })


async def broadcast_alarm(equipment_code: str, severity: str, data: dict):
    """Broadcast equipment alarm"""
    channels = [
        f"equipment:{equipment_code}",
        "alerts:all",
        f"alerts:{severity}",
    ]
    for channel in channels:
        await manager.broadcast(channel, {
            "type": "alarm",
            "equipment_code": equipment_code,
            "severity": severity,
            **data,
        })


async def broadcast_quality_alert(line_code: str, data: dict):
    """Broadcast quality alert"""
    channels = [
        "alerts:all",
        "alerts:warning",
        "dashboard:quality",
    ]
    for channel in channels:
        await manager.broadcast(channel, {
            "type": "quality_alert",
            "line_code": line_code,
            **data,
        })


async def broadcast_kpi_update(data: dict):
    """Broadcast KPI update to dashboard"""
    await manager.broadcast("dashboard:kpi", {
        "type": "kpi_update",
        **data,
    })


# ==================== ERP Channels ====================

@router.websocket("/ws/erp/sales")
async def websocket_erp_sales(websocket: WebSocket):
    """
    WebSocket endpoint for ERP sales real-time updates.

    Message Types:
    - order_created: New sales order created
    - order_approved: Sales order approved
    - shipment_created: Shipment created
    - revenue_updated: Revenue data updated
    """
    client_id = str(uuid4())
    channels = ["erp:sales", "erp:all"]

    await manager.connect(websocket, client_id, channels)

    await manager.send_personal_message({
        "type": "connected",
        "client_id": client_id,
        "channels": channels,
        "timestamp": datetime.utcnow().isoformat(),
    }, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat(),
                }, websocket)

    except WebSocketDisconnect:
        await manager.disconnect(client_id)


@router.websocket("/ws/erp/inventory")
async def websocket_erp_inventory(websocket: WebSocket):
    """
    WebSocket endpoint for ERP inventory real-time updates.

    Message Types:
    - stock_updated: Stock level changed
    - below_safety_alert: Stock below safety level
    - out_of_stock_alert: Item out of stock
    - transaction_created: New inventory transaction
    """
    client_id = str(uuid4())
    channels = ["erp:inventory", "erp:all"]

    await manager.connect(websocket, client_id, channels)

    await manager.send_personal_message({
        "type": "connected",
        "client_id": client_id,
        "channels": channels,
        "timestamp": datetime.utcnow().isoformat(),
    }, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat(),
                }, websocket)

    except WebSocketDisconnect:
        await manager.disconnect(client_id)


@router.websocket("/ws/erp/purchase")
async def websocket_erp_purchase(websocket: WebSocket):
    """
    WebSocket endpoint for ERP purchase real-time updates.

    Message Types:
    - order_created: New purchase order created
    - receipt_completed: Goods receipt completed
    - invoice_received: Purchase invoice received
    """
    client_id = str(uuid4())
    channels = ["erp:purchase", "erp:all"]

    await manager.connect(websocket, client_id, channels)

    await manager.send_personal_message({
        "type": "connected",
        "client_id": client_id,
        "channels": channels,
        "timestamp": datetime.utcnow().isoformat(),
    }, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat(),
                }, websocket)

    except WebSocketDisconnect:
        await manager.disconnect(client_id)


@router.websocket("/ws/erp/alerts")
async def websocket_erp_alerts(websocket: WebSocket):
    """
    WebSocket endpoint for ERP alerts and notifications.

    Message Types:
    - new_alert: New alert notification
    - acknowledged: Alert acknowledged
    """
    client_id = str(uuid4())
    channels = ["erp:alerts", "erp:all"]

    await manager.connect(websocket, client_id, channels)

    await manager.send_personal_message({
        "type": "connected",
        "client_id": client_id,
        "channels": channels,
        "timestamp": datetime.utcnow().isoformat(),
    }, websocket)

    try:
        while True:
            data = await websocket.receive_json()

            if data.get("type") == "acknowledge":
                alert_id = data.get("alert_id")
                await manager.send_personal_message({
                    "type": "acknowledged",
                    "alert_id": alert_id,
                    "timestamp": datetime.utcnow().isoformat(),
                }, websocket)

            elif data.get("type") == "ping":
                await manager.send_personal_message({
                    "type": "pong",
                    "timestamp": datetime.utcnow().isoformat(),
                }, websocket)

    except WebSocketDisconnect:
        await manager.disconnect(client_id)


# ==================== ERP Broadcast Functions ====================

async def broadcast_erp_sales_update(event_type: str, data: dict):
    """Broadcast ERP sales update"""
    channels = ["erp:sales", "erp:all", "dashboard:kpi"]
    for channel in channels:
        await manager.broadcast(channel, {
            "type": event_type,
            **data,
        })


async def broadcast_erp_inventory_update(event_type: str, data: dict):
    """Broadcast ERP inventory update"""
    channels = ["erp:inventory", "erp:all"]
    for channel in channels:
        await manager.broadcast(channel, {
            "type": event_type,
            **data,
        })


async def broadcast_erp_inventory_alert(alert_type: str, data: dict):
    """Broadcast ERP inventory alert"""
    channels = ["erp:inventory", "erp:alerts", "erp:all"]
    for channel in channels:
        await manager.broadcast(channel, {
            "type": alert_type,
            **data,
        })


async def broadcast_erp_purchase_update(event_type: str, data: dict):
    """Broadcast ERP purchase update"""
    channels = ["erp:purchase", "erp:all"]
    for channel in channels:
        await manager.broadcast(channel, {
            "type": event_type,
            **data,
        })


async def broadcast_erp_alert(data: dict):
    """Broadcast ERP alert notification"""
    channels = ["erp:alerts", "erp:all"]
    for channel in channels:
        await manager.broadcast(channel, {
            "type": "new_alert",
            **data,
        })
