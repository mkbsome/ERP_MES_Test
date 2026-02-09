"""
WebSocket Connection Manager
"""
import asyncio
import json
from datetime import datetime
from typing import Dict, List, Set, Any, Optional
from uuid import UUID

from fastapi import WebSocket
from pydantic import BaseModel


class ConnectionManager:
    """
    Manages WebSocket connections and message broadcasting.
    Supports multiple channels for different data streams.
    """

    def __init__(self):
        # Connections by channel: {channel_name: {client_id: websocket}}
        self.active_connections: Dict[str, Dict[str, WebSocket]] = {}
        # Subscription tracking: {client_id: set of channels}
        self.subscriptions: Dict[str, Set[str]] = {}
        # Lock for thread safety
        self._lock = asyncio.Lock()

    async def connect(self, websocket: WebSocket, client_id: str, channels: List[str] = None):
        """Accept a new WebSocket connection and subscribe to channels"""
        await websocket.accept()

        async with self._lock:
            # Initialize subscription tracking
            self.subscriptions[client_id] = set()

            # Subscribe to channels
            channels = channels or ["default"]
            for channel in channels:
                if channel not in self.active_connections:
                    self.active_connections[channel] = {}
                self.active_connections[channel][client_id] = websocket
                self.subscriptions[client_id].add(channel)

    async def disconnect(self, client_id: str):
        """Remove a client from all channels"""
        async with self._lock:
            if client_id in self.subscriptions:
                # Remove from all subscribed channels
                for channel in self.subscriptions[client_id]:
                    if channel in self.active_connections:
                        self.active_connections[channel].pop(client_id, None)
                        # Clean up empty channels
                        if not self.active_connections[channel]:
                            del self.active_connections[channel]
                # Remove subscription tracking
                del self.subscriptions[client_id]

    async def subscribe(self, client_id: str, channel: str, websocket: WebSocket):
        """Subscribe a client to a specific channel"""
        async with self._lock:
            if channel not in self.active_connections:
                self.active_connections[channel] = {}
            self.active_connections[channel][client_id] = websocket

            if client_id not in self.subscriptions:
                self.subscriptions[client_id] = set()
            self.subscriptions[client_id].add(channel)

    async def unsubscribe(self, client_id: str, channel: str):
        """Unsubscribe a client from a specific channel"""
        async with self._lock:
            if channel in self.active_connections:
                self.active_connections[channel].pop(client_id, None)
                if not self.active_connections[channel]:
                    del self.active_connections[channel]

            if client_id in self.subscriptions:
                self.subscriptions[client_id].discard(channel)

    async def send_personal_message(self, message: Any, websocket: WebSocket):
        """Send a message to a specific connection"""
        if isinstance(message, dict):
            await websocket.send_json(message)
        elif isinstance(message, str):
            await websocket.send_text(message)
        else:
            await websocket.send_json({"data": str(message)})

    async def broadcast(self, channel: str, message: Any):
        """Broadcast a message to all clients in a channel"""
        if channel not in self.active_connections:
            return

        # Prepare message
        if isinstance(message, dict):
            data = message
        elif isinstance(message, BaseModel):
            data = message.model_dump(mode="json")
        else:
            data = {"data": str(message)}

        # Add metadata
        data["_channel"] = channel
        data["_timestamp"] = datetime.utcnow().isoformat()

        # Send to all connections in channel
        disconnected = []
        for client_id, websocket in self.active_connections[channel].items():
            try:
                await websocket.send_json(data)
            except Exception:
                disconnected.append(client_id)

        # Clean up disconnected clients
        for client_id in disconnected:
            await self.disconnect(client_id)

    async def broadcast_to_multiple(self, channels: List[str], message: Any):
        """Broadcast a message to multiple channels"""
        for channel in channels:
            await self.broadcast(channel, message)

    def get_channel_clients(self, channel: str) -> List[str]:
        """Get list of client IDs in a channel"""
        if channel in self.active_connections:
            return list(self.active_connections[channel].keys())
        return []

    def get_client_channels(self, client_id: str) -> Set[str]:
        """Get channels a client is subscribed to"""
        return self.subscriptions.get(client_id, set())

    def get_connection_count(self, channel: Optional[str] = None) -> int:
        """Get number of active connections"""
        if channel:
            return len(self.active_connections.get(channel, {}))
        return sum(len(conns) for conns in self.active_connections.values())


# Global connection manager instance
manager = ConnectionManager()
