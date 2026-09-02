#!/usr/bin/env python3
# -*- coding: utf-8 -*-
"""
生成暴富专属工作台 PWA 图标 (192 / 512 PNG)
紫色背景 #7C5CFC + 白色月牙 + 星星，纯标准库实现，无需 Pillow。
用法: python tools/gen_icon.py
"""
import struct
import zlib

BG = (124, 92, 252)
WHITE = (255, 255, 255)


def gen(W, out):
    img = bytearray(W * W * 4)
    for i in range(W * W):
        img[i * 4:i * 4 + 3] = bytes(BG)

    def setp(x, y, c):
        x = int(x); y = int(y)
        if 0 <= x < W and 0 <= y < W:
            i = (y * W + x) * 4
            img[i] = c[0]; img[i + 1] = c[1]; img[i + 2] = c[2]; img[i + 3] = 255

    def disc(cx, cy, r, c):
        for y in range(int(cy - r) - 1, int(cy + r) + 2):
            for x in range(int(cx - r) - 1, int(cx + r) + 2):
                if (x - cx) ** 2 + (y - cy) ** 2 <= r * r:
                    setp(x, y, c)

    s = W / 512.0
    cx, cy, r = 256 * s, 240 * s, 150 * s
    disc(cx, cy, r, WHITE)            # 白色满月
    disc(cx + 70 * s, cy - 30 * s, r, BG)  # 挖去一块成月牙
    for sx, sy, sr in [(380, 130, 14), (420, 180, 9), (360, 200, 7), (150, 150, 8)]:
        disc(sx * s, sy * s, sr * s, WHITE)  # 星星点缀

    raw = bytearray()
    for y in range(W):
        raw.append(0)
        raw.extend(img[y * W * 4:(y + 1) * W * 4])

    def chunk(typ, data):
        c = struct.pack('>I', len(data)) + typ + data
        c += struct.pack('>I', zlib.crc32(typ + data) & 0xffffffff)
        return c

    png = b'\x89PNG\r\n\x1a\n'
    png += chunk(b'IHDR', struct.pack('>IIBBBBB', W, W, 8, 6, 0, 0, 0))
    png += chunk(b'IDAT', zlib.compress(bytes(raw), 9))
    png += chunk(b'IEND', b'')
    with open(out, 'wb') as f:
        f.write(png)
    print('written', out, W, 'x', W)


if __name__ == '__main__':
    gen(192, 'icon-192.png')
    gen(512, 'icon-512.png')
