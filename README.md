# Web-Fem — storefront de Fem

Tema Shopify nativo con mejoras en TypeScript y una vista local conectada a la tienda.

## Ejecutar

Requiere Node.js 24 o posterior; los scripts TypeScript se ejecutan directamente con Node.

```sh
npm ci
npm run build
npm run dev
```

Abrir http://localhost:3000. Requiere conexión a internet: esta vista obtiene HTML y datos de Shopify y aplica correcciones locales. El inicio renderiza sus secciones Liquid propias (banner, menú, contenido y pie de página). Las demás páginas conservan el proxy de Shopify para revisar navegación y carrito. La revisión técnica está en `/__review`.

### Banner de aniversario

El inicio incluye la sección nativa **Aniversario Fem**, con la fotografía de fondo separada del texto. En el editor de temas de Shopify, abrir **Página de inicio → Aniversario Fem** para cambiar marca, número, título, promoción, descripción, enlace, imágenes y colores. El descuento enlaza al catálogo; su texto no crea descuentos en Shopify.

La vista local renderiza esta sección directamente desde Liquid. Los textos se leen de `theme-source/templates/index.json`, dentro de `sections.fem_anniversary.settings`: guardar y recargar el inicio permite previsualizarlos sin recompilar. Las imágenes seleccionadas mediante el editor de Shopify se revisan en Shopify; la vista local usa la fotografía incluida. Ejecutar la compilación antes de cargar `theme-dev` en Shopify.

El banner conserva el video suministrado, el texto editable y la tipografía de la referencia. Las fuentes se sirven localmente; sus licencias están en `docs/*-OFL.txt`.

Para revisar el tema generado con el motor real de Shopify:

```sh
npm run theme:dev
```

Requiere iniciar sesión con una cuenta autorizada en `fd668e-73.myshopify.com`. Shopify CLI creará una vista de desarrollo. No ejecutar `theme push --live` para revisar.

## Estructura

- `theme-source/`: copia del tema existente; referencia para reconstrucción reproducible.
- `theme-dev/`: tema generado; modificar las fuentes/scripts y volver a compilar. La compilación elimina los archivos que ya no existen en las fuentes, conservando los assets generados.
- `src/`: reglas de navegación, carrito, carga de componentes y accesibilidad.
- `scripts/`: compilación y auditorías.
- `server/`: proxy de revisión local, ligado a 127.0.0.1.
- `audit/`: datos públicos necesarios y resultados locales de auditoría; los inventarios administrativos no se versionan.
- `docs/AUDIT.md`: alcance y limitaciones.

## Validar

```sh
npm run typecheck
npm test
npm run audit:links
npm run theme:check
```

Para generar los datos del auditor de enlaces, ejecutar primero `npm run audit:public`. El auditor de enlaces necesita el servidor local. `scripts/check-cart.ts` crea un carrito aislado, prueba añadir/cambiar/eliminar y lo vacía; no crea pedidos. Theme Check todavía detecta problemas heredados del tema original; consultar los JSON en `audit/`.

## Integraciones

Shopify conserva catálogo, inventario, variantes, páginas, blogs, metafields, metaobjects y carrito. Las rutas de compra externas existentes en `checkoutfem.com` se conservan. El proxy no replica autenticación ni pagos: enlaces de cuenta y servicios externos abren sus destinos oficiales. Un carrito simple puede transferirse al checkout oficial mediante permalink; las suscripciones y propiedades especiales requieren el flujo oficial y no se transfieren desde el proxy.

Los recursos visuales y las fuentes del inicio se sirven desde los assets del tema. Los productos, videos de comunidad y aplicaciones comerciales mantienen sus CDN de Shopify. No se ha publicado el tema ni cambiado productos de la tienda.

## Banner de aniversario

El banner usa `theme-source/assets/fem-anniversary-video.mp4` como fondo en bucle y sin sonido. El texto y el enlace siguen siendo editables en la sección **Aniversario Fem** del editor de Shopify; en local se editan en `theme-source/templates/index.json`. La sección permite desactivar el video o elegir otro de la biblioteca de Shopify. La vista local muestra el MP4 incluido.

El botón permite pausar y reanudar la animación. Se respeta la preferencia de movimiento reducido, se pausa al salir de pantalla y la imagen de respaldo permanece si el video no carga. Después de modificar el video o su comportamiento, vuelve a compilar el tema.

## Videos de Comunidad Fem

Los seis videos se sirven desde el CDN de Shopify. Incluyen controles nativos para reproducir, pausar, activar audio y ampliar incluso cuando el navegador restringe autoplay. Se respeta la preferencia de movimiento reducido. Los enlaces a Instagram se conservan.

El repositorio no incluye credenciales, registros de autenticación, inventarios administrativos ni los materiales de branding de VERA & CO.

## Tema sin el motor de Instant

`theme-source/sections/fem-home.liquid` organiza nueve componentes `fem-home-*.liquid`; las ocho tarjetas reutilizan `fem-product-card.liquid`. `fem-header.liquid` y `fem-footer.liquid` conservan el menú y el pie del inicio. Los estilos `fem-home.css`, `fem-header.css` y `fem-footer.css` mantienen los tamaños y los puntos de adaptación del diseño. `src/components/native-interactions.ts` implementa carruseles, franja continua, acordeones, menús y la aparición del producto fijo.

Las secciones del catálogo y las páginas también usan ahora controles propios de Fem. Se eliminaron los cargadores y el app embed, y se almacenaron las imágenes y fuentes del proveedor en el tema. Los alias JSON de plantilla y el adaptador del servidor local se conservan para compatibilidad con las asignaciones y el HTML aún publicado en Shopify. Consulta [el alcance, comprobaciones y límites de la migración](docs/NATIVE-THEME.md).

La vista local toma precios y productos del HTML público de Shopify mediante `server/native-home.ts`; en Shopify, el tema utiliza `all_products` directamente. Los precios no se fijan en el código. Para editar diseño y contenido, modificar `theme-source`, ejecutar `npm run build` y recargar. Los scripts históricos de extracción del home se eliminaron porque ya no participan en la compilación.

## Rendimiento

La compilación minifica CSS y JavaScript, carga componentes cuando son necesarios y difiere imágenes posteriores al contenido inicial. El servidor local reutiliza assets y su compresión, respetando los cambios de archivo y los rangos del video. Las medidas antes/después, las comprobaciones y sus límites están en [docs/PERFORMANCE.md](docs/PERFORMANCE.md).

## Búsqueda

La sección de resultados está habilitada en `templates/search.json`. Sus tarjetas usan `snippets/fem-search-card.liquid` y `assets/fem-search-card.css` para reproducir el diseño de “Todos los productos”, incluida la imagen alterna al pasar el cursor. El formulario permite buscar con Enter o con la lupa. La vista local utiliza `server/search.ts` para recuperar los resultados de Shopify mientras el tema publicado todavía tiene esa sección desactivada. Conserva consultas, filtros, orden y paginación, y convierte las tarjetas anteriores al mismo diseño con datos actuales de los productos. Si Shopify ya entrega las nuevas tarjetas, no realiza esas consultas adicionales.

## Carrito lateral

`fem-cart-drawer.liquid` incluye un carrito nativo en todas las páginas. El icono del header y los botones existentes de añadir al carrito abren este panel. Consulta la API Ajax de Shopify para cantidades, precios, descuentos y recomendaciones; las cantidades se modifican por la clave de línea para conservar variantes y propiedades. El carrito anterior de Instant se retiró del grupo de pie de página.

En **Carrito Fem** se configuran el mínimo de envío gratis (actualmente $100.000 COP), la visualización de los regalos existentes y una fecha real de fin de promoción en formato ISO. Sin una fecha vigente, la franja coral muestra un mensaje de compra segura. No se genera un contador que se reinicie al abrir el panel. Las imágenes de los regalos son informativas y no añaden artículos ficticios al pedido; su entrega sigue dependiendo del flujo comercial existente.

La vista local elimina las imágenes de la franja de aniversario sobre el header. El banner principal con video del inicio se conserva. El pago mantiene las limitaciones del proxy descritas en Integraciones.

## Limpieza del proyecto — 1 de octubre de 2026

Se retiraron archivos temporales de `work/`, informes de migraciones antiguas, el carrito sustituido de Instant, una sección sin referencias, grupos de respaldo desconectados, dos snippets sin uso y un SVG obsoleto. Los tipos del auditor de carrito ahora reutilizan `src/lib/cart.ts`; se eliminaron los tipos duplicados y la dependencia `tsx`. Las plantillas seleccionables, traducciones, integraciones, licencias y pruebas se conservan.

Se eliminaron 101 archivos entre fuentes, temporales y residuos de compilación, aproximadamente 9,7 MB locales. Esta reducción corresponde al proyecto en disco; los archivos sin uso ya no formaban parte de la descarga de la página. La compilación ahora retira automáticamente archivos obsoletos de `theme-dev` al terminar correctamente.

Validación: compilación, TypeScript y 23 pruebas aprobadas; HTML idéntico antes/después en 67 documentos y assets conservados idénticos byte por byte. El carrito aislado permite añadir, cambiar cantidad y eliminar. La comparación visual automática sigue pendiente por el bloqueo de acceso del navegador; no se han medido nuevos tiempos de carga.

### Gorro rosado por pago anticipado

El carrito compartido ofrece contraentrega o pago anticipado para todos los productos. Un pedido no vacío con preferencia anticipada desbloquea la ilustración del gorro; contraentrega la bloquea. Se guarda `fem_payment_preference` (`cod` / `prepaid`) y `fem_satin_reward` (`pending_payment_confirmation` / vacío) mediante Cart Ajax. No se crea un SKU ni se modifica el precio. La foto puede sustituirse desde el ajuste «Foto del gorro de satín» de la sección.

La selección del carrito es una preferencia, no una confirmación de cobro ni una restricción del método de pago de Shopify. Para entregar el regalo, operaciones debe verificar el pago anticipado real (un gorro por pedido); cualquier automatización de entrega debe comprobar el estado de pago y excluir contraentrega. Los atributos se conservan en el enlace de checkout de la vista local. Esta implementación no instala automatizaciones de fulfillment ni publica el tema.
