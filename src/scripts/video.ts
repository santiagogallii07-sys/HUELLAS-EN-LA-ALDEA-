// Videos de fondo: arrancan solos cuando se ven (salvo "reducir movimiento" o ahorro de datos),
// se pausan fuera de pantalla y tienen un botón para pausarlos a mano.
const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ahorro = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

export function videoEnPantalla(caja: HTMLElement, { cargarYa = false } = {}) {
  const video = caja.querySelector('video')!;
  const boton = caja.querySelector<HTMLButtonElement>('.boton-video');
  let pausadoAMano = quieto || ahorro;
  let visible = false;

  const reflejar = () => {
    if (!boton) return;
    const sonando = !video.paused;
    boton.dataset.estado = sonando ? 'play' : 'pausa';
    boton.setAttribute('aria-label', sonando ? 'Pausar video' : 'Reproducir video');
  };
  const decidir = () => {
    if (visible && !pausadoAMano) {
      if (video.preload !== 'auto') video.preload = 'auto';
      video.play().catch(() => {});
    } else video.pause();
  };

  video.addEventListener('play', reflejar);
  video.addEventListener('pause', reflejar);
  boton?.addEventListener('click', () => {
    pausadoAMano = !video.paused;
    if (!pausadoAMano) visible = true;
    if (pausadoAMano) video.pause();
    else video.play().catch(() => {});
  });

  if (cargarYa && !pausadoAMano) video.preload = 'auto';
  new IntersectionObserver(
    ([e]) => {
      visible = e.isIntersecting;
      decidir();
    },
    { threshold: 0.2 },
  ).observe(caja);
  reflejar();
}
