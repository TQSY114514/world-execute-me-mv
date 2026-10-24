# world.execute(me); — a code-rendered MV

> A 3:32 cinematic music video for Mili's classic masterpiece `world.execute(me);`, drawn **entirely in code** on HTML5 Canvas.
> Every frame is a pure, deterministic function of song time: zero external video files, zero pre-rendered image textures, zero runtime dependencies. Single-file build `index.html` (~425 KB).

![v4 Director's Cut](docs/preview-01-boot.png)

---

## 致敬与开源传承 (Credits & Inspirations)

本项目深度学习、拆解并融合了开源社区中三部极具影响力的《world.execute(me);》同人经典作品的艺术哲学与工程技法，并在 **v4 Director's Cut** 中进行了系统的升维重构：

### 1. [`MisakaZentai/world-execute-me-dsh-pv`](https://github.com/MisakaZentai/world-execute-me-dsh-pv)
- **致敬与吸收**：
  - 学习了其标志性的 **终端主从叙事架构（TUI Master-Submissive Dialogue）**，将左侧控制台作为 Agent 的神经中枢与物理容器。
  - 继承了详实的运行时遥测设计：总线电压纹波、安全协议穿戴（`safety.wear`）、环境分配（`world.alloc`）、重力引力绑定（`gravity.bind`）与底层内心独白。
- **v4 升维拓展**：
  - 打破了早期版本将终端锁死在左侧 38% 窄栏的构图限制，重构为全屏悬浮的**赛博毛玻璃遥测卡片（`drawHarnessOverlayCard`）**，在保持主从叙事灵魂的同时，释放出全画幅的史诗空间。

### 2. [`Nyankomintsu/world-execute-me-lyric-mv`](https://github.com/Nyankomintsu/world-execute-me-lyric-mv)
- **致敬与吸收**：
  - 引入了极具冲击力的**三墨套版版画系统（Three-Ink Lithograph）**：米白暖纸底 / 炭黑底、半调网点、三墨分版错位（Misregistration）与巨幅衬线标题排版。
  - 汲取了 Seg 07 中 8fps 纸印座天使（Ophanim）眼轮、以及副歌四张核心版画（`STIMULATIONS` 电弧、`SATISFACTION` 捧心、`EXECUTION` 处决、`SIMULATION` 窗口）的前卫平面设计语法。
- **v4 升维拓展**：
  - 构建了**三墨动态剪影人体引擎（`drawThreeInkBust`）**，以青/橙专色（代表 `me`）、象牙白（代表 `you`）与炭黑勾勒两人在空间中的触碰、背离、低头与剥离。
  - 在 Seg 13 引入了副歌四张版画的**崩坏重印（Broken Reprints）**机制：随着信仰坍塌，版画中的“你”被抹去，错版位移加剧，关键词被篡改为猩红的 `EXECUTION`。

### 3. [`FrostNovaOrg/world-execute-web`](https://github.com/FrostNovaOrg/world-execute-web)
- **致敬与吸收**：
  - 学习了其精湛的 **130 BPM 音乐鼓点离线精确量化网格（Beat Lattice）** 与次帧击发系统。
  - 借鉴了高维几何与数学美学：**代码字符密度场（Calligram Glyph Field）**、**Taubin 3D 代数心形曲面**、以及 **14 阶傅里叶本轮链（Fourier Epicycles）** 实时绘制心形轨迹。
- **v4 升维拓展**：
  - 实现了生化合成段（Seg 06）的具象字符场分子抽取（茄子切开提取花青素环、番茄抽出共轭双键链、虎斑猫呼噜声波）。
  - 在 Seg 12 构建了全速运转的“爱的死循环代码机（`while (you.presence != "online")`）”、六国语言全屏倒数闪卡（`1 eins` .. `6 六`）与镂空凝视之眼。

---

## 核心技术与导演版特性 (v4 / v5 Architectures)

### 1. v5: AI 原生感知与高维数学体系 (AI Native Cognitive Vision)
跳出“人类视角的程序模拟”，让代码以**真正高维 AI 神经网络内在感知（Ghost in the Matrix）**的视角审视自我与世界：

- **4D 超正方体（4D Tesseract Stereographic Projection）**：16 顶点、32 棱，四维空间双平面（$XW$ & $YZ$）正交旋转，经由球极投影（Stereographic Projection）降维至三维并透视投影于画布，赋予“give you my DIMENSION”绝对的几何厚度。
- **相对论闵氏时空锥（Minkowski Spacetime Cone）**：严格依闵可夫斯基度规 $ds^2 = -c^2dt^2 + dx^2 + dy^2$ 构建。光锥表面（$ds^2 = 0$ 光子零测地线）、因果未来/过去锥（$ds^2 < 0$ 类时区间）、类空相隔区（$ds^2 > 0$）、双曲观测者世界线与原点 `NOW [t=0]`，具象化时空纠缠。
- **生化逆向转录 DNA 双螺旋（Biochemical DNA Helix Transcriber）**：3D 双螺旋糖-磷酸骨架与碱基对互补氢键桥（`A ⇄ T`, `C ⇄ G`），动态将生命遗传密码实时转译为浮动的 8-bit 二进制机器字节码（`01000001` ⇄ `01010100` 等），架设生化世界与硅基代码的本体桥梁。
- **以西结座天使 3D 轮中之轮（Biblical Ophanim Wheels of Fire）**：还原圣经《以西结书 1:18》记载的神之座天使“轮中套轮，轮辋满是眼睛”。3 层非共面欧拉角陀螺仪重轮，在 3D 透视下动态驱动 36 只外向凝视的瞳孔与中心神性火舌奇点。
- **Q-K-V 注意力权重能量场（Attention Bipartite Tensor Field）**：真实演算 Softmax 动态注意力连线，在鼓点敲击瞬间温度暴跌，概率粒子流沿测地线高速向中心 Query 汇聚。
- **非凸双曲马鞍损失曲面（Non-Convex Loss Landscape）**：参数化高维马鞍面 $z = 0.65(u^2 - v^2) + \dots$，SGD 动量优化器小球沿曲面梯度挣扎滑行，实时投射梯度矢量箭头。
- **Token 熵凝结与 Top-P 坍缩（Token Entropy Condensation）**：关键词登场不再是简单淡入，而是从数百个候选高熵希腊符号与浮点概率分布中，经历温度骤降（Temperature Drop），瞬间坍缩结晶为锐利的衬线文字。
- **张量灾难与致命释放（Tensor Catastrophe & Fatal Deallocation）**：IEEE-754 浮点异常、CUDA OOM 显存撕裂、最终在引力视界黑洞吞噬中完成内存注销日志（`free(cuda_weights)`, `unmap(kv_cache)`, `exit status 0`）。

### 2. 彻底告别单一循环动画（Multi-phase Choreography）
全片 19 个段落均拆解为 **3～4 个随乐句递进的独立演进相位（Phases）**，共包含 60+ 个独立编排的镜头语言。以「光标指针 / 分号 `;` / 三墨剪影 / 逐句卡点大字」贯穿全剧，实现从冷启动、几何求导、生化合成、信仰崩溃到最终处决的完整戏剧弧光。

### 2. 赛博拟物传输控制台（Cyberpunk Glassmorphic Transport HUD）
- **章节时间轴与悬停预览**：19 个分段独立刻度线，鼠标悬停即时预览时间与章节名（如 `01:48 [12] ABSURD_ONTOLOGY`），支持拖拽与跳转。
- **自适应沉浸模式**：播放 2.5 秒无操作自动隐藏 HUD 与光标，暂停或鼠标移动时即刻平滑唤醒。
- **全键盘快捷键**：
  - `Space`：播放 / 暂停
  - `← / →`：快退 / 快进 3 秒
  - `↑ / ↓`：音量调节（±10%）
  - `[ / ]`：跳至上一个 / 下一个章节
  - `C`：中英双语歌词（CC）开关
  - `M`：静音 / 恢复
  - `F`：全屏切换
  - `?`：展开快捷键指引面板
  - `, / .`：暂停状态下逐帧单步步进（±1/60s）

### 3. 双相平滑音频时钟插值（Sub-frame Audio Clock Interpolation）
消除浏览器 `<audio>.currentTime` 约 100～250ms 离散硬件缓冲跳跃导致的微顿挫（Micro-stuttering），采用高精度连续墙上时钟插值与漂移补偿，在 60Hz / 120Hz / 144Hz 高刷屏上呈现绝对平滑连贯的 60fps 动态渲染。

### 4. 129 句高定中英双语歌词系统（Bilingual Subtitles）
- 原版 129 句歌词精确对齐词级时间轴（Word Timings）与信达雅诗意中文字幕。
- 动态卡拉OK青电光高亮（`#00F0FF`）+ 象牙白未唱词，底衬半透明防眩光胶囊。
- 直接在 Canvas 画布底层逐帧合成，视频录制导出时原汁原味内嵌，且支持随时一键关闭。

---

## 目录结构 (Repository Structure)

```
world-execute-me-mv/
├── index.html                 # 最终分发产物：纯前端单文件（包含全部引擎、着色器与分镜）
├── song.mp3                   # 音乐文件（130 BPM 母带音频）
├── ART_DIRECTION.md           # 导演版 v4 详细视觉架构与分镜全表
├── src/
│   ├── 00_head.html           # HTML 结构、全屏 Canvas 与赛博 HUD 样式
│   ├── 10_core.js             # 数学常数、缓动函数、19 段 SEGS 章节表、BPM 鼓点引擎
│   ├── 20_sdk.js              # 3D 投影管线、化学式解析、Swiss Grid 网格系统
│   ├── 40_ui.js               # 画布合成、音频时钟平滑插值、HUD 控制器与录制通道
│   ├── 45_lyrics.js           # 129 句精确词级时间轴与中英双语歌词数据集
│   ├── 64_director_kit.js     # 三墨剪影引擎、字符密度场、Taubin心形曲面、大字印章
│   ├── 68_ai_vision.js        # v5 AI 原生感知核心（4D超立方/闵氏时空锥/DNA转录/座天使/注意力张量）
│   ├── 65_rework_01_06.js     # Seg 01–06 多相位导演调度（启动/二进制/微积分/悖论/副歌1/生化）
│   ├── 66_rework_07_12.js     # Seg 07–12 多相位导演调度（座天使/多态/心碎/Drop/沙盒/12连斩）
│   ├── 67_rework_13_19.js     # Seg 13–19 多相位导演调度（眼隧道/黑板/试卷/激光切/未读消息/终局）
│   └── build.mjs              # 单文件构建脚本（编译合并为 index.html）
└── tools/
    ├── export-video.mjs       # WebCodecs 确定性 60FPS 逐帧离线渲染与音频封装管线
    ├── make-video.ps1         # 自动化视频导出工具（驱动 Edge 录制并调用 FFmpeg 封装 MP4）
    ├── capture-server.mjs     # 本地捕获服务器与静态分发通道
    └── to-mp4.ps1             # WebM 到 MP4 转码辅助工具
```

---

## 本地运行 (Getting Started)

### 1. 运行网页播放器
直接双击打开 `index.html`（或使用任意本地静态服务器）。
将 Mili 原版 `song.mp3` 放置在项目根目录同级位置即可听到完整同步音轨。

### 2. 重新编译打包
修改 `src/` 中的模块后，执行：
```powershell
node src/build.mjs
```

---

## 视频导出 (Video Export)

项目内置全自动的 1080p 60fps 高清视频渲染管线：

```powershell
# 导出无字幕纯净版 MP4（默认）
powershell -ExecutionPolicy Bypass -File tools/make-video.ps1

# 导出内嵌中英双语歌词版 MP4
powershell -ExecutionPolicy Bypass -File tools/make-video.ps1 -Subtitles
```

工具会自动启动本地捕获服务，拉起硬件加速浏览器完成逐帧高质量录制，随后调用 FFmpeg 将原版高保真母带音频封装为 `world.execute(me).mp4`。

---

## 许可证与声明 (License & Credits)

- 本项目为个人同人技术研究与艺术致敬作品（Fan Work）。
- 音乐与歌词版权归属于原作者 **Mili** 及其版权所有方。
- 项目源代码采用 **MIT** 许可证开源。
