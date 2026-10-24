
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
fps=SR/HOP; ft=(np.arange(nf)*HOP+WIN/2)/SR
hz=np.fft.rfftfreq(WIN,1/SR)
low=L[:,1:6].sum(1); mid=L[:,(hz>200)&(hz<2000)].sum(1); high=L[:,hz>2000].sum(1)
def flux_of(v):
    d=np.diff(v); f=np.maximum(d,0); f=np.concatenate([[0],f])
    return np.convolve(f,[0.2,0.6,0.2],"same")
fl_low,fl_mid,fl_high=flux_of(low),flux_of(mid),flux_of(high)
fl_all=flux_of(L.sum(1))

def peaks(env,q=95,sep=0.08):
    th=np.percentile(env,q); out=[]
    for i in range(2,len(env)-2):
        if env[i]>=th and env[i]==env[i-2:i+3].max():
            if not out or ft[i]-out[-1][0]>sep: out.append((float(ft[i]),float(env[i])))
    return np.array(out)

pk_low=peaks(fl_low,88,0.12)
print("low peaks",len(pk_low))
Ps=np.arange(0.4400,0.4800,0.0000008)
t,w=pk_low[:,0],pk_low[:,1]
best=(-1,0)
for P in Ps:
    C=abs(np.sum(w*np.exp(2j*np.pi*t/P)))/w.sum()
    if C>best[0]: best=(C,P)
C,P=best; print(f"LOW PHASE_COHERENCE P={P:.7f} bpm={60/P:.4f} C={C:.4f}")
for q in [0.461538]:
    print(f"  at 130.0000 C={abs(np.sum(w*np.exp(2j*np.pi*t/q)))/w.sum():.4f}")
ph=(np.angle(np.sum(w*np.exp(2j*np.pi*t/P)))/(2*np.pi))*P
print("phase",round(ph,4))
k=np.round((t-ph)/P); res=(t-ph-k*P)*1000
print("resid p50/p90/max",round(float(np.percentile(abs(res),50)),1),round(float(np.percentile(abs(res),90)),1),round(float(abs(res).max()),1))

# downbeat
best4=(-1,0)
for off in range(4):
    s=0.0
    for i in range(len(fl_low)):
        kk=(ft[i]-ph)/P
        if abs(kk-round(kk))<0.06 and (round(kk)%4)==off: s+=fl_low[i]
    if s>best4[0]: best4=(s,off)
print("downbeat offset",best4[1],"of 4")

# gaps
env=np.sqrt(np.convolve(x.astype(np.float64)**2,np.ones(441)/441,"same"))
db=20*np.log10(env+1e-9)
gaps=[];i=0
while i<len(db):
    if db[i]<-38:
        j=i
        while j+1<len(db) and db[j+1]<-38: j+=1
        if (j-i)/SR>=0.06: gaps.append((round(i/SR,3),round((j-i)/SR,3),round(float(db[i:j+1].max()),1)))
        i=j+1
    else:i+=1
print("GAPS(<-38dB,>=60ms)=",gaps[:20])

# band novelty at 0.25
BIN=0.25; nb=int(dur/BIN)
def novelty(v,K=12):
    edges=(np.arange(nb+1)*BIN*fps).astype(int)
    F=np.zeros((nb,len(v)),np.float32)
    for i in range(nb):
        a=max(edges[i],0); b=max(min(edges[i+1],len(v)),a+1); F[i]=v[a:b].mean()
    F-=F.mean(1,keepdims=True); F/= (np.linalg.norm(F,axis=1,keepdims=True)+1e-8)
    S=F@F.T
    g=np.exp(-0.5*(np.arange(-K,K+1)/(K/2))**2)
    ker=np.sign(np.arange(-K,K+1)[:,None]*np.arange(-K,K+1)[None,:])*g[:,None]*g[None,:]
    nov=np.zeros(nb)
    for i in range(K,nb-K): nov[i]=(S[i-K:i+K+1,i-K:i+K+1]*ker).sum()
    return np.maximum(nov,0)
# band matrices
Bg=np.zeros((nb,3),np.float32)
edges=(np.arange(nb+1)*BIN*fps).astype(int)
for i in range(nb):
    a=max(edges[i],0); b=max(min(edges[i+1],nf),a+1)
    Bg[i]=(low[a:b].mean(),mid[a:b].mean(),high[a:b].mean())
nov=np.zeros(nb)
for c in range(3):
    v=Bg[:,c:c+1]
    edges=(np.arange(nb+1)*BIN*fps).astype(int)
    F=np.zeros((nb,nb),np.float32)
    # per-bin scalar feature -> SSM of scaled values is degenerate; use spectral slice instead
nov=novelty(L)
def pk_nov(nov,thr=1.5,sep=2.0):
    out=[]
    for i in range(14,nb-14):
        if nov[i]==nov[i-3:i+4].max() and nov[i]>thr:
            if not out or i*BIN-out[-1][0]>sep: out.append((float(i*BIN),float(nov[i])))
    return out
cand=pk_nov(nov, np.percentile(nov,90), 2.0)
print("NOV_PEAKS=", [(round(a,2),round(b,2)) for a,b in cand])

# novelty near locked
locked=[14.8,29.5,44.3,59.1,73.8,88.6,103.4,118.2,129.2,133.0,147.8,162.5,177.3,184.7,192.1,199.5,206.0,209.5]
print("LOCKED  nov_at  local_max  delta")
for b in locked:
    i=int(b/BIN); w0=max(0,i-3); w1=min(nb,i+4)
    j=w0+int(np.argmax(nov[w0:w1]))
    print(f"  {b:7.2f} {nov[i]:7.2f} {nov[j]:8.2f} {(j-i)*BIN:+.2f}")

json.dump({"P":P,"bpm":60/P,"phase":ph,"downbeat":int(best4[1]),
           "nov":[[round(float(i*BIN),3),round(float(nov[i]),4)] for i in range(nb)],
           "gaps":gaps},open(r"D:\ds.world.execute\analysis\report4.json","w"))
print("saved")
