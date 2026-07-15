"""Secure P2P Messenger backend package.

One FastAPI instance runs per machine. It serves the static UI, exposes the
localhost UI socket (plaintext) and the peer socket (ciphertext), and owns all
cryptography. See docs/architecture.md.
"""
