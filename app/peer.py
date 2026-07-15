"""Outbound WebSocket client to the peer's /ws/peer (architecture.md §3.2, §9).

The initiator dials the peer, sends the handshake (salt, cipher, keylen), then
streams ciphertext envelopes. The application is symmetric — the only difference
between the two machines is which side dials.
"""

from __future__ import annotations


async def dial(address: str) -> "PeerLink":
    """Open a WebSocket to ws://{address}/ws/peer and return a PeerLink.

    `address` is host:port, e.g. "192.168.1.42:8000" or "machine-b:8000".
    """
    raise NotImplementedError


class PeerLink:
    """Wraps the live peer WebSocket: send/receive envelope dicts."""

    async def send(self, envelope: dict) -> None:
        raise NotImplementedError

    async def receive(self) -> dict:
        raise NotImplementedError

    async def close(self) -> None:
        raise NotImplementedError
