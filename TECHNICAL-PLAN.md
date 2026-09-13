# Pretty Properties QoL 技术方案

## 目标

实现第一阶段的图片便捷操作：

1. 在当前笔记正文的本地图片上右键，选择将图片设置为 Icon、Cover 或 Banner。
2. 在原生 properties 行右侧显示图片选择按钮；按钮通过系统文件选择器选择外部图片，将图片复制到仓库后写入对应 property。
3. 提供三个命令面板命令，作为 property 行按钮不可用时的完整降级入口。

## 已确认的约束

- 插件 ID：`pretty-properties-qol`；显示名：`Pretty Properties QoL`。
- 完全独立于 Pretty Properties；默认属性名为 `icon`、`cover`、`banner`，三者可分别配置。
- 第一阶段以 macOS 桌面端为基线，最低版本按当前运行中的 Obsidian `1.14.1` 设置。
- 属性图片值统一写为 wikilink；可配置为最短无歧义链接（默认）或完整仓库路径。
- 修改属性使用 Obsidian frontmatter API；图片属性准备命令将缺失属性写成空字符串并移到 frontmatter 最前面。
- 外部图片使用系统文件选择器选择；目标目录是仓库根目录下可配置的相对路径，默认根目录。
- 支持常见图片格式；自动创建目标目录；冲突时生成不重复文件名，不覆盖已有文件。
- 外部导入采用“先复制、后写属性”；写属性失败时尝试删除本次新文件。
- 阅读视图和 Live Preview 支持 property 行按钮；源码模式不支持行内按钮。
- 正文图片右键支持阅读视图和 Live Preview，支持 wikilink/Markdown 图片链接及常见别名、尺寸语法。

## 模块边界

### Domain / pure logic

- `src/domain/types.ts`：视觉角色、设置、命名策略等类型。
- `src/domain/path-utils.ts`：仓库相对路径校验、目标路径生成、冲突后缀。
- `src/domain/file-naming.ts`：原始文件名、笔记名+角色名、手动文件名三种策略。
- `src/domain/image-validation.ts`：图片 MIME/扩展名校验和手动文件名校验。

这些模块不依赖 Obsidian，可单元测试。

### Obsidian integration

- `src/services/frontmatter-service.ts`：属性类型检查、设置单个图片值、准备并排序三个图片属性。
- `src/services/image-import-service.ts`：创建目标目录、读取 `File`、生成仓库路径、复制文件。
- `src/services/image-assignment-service.ts`：组合导入与属性写入，负责失败清理和 Notice。
- `src/services/embedded-image-resolver.ts`：从当前笔记视图中的图片元素解析仓库内图片文件。
- `src/ui/image-file-picker.ts`：创建 `input[type=file]`，触发系统文件选择器。
- `src/ui/file-name-modal.ts`：手动命名模式的输入框。
- `src/ui/property-row-buttons.ts`：观察 properties UI，向匹配的原生 property 行注入按钮，并通过按钮所在的 Markdown 窗格解析目标笔记；失败不影响其他入口。
- `src/ui/context-menu.ts`：识别正文图片，并将三个操作追加到 Obsidian 原生图片菜单。

### Plugin composition

- `src/main.ts`：加载设置、注册命令/事件/视图刷新、组装服务和清理生命周期。
- `src/settings-tab.ts`：三个属性名、导入目录、命名策略设置。

## 关键流程

### 设置图片属性

1. 确认目标文件是 Markdown 笔记；命令使用当前活动文件，属性按钮使用按钮所属窗格的文件。
2. 选择源图片（正文已有仓库图片，或系统文件选择器选中的外部图片）。
3. 外部图片场景校验类型、确定名称、创建目标目录并复制到仓库。
4. 使用 `processFrontMatter` 检查目标属性类型。
5. 目标属性不存在、为空（`null`/`undefined`）或是字符串时，按链接样式设置写入 wikilink；列表、数字、日期等类型拒绝操作。
6. 如果第 4/5 步失败，尝试删除本次新复制的文件；结果通过 Notice 反馈。

### 注入 property 行按钮

使用 `MutationObserver` 扫描 `.metadata-property` 等原生 properties UI 节点。通过 property key 文本匹配当前设置中的三个属性名，并使用 `data-ppqol-role` 防止重复注入。按钮固定在属性行右侧，并拦截按下事件，避免原生空值编辑器在文件选择结束后覆盖新写入的链接。源码模式没有目标节点，因此不会注入按钮。

该层依赖 Obsidian 当前 DOM 结构，只是增强入口；三个命令和正文图片右键菜单不依赖它。

## 验收场景

- 三个默认属性名和自定义属性名均能匹配。
- 空值/重复属性名不能保存。
- 正文 wikilink、Markdown 图片、别名、尺寸语法均能解析到本地文件。
- 外部选择器取消不产生 Notice、不导入文件。
- 非图片文件被拒绝，目标 property 不变。
- 缺失目标目录自动创建。
- 原始文件名、笔记名+角色名、手动命名均生效。
- 同名文件不被覆盖，生成唯一名称。
- 最短无歧义链接与完整仓库路径两种属性值格式均可配置。
- 无 frontmatter 时自动创建。
- 目标 property 为列表、数字、日期时拒绝操作。
- 属性写入失败时尝试清理本次导入文件。
- 原生图片右键菜单包含三个插件操作，连续右键不会叠加菜单；命令面板、property 行按钮仍可独立工作。
- 属性准备命令只补充缺失属性，并把图片属性放在 frontmatter 最前面。

## 验证策略

- `npm run test`：运行纯逻辑单元测试。
- `npm run build`：TypeScript 类型检查和生产构建。
- 在 macOS Obsidian `1.14.1` 中手动验证阅读视图、Live Preview、设置页、右键菜单、命令面板和 property 行按钮。
