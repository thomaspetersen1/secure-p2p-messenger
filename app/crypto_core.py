"""Cryptographic core: PBKDF2 key derivation, DES/AES-CBC, PKCS#7, HMAC.

This module is the focus of the security analysis (architecture.md §5). It holds
no network or FastAPI concerns — pure bytes in, bytes out — so it can be unit
tested and reasoned about in isolation.

Reference:
    from Crypto.Cipher import DES, AES
    from Crypto.Protocol.KDF import PBKDF2
    from Crypto.Hash import SHA256, HMAC
    from Crypto.Util.Padding import pad, unpad
    from Crypto.Random import get_random_bytes
"""

from __future__ import annotations

from dataclasses import dataclass

# Cipher parameters, keyed by the required key length n (architecture.md §5.1).
# enc_len + mac_len == dk_len; block_size is the CBC block/IV size.
CIPHERS: dict[int, dict] = {
    56: {"name": "DES", "enc_len": 8, "mac_len": 32, "block_size": 8},
    128: {"name": "AES", "enc_len": 16, "mac_len": 32, "block_size": 16},
}


@dataclass(frozen=True)
class SessionKey:
    """Derived key material for one session."""

    enc_key: bytes
    mac_key: bytes
    keylen: int  # 56 or 128
    cipher: str  # "DES" or "AES"

    @property
    def fingerprint(self) -> str:
        """Short hex fingerprint so both sides can confirm matching passphrases.

        e.g. HMAC(mac_key, b"fingerprint")[:4] as hex — architecture.md §5.5.
        """
        raise NotImplementedError


def derive_key(passphrase: str, salt: bytes, keylen: int, iterations: int) -> SessionKey:
    """Run PBKDF2-SHA256 and split the output into enc + MAC keys.

    Both sides derive the same key from shared passphrase + salt + iterations.
    Never use the passphrase directly as the key.
    """
    raise NotImplementedError


def encrypt(session: SessionKey, plaintext: bytes) -> tuple[bytes, bytes, bytes]:
    """Encrypt-then-MAC. Returns (iv, ciphertext, mac).

    Fresh random IV per message; PKCS#7 pad; CBC encrypt; HMAC over IV||ciphertext.
    """
    raise NotImplementedError


def decrypt(session: SessionKey, iv: bytes, ciphertext: bytes, mac: bytes) -> bytes:
    """Verify the MAC (constant-time) BEFORE decrypting, then CBC-decrypt + unpad.

    Raises on MAC failure — a tampered message must never reach decryption output.
    """
    raise NotImplementedError
