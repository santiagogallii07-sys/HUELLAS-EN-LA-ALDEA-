// Lo que comparten los formularios que arman el mensaje de WhatsApp (el rápido del inicio y el de Consulta).

declare global {
  interface Window {
    fbq?: (...args: unknown[]) => void;
  }
}

/** Fecha local en formato yyyy-mm-dd, como la usan los <input type="date"> */
export const iso = (d: Date) => new Date(d.getTime() - d.getTimezoneOffset() * 60000).toISOString().slice(0, 10);

/** yyyy-mm-dd → dd/mm/aaaa */
export const fecha = (v: string) => {
  const [a, m, d] = v.split('-');
  return `${d}/${m}/${a}`;
};

export const contarNoches = (llegada: string, salida: string) =>
  Math.round((+new Date(salida) - +new Date(llegada)) / 86400000);

/** La llegada no puede ser antes de hoy y la salida siempre queda después de la llegada */
export const enlazarFechas = (llegada: HTMLInputElement, salida: HTMLInputElement) => {
  llegada.min = iso(new Date());
  llegada.addEventListener('change', () => {
    if (!llegada.value) return;
    const d = new Date(llegada.value + 'T12:00');
    d.setDate(d.getDate() + 1);
    salida.min = iso(d);
    if (!salida.value || salida.value <= llegada.value) salida.value = iso(new Date(d.getTime() + 86400000));
  });
};

/** Revisa las fechas; devuelve el problema a mostrar o '' si están bien */
export const revisarFechas = (llegada: HTMLInputElement, salida: HTMLInputElement) => {
  const marcar = (el: HTMLElement, mal: boolean) => el.setAttribute('aria-invalid', String(mal));
  marcar(llegada, !llegada.value);
  marcar(salida, !salida.value || salida.value <= llegada.value);
  if (!llegada.value || !salida.value) return 'Elegí las fechas de llegada y salida.';
  if (salida.value <= llegada.value) return 'La salida tiene que ser después de la llegada.';
  return '';
};

/** Abre el chat con el mensaje listo y le avisa al píxel de Meta que fue una consulta completa */
export const abrirWhatsApp = (numero: string, texto: string, origen: string) => {
  window.fbq?.('track', 'Lead', { content_name: origen });
  // Un enlace en vez de window.open: con "noopener", window.open devuelve null aunque abra la pestaña
  const a = document.createElement('a');
  a.href = `https://wa.me/${numero}?text=${encodeURIComponent(texto)}`;
  a.target = '_blank';
  a.rel = 'noopener';
  a.click();
};
