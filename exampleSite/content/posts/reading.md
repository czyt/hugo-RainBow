---
title: "让文字回到阅读本身"
date: 2026-09-01
tags: ["设计", "Hugo", "Go", "阅读", "排版", "开源", "笔记", "Rust", "CSS", "工具", "Linux", "日常"]
math: true
---

好的排版不必抢在文字前面。清楚的层级、适当的行距，以及读到长句时仍然舒适的行宽，已经足够让一篇文章容易读下去。

## 中文标题与 Mixed CASE

RainBow 延续 PaperMod 的轻量结构。首页用于找到文章，目录帮助长文定位，代码块则完整保留终端窗口的样式。

下面是一段独立的示例代码，用来检查代码复制和横向滚动。

```go
package main

import "fmt"

func main() {
    fmt.Println("RainBow: readable text, clear navigation, and a very long line that should scroll inside this code block on a narrow screen.")
}
```

### 层级、空白与节奏

正文通过段落和标题建立节奏。说明信息可以安静一些，但仍应容易看清。链接需要可以辨认，键盘操作也需要明确的焦点。

| 场景 | 呈现方式 | 目的 |
| --- | --- | --- |
| 阅读长文 | 正文与侧边目录 | 方便定位 |
| 查找文章 | 本地搜索与标签 | 减少翻找 |
| 阅读代码 | 等宽字体与横向滚动 | 保持代码完整 |

> 让装饰少一点，让内容多一点。

#### Deep Heading

多层标题、中文字符和大小写都应保持可定位。不要从标题文本推测锚点，使用页面实际生成的 ID。

![RainBow 图像缩放示例](/images/sample.svg)

## 公式

行内公式 $E=mc^2$ 与独立公式：

{{< katex >}}
\int_0^1 x^2\,dx = \frac{1}{3}
{{< /katex >}}

## 图表

```mermaid
flowchart LR
    A[写作] --> B[本地预览]
    B --> C[发布]
```

{{< mermaid >}}
sequenceDiagram
    读者->>博客: 打开文章
    博客-->>读者: 内容、目录与评论
{{< /mermaid >}}

## 后续阅读

这些内容只用于主题预览与自动化验证，不来自任何私人博客。
