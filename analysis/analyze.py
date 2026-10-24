
import numpy as np, json, sys

SR = 44100
x = np.fromfile(r"D:\ds.world.execute\analysis\track.f32", dtype=np.float32)
n = len(x)
dur = n / SR
print(f"samples={n} dur={dur:.4f}s")

# ---------- frames ----------
WIN, HOP = 2048, 512
nf = 1 + (n - WIN) // HOP
win = np.hanning(WIN).astype(np.float32)
idx = np.arange(WIN)[None, :] + HOP * np.arange(nf)[:, None]
frames = x[idx] * win
mag = np.abs(np.fft.rfft(frames, axis=1)).astype(np.float32)
logmag = np.log1p(mag * 20.0)
fr_t = (np.arange(nf) * HOP + WIN / 2) / SR
fps = SR / HOP

flux = np.zeros(nf, dtype=np.float32)
d = np.diff(logmag, axis=0)
flux[1:] = np.maximum(d, 0).sum(axis=1) / WIN
flux = np.convolve(flux, np.array([0.25, 0.5, 0.25], dtype=np.float32), mode="same")

# ---------- rms ----------
def rms_env(hop_ms=10):
    h = int(SR * hop_ms / 1000)
    m = len(x) // h
    y = x[: m * h].reshape(m, h)
    r = np.sqrt((y.astype(np.float64) ** 2).mean(axis=1))
    return r, hop_ms / 1000

rms, rms_dt = rms_env(10)
db = 20 * np.log10(np.maximum(rms, 1e-9))
rms_t = np.arange(len(rms)) * rms_dt

# ---------- tempo ----------
e = flux - flux.mean()
ac = np.fft.irfft(np.abs(np.fft.rfft(e, 2 * len(e))) ** 2)[: len(e)]
ac = ac / (np.arange(len(ac))[::-1] + 1)
ac = ac / ac[0]
lo, hi = int(fps * 60 / 200), int(fps * 60 / 60)
seg = ac[lo:hi]
lag = lo + int(np.argmax(seg))
def bpm_of(l): return 60.0 * fps / l
print(f"tempo_global={bpm_of(lag):.3f} bpm (lag {lag})")
# refine parabolic
a, b, c = ac[lag - 1], ac[lag], ac[lag + 1]
off = 0.5 * (a - c) / (a - 2 * b + c) if (a - 2 * b + c) != 0 else 0
print(f"tempo_refined={bpm_of(lag + off):.3f}")

# per 32s window tempo
wt = []
for s in np.arange(0, dur - 32, 16):
    a0, a1 = int(s * fps), int((s + 32) * fps)
    ee = flux[a0:a1] - flux[a0:a1].mean()
    acc = np.fft.irfft(np.abs(np.fft.rfft(ee, 2 * len(ee))) ** 2)[: len(ee)]
    acc = acc / (np.arange(len(acc))[::-1] + 1); acc = acc / acc[0]
    sg = acc[lo:hi]; l = lo + int(np.argmax(sg))
    wt.append((round(s, 1), round(bpm_of(l), 2)))
print("tempo_windows=", wt[:8])

# ---------- global beat grid at detected tempo ----------
P = lag + off
best_ph, best_sc = 0, -1
for ph in np.arange(0, P, 0.25):
    beat_idx = np.arange(ph, nf - 1, P)
    ii = np.round(beat_idx).astype(int)
    sc = flux[np.clip(ii, 0, nf - 1)].sum()
    if sc > best_sc: best_sc, best_ph = sc, ph
beat_t = (best_ph * HOP + WIN / 2) / SR + np.arange(int((nf - best_ph) / P) + 2) * P * HOP / SR
beat_t = beat_t[beat_t < dur]
print(f"beats={len(beat_t)} first={beat_t[0]:.4f} last={beat_t[-1]:.4f} period={P*HOP/SR:.6f}")

# drift: fit linear to beat index vs time in quarters
q = []
for k in range(4):
    lo_t, hi_t = k * dur / 4, (k + 1) * dur / 4
    sel = (beat_t >= lo_t) & (beat_t < hi_t)
    if sel.sum() > 8:
        i = np.arange(len(beat_t))[sel]
        p = np.polyfit(i, beat_t[sel], 1)[0]
        q.append((round(lo_t, 1), round(60 / p, 3)))
print("tempo_by_quarter=", q)

# ---------- boundaries: energy + spectral novelty ----------
def db_at(t):
    j = int(t / rms_dt); j = max(0, min(j, len(db) - 1)); return float(db[j])

# spectral novelty: cosine distance between mean log-spectra of 3s halves
step = 0.25
ts = np.arange(4, dur - 4, step)
nov = []
for t in ts:
    a0 = int((t - 3) * fps); a1 = int(t * fps)
    b0 = int(t * fps); b1 = int((t + 3) * fps)
    A = logmag[a0:a1].mean(axis=0); B = logmag[b0:b1].mean(axis=0)
    An = A / (np.linalg.norm(A) + 1e-9); Bn = B / (np.linalg.norm(B) + 1e-9)
    nov.append(1 - float(An @ Bn))
nov = np.array(nov)

# peaks
thr = np.percentile(nov, 97.5)
cand = []
for i in range(1, len(nov) - 1):
    if nov[i] >= thr and nov[i] >= nov[i - 1] and nov[i] >= nov[i + 1]:
        if not cand or ts[i] - cand[-1] > 1.5:
            cand.append(float(ts[i]))
print("novelty_peaks=", [round(c, 2) for c in cand])

# ---------- silences ----------
sil = db < -55
runs = []
i = 0
while i < len(sil):
    if sil[i]:
        j = i
        while j + 1 < len(sil) and sil[j + 1]: j += 1
        if (j - i) * rms_dt >= 0.30: runs.append((round(i * rms_dt, 2), round((j + 1) * rms_dt, 2)))
        i = j + 1
    else: i += 1
print("silences=", runs[:12])

# ---------- my 19 locked bounds ----------
locked = [0.0,14.8,29.5,44.3,59.1,73.8,88.6,103.4,118.2,129.2,133.0,147.8,162.5,177.3,184.7,192.1,199.5,206.0,209.5,212.5]
rows = []
for t in locked[1:-1]:
    pre = np.mean([db_at(t - d) for d in (0.1, 0.2, 0.35, 0.5)])
    post = np.mean([db_at(t + d) for d in (0.1, 0.2, 0.35, 0.5)])
    nearest = min(cand, key=lambda c: abs(c - t)) if cand else None
    rows.append((round(t, 2), round(pre, 1), round(post, 1), round(post - pre, 1),
                 round(nearest - t, 2) if nearest else None))
print("LOCKED  t  pre_dB  post_dB  delta  nearest_novelty_delta")
for r in rows: print("  ", r)

# ---------- tail ----------
print("tail_db_1s=", [round(db_at(t), 1) for t in np.arange(205, 211.8, 0.5)])
print("max_db=", round(float(db.max()), 1), "at", round(float(rms_t[int(db.argmax())]), 2))

json.dump({
    "dur": dur, "bpm": bpm_of(lag + off), "beats": len(beat_t),
    "beat_times": [round(float(b), 4) for b in beat_t],
    "novelty_peaks": [round(c, 2) for c in cand],
    "silences": runs,
    "locked_check": rows,
}, open(r"D:\ds.world.execute\analysis\report.json", "w"), indent=1)
print("OK")
