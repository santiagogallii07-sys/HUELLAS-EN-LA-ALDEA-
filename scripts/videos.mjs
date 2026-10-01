// Prepara los videos de drone para la web: recorta, achica y los hace "ida y vuelta"
// (adelante + al revés) para que el loop no tenga salto. Correr con: npm run videos
import { execFileSync } from 'node:child_process';
import fs from 'node:fs';
import path from 'node:path';
import ffmpeg from '@ffmpeg-installer/ffmpeg';
import sharp from 'sharp';

const ROOT = path.resolve('..', 'fotos');
const carpeta = fs.readdirSync(ROOT).find((n) => n.normalize('NFC').startsWith('Videos Caba'));
const SRC = path.join(ROOT, carpeta);
const OUT = 'public/video';
fs.mkdirSync(OUT, { recursive: true });

const run = (args) => execFileSync(ffmpeg.path, ['-hide_banner', '-loglevel', 'error', '-y', ...args], { stdio: 'inherit' });

const x264 = (crf) => ['-an', '-c:v', 'libx264', '-preset', 'slow', '-crf', String(crf), '-pix_fmt', 'yuv420p', '-profile:v', 'high', '-movflags', '+faststart'];

// [nombre, archivo, desde (s), duración (s), ida y vuelta, salidas]
const ANCHO = { filtro: 'scale=1920:-2', crf: 28, sufijo: '' };
const MOVIL = { filtro: 'crop=ih*3/4:ih,scale=720:960', crf: 29, sufijo: '-movil' };
const MEDIO = { filtro: 'scale=1280:-2', crf: 28, sufijo: '' };
const CLIPS = [
  // inicio: primero el predio entero desde el aire, después el complejo al atardecer
  ['aereo-total', 'AEREO TOTAL.MP4', 0.5, 11, false, [ANCHO, MOVIL]],
  ['complejo', 'COMPLEJO.MP4', 2, 11, false, [ANCHO, MOVIL]],
  ['pileta', 'PILETA ALEJADO.MP4', 1, 6, true, [MEDIO]],
  ['arroyo', 'COMPLEJO 2.MP4', 1, 7, true, [MEDIO]],
];

for (const [nombre, archivo, desde, dur, idaYVuelta, salidas] of CLIPS) {
  for (const { sufijo, filtro, crf } of salidas) {
    const dest = path.join(OUT, `${nombre}${sufijo}.mp4`);
    const grafo = idaYVuelta
      ? `[0:v]fps=30,${filtro},split[a][b];[b]reverse[r];[a][r]concat=n=2:v=1[v]`
      : `[0:v]fps=30,${filtro}[v]`;
    run(['-ss', String(desde), '-t', String(dur), '-i', path.join(SRC, archivo), '-filter_complex', grafo, '-map', '[v]', ...x264(crf), dest]);
    run(['-ss', String(desde), '-i', path.join(SRC, archivo), '-frames:v', '1', '-vf', filtro, '-q:v', '4', dest.replace('.mp4', '.jpg')]);
    console.log('ok', dest, (fs.statSync(dest).size / 1024 / 1024).toFixed(1), 'MB');
  }
}

// Primer cuadro de cada video también en WebP (más liviano) para mostrar mientras carga
for (const f of fs.readdirSync(OUT).filter((n) => n.endsWith('.jpg'))) {
  await sharp(path.join(OUT, f)).webp({ quality: 72 }).toFile(path.join(OUT, f.replace('.jpg', '.webp')));
}
