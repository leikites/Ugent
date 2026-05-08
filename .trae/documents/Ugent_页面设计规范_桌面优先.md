# Ugent 页面设计规范（桌面优先）

## Global Styles（全局）
- 设计原则：先满足 1440px 桌面；再下探 1280/1024；移动端仅保证可用性不追求信息密度。
- 布局基线：12 栅格；内容最大宽度 1200–1320px；页面左右 padding 24px（≥1280），16px（≤1024）。
- 色彩 Token（示例，可由“品牌配置”覆盖）：
  - --bg: #0B1220（深色）或 #FFFFFF（浅色，二选一作为默认主题）
  - --text: #0F172A
  - --muted: #64748B
  - --primary: 取自品牌 primaryColor（默认 #2563EB）
  - --danger: #DC2626
  - --border: #E2E8F0
- 字体与排版：
  - 字体：系统字体栈（优先苹方/微软雅黑/Inter）
  - 字号：12/14/16/20/24；正文 14 或 16；标题层级清晰（H1 24、H2 20、H3 16）
  - 行高：正文 1.5；表格 1.3
- 组件交互：
  - 按钮：Primary/Secondary/Ghost；hover 提亮 6–10%；disabled 降低不透明度并禁用点击
  - 输入框：focus 显示 primary 色描边；错误态显示 danger + 辅助文案
  - 链接：默认 primary；hover 下划线
- i18n 展示：
  - 长文本截断：列表卡片标题单行省略；详情页允许换行
  - 中英文混排：代码/标识符使用等宽字体；避免全角标点挤压

---

## Page 1：登录/注册页
### Layout
- 双栏布局（CSS Grid）：左侧品牌与说明，右侧表单卡片；≤1024px 改为单栏垂直堆叠。

### Meta Information
- title：Ugent 登录
- description：登录 Ugent 工作台，创建与管理 AI 应用。
- og:title / og:description 同上；og:image 使用品牌默认分享图（可选）。

### Page Structure
1. 顶部细条：语言切换（下拉），可选“访问帮助”。
2. 主体 Grid：
   - 左栏（Brand Panel）：
     - Logo（来自品牌配置）
     - 产品名 Ugent（可被 productName 覆盖）
     - Slogan（可配置 loginSlogan）
   - 右栏（Auth Card）：
     - Tabs：登录 / 注册（若管理员关闭注册则隐藏）
     - 表单区：邮箱、密码、提交按钮
     - 辅助区：忘记密码、错误提示、加载状态
3. 页脚：版权信息与版本号（小字，来自 settings meta）。

### Sections & Components
- AuthCard
  - Input：Email / Password
  - Button：Sign in / Sign up
  - Alert：错误消息（网络失败、账号不存在、密码错误）
- LocaleSwitcher：切换后立即刷新文案（保留当前路由）。

---

## Page 2：工作台首页
### Layout
- 顶部导航 + 主内容两栏（Flex）：左侧侧边栏导航，右侧内容区；≤1024px 侧边栏可折叠为图标栏。

### Meta Information
- title：Ugent 工作台
- description：进入应用构建、数据集与系统设置。

### Page Structure
1. TopNav：
   - 左：Logo + 产品名
   - 中：工作区选择器（下拉）
   - 右：用户菜单（个人信息/退出）
2. SideNav：应用、数据集、设置
3. Content：
   - Section A：入口卡片（应用 / 数据集 / 设置）
   - Section B：最近访问列表（最近应用/数据集）
   - Section C：系统提示（升级/维护/缺失配置）

### Sections & Components
- EntryCards：3–6 张卡片栅格（CSS Grid，3 列 → 2 列 → 1 列）
- RecentList：表格或列表，支持点击直达
- SystemNotices：可折叠提示条（info/warn/error）

---

## Page 3：应用构建页
### Layout
- 三段式：顶部工具条 + 左侧资源/节点面板 + 中央编辑区 + 右侧调试/配置抽屉（可切换）。
- 编辑区优先使用 CSS Grid（左右两列）或“可伸缩分栏”（split panes）。

### Meta Information
- title：应用构建 - Ugent
- description：创建、调试并发布 AI 应用。

### Page Structure
1. AppHeader
   - 返回工作台
   - 应用名称（可编辑）
   - 状态：草稿/已发布
   - 操作：保存、发布
2. Main Workspace
   - 左：应用资源（提示词、工作流节点、变量、工具）
   - 中：编辑器（上游既有：工作流画布或配置表单）
   - 右：调试面板（输入参数、运行、输出、日志/错误）
3. Version Drawer（可选抽屉）
   - 版本列表、发布时间、备注、回滚按钮

### Sections & Components
- EditorCanvas / ConfigForm：保持与上游结构一致，仅替换品牌与文案
- DebugPanel：
  - 输入区（多行文本/结构化参数）
  - Run 按钮 + loading
  - 输出区（支持复制）
  - ErrorStack（可展开）
- PublishModal：发布确认、版本备注、可见性提示

---

## Page 4：数据集页
### Layout
- 列表页（顶部工具条 + 表格/卡片）与详情页（左右结构：左侧文档列表，右侧处理/检索）。

### Meta Information
- title：数据集 - Ugent
- description：导入文档，构建检索能力。

### Page Structure
1. DatasetList
   - 工具条：新建、搜索
   - 列表：名称、状态、文档数、更新时间
2. DatasetDetail
   - 顶部：返回、数据集名称、状态
   - 左：文档列表（上传记录、处理状态）
   - 右上：导入区（上传/抓取，参数：分段/清洗）
   - 右下：检索测试（Query 输入、命中片段列表、提示语）

### Sections & Components
- ImportPanel：进度条、失败重试、失败原因展示
- RetrievalTest：命中片段卡片（高亮关键词、显示来源文档）

---

## Page 5：系统设置页（品牌 / 语言 / 二次开发）
### Layout
- 左侧设置导航（垂直 Tabs），右侧表单区（卡片分组）。

### Meta Information
- title：系统设置 - Ugent
- description：配置品牌与语言，查看版本与构建信息。

### Page Structure
1. SettingsNav（左）：品牌配置 / 语言本地化 / 二次开发与升级
2. 品牌配置（右）：
   - 产品名
   - Logo 上传（预览 + 替换）
   - Favicon 上传（预览）
   - 主题色选择器（预览按钮/链接样式）
   - 登录页文案
   - 保存/取消
3. 语言本地化：
   - 默认语言、回退语言
   - 词条包版本信息（只读）
   - 词条包导入/更新（上传或拉取，按产品策略实现）
4. 二次开发与升级：
   - 当前 Ugent 版本、关联上游版本、BuildId
   - 配置来源提示（例如：数据库/环境变量/配置文件）
   - 升级注意事项入口（链接到内部说明或文档）

### Sections & Components
- PreviewHeader：保存前即时预览（顶部 Logo/产品名/主色）
- SettingsForm：分组卡片（每组含标题、说明、字段、校验提示）
- VersionPanel：只读信息列表 + 复制按钮（复制版本号/BuildId）
