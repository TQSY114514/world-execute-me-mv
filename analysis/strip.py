
import numpy as np, json
from PIL import Image, ImageDraw
SR=44100
x=np.fromfile(r"D:\ds.world.execute\analysis\track.f32",dtype=np.float32)
n=len(x); dur=n/SR
P=0.4615400; PH=0.2422   # first downbeat
locked=[0,14.8,29.5,44.3,59.1,73.8,88.6,103.4,118.2,129.2,133.0,147.8,162.5,177.3,184.7,192.1,199.5,206.0,209.5,212.5]
nov_peaks=[11.25,15.0,17.25,26.5,28.75,33.0,37.0,55.25,57.5,74.75,77.25,82.25,93.75,107.25,115.5,123.25,135.25,140.0,170.25,174.75,181.5,187.0,190.0,192.5,195.75,200.0]

W,H=1920,1080
img=Image.new("RGB",(W,H),(6,6,8)); d=ImageDraw.Draw(img)
L=140; R=W-40
def X(t): return int(L+(R-L)*min(t,212.5)/212.5)
# lane frames
for y in (330,560,790):
    d.line([(L,y),(R,y)],fill=(38,38,44))
# waveform lane 40..320
pk=float(np.percentile(np.abs(x),99.95))
for px in range(L,R):
    a=int((px-L)/(R-L)*n); b=int((px-L+1)/(R-L)*n); b=max(b,a+1)
    seg=x[a:b]/pk
    y0=int(180-float(seg.max())*130); y1=int(180-float(seg.min())*130)
    d.line([(px,y0),(px,y1)],fill=(240,240,242))
# rms dB lane 330..550
win=441; m=len(x)//win
r=np.sqrt((x[:m*win].astype(np.float64).reshape(m,win)**2).mean(1))
db=20*np.log10(np.maximum(r,1e-9))
for i in range(m):
    t=i*win/SR; y=int(550-min(max((db[i]+60)/60,0),1)*200)
    if i%2==0: d.line([(X(t),y),(X(t+0.02),y)],fill=(0,240,255))
# novelty lane 560..780
rep=json.load(open(r"D:\ds.world.execute\analysis\report4.json"))
nov=np.array([[a,b] for a,b in rep["nov"]])
mx=nov[:,1].max()
pts=[(X(a),int(780-b/mx*200)) for a,b in nov]
d.line(pts,fill=(240,240,242))
# beat grid ticks lane 800..830
k=0
while True:
    t=PH+k*P
    if t>212.5: break
    if k%4==0:
        d.line([(X(t),800),(X(t),830)],fill=(38,38,44))
    k+=1
# locked cuts
for t in locked[1:-1]:
    d.line([(X(t),0),(X(t),1080)],fill=(255,42,42))
# novelty peaks
for t in nov_peaks:
    d.line([(X(t),780),(X(t),790)],fill=(0,240,255))
# end of music
d.line([(X(206.05),0),(X(206.05),1080)],fill=(240,240,242))
d.line([(X(207.323),0),(X(207.323),1080)],fill=(0,240,255))
img.save(r"D:\ds.world.execute\analysis\strip.png")
print("ok")
# key anchors in beats
def beat(t): return (t-PH)/P
for t in [15.0,33.0,59.25,74.0,103.5,162.5,187.0,192.5,200.0,206.05,207.323]:
    print(t,"beat",round(beat(t),2),"bar",round(beat(t)/4,2))
