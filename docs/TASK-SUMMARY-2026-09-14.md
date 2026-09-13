# Pretty Properties QoL 第一阶段任务总结

日期：2026-09-14

## 任务目标

本阶段完成一个独立的 Obsidian 插件，提供两个主要入口：

1. 在笔记正文的本地图片上使用原生右键菜单，将图片设置为当前笔记的 `icon`、`cover` 或 `banner`。
2. 在 Obsidian 原生 Properties 的相应属性行右侧增加按钮，通过系统文件选择器导入外部图片并写入属性。

插件名为 **Pretty Properties QoL**，插件 ID 为 `pretty-properties-qol`。它可以配合 Pretty Properties 使用，但不依赖或修改 Pretty Properties。

## 已实现内容

### 正文图片右键操作

- 支持 Live Preview 和阅读视图中的本地嵌入图片。
- 支持 wikilink、Markdown 图片链接、别名和尺寸语法。
- 将 Set as Icon、Set as Cover、Set as Banner 追加到 Obsidian 原生图片菜单。
- 对同一菜单实例去重，连续右键不会叠加插件菜单。

### Properties 图片按钮

- 自动匹配配置的 `icon`、`cover`、`banner` 属性名。
- 按钮固定在属性行右侧，不随悬停或选中状态移动。
- 通过系统文件选择器选择图片，导入后写入相应属性。
- 支持多 Markdown 窗格，按照按钮所在窗格确定目标笔记，而不是盲目使用当前活动笔记。

### 图片导入与属性写入

- 可配置仓库内导入目录，并自动创建缺失目录。
- 支持常见图片格式，拒绝非图片文件。
- 同名文件添加数字后缀，不覆盖已有文件。
- 支持保留原文件名、笔记名加角色名、手动命名三种策略。
- 使用 Obsidian `processFrontMatter` API 修改 YAML。
- 空值、`null`、`undefined` 和字符串属性可以写入；列表、数字等不兼容类型不会被覆盖。
- 属性值统一写为 wikilink，可选择最短无歧义链接或完整仓库路径。
- 属性写入失败时尝试清理本次新导入的文件。

### 设置与备用入口

- `icon`、`cover`、`banner` 三个属性名可以分别配置。
- 可配置导入目录、文件命名策略和链接样式。
- 提供 Icon、Cover、Banner 三个命令面板入口。
- 提供 Prepare image properties 命令，补充缺失属性并将图片属性排列到 frontmatter 前部。

## 主要问题与解决方式

### 属性按钮位置变化

按钮最初依赖 Obsidian 属性值区域的内部布局，导致悬停或选中时位置变化。最终将属性行设为定位容器，按钮绝对定位在右侧，并为其预留宽度。

### YAML 空属性无法写入

`cover:` 等空属性会被 YAML 解析为 `null`，最初的检查只接受字符串。最终把 `null` 和 `undefined` 纳入合法空值，同时继续保护列表、数字等非文本值。

### 右键菜单重复或与原生菜单分离

最初自行监听 DOM `contextmenu` 并创建独立菜单，没有进入 Obsidian 的菜单生命周期。最终改用 `file-menu` 和 `editor-menu` 事件，把操作追加到原生菜单并进行实例去重。

### 属性链接路径不符合使用习惯

最初固定写入完整仓库路径。最终增加链接样式设置，默认通过 metadata cache 生成最短无歧义链接，同时保留完整路径选项。

### 图片已导入但属性仍为空

插件按钮位于原生属性行内部，按钮事件可能同时激活 Obsidian 的空属性编辑器，后者随后提交空值并覆盖插件结果。最终在 `window` 捕获阶段拦截按钮相关的鼠标和键盘事件，阻止它们进入原生属性编辑流程。

### 错误使用 `Untitled 4` 命名并写入错误笔记

这是本阶段最后确认的关键问题。属性按钮会出现在所有打开的 Markdown 窗格中，但旧实现始终取得当前活动窗格的文件。点击非活动窗格的按钮时，图片会按照另一个活动笔记（例如 `Untitled 4`）命名，链接也会写入错误笔记。

最终实现会遍历 Markdown leaves，根据按钮是否位于某个 `MarkdownView.containerEl` 内来确定按钮所属笔记，再把这个明确目标传给导入和属性写入流程。交叉窗格回归中，活动窗格保持为 `Untitled 4`，点击非活动的 `PPQOL Test` 窗格后，正确生成了 `PPQOL Test-cover.jpg` 并把链接写入 `PPQOL Test.md`，没有修改 `Untitled 4.md`。

## 验证结果

- `npm test`：2 个测试文件、8 项测试通过。
- `npm run build`：TypeScript 类型检查和生产构建通过。
- `git diff --check`：通过。
- 已在 macOS、Obsidian 1.14.1 和 ObsidianTest 仓库中完成手动验证。
- 已验证原生图片菜单、属性按钮、空属性、命名冲突、两种链接样式和双窗格目标笔记识别。

## 尚未完成或当前限制

- 尚未在 Windows、Linux 和移动端验证。
- 属性行按钮依赖 Obsidian 当前的 Properties DOM，未来 Obsidian 版本可能需要适配。
- 源码模式没有原生 Properties 行，因此不显示行内按钮；命令面板入口仍可使用。
- 自动测试目前主要覆盖纯逻辑，尚无 Obsidian 运行时、菜单、文件选择器、DOM 和多窗格的自动化集成测试。
- 尚未支持远程网络图片、多图片批量操作、拖放导入、剪贴板导入和图片裁剪预览。
- 尚未实现 `cover_shape`、`cover_position` 等 Pretty Properties 附加视觉属性。
- 尚未完成多语言本地化、正式版本发布、GitHub Release 和 Obsidian Community Plugins 提交。
- 尚未进行跨主题、跨插件组合和大规模仓库兼容测试。
