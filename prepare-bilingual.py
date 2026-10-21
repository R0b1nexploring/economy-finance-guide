from html.parser import HTMLParser
from pathlib import Path
import html, json, re

ROOT = Path(__file__).resolve().parent
VOID = {'area','base','br','col','embed','hr','img','input','link','meta','param','source','track','wbr'}

class Node:
    def __init__(self, tag='', attrs=None, parent=None):
        self.tag, self.attrs, self.parent, self.children = tag, dict(attrs or []), parent, []
    def inner(self):
        return ''.join(c.render() if isinstance(c,Node) else c for c in self.children)
    def render(self):
        if not self.tag: return self.inner()
        attrs=''.join(' '+k+(('="'+html.escape(str(v),quote=True)+'"') if v is not None else '') for k,v in self.attrs.items())
        return '<'+self.tag+attrs+'>'+('' if self.tag in VOID else self.inner()+'</'+self.tag+'>')
    def walk(self):
        yield self
        for c in self.children:
            if isinstance(c,Node): yield from c.walk()

class Document(HTMLParser):
    def __init__(self, text):
        super().__init__(convert_charrefs=False)
        self.root=Node(); self.current=self.root; self.feed(text)
    def handle_decl(self,data): self.current.children.append('<!'+data+'>')
    def handle_starttag(self,tag,attrs):
        n=Node(tag,attrs,self.current);self.current.children.append(n)
        if tag not in VOID: self.current=n
    def handle_endtag(self,tag):
        n=self.current
        while n.parent is not None and n.tag!=tag:n=n.parent
        if n.parent is not None:self.current=n.parent
    def append_text(self,data):
        if self.current.children and isinstance(self.current.children[-1],str):self.current.children[-1]+=data
        else:self.current.children.append(data)
    def handle_data(self,data):self.append_text(data)
    def handle_entityref(self,name):self.append_text('&'+name+';')
    def handle_charref(self,name):self.append_text('&#'+name+';')
    def handle_comment(self,data):self.current.children.append('<!--'+data+'-->')

def plain(node):
    return html.unescape(re.sub('<[^>]+>','',node.inner())).strip()

def chapter(node):
    n=node
    while n:
        if n.tag=='section' and n.attrs.get('id'):return n.attrs['id']
        n=n.parent
    return ''

def inside_body(node):
    n=node
    while n:
        if 'chapter-body' in n.attrs.get('class','').split(): return True
        n=n.parent
    return False

def prepare():
    doc=Document((ROOT/'index.html').read_text())
    groups={'foundations':[],'modules-3-4':[],'modules-5-6':[],'module-7-capstone':[]}
    eligible={'p','li','th','td','h3','h4','h5','h6'}
    for body in doc.root.walk():
        if 'chapter-body' not in body.attrs.get('class','').split():continue
        region=chapter(body); count=0
        for n in body.walk():
            if n.tag not in eligible or not plain(n):continue
            if any(x is not n and x.tag in eligible for x in n.walk()):continue
            count+=1;key=region+'-'+str(count).zfill(3)
            n.attrs['data-pair-id']=key
            group='modules-3-4' if region in ['module-3','module-4'] else 'modules-5-6' if region in ['module-5','module-6'] else 'module-7-capstone' if region in ['module-7','capstone'] else 'foundations'
            groups[group].append({'id':key,'en':n.inner()})
    for name,units in groups.items():
        (ROOT/(name+'-units.json')).write_text(json.dumps(units,ensure_ascii=False,indent=2))
    ui={}
    def visit(n,ignore=False):
        ignore=ignore or n.tag in ['script','style'] or 'chapter-body' in n.attrs.get('class','').split()
        if ignore:return
        for c in n.children:
            if isinstance(c,Node):visit(c,ignore)
            elif re.search('[A-Za-z]',html.unescape(c)):
                text=html.unescape(c).strip()
                if text and not text.startswith('<!'):ui[text]=''
    visit(doc.root)
    (ROOT/'ui-units.json').write_text(json.dumps(ui,ensure_ascii=False,indent=2))
    (ROOT/'annotated-en.html').write_text(doc.root.render())
    print(json.dumps({'chapter_units':{k:len(v) for k,v in groups.items()},'ui_units':len(ui)},indent=2))

if __name__=='__main__':prepare()
