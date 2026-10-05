// Generates PWA icons using pure Node.js
import fs from 'fs';
import path from 'path';
import zlib from 'zlib';
import { fileURLToPath } from 'url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));

function createPNG(width, height, colorRGB) {
  const signature = Buffer.from([137, 80, 78, 71, 13, 10, 26, 10]);

  const ihdrData = Buffer.alloc(13);
  ihdrData.writeUInt32BE(width, 0);
  ihdrData.writeUInt32BE(height, 4);
  ihdrData[8] = 8;
  ihdrData[9] = 2;
  ihdrData[10] = 0;
  ihdrData[11] = 0;
  ihdrData[12] = 0;
  const ihdrChunk = makeChunk('IHDR', ihdrData);

  const rowSize = 1 + width * 3;
  const rawData = Buffer.alloc(height * rowSize);

  const [r, g, b] = colorRGB;
  const cx = width / 2;
  const cy = height / 2;
  const radius = width * 0.42;

  for (let y = 0; y < height; y++) {
    const rowOffset = y * rowSize;
    rawData[rowOffset] = 0;
    for (let x = 0; x < width; x++) {
      const pixelOffset = rowOffset + 1 + x * 3;
      const dx = x - cx;
      const dy = y - cy;
      const dist = Math.sqrt(dx * dx + dy * dy);

      const gradRatio = (x + y) / (width + height);
      if (dist < radius) {
        rawData[pixelOffset] = Math.min(255, Math.floor(108 + gradRatio * 80));
        rawData[pixelOffset + 1] = Math.min(255, Math.floor(99 + gradRatio * 60));
        rawData[pixelOffset + 2] = Math.min(255, Math.floor(255));
      } else {
        rawData[pixelOffset] = r;
        rawData[pixelOffset + 1] = g;
        rawData[pixelOffset + 2] = b;
      }
    }
  }

  const compressedData = zlib.deflateSync(rawData);
  const idatChunk = makeChunk('IDAT', compressedData);
  const iendChunk = makeChunk('IEND', Buffer.alloc(0));

  return Buffer.concat([signature, ihdrChunk, idatChunk, iendChunk]);
}

function makeChunk(type, data) {
  const len = data.length;
  const buf = Buffer.alloc(8 + len + 4);
  buf.writeUInt32BE(len, 0);
  buf.write(type, 4, 4, 'ascii');
  data.copy(buf, 8);
  const crc = crc32(buf.subarray(4, 8 + len));
  buf.writeInt32BE(crc, 8 + len);
  return buf;
}

const crcTable = [];
for (let n = 0; n < 256; n++) {
  let c = n;
  for (let k = 0; k < 8; k++) {
    c = (c & 1) ? (0xedb88320 ^ (c >>> 1)) : (c >>> 1);
  }
  crcTable[n] = c;
}

function crc32(buf) {
  let crc = -1;
  for (let i = 0; i < buf.length; i++) {
    crc = (crc >>> 8) ^ crcTable[(crc ^ buf[i]) & 0xff];
  }
  return (crc ^ -1) | 0;
}

const outDir = path.resolve(__dirname, '..', 'public');
if (!fs.existsSync(outDir)) {
  fs.mkdirSync(outDir, { recursive: true });
}

if (fs.existsSync(path.join(outDir, 'app-icon.png'))) {
  try {
    const { execSync } = await import('child_process');
    execSync(`powershell -ExecutionPolicy Bypass -File "${path.join(__dirname, 'resize-icons.ps1')}"`, { stdio: 'inherit' });
    console.log('Icons generated from app-icon.png successfully in', outDir);
    process.exit(0);
  } catch (e) {
    console.warn('Could not run resize-icons.ps1, falling back to procedural generator:', e.message);
  }
}

fs.writeFileSync(path.join(outDir, 'pwa-192x192.png'), createPNG(192, 192, [14, 19, 38]));
fs.writeFileSync(path.join(outDir, 'pwa-512x512.png'), createPNG(512, 512, [14, 19, 38]));
fs.writeFileSync(path.join(outDir, 'apple-touch-icon.png'), createPNG(180, 180, [14, 19, 38]));
fs.writeFileSync(path.join(outDir, 'favicon.ico'), createPNG(64, 64, [14, 19, 38]));

console.log('PWA icons generated successfully in', outDir);
