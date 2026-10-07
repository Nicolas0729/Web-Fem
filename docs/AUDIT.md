# Auditoría y estado de implementación

## Cobertura

Inventario obtenido del catálogo y del tema conectado: 30 productos (19 activos, 7 archivados, 4 borradores), 40 variantes públicas, 6 colecciones administrativas (5 públicas), 19 páginas, 6 blogs y 9 artículos. Se capturaron 66 documentos HTML y se verificaron 74 rutas locales. Datos fuente en `audit/`; la disponibilidad y los precios pueden cambiar en Shopify.

La portada utiliza las secciones nativas `fem-header`, `fem-home` y `fem-footer`, además del banner de aniversario. Nueve componentes organizan su contenido y ocho tarjetas comparten `fem-product-card`. Esta auditoría describe el estado de septiembre. La migración posterior de los componentes restantes se documenta en [NATIVE-THEME.md](NATIVE-THEME.md).

El inventario y las 74 rutas anteriores corresponden a la auditoría inicial. La optimización del 29 de septiembre de 2026 comprobó los 66 documentos guardados y siete rutas en vivo; sus medidas y limitaciones están en [PERFORMANCE.md](PERFORMANCE.md).

## Cambios

- CTA del dúo y de preguntas frecuentes conectados al producto correspondiente.
- Enlaces de “Más vendido” conectados a su colección.
- Contenedores de testimonios sin destino convertidos a elementos no interactivos; enlace de correo legal preservado.
- Enlaces internos normalizados, conservando parámetros y anclas.
- Scripts de componentes cargados cuando aparecen sus elementos en el DOM.
- Tipos de productos del inicio y carrito junto a sus módulos TypeScript, foco visible y movimiento reducido.
- Dimensiones de imagen basadas en objetos Shopify o metadatos del archivo, sin inventar medidas.
- Eliminación de una conversión de compra que el tema emitía en cada página sin transacción.
- Minificación de CSS. El ahorro del manifiesto corresponde al total de assets, no a una página ni a una medición de Core Web Vitals.

## Diseño conservado

Paleta rosa/coral y familias Poppins, Behind The Nineties Sans y las fuentes heredadas por sección. Se conservan imágenes, textos, precios dinámicos, estructura de secciones y destinos originales de checkout. Tokens complementarios en `src/styles/tokens.css`.

## Evidencia

`audit/link-check.json`: rutas comprobadas y enlaces vacíos/inválidos. `audit/cart-check.json`: carrito aislado con variante real. Pruebas de navegación contrastan los 66 documentos; la prueba LiquidJS compara estructura, atributos, textos y precios de la portada antes/después de separar componentes. LiquidJS no sustituye la validación con el motor completo de Shopify.

## Pendiente de validación

Autenticación y vista del tema en Shopify CLI; comparación visual completa de cada plantilla en escritorio y móvil; verificación de integraciones y suscripciones en el entorno Shopify; resolver y clasificar los hallazgos heredados de Theme Check. Algunos CDN no respondieron durante la lectura de dimensiones; esas medidas no se inventaron. No hay medición Lighthouse/Core Web Vitals que respalde una mejora numérica.

## Revisión local y pagos

`localhost:3000` usa HTML público de la tienda con transformaciones locales; no es una tienda autónoma ni un sustituto del preview nativo. Los pagos permanecen en sus dominios oficiales. Los formularios externos pueden enviar datos reales si se completan. La validación automatizada no realizó pagos ni pedidos.
