# Migración de Instant a componentes de Fem — 5 de octubre de 2026

El tema generado ya no incluye cargadores de Instant, su app embed ni recursos de sus dominios. Se retiraron las 37 secciones y sus hojas de estilos anteriores: 34 páginas conservan su estructura y estilos en secciones `fem-*`; header, inicio y footer reutilizan los componentes nativos existentes.

## Funcionamiento

- `src/components/catalog-interactions.ts` implementa galerías, miniaturas, ventanas de imagen, acordeones, cintas animadas, menús y controles de cantidad, sin Swiper ni Instant.
- `src/components/purchase-selection.ts` conserva el tipo de compra al cambiar de cantidad. Consulta la Section Rendering API de Shopify para actualizar precios, disponibilidad, imágenes y contenido condicional. Cancela solicitudes anteriores, bloquea la compra mientras se actualiza y restaura la selección confirmada si falla la consulta.
- `src/lib/product-markup.ts` actualiza los campos recibidos sin reemplazar toda la ficha, para mantener foco y posición de la galería.
- El carrito, búsqueda, checkout externo, aplicaciones comerciales y contenido editorial se mantienen. La propiedad privada `_instant-hidden` se sigue leyendo únicamente para no mostrar regalos ocultos en carritos anteriores; no ejecuta código del proveedor.

## Diseño y recursos

Se conservaron los valores del diseño y sus puntos de adaptación. Se eliminaron 1.576 reglas CSS de componentes cuyos selectores no aparecen en las secciones ni en los estados usados por el nuevo código (266.675 bytes de fuente). Los ajustes de galerías con scroll nativo están en `src/styles/tokens.css`.

Las imágenes y fuentes antes alojadas por el proveedor ahora son assets del tema. Se conservaron las variantes de imagen para móvil y escritorio. Los recursos idénticos comparten archivo. Se convirtieron 359 PNG a WebP sin pérdida, comprobando dimensiones, alfa y cada píxel visible; se ahorraron 77.642.047 bytes frente a las descargas originales. Algunas variantes de ancho que devolvieron HTTP 508 reutilizan la imagen de 1280 px del mismo recurso. Esto conserva el contenido, aunque puede descargar más bytes en esos tamaños.

Se añadieron las dimensiones reales a 39 imágenes que no las declaraban. La plantilla genérica `page.json` referenciaba una sección inexistente: se retiró esa configuración huérfana y se habilitó `main-page` para mostrar `page.content`. Las plantillas de privacidad, contacto y suscripción mantienen sus secciones específicas.

## Referencias que se conservan deliberadamente

Los archivos JSON `templates/*.instant-*.json` son alias de plantilla, con referencias a secciones nativas. Los nombres pueden seguir asignados a productos, páginas o artículos en Shopify. Eliminarlos exige revisar y reasignar previamente esos recursos desde Shopify; conservarlos evita que caigan en otra plantilla al publicar el tema. No cargan el motor ni recursos de Instant.

`server/legacy-preview.ts` y `server/media-manifest.json` adaptan el HTML antiguo que todavía entrega la tienda publicada a la vista local. Conservan el identificador original de sección para las consultas de variantes. No se incluyen en el JavaScript del navegador ni se publican como assets del tema. Después de publicar el tema nativo se podrá retirar este adaptador. Los fixtures históricos de las pruebas conservan el HTML anterior como referencia de comparación.

## Verificación y límites

- Compilación y TypeScript correctos; 43 pruebas aprobadas.
- Comparación de contenido, formularios, destinos, dimensiones e iconos de los documentos auditados; pruebas específicas del inicio y resultados de búsqueda.
- Pruebas DOM aisladas, sin cargar páginas remotas: suscripción, cambios rápidos de cantidad, respuestas fuera de orden, recuperación tras error, miniaturas, flechas, cierre de ventanas y acordeones.
- Validación Liquid de 43 archivos: sin errores; conserva avisos de estilo de variables, fuentes externas de Google y complejidad heredada.
- Servidor local disponible en `http://localhost:3000`. La consulta de contenido a Shopify devolvió HTTP 429 durante la comprobación final.

No se publicó el tema ni se desinstaló ninguna aplicación de la tienda. La política del navegador impidió la revisión visual en localhost; las pruebas de DOM no verifican el aspecto renderizado, animaciones visuales ni tiempos de carga reales. La revisión visual y una compra de prueba en un preview de Shopify siguen siendo necesarias antes de publicar.

La revisión automática bloqueó la eliminación de las copias y herramientas temporales de `work/before-native`, `work/npm-tool`, `work/npm-cache`, los scripts auxiliares de `work` y `audit/instant-core-readable.js`, incluso después de obtener permiso de escritura para esas rutas. Permanecen excluidos de Git y del tema generado; no se usan para ejecutar la web. Su limpieza física queda pendiente por esa restricción.
