
import json
P=0.461538; D0=0.222
def lat8(k): return D0+14.76923*k
lock=[0.0,14.8,29.5,44.3,59.1,73.8,88.6,103.4,118.2,129.2,133.0,147.8,162.5,177.3,184.7,192.1,199.5,206.0,209.5,212.5]
snap=[0.222,14.991,29.760,44.530,59.299,74.068,88.837,103.606,118.376,None,133.145,147.914,162.683,177.452,184.837,192.222,199.607,207.150,209.500,211.931]
notes=["first downbeat","","","","","","","","","NO EVENT IN AUDIO","","","","","half-block","","half-block","hard cut","true silence","file end"]
rows=[]
for i,(a,b,n) in enumerate(zip(lock,snap,notes),1):
    d=None if b is None else round(b-a,3)
    rows.append(dict(seg=i,lock=a,snap=b,delta=d,note=n))
    print("%02d lock=%7.2f snap=%s delta=%s %s"%(i,a,b,d,n))

beats={"bpm":130.0,"period":P,"downbeat0":D0,"duration":211.931,
 "lattice8":[round(lat8(k),3) for k in range(15)],
 "hard_events":{"last_hit":206.05,"music_cut":207.15,"silence_from":207.95,"file_end":211.931,
                "gaps":[[0.0,0.097],[207.323,4.608]]},
 "novelty_peaks":[11.25,15.0,17.25,26.5,28.75,33.0,37.0,55.25,57.5,74.75,77.25,82.25,93.75,107.25,115.5,123.25,135.25,140.0,170.25,174.75,181.5,187.0,190.0,192.5,195.75,200.0],
 "segments":rows,
 "beat_times":[round(D0+P*k,4) for k in range(int((211.9-D0)/P)+1)]}
json.dump(beats,open(r"D:\ds.world.execute\analysis\beats.json","w"),indent=1)

L=[]
L.append("# TIMING RECONCILIATION - Mili / world.execute(me);")
L.append("")
L.append("source: album track 11, 320 kbps, 44.1 kHz stereo, 211.931 s (ID3: Miracle Milk)")
L.append("")
L.append("## grid")
L.append("")
L.append("- tempo: 130.0000 BPM (low-band phase coherence, C=0.393)")
L.append("- period: 0.461538 s = 27.6923 frames @60fps")
L.append("- first downbeat: 0.222 s")
L.append("- 8-bar block = 32 beats = 14.76923 s ; 4-bar = 7.38462 s")
L.append("- validated by onsets at 14.988 / 59.304 / 103.596 / 162.691 (within 10 ms)")
L.append("")
L.append("## hard facts")
L.append("")
L.append("| event | time | note |")
L.append("|---|---|---|")
L.append("| first sound | 0.097 | 97 ms of true silence first |")
L.append("| last strong hit | 206.05 | beat 446 |")
L.append("| hard audio cut | 207.15 | -17 dB in 50 ms |")
L.append("| digital silence | 207.95 | tail decays to -75 dB |")
L.append("| file end | 211.931 | 4.6 s of silence after the cut |")
L.append("")
L.append("No other gaps exist anywhere in the file (min 60 ms, -38 dB threshold).")
L.append("")
L.append("## segment reconciliation")
L.append("")
L.append("| # | locked | measured anchor | delta | note |")
L.append("|---|---|---|---|---|")
for r in rows:
    s = "-" if r["snap"] is None else "%.3f"%r["snap"]
    d = "-" if r["delta"] is None else "%+.3f"%r["delta"]
    L.append("| %02d | %.1f | %s | %s | %s |"%(r["seg"],r["lock"],s,d,r["note"]))
open(r"D:\ds.world.execute\analysis\TIMING.md","w",encoding="utf-8").write("\n".join(L))
print("written")
