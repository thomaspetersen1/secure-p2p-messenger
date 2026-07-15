"""Build and parse the JSON envelope that crosses /ws/peer (architecture.md §7).

Binary fields (iv, ciphertext, mac) are base64-encoded. `salt` is exchanged once
at handshake, not per message.
"""

from __future__ import annotations

from dataclasses import dataclass

ENVELOPE_VERSION = 1


@dataclass
class Envelope:
    """One message on the wire. `filename`/`mime` are None for plain text."""

    type: str  # "text" | "image" | "voice" | "file"
    cipher: str  # "DES" | "AES"
    keylen: int  # 56 | 128
    iv: bytes
    ciphertext: bytes
    mac: bytes
    ts: int
    filename: str | None = None
    mime: str | None = None
    v: int = ENVELOPE_VERSION


def build(env: Envelope) -> dict:
    """Serialize an Envelope to a JSON-ready dict with base64 binary fields."""
    raise NotImplementedError


def parse(data: dict) -> Envelope:
    """Validate and decode an inbound dict into an Envelope (base64 -> bytes)."""
    raise NotImplementedError
