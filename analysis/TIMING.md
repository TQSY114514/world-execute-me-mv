# TIMING RECONCILIATION - Mili / world.execute(me);

source: album track 11, 320 kbps, 44.1 kHz stereo, 211.931 s (ID3: Miracle Milk)

## grid

- tempo: 130.0000 BPM (low-band phase coherence, C=0.393)
- period: 0.461538 s = 27.6923 frames @60fps
- first downbeat: 0.222 s
- 8-bar block = 32 beats = 14.76923 s ; 4-bar = 7.38462 s
- validated by onsets at 14.988 / 59.304 / 103.596 / 162.691 (within 10 ms)

## hard facts

| event | time | note |
|---|---|---|
| first sound | 0.097 | 97 ms of true silence first |
| last strong hit | 206.05 | beat 446 |
| hard audio cut | 207.15 | -17 dB in 50 ms |
| digital silence | 207.95 | tail decays to -75 dB |
| file end | 211.931 | 4.6 s of silence after the cut |

No other gaps exist anywhere in the file (min 60 ms, -38 dB threshold).

## segment reconciliation

| # | locked | measured anchor | delta | note |
|---|---|---|---|---|
| 01 | 0.0 | 0.222 | +0.222 | first downbeat |
| 02 | 14.8 | 14.991 | +0.191 |  |
| 03 | 29.5 | 29.760 | +0.260 |  |
| 04 | 44.3 | 44.530 | +0.230 |  |
| 05 | 59.1 | 59.299 | +0.199 |  |
| 06 | 73.8 | 74.068 | +0.268 |  |
| 07 | 88.6 | 88.837 | +0.237 |  |
| 08 | 103.4 | 103.606 | +0.206 |  |
| 09 | 118.2 | 118.376 | +0.176 |  |
| 10 | 129.2 | - | - | NO EVENT IN AUDIO |
| 11 | 133.0 | 133.145 | +0.145 |  |
| 12 | 147.8 | 147.914 | +0.114 |  |
| 13 | 162.5 | 162.683 | +0.183 |  |
| 14 | 177.3 | 177.452 | +0.152 |  |
| 15 | 184.7 | 184.837 | +0.137 | half-block |
| 16 | 192.1 | 192.222 | +0.122 |  |
| 17 | 199.5 | 199.607 | +0.107 | half-block |
| 18 | 206.0 | 207.150 | +1.150 | hard cut |
| 19 | 209.5 | 209.500 | +0.000 | true silence |
| 20 | 212.5 | 211.931 | -0.569 | file end |