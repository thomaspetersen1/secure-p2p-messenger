# Secure P2P Messenger

A secure point-to-point instant messenger for two parties (Alice and Bob). The
two share a passphrase out-of-band and use it to encrypt every message — text,
image, voice note, or file — that crosses the network, with either **DES (56-bit)**
or **AES-128**. No server, no relay: the two backends talk directly.

Plaintext only ever exists inside a machine; everything on the wire is
ciphertext. See [docs/architecture.md](docs/architecture.md) for the full design.

## Requirements

- Python 3.11+

## Setup

```bash
python -m venv .venv
# Windows:  .venv\Scripts\activate
# macOS/Linux:  source .venv/bin/activate
pip install -r requirements.txt
cp config.example.toml config.toml   # then edit per machine
```

## Run

```bash
uvicorn app.main:app --host 0.0.0.0 --port 8000
```

Then open <http://localhost:8000> in a browser.

- **One machine (dev):** run the backend once and open two browser tabs; use
  `localhost` as the peer address.
- **Two machines:** run the backend on both, open `localhost:8000` on each, enter
  the same passphrase and cipher, and have one side enter the other's address
  (LAN IP like `192.168.x.x:8000`, or a Tailscale name like `machine-b:8000`).

Binding to `0.0.0.0` (not `127.0.0.1`) is required so the peer machine can reach
`/ws/peer`.

## Layout

```
app/    FastAPI backend — serves UI, /ws/ui (plaintext), /ws/peer (ciphertext), crypto
web/    static UI (HTML + CSS + vanilla JS, no build step)
docs/   architecture.md
demo/   screenshots for the report
```
