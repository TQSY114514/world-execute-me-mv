# 我给这个项目的提示词

这份文件是**用户（委托人）发给执行者的原话**，按时间顺序排列。

- 标注「原文」的，是从会话上下文里逐字取回的。
- 标注「摘要」的，来自会话被压缩时保留的引用片段——那一轮完整措辞已不可得，
  只有核心句子是准的。
- 第 12 条是完整的技术指令，一字未改。

---

## 1 · 早期方向（摘要）

> 感觉你做的千篇一律，然后也不够用惊艳

随后的硬性要求（摘要）：重写最单调的 2–3 段，每段渲染函数不少于 120 行，并遵守四条法则：

1. 废除固定分栏，改用五种范式——纯黑客终端（ASCII/Braille）、工程图纸（骨白纸、卡尺、画中画放大镜）、多窗口级联、动能排版（300–500px 等宽大字被几何切断）、结构体把左栏压碎；
2. 虚拟摄影机——对 0.0001px 的缝隙做 15 倍微距、希区柯克变焦、跟拍的重拍冲击；
3. 具体的硬结构——带法线的切线网与密切圆、真正的有机化学六元环与配平框、超二次曲面与截面扫描线、锁在光标上的座天使眼轮；
4. 冲击帧——2–3 帧的满屏反相 / 白场 / 红色剪影。

> 你需要什么 skill 和插件都可以装

## 2 · 原文

> 好，然后进度条不要，我就是要一个动画，最终转化为视频

> 音乐似乎没有？然后还是太单调了，还有的动画似乎有问题，你能不能一次性完善好，我不是给你发了参考视频吗，然后 skill，插件你都可以装

> https://github.com/MisakaZentai/world-search-you-dsh-pv，https://github.com/FrostNovaOrg/world-execute-web，https://github.com/MisakaZentai/world-execute-me-dsh-pv，https://github.com/Nyankomintsu/world-execute-me-lyric-mv
> 不过风格按照你想要的来，你甚至可以放弃一开始的后数字，我就是想要你眼里的这个动画，你再看看可不可以访问，我可以，antigravity 可以，你应该也可以才对，然后不要急着完成，重要的是质量

> 好

> 没有音乐，并且没有我前面给你发的那几个惊艳

> 哪个质量好

> 话说你决定会不会有点单调，然后运行 html 的那个似乎没有音乐

> 继续，然后我还是推荐你看看 https://github.com/MisakaZentai/world-execute-me-dsh-pv，https://github.com/Nyankomintsu/world-execute-me-lyric-mv，https://github.com/FrostNovaOrg/world-execute-web 可以参考一下

> 继续优化，你一次性优化好吧

> 然后你可以看看别人的仓库，学习优化，你这个侧脸有点诡异啊

> 你是看不到吗，你这个脸很奇怪诶，你自己优化一下

> 帧率太低了，画质也太低了，并且我感觉动画还是不够好看

> 还是比较单调的，有很多地方都是重复播放同一个动画

> 你新建一个 github 项目，然后上传上去，proment 也要把

> 我说的 proment 是给你的提示词

## 3 · 技术指令（原文，一字未改）

> 停一下，不要再单纯换颜色或改表面风格了。现在画面质量差的根本原因是**底层渲染管线太简陋**——全靠手写基础的 `ctx.lineTo` 和线性的 `Math.sin(t)`，画出来的东西像简陋的火柴人简笔画，运动僵硬，排版毫无设计感。
>
> 我们要从底层彻底解决“廉价感”，请立即对渲染底座进行以下 4 项硬核技术升级，然后再重写画面：
>
> ### 1. 废除线性运动，全面接入「弹簧物理与高阶非线性缓动（Spring & Snap Easing）」
> - 严禁再使用平庸的线性 `lerp` 或单纯的 `Math.sin(t)` 做位移和缩放！
> - 请在引擎底座中实现一套高张力运动算子：
>   - `expDecay(val, target, lambda, dt)` 与基于精确时间戳的过冲弹簧函数 `springImpulse(t, triggerTime, freq, damping)`。
>   - 所有的窗口弹出、镜头推拉、图形切换，必须是**“前 15% 时间极速爆发到位 + 后 85% 时间带微弱阻尼回弹悬停”**（即 `cubic-bezier(0.16, 1, 0.3, 1)` 质感），彻底消灭软绵绵的匀速运动。
>
> ### 2. 引入「双缓冲离屏后处理管线（Offscreen Post-Processing Pipeline）」
> - 不要直接往主画布上干巴巴地画死白线！建立 `mainBuffer` 与 `bloomBuffer` 双离屏 Canvas：
>   - **高光溢出（subtle Halation/Bloom）**：对高能图形层做低分辨率高斯叠加，让锐利的矢量线条自带微弱的显像管电子束辉光。
>   - **动态色差与扫描抖动（Chromatic / Luma Jitter）**：在重拍 `kickPulse` 瞬间，对画布进行通道级微偏移与程序化胶片噪点（Procedural Noise Grain）叠加，消除原生 Canvas 2D 的廉价塑料感。
>
> ### 3. 建立「瑞士国际主义网格排版系统（Swiss Grid Layout Engine）」
> - 严禁在画布上随便写个 `(x + 20, y + 30)` 乱放文字！
> - 在底座中实现一个严格的 `GridLayout(cols=24, rows=12, margin=40, gutter=12)` 网格分配器：
>   - 所有文字、数据遥测表、子视口必须严格吸附在网格单元内，自带 1px 十字准星角标（Crosshair Marks）、字距追踪（Letter-spacing 渲染封装）以及反色黑底白字标签块（Inverted Tag Blocks）。
>   - 画面空白处必须由自动生成的极细微数据标尺（Micro-telemetry rulers）、帧步进十六进制码流填充，保证全屏拥有工业级的视觉平衡与信息密度。
>
> ### 4. 用「高精度生成式算法/预计算数据」替代「手写几行 lineTo」
> - 严禁用少于 50 个顶点的简陋图形代表核心意象！
> - 请先写一个独立的 `generator.js`（或 Python 预生成脚本），通过数学分形、L-System、洛伦兹吸引子（Lorenz Attractor）、反应扩散算法（Reaction-Diffusion）或精确的 3D 网格细分算法，生成每次至少包含 **500~2000 个顶点/线段** 的复杂拓扑结构数据，再交给渲染器绘制。
>
> 请先修改底层渲染引擎，把这 4 个系统（弹簧缓动、离屏后处理、24 列瑞士网格排版器、高顶点数算法生成器）实装到位，并用 Seg 01-03 验证效果！你也可以试试 DOM / CSS Grid 排版 + Canvas 局部渲染和 Three.js + GLSL Shader

---

## 这份提示词被读成了什么

如果想知道上面这些要求最终变成了哪些代码，看 `README.md` 的技术那节：
四条法则 → `src/50_engine2.js`；五种范式 → 19 段各自的文件；冲击帧 → `src/38_scenes_e.js`；
129 行歌词切镜 → `src/45_lyrics.js`；版画与四张纸 → `src/47..49`。
