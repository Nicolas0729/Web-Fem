import {registerHooks,createRequire} from 'node:module';
import {pathToFileURL} from 'node:url';
const require=createRequire(new URL('../package.json',import.meta.url));
registerHooks({resolve(specifier,context,nextResolve){
 if(specifier.startsWith('@shopify/') && context.parentURL?.includes('/skills/shopify-liquid/scripts/validate.mjs'))return {url:pathToFileURL(require.resolve(specifier)).href,shortCircuit:true};
 return nextResolve(specifier,context);
}});
