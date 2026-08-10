#!/usr/bin/env python3
from pathlib import Path
import struct
import zlib

OUT = Path("src-tauri/icons/icon.png")
W = H = 512

OUT.parent.mkdir(parents=True, exist_ok=True)

rows = []
for y in range(H):
    row = bytearray([0])
    for x in range(W):
        border = x < 18 or y < 18 or x >= W - 18 or y >= H - 18
        if border:
            rgba = (65, 200, 255, 255)
        else:
            rgba = (5, 11, 20, 255)
        row.extend(rgba)
    rows.append(bytes(row))

raw = b"".join(rows)

def chunk(kind: bytes, data: bytes) -> bytes:
    return (
        struct.pack(">I", len(data))
        + kind
        + data
        + struct.pack(">I", zlib.crc32(kind + data) & 0xFFFFFFFF)
    )

png = (
    b"\x89PNG\r\n\x1a\n"
    + chunk(b"IHDR", struct.pack(">IIBBBBB", W, H, 8, 6, 0, 0, 0))
    + chunk(b"IDAT", zlib.compress(raw, 9))
    + chunk(b"IEND", b"")
)
OUT.write_bytes(png)
print(f"Tauri icon ready: {OUT} ({W}x{H} RGBA)")
