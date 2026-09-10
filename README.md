# RainBow

基于 [PaperMod](https://github.com/adityatelange/hugo-PaperMod) 的 Hugo 主题。正文采用纸色、衬线字体和清晰的阅读层级；导航、目录和控件采用轻磨砂材质。支持浅色、深色和移动端。

保留终端窗口式代码块、侧边目录、图片缩放和 GitHub Issues 评论。标签按名称生成稳定的多色色相，交互动画遵循系统的减少动态效果设置。原始 PaperMod 的 MIT 许可及作者署名保留在仓库中。

## 本地预览

建议使用 **Hugo extended 0.165.0**；CI 同时验证 0.165.0 与 0.166.0，最低要求 0.158.0。

```sh
hugo server --source exampleSite --themesDir ../.. --theme hugo-RainBow
```

示例文章为独立编写的测试内容。`example/comments` 是示例配置，使用时替换为自己的评论仓库。

```sh
bash scripts/verify.sh
```

该命令在临时目录构建示例站点并检查输出：页面、搜索索引、评论映射、资源、图表、公式及功能开关。不会修改现有博客。

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

## 阅读字体

默认通过 jsDelivr 加载霞鹜文楷 1.7.0，用于阅读标题、正文和首页摘要，并保留系统字体回退。

```toml
[params.rainbow]
readingFontCSS = "https://cdn.jsdelivr.net/npm/lxgw-wenkai-webfont@1.7.0/style.min.css"
```

可以替换为自己的同名字体 CSS，或设置为空字符串以使用本地字体回退。

## 标签展示

```toml
[params]
TagLayout = "cloud" # cloud / labels
TagEffects = true # Default ambience; visitors can toggle it
```

该配置仅决定首次访问的默认模式。访客可以在页面上切换 3D 球形标签云与完整标签列表，浏览器会记住选择。球形视图展示最多 60 个热门标签，支持拖动、暂停与键盘选择；减少动态效果时默认使用列表。两种模式都按标签名称生成稳定色相。

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

传递依赖见 `go.mod`、`go.sum` 和 `_vendor/modules.txt`。Mermaid 浏览器端版本固定为 11.12.0，使用严格安全模式。所有 vendored 依赖的许可证保留在 `licenses/`，以免再次执行 vendor 命令时丢失。

RainBow 在初始化时同步到 PaperMod 提交 `d3768854d00ad003b0a8dbdba254ce9224377a01`，之后独立维护，不再自动或定期合并上游。`upstream` 远程与原始 Git 历史仅用于追溯来源。

更新模块时，在主题仓库执行并提交锁文件与 `_vendor` 的变化：

```sh
hugo mod get github.com/hugomods/utterances@v0.1.0
hugo mod vendor
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

PaperMod 的布局和基础资源在初始化时同步，随后由 RainBow 独立维护。定制主要位于 `assets/css/extended/`、`assets/js/rainbow.js` 和 `layouts/_partials/rainbow/`。评论、页脚、目录和首页简介有少量适配，修改时应检查这些位置。

移除了旧的重复复制按钮初始化、无消费者的访问统计脚本、过时的 MathJax 注入，以及包含硬编码凭据且未使用的 iQiyi 短代码。保留现有 Bilibili 嵌入和新版 Hugo 已移除的 Gist 短代码兼容入口。
