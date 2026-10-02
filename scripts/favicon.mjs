// Arma el ícono de la pestaña con partes del logo: las montañas naranjas y la "H" verde.
// Correr con: node scripts/favicon.mjs
import fs from 'node:fs';
import sharp from 'sharp';

const svg = fs.readFileSync('src/assets/logo.svg', 'utf8');
const trazo = (id) => {
  const tag = svg.match(new RegExp(`<path[^>]*id="${id}"[^>]*>`))[0];
  return tag.match(/ d="([^"]+)"/)[1];
};

// Coordenadas en el sistema del logo (viewBox 820 × 615): montañas arriba, "H" a la izquierda.
const icono = `<svg xmlns="http://www.w3.org/2000/svg" viewBox="0 0 256 256">
<defs>
<clipPath id="m"><rect x="110" y="10" width="610" height="156"/></clipPath>
<clipPath id="h"><polygon points="10,160 232,160 232,220 206,220 206,250 232,250 232,356 10,356"/></clipPath>
</defs>
<rect width="256" height="256" rx="52" fill="#fff"/>
<g transform="translate(-11.8 18) scale(0.34)"><path fill="#F7A600" stroke="#F7A600" stroke-width="16" stroke-linejoin="round" fill-rule="evenodd" clip-path="url(#m)" d="${trazo('naranja')}"/></g>
<g transform="translate(29.9 -49) scale(0.806)"><path fill="#006A3B" fill-rule="evenodd" clip-path="url(#h)" d="${trazo('verde')}"/></g>
</svg>`;

fs.writeFileSync('public/favicon.svg', icono);
const png = (lado, destino) => sharp(Buffer.from(icono), { density: 300 }).resize(lado, lado).png().toFile(destino);
await png(180, 'public/apple-touch-icon.png');
await png(48, 'public/favicon-48.png');
if (process.argv[2]) {
  await png(256, `${process.argv[2]}/ico-grande.png`);
  await png(32, `${process.argv[2]}/ico-32.png`);
}
console.log('ícono listo');
