// Copia las fotos elegidas a src/assets/fotos, giradas según EXIF y achicadas a 2400 px.
// Astro después genera las versiones AVIF/WebP de cada tamaño. Correr con: npm run photos
import fs from 'node:fs';
import path from 'node:path';
import sharp from 'sharp';

const ROOT = path.resolve('..', 'fotos');
// Las carpetas vienen de macOS con "ñ" descompuesta: las buscamos por prefijo.
const find = (dir, prefix) => {
  const hit = fs.readdirSync(dir).find((n) => n.normalize('NFC').startsWith(prefix));
  if (!hit) throw new Error(`No encuentro ${prefix} en ${dir}`);
  return path.join(dir, hit);
};
const FC = find(ROOT, 'Fotos caba');
const dir = (p) => find(FC, p);
const ENERO = find(ROOT, 'Huellas fotos 22');

const PICKS = {
  // vistas aéreas
  'complejo-cenital': [dir('1 complejo'), 'DJI_0109.jpg'],
  'complejo-valle': [dir('1 complejo'), 'DJI_0006.jpg'],
  'complejo-atardecer': [dir('1 complejo'), 'DJI_0119.jpg'],
  'complejo-sol': [dir('1 complejo'), 'DJI_0114.jpg'],
  // cabaña
  'cabana-frente': [dir('1 caba'), 'IMG_1392.jpg'],
  'cabana-lateral': [dir('1 caba'), 'IMG_1465.jpg'],
  'cabana-arbol': [dir('1 caba'), 'DSC_9461.jpg'],
  'cabana-cochera': [dir('1 caba'), 'IMG_1389.jpg'],
  'galeria-parrilla': [dir('1 caba'), 'IMG_1395.jpg'],
  'galeria-sillones': [dir('1 caba'), 'IMG_1396.jpg'],
  'galeria-vista': [dir('1 caba'), 'IMG_1461.jpg'],
  'galeria-mesa': [dir('1 caba'), 'IMG_1443.jpg'],
  'cocina-mesa': [dir('1 caba'), 'IMG_1398.jpg'],
  'cocina-ventana': [dir('1 caba'), 'IMG_1401.jpg'],
  'cocina-abierta': [dir('1 caba'), 'IMG_1440.jpg'],
  'cocina-mesada': [dir('1 caba'), 'IMG_1460.jpg'],
  'dormitorio-ppal': [dir('1 caba'), 'IMG_1428.jpg'],
  'dormitorio-ppal-2': [dir('1 caba'), 'IMG_1452.jpg'],
  'dormitorio-ppal-3': [dir('1 caba'), 'IMG_1449.jpg'],
  'dormitorio-dos': [dir('1 caba'), 'IMG_1419.jpg'],
  'dormitorio-dos-2': [dir('1 caba'), 'IMG_1457.jpg'],
  'bano': [dir('1 caba'), 'IMG_1405.jpg'],
  'bano-2': [dir('1 caba'), 'IMG_1418.jpg'],
  // predio
  'pileta-aerea': [dir('1 pileta'), 'DJI_0083 ok.jpg'],
  'pileta-jacuzzi': [dir('1 pileta'), 'DJI_0076.jpg'],
  'pileta-reposeras': [dir('1 pileta'), 'DSC_9544.jpg'],
  'pileta-borde': [dir('1 pileta'), 'DSC_9383.jpg'],
  'quincho': [dir('1 quincho'), 'IMG_1386.jpg'],
  'arroyo-paseo': [dir('1 arroyo'), 'DSC_9562.jpg'],
  'arroyo-dique': [dir('1 arroyo'), 'DJI_0134.jpg'],
  'arroyo-remanso': [dir('1 arroyo'), 'DSC_9538.jpg'],
  'aljibe': [dir('1 espacios'), 'DSC_9567.jpg'],
  'piedra-tallada': [dir('1 espacios'), 'DSC_9581.jpg'],
  'mesas-arboles': [dir('1 espacios'), 'IMG_1385.jpg'],
  'caminata': [dir('1 espacios'), 'DSC_9388.jpg'],
  'pato': [dir('1 natural'), 'DSC_9482.jpg'],
  // sesión de enero (atardecer, noche, fuego, cielo)
  'pileta-noche-cenital': [ENERO, 'DJI_0475.jpg'],
  'pileta-atardecer': [ENERO, 'DJI_0409.jpg'],
  'jacuzzi': [ENERO, 'DSC_5561.jpg'],
  'fuego': [ENERO, 'IMG_5674.jpg'],
  'galeria-noche': [ENERO, 'IMG_5668.jpg'],
  'cometa': [ENERO, 'DSC_5709.jpg'],
  // referencias del mapa del predio (pedidas por el cliente)
  'laguna': [dir('1 espacios'), 'DSC_9469.jpg'],
  'embarcadero-1': [dir('1 espacios'), 'embarcadero 1.jpeg'],
  'embarcadero-2': [dir('1 espacios'), 'embarcadero 2.jpeg'],
  'barco-1': [dir('1 espacios'), 'barco 1.jpeg'],
  'volley-1': [dir('1 espacios'), 'volley 1.jpeg'],
  // destacadas por el cliente
  'juegos-metegol': [ENERO, 'DSC_5601.jpg'],
  'escalera-flores': [ENERO, 'DSC_5619.jpg'],
  'tarde-dorada': [ENERO, 'DSC_5609.jpg'],
  'pileta-dia': [ENERO, 'DSC_5445.jpg'],
  'pileta-ocaso': [ENERO, 'DSC_5630.jpg'],
  'noche-predio': [ENERO, 'DSC_5755.jpg'],
  'dique-aereo': [ENERO, 'DJI_0468.jpg'],
  'invierno-atardecer': [path.join(ROOT, 'Fotos Jorge invierno'), 'foto atardecer invierno.jpg'],
};

const OUT = 'src/assets/fotos';
fs.mkdirSync(OUT, { recursive: true });
for (const [name, [d, file]] of Object.entries(PICKS)) {
  const dest = path.join(OUT, `${name}.jpg`);
  if (fs.existsSync(dest)) continue;
  await sharp(path.join(d, file))
    .rotate()
    .resize({ width: 2400, height: 2400, fit: 'inside', withoutEnlargement: true })
    .jpeg({ quality: 84, mozjpeg: true })
    .toFile(dest);
  console.log('ok', name);
}
