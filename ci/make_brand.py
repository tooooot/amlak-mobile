#!/usr/bin/env python3
"""يولّد أيقونة وشاشة بداية «إدارة أملاك» (أخضر بحري + بيت زعفراني). يستعمل: make_brand.py icons|android <dir>"""
import sys, os
from PIL import Image, ImageDraw
TEAL=(14,92,88); TEAL2=(23,135,127); SAF=(246,176,74); ACC=(240,160,48)
def mark(size, bg=TEAL, fg=SAF, k=None):
    S=size*2; im=Image.new('RGBA',(S,S),(0,0,0,0)); d=ImageDraw.Draw(im); k=(k or S/24*0.78)
    ox=(S-24*k)/2; oy=(S-(20.9-3.6)*k)/2-3.6*k
    P=lambda x,y:(ox+x*k,oy+y*k)
    d.polygon([P(3.2,11.2),P(12,3.6),P(20.8,11.2),P(20.8,20.2),P(20.0,20.9),P(4.0,20.9),P(3.2,20.2)],fill=fg)
    r=2.5*k; cx,cy=P(12,12.4); d.ellipse((cx-r,cy-r,cx+r,cy+r),fill=bg)
    d.polygon([P(11.1,14.3),P(12.9,14.3),P(13.6,18.5),P(10.4,18.5)],fill=bg)
    return im.resize((size,size),Image.LANCZOS)
def bgimg(w,h):
    im=Image.new('RGB',(w,h),TEAL); d=ImageDraw.Draw(im)
    for y in range(h):  # تدرّج رأسي خفيف
        t=y/h; d.line((0,y,w,y),fill=tuple(int(TEAL[i]+(TEAL2[i]-TEAL[i])*t*0.6) for i in range(3)))
    # دائرة زعفرانية شفافة في الزاوية
    ov=Image.new('RGBA',(w,h),(0,0,0,0)); ImageDraw.Draw(ov).ellipse((w*0.55,h*0.62,w*1.25,h*1.32),fill=ACC+(46,))
    return Image.alpha_composite(im.convert('RGBA'),ov).convert('RGB')
def splash(W,H):
    c=bgimg(W,H); u=min(W,H); m=mark(int(u*0.36)); wm=Image.open(os.path.join(os.path.dirname(os.path.abspath(__file__)),'wordmark.png')).convert('RGBA')
    ww=int(u*0.46); wm=wm.resize((ww,int(wm.size[1]*ww/wm.size[0])),Image.LANCZOS)
    total=m.size[1]+int(u*0.03)+wm.size[1]; y0=(H-total)//2
    c.paste(m,((W-m.size[0])//2,y0),m); c.paste(wm,((W-ww)//2,y0+m.size[1]+int(u*0.03)),wm); return c
def icons(out):
    os.makedirs(out,exist_ok=True)
    a=bgimg(1024,1024); m=mark(960); a.paste(m,((1024-960)//2,(1024-960)//2),m); a.save(out+'/icon.png')
    splash(2732,2732).save(out+'/splash.png')
def android(res):
    sizes={'mdpi':48,'hdpi':72,'xhdpi':96,'xxhdpi':144,'xxxhdpi':192}
    for dn,px in sizes.items():
        d=f'{res}/mipmap-{dn}'
        if not os.path.isdir(d): continue
        full=bgimg(px,px); m=mark(int(px*1.05)); full.paste(m,((px-m.size[0])//2,(px-m.size[1])//2),m)
        full.save(d+'/ic_launcher.png')
        rd=Image.new('L',(px,px),0); ImageDraw.Draw(rd).ellipse((0,0,px-1,px-1),fill=255); r=Image.new('RGBA',(px,px),(0,0,0,0)); r.paste(full,(0,0),rd); r.save(d+'/ic_launcher_round.png')
        F=int(px*108/48); fg=Image.new('RGBA',(F,F),(0,0,0,0)); mm=mark(int(F*0.78)); fg.paste(mm,((F-mm.size[0])//2,(F-mm.size[1])//2),mm); fg.save(d+'/ic_launcher_foreground.png')
    os.makedirs(res+'/values',exist_ok=True)
    open(res+'/values/ic_launcher_background.xml','w').write('<?xml version="1.0" encoding="utf-8"?>\n<resources>\n    <color name="ic_launcher_background">#0E5C58</color>\n</resources>\n')
    import glob
    for p in glob.glob(res+'/drawable*/splash.png'):
        W,H=Image.open(p).size; splash(W,H).save(p)
if __name__=='__main__':
    {'icons':icons,'android':android}[sys.argv[1]](sys.argv[2])
