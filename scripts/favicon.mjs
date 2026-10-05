// Arma el ícono de la pestaña (y el de Google) con partes del logo: las montañas naranjas y la "H".
// Versión de marca sobre verde: fondo verde lleno, "H" blanca, montañas naranjas gruesas.
// Todo queda dentro del círculo central, porque Google recorta el ícono en círculo.
// Correr con: node scripts/favicon.mjs [carpeta-para-vistas-previas]
import fs from 'node:fs';
import sharp from 'sharp';
import pngToIco from './png-a-ico.mjs';

const svg = fs.readFileSync('src/assets/logo.svg', 'utf8');
const trazo = (id) => {
  const tag = svg.match(new RegExp(`<path[^>]*id="${id}"[^>]*>`))[0];
  return tag.match(/ d="([^"]+)"/)[1];
};

// Coordenadas en el sistema del logo (viewBox 820 × 615): montañas arriba, "H" a la izquierda.
// El grupo se achica al 80 % alrededor del centro para que entre en el círculo de Google.
const icono = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
<defs>
<clipPath id="m"><rect x="110" y="10" width="610" height="156"/></clipPath>
<clipPath id="h"><polygon points="10,160 232,160 232,220 206,220 206,250 232,250 232,356 10,356"/></clipPath>
</defs>
<rect width="256" height="256" fill="#006A3B"/>
<g transform="translate(128 132) scale(0.8) translate(-128 -128)">
<g transform="translate(-11.8 18) scale(0.34)"><path fill="#F7A600" stroke="#F7A600" stroke-width="34" stroke-linejoin="round" stroke-linecap="round" fill-rule="evenodd" clip-path="url(#m)" d="${trazo('naranja')}"/></g>
<g transform="translate(29.9 -49) scale(0.806)"><path fill="#FFFFFF" stroke="#FFFFFF" stroke-width="3" stroke-linejoin="round" fill-rule="evenodd" clip-path="url(#h)" d="${trazo('verde')}"/></g>
</g>
</svg>`;

fs.writeFileSync('public/favicon.svg', icono);
const png = (lado, destino) => sharp(Buffer.from(icono), { density: 300 }).resize(lado, lado).png().toFile(destino);
const buffer = (lado) => sharp(Buffer.from(icono), { density: 300 }).resize(lado, lado).png().toBuffer();

await png(180, 'public/apple-touch-icon.png');
await png(48, 'public/favicon-48.png');
await png(96, 'public/favicon-96.png');
await png(192, 'public/icon-192.png');
await png(512, 'public/icon-512.png');
// favicon.ico en la raíz: algunos buscadores lo piden directo, sin leer el HTML.
fs.writeFileSync('public/favicon.ico', pngToIco([await buffer(16), await buffer(32), await buffer(48)]));

if (process.argv[2]) {
  await png(256, `${process.argv[2]}/ico-grande.png`);
  await png(32, `${process.argv[2]}/ico-32.png`);
}
console.log('ícono listo');
