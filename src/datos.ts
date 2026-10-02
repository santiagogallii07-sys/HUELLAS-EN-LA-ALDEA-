// Datos de contacto y lugar: un solo lugar para cambiarlos.
export const WHATSAPP = '5493512142137';
export const WHATSAPP_VISIBLE = '+54 9 351 214-2137';
export const MAIL = 'huellasenlaaldea@gmail.com';
export const INSTAGRAM = 'https://www.instagram.com/huellasenlaaldea/';
// Abre la ficha "Huellas en la Aldea" de Google Maps (con reseñas y fotos), no solo el punto.
export const MAPS = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('Huellas en la Aldea, Las Bajadas, Córdoba');
export const waLink = (texto = 'Hola! Quería consultar por una estadía en Huellas en la Aldea.') =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
