from pathlib import Path
import importlib.util, json, html, re

ROOT=Path(__file__).resolve().parent
spec=importlib.util.spec_from_file_location('atlas_dom',ROOT/'prepare-bilingual.py')
dom=importlib.util.module_from_spec(spec);spec.loader.exec_module(dom)
Node,Document=dom.Node,dom.Document
translations={};units=[]
for group in ['foundations','modules-3-4','modules-5-6','module-7-capstone']:
    original=json.loads((ROOT/(group+'-units.json')).read_text())
    translated=json.loads((ROOT/(group+'-zh.json')).read_text())
    assert {x['id'] for x in original}==set(translated),group
    assert all(isinstance(v,str) and v.strip() for v in translated.values()),group
    for u in original:
        assert re.findall(r'<[^>]+>',u['en'])==re.findall(r'<[^>]+>',translated[u['id']]),u['id']
    translations.update(translated);units.extend(original)

ui=json.loads((ROOT/'ui-zh.json').read_text())
for unit in units:
    en_doc=Document(unit['en']);zh_doc=Document(translations[unit['id']])
    en_links=[n for n in en_doc.root.walk() if n.tag=='a']
    zh_links=[n for n in zh_doc.root.walk() if n.tag=='a']
    for a,b in zip(en_links,zh_links):ui[dom.plain(a)]=dom.plain(b)

doc=Document((ROOT/'annotated-en.html').read_text())
original_ids={n.attrs['id'] for n in doc.root.walk() if 'id' in n.attrs}
pair_count=0
for n in list(doc.root.walk()):
    key=n.attrs.get('data-pair-id')
    if not key:continue
    en=n.inner();zh=translations[key]
    if html.unescape(en).strip()==html.unescape(zh).strip():
        n.attrs['data-language-neutral']='true';continue
    pair_count+=1
    if n.tag=='p':
        en_node=Node('p',{'class':'bi-en','lang':'en'},n);en_node.children=[en]
        zh_node=Node('p',{'class':'bi-zh','lang':'zh-CN'},n);zh_node.children=[zh]
        n.tag='div';n.attrs['class']=(n.attrs.get('class','')+' parallel-block').strip();n.children=[en_node,zh_node]
    elif n.tag=='li':
        n.children=[f'<div class="parallel-list"><div class="bi-en" lang="en">{en}</div><div class="bi-zh" lang="zh-CN">{zh}</div></div>']
    else:
        n.children=[f'<span class="bi-en" lang="en">{en}</span><span class="bi-zh" lang="zh-CN">{zh}</span>']

for n in doc.root.walk():
    if n.tag=='title':n.children=['Economic Atlas — 中英文对照版 / Bilingual Edition']
    if n.tag=='html':n.attrs['lang']='en'
    if n.tag=='body':n.attrs['data-language']='both';n.attrs['class']='bilingual-edition'
    if n.tag=='h1':
        n.attrs['data-bilingual-ready']='true'
        n.children=['<span class="bi-en" lang="en">Explore the<br><em>whole map.</em></span><span class="bi-zh hero-zh" lang="zh-CN">探索整张经济金融地图。</span>']
    if n.attrs.get('class')=='wordmark':
        n.attrs['data-bilingual-ready']='true'
        n.children=['<span class="bi-en" lang="en">ECONOMIC <strong>ATLAS</strong></span><span class="bi-zh" lang="zh-CN">经济金融地图</span>']

unknown=set();ui_count=0
def lookup(text):
    if text in ui:return ui[text]
    match=re.fullmatch(r'(\d+) min reading',text)
    if match:return '英文约'+match[1]+'分钟'
    if re.fullmatch(r'[a-z0-9.-]+\.(?:gov|org|uk|eu|cn|in)',text):return text
    if re.fullmatch(r'(?:CU|LCU|US\$)[\s\d,.$%+−–-]+',text):return text
    if text=='A–Z':return text
    unknown.add(text);return None

def translate_ui(n):
    global ui_count
    if n.tag in ['head','style','script'] or n.attrs.get('data-pair-id') or n.attrs.get('data-bilingual-ready'):return
    new=[]
    for child in n.children:
        if isinstance(child,Node):translate_ui(child);new.append(child)
        else:
            text=html.unescape(child).strip()
            if text.startswith('<!') or not re.search('[A-Za-z]',text):new.append(child);continue
            zh=lookup(text)
            if zh is None or zh==text:new.append(child);continue
            ui_count+=1
            leading=child[:len(child)-len(child.lstrip())];trailing=child[len(child.rstrip()):]
            new.append(leading+'<span class="bi-ui"><span class="bi-en" lang="en">'+html.escape(text)+'</span><span class="bi-zh" lang="zh-CN">'+html.escape(zh)+'</span></span>'+trailing)
    n.children=new
    if 'aria-label' in n.attrs:
        label=n.attrs['aria-label'];known=ui.get(label)
        if known:n.attrs['aria-label']=label+' / '+known
        elif label=='Guide contents':n.attrs['aria-label']='Guide contents / 学习目录'
        elif label=='Loan stages':n.attrs['aria-label']='Loan stages / 贷款的四个阶段'
        elif label=='A schematic of the connections discussed in this region':n.attrs['aria-label']='Connections in this region / 本区域的联系示意图'
translate_ui(doc.root)
assert not unknown,'Untranslated UI: '+repr(sorted(unknown))

mode_html='''<div class="language-controls" role="group" aria-label="Reading language / 阅读语言"><button type="button" data-language-choice="both" aria-pressed="true">EN + 中文</button><button type="button" data-language-choice="en" aria-pressed="false">English</button><button type="button" data-language-choice="zh" aria-pressed="false">中文</button></div>'''
for n in doc.root.walk():
    if n.attrs.get('class')=='header-actions':n.children.insert(0,mode_html)
    if n.attrs.get('class')=='hero':n.children.insert(0,'<div class="bilingual-badge">Bilingual edition · 中英文对照版</div>')
    if n.tag=='style':n.children.append('\n'+(ROOT/'bilingual.css').read_text())
    if n.tag=='script':n.children=[(ROOT/'interactions-bilingual.js').read_text()]

rendered=doc.root.render()
final_doc=Document(rendered)
ids=[n.attrs['id'] for n in final_doc.root.walk() if 'id' in n.attrs]
assert len(ids)==len(set(ids)),'Duplicate ids'
assert original_ids.issubset(set(ids)),'An original anchor or control was lost'
assert '\\"' not in rendered,'Literal quote escaping'
(ROOT/'index-bilingual.html').write_text(rendered)
report={'output':str(ROOT/'index-bilingual.html'),'translated_content_units':len(translations),'paired_content_units':pair_count,'paired_ui_labels':ui_count,'missing_translations':0,'bytes':len(rendered.encode()),'original_anchors_preserved':len(original_ids)}
(ROOT/'bilingual-coverage.json').write_text(json.dumps(report,ensure_ascii=False,indent=2))
print(json.dumps(report,ensure_ascii=False,indent=2))
