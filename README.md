# 自我管理 · Self Management for DeepSeek Harness

一个跑在 DeepSeek Harness（`dsh`）Web / Desktop 界面里的自我管理插件：把「缺点、学习方向、待办」放在同一页，每天提醒自己，并且可以用**一句话让 AI 生成条目草稿，确认后写入**。

> 插件以 DSH 进程权限运行。数据保存在浏览器本地（localStorage），不会上传到任何服务器；AI 草稿功能会把你的那句话发送到当前对话，由当前配置的模型整理。安装前请阅读下面的「数据与风险」。

## 功能

- **一句话生成**：面板顶部「✨ 一句话生成」输入一句描述（例如「我总是拖延到最后一刻；想三个月内学好英语口语；明天要交周报」），插件自动在对话里请 AI 整理成结构化草稿，回到面板确认（可逐条删除）后才写入。
- **今日**：每日轮换一条缺点提醒、自我提醒打卡与连续天数、今日到期/逾期待办、学习焦点一键推进 10%。
- **缺点**：名称、描述、触发场景、改进动作、严重程度；「记录一次改进」累积次数与最近日期。
- **学习方向**：方向、目标、资源链接、进度条（0–100）。
- **待办**：快速添加、优先级、截止日期，逾期高亮，未完成/已完成/全部筛选。
- **常驻提醒**：对话输入框下方一条轻量提醒，显示今日提醒和逾期数量，可当天关闭；AI 整理期间显示进度。
- **备份**：顶栏导出/导入 JSON，清空数据。

## 安装

需要先安装 DeepSeek Harness（`dsh`），并确定要安装到的 profile 名称（常见为 `web`，桌面版通常为 `desktop`；可用 `dsh profile list` 查看）。

### 从 GitHub 安装（推荐）

使用固定标签（可复现）：

```sh
dsh plugin --profile web add "git+https://github.com/xmgcode88/dsh-plugin-self-management.git#v1.0.0"
```

或安装默认分支最新版本：

```sh
dsh plugin --profile web add "git+https://github.com/xmgcode88/dsh-plugin-self-management.git"
```

把 `web` 换成你的 profile 名称。如果本机只能通过 SSH 访问 GitHub，先执行一次：

```sh
git config --global url."git@github.com:".insteadOf "https://github.com/"
```

安装后按 DSH 提示重启或刷新页面。侧边栏会出现一个靶心图标（在 Plugins、Schedules 下），点开即「自我管理」；对话输入框下方也会出现提醒条。

### 从插件管理页安装

打开 DSH 的 **插件** 页面，使用「添加插件 / 安装插件」入口，填入本仓库的 Git 地址（`git+https://github.com/xmgcode88/dsh-plugin-self-management.git`）并选择 profile 安装。

### 本地开发

```sh
git clone https://github.com/xmgcode88/dsh-plugin-self-management.git
dsh plugin --profile web add ./dsh-plugin-self-management
```


## 使用

1. 点侧边栏靶心图标打开面板。
2. 手动添加：在「缺点 / 学习 / 待办」标签页里点添加。
3. 一句话生成：点「✨ 一句话生成」→ 输入一句话 → 生成草稿 → 插件自动跳到对话发送给 AI → 回复后回到面板，在顶部「AI 草稿待确认」里删除不要的条目并点「采纳这些」。
4. 每天打开「今日」页，看一眼提醒、打卡；输入框下方的提醒条会跟着你。

> AI 生成需要当前有一个打开的会话；生成会消耗一个模型回合。AI 回复不是合法 JSON 时会显示「AI 整理失败」，可重试。

## 数据与风险

- **数据位置**：浏览器 localStorage（当前 DSH 页面 origin）。清除浏览器站点数据、更换端口或卸载插件前，建议先「导出备份」。
- **隐私**：插件自身不发起任何网络请求；一句话生成会把你的描述作为一条普通用户消息发送到当前对话，由你配置的模型服务处理。
- **权限**：插件以 DSH 进程权限运行，只注册 UI 插槽（主面板、侧边栏图标、输入框下方提醒条），不改核心代码、不注册模型工具、不读取其他插件。
- **无安装脚本**：本包没有 `preinstall/install/postinstall/prepare` 生命周期脚本。

## 兼容性

- 在 DSH `0.2.1-rc.5`（Web / Desktop）上开发并实测。
- 仅 Web 客户端：插件通过 `dsh.client` 注册浏览器端 UI。
- 数据格式 `dsh.self-management.v1`，升级时自动兼容旧数据。

## 开发

```
client.js          # 全部 UI、数据与三个插槽注册（主面板 / 侧边栏图标 / 输入框提醒条）
index.js           # Host 半部分（空 apply，仅让包进入 DSH 插件清单）
cordis.patch.yml   # 插入 self-management 行
locale/*.json      # 插件市场中的标题与说明
icon.svg           # 插件图标
market/index.json  # 官方格式的插件市场索引（本仓库自托管）
```

本地修改后刷新 DSH 页面即可生效（插件以 link 方式安装时）；发布新版本时提升 `package.json` 的 `version`。

## License

MIT
