
import numpy as np
SR=44100
x=np.fromfile(r"D:\ds.world.execute\analysis\track.f32",dtype=np.float32)
n=len(x); dur=n/SR
WIN,HOP=2048,512
nf=1+(n-WIN)//HOP
win=np.hanning(WIN).astype(np.float32)
idx=np.arange(WIN)[None,:]+HOP*np.arange(nf)[:,None]
mag=np.abs(np.fft.rfft(x[idx]*win,axis=1)).astype(np.float32)
L=np.log1p(mag*20.0); fps=SR/HOP
flux=np.zeros(nf,np.float32); flux[1:]=np.maximum(np.diff(L,axis=0),0).sum(1)/WIN
flux=np.convolve(flux,[0.25,0.5,0.25],"same")
ft=(np.arange(nf)*HOP+WIN/2)/SR

# onset peaks
thr=np.percentile(flux,93)
pk=[]
for i in range(2,nf-2):
    if flux[i]>=thr and flux[i]==flux[i-2:i+3].max():
        if not pk or ft[i]-pk[-1][0]>0.045: pk.append((float(ft[i]),float(flux[i])))
pk=np.array(pk)
print("peaks",len(pk))

# phase coherence tempo
Ps=np.arange(0.4550,0.4700,0.000001)
t=pk[:,0]; w=pk[:,1]
best=(-1,0)
for P in Ps:
    C=abs(np.sum(w*np.exp(2j*np.pi*t/P)))/w.sum()
    if C>best[0]: best=(C,P)
C,P=best
print(f"PHASE_COHERENCE P={P:.6f} bpm={60/P:.4f} C={C:.4f}")
for q in [0.461538,0.461123,0.46182]:
    print(f"  at P={q:.6f} bpm={60/q:.4f} C={abs(np.sum(w*np.exp(2j*np.pi*t/q)))/w.sum():.4f}")

# best phase for chosen P
ph=(np.angle(np.sum(w*np.exp(2j*np.pi*t/P)))/(2*np.pi))*P
print("phase",round(ph,4))
k=np.round((t-ph)/P)
res=(t-ph-k*P)*1000
print("grid_resid_ms p50/p90/max",round(float(np.percentile(abs(res),50)),1),round(float(np.percentile(abs(res),90)),1),round(float(abs(res).max()),1))

# nearest onset to each locked boundary
locked=[0.0,14.8,29.5,44.3,59.1,73.8,88.6,103.4,118.2,129.2,133.0,147.8,162.5,177.3,184.7,192.1,199.5,206.0]
print("BOUND  nearest_onset  delta  flux")
for b in locked[1:]:
    j=int(np.argmin(abs(pk[:,0]-b))); d=float(pk[j,0]-b)
    print(f"  {b:7.2f}  {pk[j,0]:8.3f}  {d:+.3f}  {pk[j,1]:.1f}")

# fine look 126-134 and 203-208
def fine(t0,t1,step=0.05):
    out=[]
    for a in np.arange(t0,t1,step):
        i0,i1=int(a*fps),int((a+step)*fps)
        if i1<=i0: continue
        r=np.sqrt(np.mean(x[int(a*SR):int((a+step)*SR)].astype(np.float64)**2)+1e-12)
        out.append((round(a,2),round(20*np.log10(r+1e-9),1),round(float(flux[i0:i1].max()),1)))
    return out
print("FINE_126_134=", fine(126,134))
print("FINE_204_208=", fine(204,208))
