// Genera las curvas de nivel reales del valle a partir de tiles públicos de elevación
// (AWS Open Data, formato "terrarium", zoom 11). Correr con: npm run terrain
import fs from 'node:fs';
import path from 'node:path';
import { PNG } from 'pngjs';
import { contours } from 'd3-contour';
import sharp from 'sharp';

const Z = 11;
const XS = [656, 657, 658, 659];
const YS = [1216, 1217];
const T = 256;
// Huellas en la Aldea, dentro de Rucalhue Aldea Serrana (plus code VMH9+87Q, Las Bajadas)
const PLACE = { lat: -32.12166, lon: -64.33176 };

const W = XS.length * T;
const H = YS.length * T;
const elev = new Float32Array(W * H);

for (const [ix, x] of XS.entries()) {
  for (const [iy, y] of YS.entries()) {
    const png = PNG.sync.read(fs.readFileSync(`scripts/tiles/${Z}_${x}_${y}.png`));
    for (let py = 0; py < T; py++) {
      for (let px = 0; px < T; px++) {
        const i = (py * T + px) * 4;
        const e = png.data[i] * 256 + png.data[i + 1] + png.data[i + 2] / 256 - 32768;
        elev[(iy * T + py) * W + ix * T + px] = e;
      }
    }
  }
}

// Mercator -> píxel global del mosaico
const n = 2 ** Z;
const toPx = (lat, lon) => {
  const r = (lat * Math.PI) / 180;
  const gx = ((lon + 180) / 360) * n;
  const gy = ((1 - Math.log(Math.tan(r) + 1 / Math.cos(r)) / Math.PI) / 2) * n;
  return [(gx - XS[0]) * T, (gy - YS[0]) * T];
};
const toLonLat = (px, py) => {
  const gx = px / T + XS[0];
  const gy = py / T + YS[0];
  const lon = (gx / n) * 360 - 180;
  const lat = (Math.atan(Math.sinh(Math.PI * (1 - (2 * gy) / n))) * 180) / Math.PI;
  return [lon, lat];
};

// Suavizado gaussiano separable para que las curvas no queden escalonadas
function blur(src, w, h, r) {
  const k = [];
  for (let i = -r * 2; i <= r * 2; i++) k.push(Math.exp(-(i * i) / (2 * r * r)));
  const ks = k.reduce((a, b) => a + b, 0);
  const tmp = new Float32Array(w * h);
  const out = new Float32Array(w * h);
  const R = r * 2;
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -R; i <= R; i++) s += src[y * w + Math.min(w - 1, Math.max(0, x + i))] * k[i + R];
      tmp[y * w + x] = s / ks;
    }
  for (let y = 0; y < h; y++)
    for (let x = 0; x < w; x++) {
      let s = 0;
      for (let i = -R; i <= R; i++) s += tmp[Math.min(h - 1, Math.max(0, y + i)) * w + x] * k[i + R];
      out[y * w + x] = s / ks;
    }
  return out;
}

const smooth = blur(elev, W, H, 2);
let min = Infinity;
let max = -Infinity;
for (const e of smooth) {
  if (e < min) min = e;
  if (e > max) max = e;
}
const [mx, my] = toPx(PLACE.lat, PLACE.lon);
const placeElev = smooth[Math.round(my) * W + Math.round(mx)];
console.log({ W, H, min: min.toFixed(0), max: max.toFixed(0), marker: [mx.toFixed(1), my.toFixed(1)], placeElev: placeElev.toFixed(0) });

const STEP = 10;
const thresholds = [];
for (let t = Math.ceil(min / STEP) * STEP; t <= max; t += STEP) thresholds.push(t);

const polys = contours().size([W, H]).smooth(true).thresholds(thresholds)(Array.from(smooth));

// Simplificación Ramer–Douglas–Peucker
function rdp(pts, eps) {
  if (pts.length < 3) return pts;
  const [a, b] = [pts[0], pts[pts.length - 1]];
  let idx = 0;
  let dmax = 0;
  const dx = b[0] - a[0];
  const dy = b[1] - a[1];
  const len = Math.hypot(dx, dy) || 1;
  for (let i = 1; i < pts.length - 1; i++) {
    const d = Math.abs(dy * pts[i][0] - dx * pts[i][1] + b[0] * a[1] - b[1] * a[0]) / len;
    if (d > dmax) {
      dmax = d;
      idx = i;
    }
  }
  if (dmax <= eps) return [a, b];
  return [...rdp(pts.slice(0, idx + 1), eps).slice(0, -1), ...rdp(pts.slice(idx), eps)];
}

const onEdge = (p) => p[0] <= 0.01 || p[1] <= 0.01 || p[0] >= W - 0.01 || p[1] >= H - 0.01;
const lines = [];
for (const mp of polys) {
  let d = '';
  for (const poly of mp.coordinates) {
    for (const ring of poly) {
      // Cortamos los tramos que corren por el borde del mapa: son artefactos, no curvas.
      let run = [];
      const flush = () => {
        if (run.length > 3) {
          const s = rdp(run, 0.35);
          d += 'M' + s.map((p) => `${p[0].toFixed(1)} ${p[1].toFixed(1)}`).join('L');
        }
        run = [];
      };
      for (const p of ring) {
        if (onEdge(p)) flush();
        else run.push(p);
      }
      flush();
    }
  }
  if (d) lines.push({ e: mp.value, d });
}

// Escala: metros por píxel en la latitud del lugar
const mpp = (156543.03392 * Math.cos((PLACE.lat * Math.PI) / 180)) / n;
const [lonA, latA] = toLonLat(0, 0);
const [lonB, latB] = toLonLat(W, H);

// Referencias reales para rotular el mapa
let peak = { x: 0, y: 0, e: -Infinity };
for (let y = 40; y < H - 40; y++)
  for (let x = 40; x < W - 40; x++) {
    const e = smooth[y * W + x];
    if (e > peak.e) peak = { x, y, e };
  }
const [bx, by] = toPx(-32.0971, -64.3308);
const labels = [
  { kind: 'peak', x: peak.x, y: peak.y, text: `${Math.round(peak.e).toLocaleString('es-AR')} m` },
  { kind: 'town', x: bx, y: by, text: 'Las Bajadas' },
];
console.log(labels);

// Perfil del terreno de oeste a este pasando por el complejo (para el borde de sierra del inicio)
const fila = Math.round(my);
const perfil = [];
for (let x = 0; x < W; x += 8) {
  let sum = 0;
  let n = 0;
  for (let dy = -6; dy <= 6; dy++) for (let dx = 0; dx < 8; dx++) {
    sum += smooth[(fila + dy) * W + x + dx];
    n++;
  }
  perfil.push(Math.round(sum / n));
}
fs.mkdirSync('src/data', { recursive: true });
fs.writeFileSync('src/data/perfil.json', JSON.stringify({ desde: Math.round(min), hasta: Math.round(max), placeX: mx / W, valores: perfil }));

const out = {
  labels,
  width: W,
  height: H,
  metersPerPx: mpp,
  bbox: [lonA, latB, lonB, latA],
  place: { ...PLACE, x: mx, y: my, elev: Math.round(placeElev) },
  range: [Math.round(min), Math.round(max)],
  step: STEP,
  lines,
};
fs.mkdirSync('public/terrain', { recursive: true });
fs.writeFileSync('public/terrain/terrain.json', JSON.stringify(out));
console.log('curvas:', lines.length, 'KB:', (fs.statSync('public/terrain/terrain.json').size / 1024).toFixed(0));

// Sombreado de relieve (hillshade) en escala de grises, para dar volumen debajo de las curvas
const shade = Buffer.alloc(W * H);
const az = (315 * Math.PI) / 180;
const alt = (40 * Math.PI) / 180;
for (let y = 1; y < H - 1; y++)
  for (let x = 1; x < W - 1; x++) {
    const dzdx = (smooth[y * W + x + 1] - smooth[y * W + x - 1]) / (2 * mpp);
    const dzdy = (smooth[(y + 1) * W + x] - smooth[(y - 1) * W + x]) / (2 * mpp);
    const slope = Math.atan(3 * Math.hypot(dzdx, dzdy));
    const aspect = Math.atan2(dzdy, -dzdx);
    const v = Math.sin(alt) * Math.cos(slope) + Math.cos(alt) * Math.sin(slope) * Math.cos(az - aspect);
    shade[y * W + x] = Math.max(0, Math.min(255, v * 255));
  }
fs.mkdirSync('public/terrain', { recursive: true });
await sharp(shade, { raw: { width: W, height: H, channels: 1 } })
  .resize(W * 2, H * 2, { kernel: 'lanczos3' })
  .webp({ quality: 70 })
  .toFile(path.join('public/terrain', 'relieve.webp'));
console.log('relieve listo');
