
import numpy as np, json
SR=44100
x=np.fromfile(r"D:\ds.world.execute\analysis\track.f32",dtype=np.float32)
n=len(x)
h=2205
m=n//h
r=np.sqrt((x[:m*h].astype(np.float64).reshape(m,h)**2).mean(1))
db=20*np.log10(np.maximum(r,1e-9)); t=np.arange(m)*h/SR
def at(s): return float(db[min(int(s*SR/h),m-1)])
print("185-195 dB:")
print([(round(s,1),round(at(s),1)) for s in np.arange(184,196,0.5)])
print("117-121:", [(round(s,1),round(at(s),1)) for s in np.arange(117,121,0.25)])
print("207.0-208.0:", [(round(s,2),round(at(s),1)) for s in np.arange(207.0,208.0,0.05)])
# energy change at top novelty peaks
for p in [15.0,33.0,55.25,74.0,103.5,135.25,162.5,187.0,192.5,200.0]:
    a=np.mean([at(p-d) for d in np.arange(0.1,2.0,0.1)]); b=np.mean([at(p+d) for d in np.arange(0.1,2.0,0.1)])
    print(f"  peak {p:6.2f} pre={a:6.1f} post={b:6.1f} delta={b-a:+.1f}")
