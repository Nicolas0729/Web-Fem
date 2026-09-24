# Web-Fem — storefront de Fem

Tema Shopify nativo con mejoras en TypeScript y una vista local conectada a la tienda.

## Ejecutar

```sh
npm ci
npm run build
npm run dev
```

Abrir http://localhost:3000. Requiere conexión a internet: esta vista obtiene HTML y datos de Shopify y aplica correcciones locales. **No renderiza el tema Liquid modificado.** Sirve para revisar navegación, assets y carrito. La revisión técnica está en `/__review`.

Para revisar el tema generado con el motor real de Shopify:

```sh
npm run theme:dev
```

Requiere iniciar sesión con una cuenta autorizada en `fd668e-73.myshopify.com`. Shopify CLI creará una vista de desarrollo. No ejecutar `theme push --live` para revisar.

## Estructura

- `theme-source/`: copia del tema existente; referencia para reconstrucción reproducible.
- `theme-dev/`: tema generado; modificar las fuentes/scripts y volver a compilar.
- `src/`: tipos, reglas de navegación, carga de componentes y accesibilidad.
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

Las imágenes, fuentes y aplicaciones de terceros siguen usando sus CDN originales. No se ha publicado el tema ni cambiado productos de la tienda.

## Videos de Comunidad Fem

Los seis videos se sirven desde el CDN de Shopify. Incluyen controles nativos para reproducir, pausar, activar audio y ampliar incluso cuando el navegador restringe autoplay. Se respeta la preferencia de movimiento reducido. Los enlaces a Instagram se conservan.

El repositorio no incluye credenciales, registros de autenticación, inventarios administrativos ni los materiales de branding de VERA & CO.
