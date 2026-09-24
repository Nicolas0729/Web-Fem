"""Record real dimensions of existing static images missing size attributes."""
import pathlib,re,json,hashlib,urllib.request,subprocess,concurrent.futures
root=pathlib.Path(__file__).resolve().parents[1];cache=root/'.cache/image-dimensions';cache.mkdir(parents=True,exist_ok=True)
urls=set()
for p in (root/'theme-source').rglob('*.liquid'):
 for m in re.finditer(r'<img\b(?:"[^"]*"|\x27[^\x27]*\x27|[^\x27">])*>',p.read_text()):
  tag=m[0]
  if re.search(r'\swidth\s*=',tag) and re.search(r'\sheight\s*=',tag):continue
  src=re.search(r'src="(https://[^"]+)"',tag)
  if src:urls.add(src[1])
def get(url):
 try:
  raw=urllib.request.urlopen(url,timeout=20).read()
  if b'<svg' in raw[:1000]:
   text=raw.decode();view=re.search(r'viewBox=["\x27]([\d.\s-]+)',text);w=re.search(r'\bwidth=["\x27]([\d.]+)',text);h=re.search(r'\bheight=["\x27]([\d.]+)',text)
   if view:w,h=view[1].split()[2:4]
   else:w,h=w[1],h[1]
   return url,{'width':round(float(w)),'height':round(float(h))}
  path=cache/hashlib.sha256(url.encode()).hexdigest();path.write_bytes(raw)
  text=subprocess.check_output(['sips','-g','pixelWidth','-g','pixelHeight',str(path)],text=True,stderr=subprocess.DEVNULL)
  return url,{'width':int(re.search('pixelWidth: (\\d+)',text)[1]),'height':int(re.search('pixelHeight: (\\d+)',text)[1])}
 except Exception as e:return url,{'error':str(e)}
result=dict(concurrent.futures.ThreadPoolExecutor(4).map(get,sorted(urls)))
(root/'audit/image-dimensions.json').write_text(json.dumps(result,indent=2));print(json.dumps(result,indent=2))
