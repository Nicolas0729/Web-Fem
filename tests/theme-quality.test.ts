import test from 'node:test';
import assert from 'node:assert/strict';
import {improveThemeMarkup} from '../src/lib/theme-quality.ts';
test('Image aspect ratio is sourced from Shopify, without replacing merchant dimensions',()=>{
 assert.equal(improveThemeMarkup('<img src="{{ product_image | image_url: width: 800 }}">'),'<img src="{{ product_image | image_url: width: 800 }}" width="{{ product_image.width }}" height="{{ product_image.height }}">');
 const existing='<img src="/image.webp" width="800" height="600">';assert.equal(improveThemeMarkup(existing),existing);
 const unknown='<img src="https://example.com/unknown.webp">';assert.equal(improveThemeMarkup(unknown),unknown);
});
test('Known malformed copy markup is repaired without changing the text',()=>{
 assert.equal(improveThemeMarkup('<p><p>💬 Test</p>'),'<p>💬 Test</p>');
 assert.equal(improveThemeMarkup('<p>GRUPO MSM S.A.S.</strong>podrá'),'<p><strong>GRUPO MSM S.A.S.</strong>podrá');
});
