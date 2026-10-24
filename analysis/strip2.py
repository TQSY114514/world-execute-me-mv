
import numpy as np, json
from PIL import Image, ImageDraw, ImageFont
SR=44100
x=np.fromfile(r"D:\ds.world.execute\analysis\track.f32",dtype=np.float32)
n=len(x); dur=n/SR
P=0.461538; D0=0.222
locked=[0,14.8,29.5,44.3,59.1,73.8,88.6,103.4,118.2,129.2,133.0,147.8,162.5,177.3,184.7,192.1,199.5,206.0,209.5,212.5]
lat=[D0+14.76923*k for k in range(0,15)]
W,H=1920,1080
img=Image.new("RGB",(W,H),(6,6,8)); d=ImageDraw.Draw(img)
try: f=ImageFont.load_default(size=17)
except: f=ImageFont.load_default()
L,Rr=120,1880
def X(t): return int(L+(Rr-L)*min(t,212.5)/212.5)
BG=(38,38,44); BO=(240,240,242); AC=(0,240,255); RD=(255,42,42); DIM=(90,90,98)

d.text((40,40),"Mili - world.execute(me);  |  211.93s  |  130.0000 BPM  |  grid 0.222 + 14.7692k",font=f,fill=BO)
for y0,y1,lab in ((110,340,"AMPLITUDE"),(380,610,"LOUDNESS dB"),(650,880,"STRUCTURAL NOVELTY"),(920,1000,"CUT vs GRID")):
    d.text((40,y0+6),lab,font=f,fill=DIM)
    d.line([(L,y0),(Rr,y0)],fill=BG); d.line([(L,y1),(Rr,y1)],fill=BG)

# amplitude RMS envelope
h=441; m=n//h
r=np.sqrt((x[:m*h].astype(np.float64).reshape(m,h)**2).mean(1))
db=20*np.log10(np.maximum(r,1e-9))
for px in range(L,Rr):
    a=int((px-L)/(Rr-L)*m); b=max(int((px-L+1)/(Rr-L)*m),a+1)
    v=float(np.sqrt((r[a:b]**2).mean()))
    amp=min(v*2.2,1.0)
    d.line([(px,225-amp*105),(px,225+amp*105)],fill=(240,240,242))
# dB lane
for i in range(m):
    t=i*h/SR; y=int(600-min(max((db[i]+60)/60,0),1)*200)
    d.point((X(t),y),fill=AC)
# novelty
rep=json.load(open(r"D:\ds.world.execute\analysis\report4.json"))
nov=np.array([[a,b] for a,b in rep["nov"]],dtype=float)
mx=nov[:,1].max()
d.line([(X(a),int(870-b/mx*200)) for a,b in nov],fill=BO)
# cut vs grid
for t in lat:
    if t<=0: continue
    d.line([(X(t),925),(X(t),975)],fill=AC)
for t in locked[1:-1]:
    d.line([(X(t),940),(X(t),1000)],fill=RD)
img.save(r"D:\ds.world.execute\analysis\strip2.png")
print("ok")
