import json,urllib.request,urllib.parse,sys,time
UA={'User-Agent':'nyzar-prova/1.0 (gravenbandlp@gmail.com)'}
def api(**p):
    time.sleep(0.5)  # gentile con Commons: niente raffiche
    p.update(format='json'); u='https://commons.wikimedia.org/w/api.php?'+urllib.parse.urlencode(p)
    return json.loads(urllib.request.urlopen(urllib.request.Request(u,headers=UA),timeout=60).read())
def cerca(q,n=20):
    r=api(action='query',list='search',srnamespace=6,srlimit=n,srsearch=q)
    return [x['title'] for x in r['query']['search'] if x['title'].lower().endswith(('.jpg','.jpeg','.png','.tif','.tiff'))]
def info(t,w=2400):
    r=api(action='query',prop='imageinfo',iiprop='url|extmetadata|size',iiurlwidth=w,titles=t)
    ii=list(r['query']['pages'].values())[0]['imageinfo'][0]; md=ii['extmetadata']
    return ii['thumburl'], ii['descriptionurl'], md.get('LicenseShortName',{}).get('value'), (ii['width'],ii['height'])
def scarica(t,dst,w=2400):
    url,desc,lic,size=info(t,w)
    open(dst,'wb').write(urllib.request.urlopen(urllib.request.Request(url,headers=UA),timeout=120).read())
    return desc,lic,size
if __name__=='__main__':
    for q in sys.argv[1:]:
        print('==',q)
        for t in cerca(q): print('  ',t)
