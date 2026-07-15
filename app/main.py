"""FastAPI application entrypoint (architecture.md §3.2, §9).

    uvicorn app.main:app --host 0.0.0.0 --port 8000

Responsibilities (yours to implement):
  - GET /            -> serve web/index.html
  - WS  /ws/ui       -> own browser, localhost, PLAINTEXT
  - WS  /ws/peer     -> other machine's backend, CIPHERTEXT
  - dial the peer's /ws/peer when this machine initiates

Wiring available to you:
  - app.crypto_core : derive_key, encrypt, decrypt, SessionKey, CIPHERS
  - app.envelope    : Envelope, build, parse
  - app.peer        : dial, PeerLink
"""

from __future__ import annotations

from pathlib import Path

from fastapi import FastAPI
from fastapi.staticfiles import StaticFiles

WEB_DIR = Path(__file__).resolve().parent.parent / "web"

app = FastAPI(title="Secure P2P Messenger")


@app.get("/health")
def health() -> dict:
    return {"status": "ok"}


# TODO: GET /  -> serve web/index.html
# TODO: WS /ws/ui   (localhost, plaintext)
# TODO: WS /ws/peer (peer machine, ciphertext)

# Serve the static UI assets (index.html wiring is yours, above).
app.mount("/", StaticFiles(directory=WEB_DIR, html=True), name="web")
