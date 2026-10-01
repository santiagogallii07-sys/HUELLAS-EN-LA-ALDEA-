# DESIGN — Huellas en la Aldea (sitio público)

Mundo visual: **carta topográfica viva**. Recorrido: valle → predio → cabaña → ambientes, y vuelta al valle en "Cómo llegar".

## Color
| Token | Valor | Uso |
|---|---|---|
| `--verde` | #006A3B | Campo dominante (mapa, consulta), botones secundarios |
| `--verde-hondo` | #0B3B24 | Sección cabaña, texto sobre papel |
| `--verde-noche` | #072A19 | Pie, paneles sobre foto, rótulos |
| `--verde-claro` | #F1F4EE | Fondo de lectura |
| `--verde-papel` | #E3EADF | Mascotas, cómo llegar (papel de mapa) |
| `--naranja` | #F7A600 | Solo "huella": marcador, recorrido, acción principal, selección |
| `--tinta` / `--tinta-suave` | #14251B / #3C4D42 | Texto |

El naranja nunca se usa como texto sobre claro (contraste bajo); va como fondo con texto `--verde-noche`.

## Tipografía
- Títulos: **Gloock** (sustituto de Big More, más firme y legible), 400, interlineado 1.04, nunca menor a 1.6rem.
- Texto: **Montserrat Variable** 500, 17–18px, interlineado 1.6. Rótulos de mapa 13px 600–650.
- Sin cursivas finas ni textos sobre foto sin panel sólido.

## Componentes
- Inicio: videos de drone encadenados (AEREO TOTAL → COMPLEJO) con capítulos y pausa (`src/components/inicio/Secuencia.astro`). Diseño elegido: "Línea de sierra" — el video termina en el perfil real del terreno (`src/data/perfil.json`, de `npm run terrain`).
- Leyenda de mapa en vez de tarjetas de íconos (predio).
- Plano esquemático + pestañas + tira de fotos con scroll-snap (cabaña).
- Botones píldora 52px (44px en cabecera). Foco: contorno naranja 3px.
- Indicador de zoom fijo a la derecha (≥1100px) que funciona como navegación.

## Movimiento
Regla: muchas animaciones, todas cortas (0.3–0.8 s, ease-out), nada que secuestre el scroll.
- Inicio (<1 s): el video se acerca apenas, el panel verde sube, el título entra palabra por palabra, las curvas se dibujan desde el lugar.
- Al entrar en pantalla: títulos y textos suben (data-r="sube"), fotos se destapan (data-r="foto"), listas de a una (data-r="grupo"). Ver src/scripts/revelar.ts.
- Interacción: marcas del predio con "pop", lupa y paneles de la cabaña con fundido corto, subrayado naranja en el menú, cabecera que se esconde al bajar y vuelve al subir.
- Scroll: paralaje suave en el video de inicio y en la foto del arroyo (CSS scroll-driven, si el navegador lo soporta).
- Videos con botón de pausa; con "reducir movimiento" o ahorro de datos no arrancan solos.

## Fotos
Originales en `../fotos`; `npm run photos` copia las elegidas a `src/assets/fotos` (2400px máx). Astro genera AVIF/WebP. Procedencia: fotos del cliente (no generadas). Relieve: AWS Terrain Tiles (datos abiertos).
