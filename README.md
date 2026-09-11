# RainBow

**简体中文** · [English](README.en.md)

面向长文阅读的 Hugo 主题。正文采用纸色、衬线字体和清晰的阅读层级；导航、目录和控件采用轻磨砂材质。支持浅色、深色和移动端。

保留终端窗口式代码块、侧边目录、图片缩放和 GitHub Issues 评论。标签按名称生成稳定的多色色相，交互动画遵循系统的减少动态效果设置。来源与许可证见下文。

## 本地预览

建议使用 **Hugo extended 0.165.0**；CI 同时验证 0.165.0 与 0.166.0，最低要求 0.158.0。

```sh
hugo server --source exampleSite --themesDir ../.. --theme hugo-RainBow
```

示例文章为独立编写的测试内容。`example/comments` 是示例配置，使用时替换为自己的评论仓库。

```sh
bash scripts/verify.sh
```

验证需要 Python 3 和 Node.js 20+。该命令在临时目录构建示例站点并检查输出：页面、搜索索引、评论映射、资源、图表、公式及功能开关。不会修改现有博客。

## 接入已有博客

```sh
git submodule add https://github.com/czyt/hugo-RainBow.git themes/RainBow
ln -s themes/RainBow/_vendor _vendor
```

仅在博客尚无 `_vendor` 时使用上述链接；已有 Hugo Module 依赖的博客应统一管理自己的模块与 vendor 目录，不覆盖已有目录。`_vendor` 链接让普通主题安装直接使用主题中锁定的 HugoMods，无需在 Cloudflare 构建时安装 Go 或下载模块。

```toml
theme = ["RainBow"]
locale = "zh-CN"
defaultContentLanguage = "zh"

[params]
ShowCodeCopyButtons = true
ShowToc = true
TocSide = "right" # left / right；不设置则使用正文内目录
EnableImageZoom = true
comments = true

[params.utterances]
repo = "YOUR_NAME/YOUR_COMMENTS_REPO"
mapping = "pathname"
label = ""
theme = "preferred-color-scheme"

[markup.highlight]
noClasses = false

[outputs]
home = ["HTML", "RSS", "JSON"]
```

已有评论的站点应保留原来的 `repo`、`mapping` 和文章 URL。RainBow 会通过 HugoMods 的 `setTheme()` 让评论随站点明暗模式切换。旧的 `params.utteranc` 配置仍可兼容。

数学公式使用 `katex` 短代码或 `katex` 代码围栏，也可在文章 front matter 中设置 `math: true` 以识别 `$...$` 等公式。Mermaid 同时支持原来的 `mermaid` 短代码和代码围栏。资源只在对应页面加载。

`ShowCodeCopyButtons`、`EnableImageZoom`、`comments` 可在文章 front matter 中分别关闭。首页 `homeInfoParams.Title` 可省略，此时只显示简介，不重复站点名称。设置 `params.homeInfoParams.Typewriter = true` 可启用简介打字效果，每次进入首页播放一次，并尊重减少动态效果设置。

## 目录与复制按钮

目录以随标题层级缩进的细导轨连接各项，当前章节用主题强调色标记。顶部导航采用跟随鼠标的共享高亮气泡，离开后返回当前栏目；键盘和减少动态效果模式直接定位。

```toml
[params]
TocOpen = true
CodeCopyDisplay = "hover" # always / hover
```

目录默认展开，浮动折叠按钮在悬停或键盘聚焦时显示。触摸设备直接显示按钮。`hover` 模式下复制按钮随代码块悬停或键盘聚焦显示，触摸设备始终显示。

## 代码高亮

```toml
[params]
CodeHighlighter = "gpu-lexer" # chroma / gpu-lexer
```

这是站点设置。默认 `chroma` 使用 Hugo 构建时的高亮；`gpu-lexer` 会在支持 WebGPU 的安全浏览器环境中尝试实验高亮。HTML 始终包含 Chroma 回退，模块或 GPU 初始化失败、超时、结果不合法时保留原样。代码只在访客本地处理，不发给外部接口。

GPU 模块仅在代码块接近视口时加载。带行号、指定行高亮或超过 100,000 字符的代码块继续使用 Chroma。代码文本与复制按钮保持不变。该模型是实验性词法分类器，存在识别误差，不用作语法校验。

浏览器分发版本和校验值记录在 `data/rainbow/gpu-lexer.json`。每周一 **Update GPU lexer** 检测 npm 新版，不执行 npm lifecycle scripts；通过导出/语法检查、渲染器回归测试与 Hugo 构建后，才提交更新。上游许可或导出结构变化会停止自动更新，等待人工检查。可在 Actions 手动运行。

```sh
python3 scripts/update-gpu-lexer.py
bash scripts/verify.sh
```

## 阅读字体

默认优先使用 Maple Mono，中文回退到霞鹜文楷 1.7.0。代码块同样优先使用 Maple Mono，再回退到霞鹜文楷等宽字体与系统等宽字体；未接入额外宋体。

```toml
[params.rainbow]
monoFontCSS = "https://cdn.jsdelivr.net/npm/@fontsource/maple-mono@5.3.0/index.min.css"
readingFontCSS = "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.min.css"
```

可以替换为自己的同名字体 CSS，或设置为空字符串以使用本地字体回退。

## 标签展示

```toml
[params]
TagLayout = "cloud" # cloud / labels
TagEffects = true # Enable tag-cloud ambience
```

该配置仅决定首次访问的默认模式。访客可以用右上角的小熊开关切换 3D 球形标签云与完整标签列表，浏览器会记住选择。球形视图展示最多 60 个热门标签，支持拖动与键盘选择；鼠标悬停、键盘聚焦或切换到列表时停止旋转，减少动态效果时默认使用列表。底部不再显示控制按钮与说明，氛围效果由 `TagEffects` 配置。两种模式都按标签名称生成稳定色相。完整列表与文章顶部标签共用紧凑的“标签名＋内部数量”样式。列表数量默认可见；悬停只增强背景反馈。

## 页脚自定义

默认仅显示 Powered by RainBow。可以配置 Hugo 的顶层 `copyright`、`params.footer.text`（支持 Markdown）和 `params.footer.showThemeCredit`：

```toml
copyright = "© {year} Your Name"

[params.footer]
text = "[关于本站](/about/)"
showThemeCredit = true
```

`{year}` 会在构建时替换为当前年份。

将 `showThemeCredit` 设为 `false` 可隐藏主题链接，`hideFooter = true` 可隐藏整个页脚。博客未填写版权或自定义文字时，不生成默认版权行。

## HugoMods 与维护

主题使用并锁定以下模块：

| 模块 | 版本 | 用途 |
| --- | --- | --- |
| hugomods/utterances | 0.1.0 | GitHub Issues 评论与主题接口 |
| hugomods/mermaid | 0.1.4 | Mermaid 短代码与渲染钩子 |
| hugomods/katex | 0.3.6 | 公式与本地字体资源 |

传递依赖见 `go.mod`、`go.sum` 和 `_vendor/modules.txt`。Mermaid 浏览器端版本固定为 11.12.0，使用严格安全模式。所有 vendored 依赖的许可证保留在 `licenses/`，由 `scripts/vendor.sh` 在重新生成依赖时恢复；该脚本同时移除上游构建工具的 npm 开发清单。

RainBow 源自 [PaperMod](https://github.com/adityatelange/hugo-PaperMod)，原始 MIT 许可及作者署名保留在 `LICENSE`、资源许可头和 `theme.toml` 的 `[original]` 中。初始化时同步到提交 `d3768854d00ad003b0a8dbdba254ce9224377a01`，之后独立维护，不再自动或定期合并上游。`upstream` 远程与原始 Git 历史仅用于追溯来源。

更新模块时，在主题仓库执行并提交锁文件与 `_vendor` 的变化：

```sh
hugo mod get github.com/hugomods/utterances@v0.1.0
bash scripts/vendor.sh
bash scripts/verify.sh
```

更新引用主题的博客：

```sh
git submodule update --init --recursive
git submodule update --remote themes/RainBow
hugo --gc --minify
```

博客需提交新的子模块版本，Cloudflare Pages 的 Git 集成才会收到新提交并重新部署。Cloudflare 的 `HUGO_VERSION` 建议显式设置为 `0.165.0`，构建命令为 `hugo --gc --minify`，输出目录为 `public`。

## 维护边界

RainBow 的布局和基础资源由本仓库独立维护。定制主要位于 `assets/css/extended/`、`assets/js/rainbow.js` 和 `layouts/_partials/rainbow/`。评论、页脚、目录和首页简介有少量适配，修改时应检查这些位置。

移除了旧的重复复制按钮初始化、无消费者的访问统计脚本、过时的 MathJax 注入，以及包含硬编码凭据且未使用的 iQiyi 短代码。保留现有 Bilibili 嵌入和新版 Hugo 已移除的 Gist 短代码兼容入口。

## Markdown 阅读样式

正文链接采用细下划线与主题强调色，外链附带小型方向标记；导航、标签、目录与页脚不套用这组正文链接样式。

文章标题与日期下方显示可点击的标签；点击可查看同一标签下的文章，文末不再重复显示。标签名采用中性色，文章标签内部显示同标签文章数量；桌面悬停时以 160ms 淡入，背景以 180ms 轻移填充，标签尺寸不变。键盘聚焦直接显示，触屏数量始终可见，并尊重减少动态效果设置。没有标签的文章不生成空标签区域。

引用采用缩进与低饱和文字区分，带出处的 `blockquote` 短代码支持多段落。列表保留原生编号及起始值，嵌套层级使用圆点、空心圆或字母辅助辨认；不添加编号徽章。脚注使用方括号编号、分隔线和落点高亮，原生锚点支持浏览器返回与键盘焦点。示例见 `exampleSite/content/posts/typography.md`。

## 状态页

404 自动生成，提供返回首页和搜索入口；仅在站点存在 `layout: search` 页面时显示搜索链接。页面遵循站点语言及明暗模式。404 采用小熊插画和逐字恢复的故障文字，进入页面后约 640ms 恢复为状态码；悬停或键盘聚焦返回首页时，小熊恢复表情。减少动态效果时直接显示状态码。说明与导航保持稳定。

404 页还提供贪吃蛇和俄罗斯方块，点击游戏区底部的两个图标切换，切换时暂停并保留各自进度。贪吃蛇支持方向键 / WASD、空格暂停、触屏滑动和方向按钮，允许穿墙并随吃食加速。俄罗斯方块采用复古液晶屏配色，包含七种方块、旋转、消行计分和逐级加速；方向键移动/旋转/下落，空格落到底，P 暂停，也可使用触屏按钮。两个游戏均按需开始，结束后可重玩；切换标签页、窗口失焦或焦点离开游戏时自动暂停。游戏资源仅在 404 页加载，无 JavaScript 时保留错误说明和导航。底部图标来自 Lucide，许可见 `licenses/lucide.LICENSE`。

需要 500 或 503 页面时，将 `exampleSite/content/500.md`、`exampleSite/content/503.md` 复制到博客的 `content/` 下。Hugo 会生成 `/500.html` 和 `/503.html`，并通过 `layout: status` 使用同一套排版；这两个页面不出现在文章列表、搜索、RSS 和站点地图中，且标记为 noindex。多语言站点需在对应语言的内容目录放置这些文件，URL 按部署路径设置。

这些文件只负责页面内容。实际 HTTP 500/503 响应需由服务器或 CDN 配置，并保留原错误状态码；直接访问静态文件通常返回 200。Cloudflare Pages 会使用根目录的 `404.html` 处理不存在的路径，但不会因为存在 `500.html` 就自动替换平台的 5xx 错误页。不要用 200 重写规则模拟服务器错误。
