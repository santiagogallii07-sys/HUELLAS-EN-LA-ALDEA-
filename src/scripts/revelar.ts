// Marca con .visto lo que entra en pantalla; los grupos escalonan a sus hijos.
const quieto = window.matchMedia('(prefers-reduced-motion: reduce)').matches;
// Títulos de sección: se parten en palabras para que suban de a una (como el título del inicio)
document.querySelectorAll<HTMLElement>('main section h2').forEach((h) => {
  if (h.children.length) return;
  const texto = h.textContent!.trim();
  h.setAttribute('aria-label', texto);
  h.innerHTML = texto
    .split(/\s+/)
    .map((p, i) => `<span class="r-pal" aria-hidden="true"><span style="--i:${i}">${p}</span></span>`)
    .join(' ');
  h.dataset.r = 'palabras';
});

const els = document.querySelectorAll<HTMLElement>('[data-r]');

document.querySelectorAll<HTMLElement>('[data-r="grupo"]').forEach((g) =>
  [...g.children].forEach((h, i) => (h as HTMLElement).style.setProperty('--d', `${Math.min(i, 7) * 70}ms`)),
);

if (quieto || !('IntersectionObserver' in window)) {
  els.forEach((el) => el.classList.add('visto'));
} else {
  const io = new IntersectionObserver(
    (entradas) => {
      for (const e of entradas) {
        if (!e.isIntersecting) continue;
        e.target.classList.add('visto');
        io.unobserve(e.target);
      }
    },
    { rootMargin: '0px 0px -8% 0px', threshold: 0.12 },
  );
  els.forEach((el) => io.observe(el));
}
