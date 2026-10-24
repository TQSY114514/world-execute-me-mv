
import numpy as np, json
from PIL import Image, ImageDraw

SR=44100
x=np.fromfile(r"D:\ds.world.execute\analysis\track.f32",dtype=np.float32)
n=len(x); dur=n/SR
WIN,HOP=2048,512
nf=1+(n-WIN)//HOP
win=np.hanning(WIN).astype(np.float32)
idx=np.arange(WIN)[None,:]+HOP*np.arange(nf)[:,None]
mag=np.abs(np.fft.rfft(x[idx]*win,axis=1)).astype(np.float32)
L=np.log1p(mag*20.0)
fps=SR/HOP
fr_t=(np.arange(nf)*HOP+WIN/2)/SR
flux=np.zeros(nf,np.float32); d=np.diff(L,axis=0); flux[1:]=np.maximum(d,0).sum(1)/WIN
flux=np.convolve(flux,[0.25,0.5,0.25],"same")

locked=[0.0,14.8,29.5,44.3,59.1,73.8,88.6,103.4,118.2,129.2,133.0,147.8,162.5,177.3,184.7,192.1,199.5,206.0,209.5,212.5]

# ---- A: fit beat grid to locked cut points ----
best=None
for P in np.arange(0.4590,0.4640,0.000002):
    k=np.round(locked/P)
    r=locked-k*P
    # circular mean phase
    ang=2*np.pi*(r/P)
    ph=(np.angle(np.mean(np.exp(1j*ang)))/(2*np.pi))*P
    res=(r-ph+ P/2)%P - P/2
    rms=float(np.sqrt(np.mean(res**2))); mx=float(np.max(np.abs(res)))
    if best is None or rms<best[0]: best=(rms,mx,P,ph,res)
rms,mx,P,ph,res=best
print(f"GRID FIT  P={P:.6f}s bpm={60/P:.4f} phase={ph:.4f} rms={rms*1000:.1f}ms max={mx*1000:.1f}ms")
print("residual_ms=", [round(float(r)*1000,1) for r in res])

# ---- B: SSM novelty at 0.25s ----
BIN=0.25
nb=int(dur/BIN)
edges=(np.arange(nb+1)*BIN*fps).astype(int)
F=np.zeros((nb,L.shape[1]),np.float32)
for i in range(nb):
    a,b=max(edges[i],0),max(min(edges[i+1],nf),edges[i]+1)
    F[i]=L[a:b].mean(0)
F-=F.mean(1,keepdims=True)
F/= (np.linalg.norm(F,axis=1,keepdims=True)+1e-8)
S=F@F.T
K=12
g=np.exp(-0.5*(np.arange(-K,K+1)/(K/2))**2)
ker=np.sign(np.arange(-K,K+1)[:,None]*np.arange(-K,K+1)[None,:])*g[:,None]*g[None,:]
nov=np.zeros(nb)
for i in range(K,nb-K):
    nov[i]=(S[i-K:i+K+1,i-K:i+K+1]*ker).sum()
nov=np.maximum(nov,0)
# peaks
peaks=[]
for i in range(K+2,nb-K-2):
    if nov[i]==nov[i-2:i+3].max() and nov[i]>np.mean(nov)+0.6*np.std(nov):
        t=i*BIN
        if not peaks or t-peaks[-1][0]>2.0: peaks.append((t,float(nov[i])))
peaks=sorted(peaks,key=lambda p:-p[1])[:26]
peaks=sorted(peaks)
print("SSM_PEAKS=", [(round(t,2),round(v,2)) for t,v in peaks])

# ---- C: region dumps ----
def prof(t0,t1,step=0.5):
    out=[]
    for t in np.arange(t0,t1,step):
        a=max(int(t*fps),0); b=min(int((t+step)*fps),nf)
        if b<=a: continue
        seg=L[a:b]
        lo=seg[:,:int(200/ (SR/WIN))].mean()
        out.append((round(t,1), round(float(seg.mean()),2), round(float(lo),2)))
    return out
print("R0_16=", prof(0,16,1.0))
print("R124_136=", prof(124,136,0.5))
print("R203_212=", prof(203,212,0.5))

# last energetic event before silence
rms=np.sqrt((x.astype(np.float64)**2).reshape(-1)[:n//1024*1024].reshape(-1,1024).mean(1))
rt=np.arange(len(rms))*1024/SR
db=20*np.log10(np.maximum(rms,1e-9))
tail=[(round(float(t),2),round(float(v),1)) for t,v in zip(rt,db) if t>205]
print("TAIL_DB=", tail[::2][:40])
print("last_above_-40dB=", round(float(rt[np.where(db>-40)[0][-1]]),3))

json.dump({"P":P,"bpm":60/P,"phase":ph,"res_ms":[float(r)*1000 for r in res],
           "peaks":[[float(t),float(v)] for t,v in peaks]},
          open(r"D:\ds.world.execute\analysis\report2.json","w"),indent=1)

# ---- D: strip image ----
W,H=1800,620
img=Image.new("RGB",(W,H),(6,6,8)); d_=ImageDraw.Draw(img)
def X(t): return int(t/dur*(W-1))
# waveform
per=64
for px in range(W):
    a=int(px/W*n); b=int((px+1)/W*n); b=max(b,a+1)
    seg=x[a:b]
    mn,mx=float(seg.min()),float(seg.max())
    y0=int(220-mx*200); y1=int(220-mn*200)
    d_.line([(px,y0),(px,y1)],fill=(240,240,242))
# novelty
mxv=max(nov) or 1
pts=[(X(i*BIN), int(430-nov[i]/mxv*180)) for i in range(nb)]
d_.line(pts,fill=(0,240,255),width=1)
# locked
for t in locked[1:-1]:
    d_.line([(X(t),440),(X(t),600)],fill=(255,42,42))
# peaks
for t,v in peaks:
    d_.line([(X(t),430),(X(t),410)],fill=(240,240,242))
img.save(r"D:\ds.world.execute\analysis\structure.png")
print("IMG OK")
