// Datos de contacto y lugar: un solo lugar para cambiarlos.
export const WHATSAPP = '5493512142137';
export const WHATSAPP_VISIBLE = '+54 9 351 214-2137';
export const MAIL = 'huellasenlaaldea@gmail.com';
export const INSTAGRAM = 'https://www.instagram.com/huellasenlaaldea/';
export const MAPS = 'https://www.google.com/maps/search/?api=1&query=' + encodeURIComponent('VMH9+87Q Las Bajadas, Córdoba');
export const waLink = (texto = 'Hola! Quería consultar por una estadía en Huellas en la Aldea.') =>
  `https://wa.me/${WHATSAPP}?text=${encodeURIComponent(texto)}`;
