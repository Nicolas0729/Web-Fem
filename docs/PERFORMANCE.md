# Optimización de rendimiento — 29 de septiembre de 2026

Se revisaron las referencias de 656 archivos del tema, servidor y herramientas. Los cambios reducen el código enviado, las precargas y el trabajo repetido del servidor local. Se mantienen los estilos, fuentes utilizadas, contenido, video del banner y lógica comercial.

## Medidas antes y después

| Medida | Antes | Después |
| --- | ---: | ---: |
| JavaScript total del tema generado, sin comprimir | 441.714 bytes | 239.810 bytes |
| Scripts externos declarados para carga inicial en el inicio | 19 | 14 |
| Precargas declaradas en el inicio | 15 | 5 |
| Imágenes sin carga diferida en la ficha de producto revisada | 27 | 9 |
| Imágenes sin carga diferida en el catálogo revisado | 33 | 7 |

El paquete completo de JavaScript disminuyó un 45,7 % (201.904 bytes). Esto no representa el peso descargado por una página ni un porcentaje de mejora en su tiempo de carga. Los recuentos proceden del HTML servido; no incluyen solicitudes posteriores de aplicaciones o importaciones. Las imágenes visibles con `loading="lazy"` pueden descargarse inmediatamente según el navegador.

Se eliminaron cinco recursos antiguos sin referencias, por un total de 2.447.100 bytes: una fotografía PNG y cuatro archivos de fuentes del banner anterior. Como ya no se utilizaban, su eliminación reduce el paquete del proyecto, no la descarga inicial de la página.

Las medidas locales están en `audit/performance.json`. Las capturas temporales de `work/performance-before` y `work/performance-after` se eliminaron durante la limpieza del 1 de octubre de 2026; las pruebas conservan sus fixtures en `tests/fixtures/`. Los datos y metadatos públicos de Shopify pueden cambiar entre capturas.

## Cambios aplicados

- Minificación de 61 archivos JavaScript, conservando los nombres globales que comparten los componentes de Horizon.
- Carga de módulos cuando aparecen sus componentes; los componentes dentro de diálogos cerrados esperan a su apertura. La búsqueda conserva su atajo de teclado.
- Retirada de precargas de módulos y de declaraciones locales duplicadas. Las imágenes posteriores a los primeros candidatos visibles usan carga diferida nativa, conservando sus URLs, alternativas y dimensiones.
- Reutilización de la geometría de iconos SVG repetidos mediante símbolos; se conservan los atributos del icono, sus títulos y trazados.
- Menos recorridos del DOM al añadir contenido y reutilización del documento ya analizado para leer los productos del inicio.
- Caché de assets locales con invalidación por versión, límite de 32 MiB y reutilización de la compresión gzip. Los datos dinámicos de Shopify no se fijan en esta caché.
- Retirada de herramientas de extracción que ya no participan en la compilación del inicio nativo.

En esta medición de septiembre las demás plantillas aún conservaban el motor de Instant. La migración del 5 de octubre lo sustituye por controles propios: [NATIVE-THEME.md](NATIVE-THEME.md). Se mantienen las aplicaciones comerciales y los destinos oficiales de compra.

## Comprobaciones

- Compilación del tema y TypeScript sin errores.
- 17 pruebas aprobadas. La comparación de 66 documentos guardados conserva texto, campos de formularios, imágenes, dimensiones y geometría de iconos. Las pruebas del inicio nativo comprueban su estructura y precios dinámicos.
- Siete rutas respondieron con HTTP 200: inicio, producto, catálogo, colecciones, artículo, planes y búsqueda.
- Assets locales verificados con gzip, ETag/304 y HEAD. El video responde correctamente a rangos válidos (206) e inválidos (416).
- El validador Liquid se ejecutó sobre los archivos generados modificados. El resultado global sigue siendo inválido por hallazgos del tema heredado: URLs de recursos, convenciones de variables, objetos desconocidos, complejidad y tamaño de esquemas. No constituye una validación completa aprobada para publicar en Shopify.

La política de seguridad del navegador bloqueó el acceso a `http://localhost:3000/`; no se realizó comparación visual ni prueba interactiva de esta revisión. Las comprobaciones de estructura no sustituyen esa revisión. Tampoco se midieron Lighthouse o Core Web Vitals, por lo que no se atribuye una mejora numérica al tiempo de carga. La vista local sigue dependiendo de la respuesta de Shopify.
