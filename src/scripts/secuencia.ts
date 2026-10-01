// Encadena los videos del inicio: cuando uno termina, el siguiente entra con un fundido.
// Con "reducir movimiento" o ahorro de datos queda la foto quieta hasta que la persona toque play.
const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
const ahorro = (navigator as Navigator & { connection?: { saveData?: boolean } }).connection?.saveData === true;

export function iniciarSecuencia(raiz: HTMLElement) {
  const videos = [...raiz.querySelectorAll<HTMLVideoElement>('video')];
  const capitulos = [...raiz.querySelectorAll<HTMLButtonElement>('[data-ir]')];
  const rellenos = capitulos.map((c) => c.querySelector<HTMLElement>('.secuencia__relleno')!);
  const pausa = raiz.querySelector<HTMLButtonElement>('.secuencia__pausa')!;

  let actual = 0;
  let enPausa = quieto || ahorro;
  let visible = true;
  let arrancado = false;

  const reflejar = () => {
    pausa.dataset.estado = enPausa ? 'pausa' : 'play';
    pausa.setAttribute('aria-label', enPausa ? 'Reproducir video' : 'Pausar video');
  };

  const ir = (i: number) => {
    const antes = videos[actual];
    const v = videos[i];
    actual = i;
    arrancado = true;
    v.preload = 'auto';
    v.currentTime = 0;
    videos.forEach((x) => x.classList.toggle('activo', x === v));
    capitulos.forEach((c, j) => c.setAttribute('aria-current', String(j === i)));
    rellenos.forEach((r, j) => (r.style.transform = `scaleX(${j < i ? 1 : 0})`));
    if (!enPausa && visible) v.play().catch(() => {});
    if (antes !== v) {
      // el anterior queda abajo hasta que el nuevo terminó de aparecer
      const soltar = () => {
        antes.classList.remove('listo');
        antes.pause();
      };
      if (v.classList.contains('listo') || enPausa) soltar();
      else v.addEventListener('playing', () => setTimeout(soltar, 850), { once: true });
    }
    const siguiente = videos[(i + 1) % videos.length];
    if (siguiente !== v) siguiente.preload = 'metadata';
  };

  videos.forEach((v, i) => {
    v.addEventListener('playing', () => v.classList.add('listo'));
    v.addEventListener('ended', () => ir((i + 1) % videos.length));
    if (videos.length === 1) v.loop = true;
  });

  capitulos.forEach((c, i) =>
    c.addEventListener('click', () => {
      if (enPausa) {
        enPausa = false;
        reflejar();
      }
      ir(i);
    }),
  );

  pausa.addEventListener('click', () => {
    enPausa = !enPausa;
    reflejar();
    const v = videos[actual];
    if (enPausa) v.pause();
    else if (!arrancado) ir(actual);
    else v.play().catch(() => {});
  });

  // La barra del capítulo avanza solo mientras el video se ve y suena
  let girando = false;
  const avanzar = () => {
    const v = videos[actual];
    if (v.duration) rellenos[actual].style.transform = `scaleX(${Math.min(1, v.currentTime / v.duration)})`;
    if (visible && !enPausa) requestAnimationFrame(avanzar);
    else girando = false;
  };
  const girar = () => {
    if (girando) return;
    girando = true;
    requestAnimationFrame(avanzar);
  };
  videos.forEach((v) => v.addEventListener('play', girar));

  new IntersectionObserver(([e]) => {
    visible = e.isIntersecting;
    const v = videos[actual];
    if (!visible) v.pause();
    else if (!enPausa) {
      if (!arrancado) ir(actual);
      else v.play().catch(() => {});
    }
  }).observe(raiz);

  reflejar();
}
