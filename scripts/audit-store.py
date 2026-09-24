"""Read-only public storefront inventory; never submits forms or creates carts."""
import concurrent.futures, hashlib, json, pathlib, re, urllib.request, urllib.error
from html.parser import HTMLParser
from urllib.parse import urljoin, urlsplit
ROOT=pathlib.Path(__file__).resolve().parents[1]
ORIGIN='https://femprobiotics.co'
(ROOT/'audit/html').mkdir(parents=True,exist_ok=True)
class Document(HTMLParser):
 def __init__(self):
  super().__init__(); self.links=[]; self.assets=[]; self.forms=[]; self.sections=[]; self.bad=[]; self.headings=[]; self.title=''; self.capture=None
 def handle_starttag(self,tag,attrs):
  a=dict(attrs)
  if tag=='a' and 'href' in a:
   self.links.append(a['href'])
   if a['href'] in ['null','undefined','', '#']: self.bad.append(a)
  if tag in ['script','link','img','source','iframe']:
   self.assets.append({'tag':tag,**{k:v for k,v in a.items() if k in ['src','href','srcset','type','loading','width','height']}})
  if tag=='form': self.forms.append(a)
  if a.get('id','').startswith('shopify-section'): self.sections.append(a['id'])
  if tag in ['h1','h2','h3','title']: self.capture=tag
 def handle_endtag(self,t):
  if t==self.capture:self.capture=None
 def handle_data(self,d):
  if self.capture=='title':self.title+=d.strip()
  elif self.capture and d.strip():self.headings.append([self.capture,d.strip()])
def fetch(path):
 url=urljoin(ORIGIN,path); key=hashlib.sha256(url.encode()).hexdigest()[:16]
 try:
  with urllib.request.urlopen(url,timeout=35) as r: html=r.read().decode(); status=r.status; final=r.url
 except urllib.error.HTTPError as e: html=e.read().decode(); status=e.code; final=e.url
 except Exception as e:return {'url':url,'error':str(e)}
 (ROOT/'audit/html'/f'{key}.html').write_text(html)
 d=Document();d.feed(html)
 return {'url':url,'status':status,'finalUrl':final,'file':f'html/{key}.html','bytes':len(html.encode()),'title':d.title,'headings':d.headings,'links':sorted(set(d.links)),'invalidLinks':d.bad,'assets':d.assets,'forms':d.forms,'sections':d.sections}
urls=json.loads((ROOT/'audit/sitemap-urls.json').read_text())
urls+= [ORIGIN+x for x in ['/collections','/collections/all','/search','/search?q=fem','/cart','/policies/privacy-policy','/policies/refund-policy']]
results=[]
with concurrent.futures.ThreadPoolExecutor(5) as pool:
 for result in pool.map(fetch,sorted(set(urls))):
  results.append(result);print(result['url'], result.get('status',result.get('error')),flush=True)
(ROOT/'audit/public-inventory.json').write_text(json.dumps(results,ensure_ascii=False,indent=2))
print('Audited',len(results),'pages')
