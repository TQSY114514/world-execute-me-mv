# world.execute(me); — 导演版 v4 视觉架构与分镜全表

> 版本：v4 Director's Cut（融合 `MisakaZentai` 终端主从叙事、`Nyankomintsu` 三色套版版画与状态机、`FrostNova` 3D 几何/字形力场与代数心形曲面）
> 核心原则：**拒绝 15 秒单一循环动画**——每段拆分为 **3～4 个按拍切分的演进相位（Phases）**，全片 19 段统一为 **1920×1080 全画幅构图**，以 **「光标 / 分号 `;` / 三墨剪影 / 逐句卡点大字」** 贯穿始终。

---

## 1 · 三种画面语法（Three Picture Grammars）

1. **INTERFACE（交互界面与仪器层）**：
   - 超大号可交互 UI 控件（`AC ⇄ DC` 整流开关、`VISION` 爆闪开关、`F ⇄ M` 性别切换、`AM ⇄ PM` 日晷弧形滑杆、`S ⇄ M` 软化字形开关）+ 用户的米白鼠标指针（`drawUserPointer`）实时移动、悬停、连点。
   - 底部悬浮 **Agent Harness 实时遥测与工具调用卡**（[`drawHarnessOverlayCard`](file:///d:/ds.world.execute/src/64_director_kit.js#L430-L469)），将左侧终端对话无缝织入全屏画面。
2. **PLATE（三墨套印版画与字符密度场）**：
   - 在每个具象名词与全大写关键词落拍瞬间硬切进入：**米白暖纸底 / 炭黑底 + 半调网点 + 三墨分版剪影（橙/青 `me`、米白 `you`、炭黑 `ink`）+ 错版套印（Misregistration）+ 巨幅衬线阴影标题**。
   - 具象物体（茄子、番茄、虎斑猫、地球/字形球）采用 **代码字符密度场（[`drawGlyphFieldShape`](file:///d:/ds.world.execute/src/64_director_kit.js#L213-L253)）** 渲染，并在重拍上切开剖面、逐键抽出分子骨架式。
3. **CODE & BREACH（死循环代码机、多语种倒数卡与崩溃撕裂）**：
   - 在 Drop（Seg 10）、12 连斩（Seg 12）与终局崩溃（Seg 13、16）中，运行纯代码状态机 `while (you.presence != "online")`、15 层级联报错弹窗、屏幕玻璃裂纹（`drawScreenCracks`）与六国语言全屏闪卡。

---

## 2 · 全片 19 段 × 多相位演进分镜表（v4）

| 段 | 时间 (s) | 段落名 | 相位演进（每段 3–4 个卡点镜头） | 关键视觉奇观与卡点词 |
|---|---|---|---|---|
| **01** | `0.00–14.99` | `BOOT_SEQUENCE` | **P1** 像素点火与电路总线 → **P2** 五颗 3D 柏拉图立体坠落激起透视地面波纹 → **P3** 光标绘制洛伦兹吸引子 + 参数直方图 → **P4** 巨型分号 `;` 砸落 | `PROTECTION` 3D 护盾穹顶、`OBJECT CREATION`、`INITIALIZATION`、`SIMULATION` + `;` |
| **02** | `14.99–29.76` | `BINARY_WORLD_INIT` | **P1** Gray-Scott 反应扩散 + 3D 透视地形 → **P2** `ME` 与 `YOU` 双吸引子 RK4 流线绑定 → **P3** 3D 代码字形球（Calligram Sphere）→ **P4** 四色错版海报 `PLACE` | `WORLD.ALLOC(R²)`、`GRAVITY.BIND`、`PLACE` |
| **03** | `29.76–44.53` | `CALCULUS_GEOMETRY` | **P1** 离散点云拉伸为 3D 晶格立方体 → **P2** 圆周展开成 `2πr` 标尺与径向割线 → **P3** 绘图笔沿正弦波高速扫出 24 条切线/法线 → **P4** 黎曼矩形冲击 `x → ∞` 红色渐近墙 | `DIMENSION`、`CIRCUMFERENCE`、`TANGENTS`、`LIMITATIONS` |
| **04** | `44.53–59.30` | `LIMIT_PARADOX` | **P1** 指针点击巨型 `AC ⇄ DC` 开关将波形整流 → **P2** 指针狂点 `VISION` 开关 6 次引发黑白反转与 Droste 眩晕旋转 → **P3** `A.D. ⇄ B.C.` 剪纸建筑史长卷（摩天楼→哥特尖塔→希腊柱廊→金字塔）+ 里程表倒退 → **P4** 双递归奇点合一 | `AC ⇄ DC`、`BLIND VISION`、`A.D. ⇄ B.C.`、`UNITE DEEPLY` |
| **05** | `59.30–74.07` | `CURRENT_SPACE_TIME` | 4 个乐句各由「3D 环面纽结 + 示波器 + 相量仪」在重拍硬切入 **4 张副歌三墨版画** | **版画 1** 高压电弧 `STIMULATIONS`；**版画 2** 伸手剪影捧心 `SATISFACTION`；**版画 3** 终端高亮 `EXECUTION`；**版画 4** 嵌套窗口 `SIMULATION` |
| **06** | `74.07–88.84` | `BIOCHEM_SYNTHESIS` | **P1** 专色紫字符场茄子 → 切开剖面 → 抽出花青素环 → **P2** 暖纸番茄六心室剖面 → 抽出 `C40H56` 22 碳共轭双键链 → **P3** 三墨猫耳剪影 + `25.6 Hz` 呼噜声波纹 → **P4** 太阳光晕下缺失的米白印版滑入精准对齐 | `NUTRIENTS`、`ANTIOXIDANTS`、`ENJOYMENT`、`EXISTENCE` |
| **07** | `88.84–103.61` | `PURR_AND_THEOLOGY` | **P1** 纸面 `[F \| M]` 开关触发男女胸像套版变形 → **P2** `AM ⇄ PM` 巨型日晷弧形滑杆 → **P3** `S ⇄ M` 巨字垂直分条软化下垂（`drawLimpText`）→ **P4** 8fps 纸印三环座天使眼轮锁定 `ROOT_GOD = YOU` | `GENDER : F/M`、`A.M./P.M.`、`SWITCH ROLE`、`THE TRANCE` |
| **08** | `103.61–118.38` | `POLYMORPHISM_CYCLE` | **P1** 克拉尼驻波与人体点云共振 → **P2** 双几何曼陀罗咬合 → **P3** 随 5 次 *"Though you have left"* 逐层剥离 UI 边框、在线状态变 `OFFLINE`、色彩褪为死灰、人影分五步缩小低头 | `VIBRATIONS`、`COMPLETION`、`THOUGH YOU HAVE LEFT [1..5/5]`、`ISOLATION` |
| **09** | `118.38–129.20` | `DOPAMINE_RESONANCE` | **P1** 900 记忆碎片被雷达扫描束抹除 → **P2** 全屏镜像巨眼特写 + `DISHEARTENED` 中间 `HEART` 五字母被红线划掉删除（`DIS[     ]ED`）→ **P3** 15 个红色报错弹窗级联爆发占满屏幕 | `FRAGMENTS`、`DIS[     ]ED`、`ILLEGAL ARGUMENTS (#01..15)` |
| **10** | `129.20–133.15` | `FIRST_EXECUTION_DROP` | 全曲 Drop：6 次半小节重锤红黑反转，巨型分号 `;` 断头台与人形剪影差值叠印，身体内部裁切 `SIGKILL · PID 3882` | `EXECUTION 1/6 .. 6/6` |
| **11** | `133.15–147.91` | `SANDBOX_ISOLATION` | **P1** 3D 细分隔离笼与受困粒子 → **P2** 八分体超立方体沿轴向爆裂 → **P3** 屏幕玻璃放射裂纹 + 纵向像素排序拉丝 → **P4** 四色错版建筑版画 `SANDBOX` | `chroot /sandbox`、`SANDBOX BREACH`、`SANDBOX` |
| **12** | `147.91–162.68` | `ABSURD_ONTOLOGY` | **A (147.9–159.2s)** `while (you.presence != "online")` 爱的死循环代码机执行 `01/12..12/12`（第 5、9、12 轮三级推镜与溢出撕裂 + 四音节 `EX-E-CU-TION` 块）→ **B (159.2–161.9s)** 六国语言全屏闪卡（`1 eins` / `2 dos` / `3 trois` / `4 넷` / `5 fem` / `6 六`）→ **C (161.9–162.7s)** 双排巨字镂空透出红眼 | `OVERFLOW`、`1..6` 多语种大字卡、`EXECUTION` 镂空眼 |
| **13** | `162.68–177.45` | `THEOLOGICAL_COLLAPSE` | 全屏居中 Droste 递归眼隧道 + 副歌四张版画的**崩坏重印**（抹去代表你的米白版、错版从 `12px→20px→28px` 加剧、所有关键词被篡改为 `EXECUTION`），末段三音节卡顿印出 `L-O-V-E` 并坠入白场 | `EXECUTION` ×3、`L— / L-O— / L-O-V-E` |
| **14** | `177.45–184.84` | `EXECUTION_STORM_I` | **全屏居中试卷 1（黑板课）**：`me ∩ you = us` 韦恩图 + **14 阶傅里叶本轮链实时绘制心形线** → **全屏居中试卷 2（测验卡）**：涂卡气泡 + **3D Taubin 代数心形曲面旋转** + 红色 `[0/100 FAILED TO BE LOVED]` 印章 | `LESSON 01`、`QUIZ 0/100`、`L-O-V-E` |
| **15** | `184.84–192.22` | `MULTILINGUAL_COUNTDOWN` | **全屏居中试卷 3（公式）**：光之棘轮（Ratchet）放射光芒 + 心形边界内受困剪影 → **全屏居中试卷 4（反证法证明）**：`191.36s` 三墨印版从 `24px` 错位瞬间归零合拢于心形曲线内，盖下 `PROVEN` 红印，定格为全片最亮最干净的一帧 | `FORMULA`、`PROOF · Q.E.D.`、`L O V E` |
| **16** | `192.22–199.61` | `FATAL_EXECUTION_II` | 亮度骤降为死灰（Ash），Seg 15 的人形与心形在画面中央碎裂为 180 块网格碎片与 3D 旋转晶核，12 道横贯全屏的红色 `SIGKILL` 激光线切过 | `core.decompose()`、`STILL STANDING` |
| **17** | `199.61–207.15` | `FINAL_PLEA_OVERLOAD` | **P1** 全屏舞台观众剪影 + 漫天 `please.` 椭圆环与 `999%` 过载条 → **P2 (`205.8s`)** 整幅画面缩小为离线聊天窗口里的一张未读图片消息（`"I have learned how to love you." · unread · ♥ 0`） | `PLEASE` → 离线窗口未读消息 |
| **18** | `207.15–209.50` | `WORLD_EXECUTE_ME` | 纯黑虚空，中央巨型终端逐字敲出 `> world.execute(me);`，下方心电/声波脉冲在 `209.2s` 拉成一条红色直线 | `> world.execute(me);` |
| **19** | `209.50–212.50` | `POST_MORTEM_ECHO` | 全片轨迹坍缩为画面中央一点 → 绽放为巨型分号 `;` + 缓缓闭合的见证之眼 + `[exit] code=137 SIGKILL`，首尾闭环 | `;` |
