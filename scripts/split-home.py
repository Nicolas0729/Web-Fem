"""Extract independent homepage sections without changing their markup or settings."""
from html.parser import HTMLParser
import re,pathlib,json
root=pathlib.Path(__file__).resolve().parents[1];path=root/'theme-dev/sections/instant-QpL8HGFa3rotk5kl.liquid';source=path.read_text()
masked=re.sub(r'\{%-?[\s\S]*?-?%\}|\{\{-?[\s\S]*?-?\}\}',lambda m:re.sub(r'[^\n]',' ',m[0]),source)
lines=masked.splitlines(keepends=True);offsets=[0]
for l in lines:offsets.append(offsets[-1]+len(l))
void={'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}
class Parts(HTMLParser):
 def __init__(self):super().__init__(convert_charrefs=False);self.depth=0;self.active=False;self.start=None;self.parts=[];self.rootStart=0;self.rootEnd=0
 def pos(self):l,c=self.getpos();return offsets[l-1]+c
 def handle_starttag(self,t,a):
  if not self.active and dict(a).get('data-instant-type')=='root':self.active=True;self.depth=1;self.rootStart=self.pos()+len(self.get_starttag_text());return
  if not self.active:return
  if self.depth==1:self.start=self.pos()
  if t not in void:self.depth+=1
  elif self.depth==1:self.parts.append((self.start,self.pos()+len(self.get_starttag_text())))
 def handle_endtag(self,t):
  if not self.active or t in void:return
  self.depth-=1
  if self.depth==1:self.parts.append((self.start,masked.index('>',self.pos())+1))
  if self.depth==0:self.rootEnd=self.pos();self.active=False
p=Parts();p.feed(masked)
assert 8 <= len(p.parts) <= 25, len(p.parts)
names=['campaign-hero','evergreen-hero','benefits-marquee','bestsellers','subscription-benefits','trust-badges','expert-support','community','press-logos','press','faq','featured-product']
last=p.rootStart;calls=[];manifest=[]
for i,(start,end) in enumerate(p.parts):
 fragment=source[last:end];name='fem-home-'+(names[i] if i<len(names) else str(i+1));last=end
 assert fragment.count('{%')==fragment.count('%}')
 header="{% doc %}\nHomepage section extracted from the audited live design.\n@param {section} section - Current section settings\n{% enddoc %}\n"
 (root/'theme-dev/snippets'/f'{name}.liquid').write_text(header+fragment+'\n')
 calls.append("{% render '"+name+"', section: section %}")
 manifest.append({'component':name,'sourceBytes':len(fragment.encode()),'heading':re.findall(r'<h[1-3][^>]*>(.*?)</h[1-3]>',fragment,re.S)[:2]})
path.write_text(source[:p.rootStart]+'\n'+'\n'.join(calls)+source[last:])
(root/'audit/home-components.json').write_text(json.dumps(manifest,ensure_ascii=False,indent=2));print('Homepage components:',len(manifest))
