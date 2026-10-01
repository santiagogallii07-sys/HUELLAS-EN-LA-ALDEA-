// Curvas de nivel reales del valle (datos abiertos de elevación) dibujadas en canvas.

type Rotulo = { kind: 'peak' | 'town'; x: number; y: number; text: string };
type Terreno = {
  width: number;
  height: number;
  metersPerPx: number;
  place: { x: number; y: number; elev: number; lat: number; lon: number };
  labels: Rotulo[];
  lines: { e: number; d: string }[];
};

type Paleta = { fondo: string; linea: string; maestra: string; relieve: GlobalCompositeOperation; relieveAlfa: number };

export const VERDE: Paleta = {
  fondo: '#006a3b',
  linea: 'rgba(255,255,255,0.22)',
  maestra: 'rgba(255,255,255,0.5)',
  relieve: 'soft-light',
  relieveAlfa: 0.9,
};

export const PAPEL: Paleta = {
  fondo: '#e3eadf',
  linea: 'rgba(0,106,59,0.28)',
  maestra: 'rgba(0,106,59,0.6)',
  relieve: 'multiply',
  relieveAlfa: 0.35,
};

let terrenoP: Promise<Terreno> | null = null;
let relieveP: Promise<HTMLImageElement> | null = null;

const cargarTerreno = () => (terrenoP ??= fetch('/terrain/terrain.json').then((r) => r.json()));
const cargarRelieve = () =>
  (relieveP ??= new Promise((ok, mal) => {
    const img = new Image();
    img.onload = () => ok(img);
    img.onerror = mal;
    img.src = '/terrain/relieve.webp';
  }));

const clamp = (v: number, a = 0, b = 1) => Math.min(b, Math.max(a, v));
const salida = (t: number) => 1 - (1 - t) ** 4;

type Vista = { s: number; ox: number; oy: number };

class Lienzo {
  ctx: CanvasRenderingContext2D;
  // 0: cada 10 m (solo de cerca), 1: cada 20 m, 2: maestras cada 100 m
  caminos: { p: Path2D; tipo: 0 | 1 | 2 }[];
  dpr = 1;
  w = 0;
  h = 0;

  constructor(
    public canvas: HTMLCanvasElement,
    public t: Terreno,
    public relieve: HTMLImageElement,
    public paleta: Paleta,
  ) {
    this.ctx = canvas.getContext('2d')!;
    this.caminos = t.lines.map((l) => ({ p: new Path2D(l.d), tipo: l.e % 100 === 0 ? 2 : l.e % 20 === 0 ? 1 : 0 }));
    this.medir();
  }

  medir() {
    const r = this.canvas.getBoundingClientRect();
    this.dpr = Math.min(window.devicePixelRatio || 1, 2);
    this.w = r.width;
    this.h = r.height;
    this.canvas.width = Math.round(r.width * this.dpr);
    this.canvas.height = Math.round(r.height * this.dpr);
  }

  dibujar(v: Vista, detalle: number, revelado = Infinity, centro?: [number, number]) {
    const { ctx, dpr, t, paleta } = this;
    ctx.setTransform(1, 0, 0, 1, 0, 0);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;
    ctx.fillStyle = paleta.fondo;
    ctx.fillRect(0, 0, this.canvas.width, this.canvas.height);

    ctx.setTransform(dpr * v.s, 0, 0, dpr * v.s, dpr * v.ox, dpr * v.oy);
    ctx.globalCompositeOperation = paleta.relieve;
    ctx.globalAlpha = paleta.relieveAlfa;
    ctx.imageSmoothingQuality = 'high';
    // El relieve tiene un borde sin datos: lo recortamos.
    const rw = this.relieve.naturalWidth;
    const rh = this.relieve.naturalHeight;
    ctx.drawImage(this.relieve, 4, 4, rw - 8, rh - 8, 2, 2, t.width - 4, t.height - 4);
    ctx.globalCompositeOperation = 'source-over';
    ctx.globalAlpha = 1;

    ctx.save();
    if (revelado !== Infinity && centro) {
      ctx.setTransform(dpr, 0, 0, dpr, 0, 0);
      ctx.beginPath();
      ctx.arc(centro[0], centro[1], Math.max(0, revelado), 0, Math.PI * 2);
      ctx.clip();
      ctx.setTransform(dpr * v.s, 0, 0, dpr * v.s, dpr * v.ox, dpr * v.oy);
    }
    ctx.lineJoin = 'round';
    ctx.lineCap = 'round';
    for (const tipo of [0, 1, 2] as const) {
      if (tipo === 0 && detalle <= 0) continue;
      ctx.globalAlpha = tipo === 0 ? detalle : 1;
      ctx.strokeStyle = tipo === 2 ? paleta.maestra : paleta.linea;
      ctx.lineWidth = (tipo === 2 ? 1.5 : 0.85) / v.s;
      for (const c of this.caminos) if (c.tipo === tipo) ctx.stroke(c.p);
    }
    ctx.restore();
  }
}

// Ubica el mapa para que un punto quede en (tx, ty) sin dejar bordes vacíos.
function encuadrar(t: Terreno, w: number, h: number, s: number, px: number, py: number, tx: number, ty: number): Vista {
  return {
    s,
    ox: clamp(tx - px * s, w - t.width * s, 0),
    oy: clamp(ty - py * s, h - t.height * s, 0),
  };
}

type Opciones = {
  paleta: Paleta;
  /** dónde cae el lugar, en fracción del ancho y alto del canvas */
  donde: [number, number];
  /** acercamiento respecto de "cubrir justo" */
  factor: number;
  /** las curvas se dibujan desde el lugar hacia afuera al aparecer */
  animar?: boolean;
};

export async function dibujarMapa(canvas: HTMLCanvasElement, rotulos: HTMLElement, o: Opciones) {
  let t: Terreno;
  let relieve: HTMLImageElement;
  try {
    [t, relieve] = await Promise.all([cargarTerreno(), cargarRelieve()]);
  } catch {
    return;
  }
  const lienzo = new Lienzo(canvas, t, relieve, o.paleta);
  let inicio = 0;

  const pintar = (ahora = performance.now()) => {
    const { w, h } = lienzo;
    const s = Math.max(w / t.width, h / t.height) * o.factor;
    const v = encuadrar(t, w, h, s, t.place.x, t.place.y, w * o.donde[0], h * o.donde[1]);
    const cx = v.ox + t.place.x * s;
    const cy = v.oy + t.place.y * s;
    const detalle = clamp((o.factor - 1.4) / 1.2) * 0.7;

    let revelado = Infinity;
    if (o.animar) {
      const k = clamp((ahora - inicio) / 900);
      if (k < 1) {
        revelado = salida(k) * Math.hypot(w, h);
        requestAnimationFrame(pintar);
      }
    }
    lienzo.dibujar(v, detalle, revelado, [cx, cy]);

    const ubicar = (el: HTMLElement | null, x: number, y: number) => {
      if (!el) return;
      el.style.setProperty('--x', `${(v.ox + x * s).toFixed(1)}px`);
      el.style.setProperty('--y', `${(v.oy + y * s - el.offsetHeight / 2).toFixed(1)}px`);
    };
    ubicar(rotulos.querySelector('[data-rot="lugar"]'), t.place.x, t.place.y);
    for (const l of t.labels) ubicar(rotulos.querySelector(`[data-rot="${l.kind}"]`), l.x, l.y);
    rotulos.classList.add('listo');
  };

  inicio = performance.now();
  let primera = true;
  new ResizeObserver(() => {
    lienzo.medir();
    if (primera) {
      primera = false;
      pintar();
    } else {
      o.animar = false;
      pintar();
    }
  }).observe(canvas);
}
