/** Source-level repairs: dimensions come from Shopify image objects, never guessed. */
export function improveThemeMarkup(source:string, staticImages:Record<string,{width?:number;height?:number}>= {}):string {
  return source.replace(/<img\b(?:"[^"]*"|'[^']*'|[^'">])*>/g,tag=>{
    if(/\swidth\s*=/.test(tag)&&/\sheight\s*=/.test(tag))return tag;
    const image=tag.match(/src="\{\{\s*([\w.[\]]+)\s*\|\s*image_url:/)?.[1];
    let dimensions='';
    if(image)dimensions=`width="{{ ${image}.width }}" height="{{ ${image}.height }}"`;
    else if(tag.includes('media.media_type'))dimensions='width="{{ media.preview_image.width }}" height="{{ media.preview_image.height }}"';
    else if(tag.includes('product.selected_or_first_available_variant.featured_image | default: product.featured_image'))dimensions='width="{{ product.selected_or_first_available_variant.featured_image.width | default: product.featured_image.width }}" height="{{ product.selected_or_first_available_variant.featured_image.height | default: product.featured_image.height }}"';
    else if(tag.includes('fem-view-video__sizer')){
      const decoded=decodeURIComponent(tag);const width=decoded.match(/width='([\d.]+)'/)?.[1];const height=decoded.match(/height='([\d.]+)'/)?.[1];
      if(width&&height)dimensions=`width="${Math.round(Number(width)*4)}" height="${Math.round(Number(height)*4)}"`;
    }
    const staticImage=staticImages[tag.match(/src="([^"]+)"/)?.[1]??''];
    if(!dimensions&&staticImage?.width&&staticImage?.height)dimensions=`width="${staticImage.width}" height="${staticImage.height}"`;
    if(!dimensions)return tag;
    return tag.replace(/\s(?:width|height)="[^"]*"/g,'').replace(/\s*\/?>$/,` ${dimensions}>`);
  }).replace(/<script \{% if section.settings.section_preload == "false" %\}class="gps-link" delay \{% else %\}src\{% endif %\}="([^"]+)"/g, '<script {% if section.settings.section_preload == "false" %}class="gps-link" delay="$1"{% else %}src="$1"{% endif %}')
    .replace('<p><p>💬','<p>💬')
    .replace('<p>GRUPO MSM S.A.S.</strong>podrá','<p><strong>GRUPO MSM S.A.S.</strong>podrá');
}
