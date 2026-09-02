# 暴富专属工作台

> 个人专属移动端单页应用 · 紫色毛玻璃 · 数据本地留存 · 支持安装到主屏

## 📌 项目概要

| 项 | 值 |
|---|---|
| **内容** | 个人专属工作台单页应用（计划/花费/灵感/锻炼/阅读/睡眠闹钟） |
| **时间** | 2026-08-17 立项 · 2026-08-18 部署上线 |
| **版本** | v1.1 |
| **作者** | 暴富 🤑 |
| **部署** | GitHub Pages（公开静态站点） |

## 🎯 在线访问

🌐 https://linzxl93-glitch.github.io/baofu-workbench/

🔑 **访问密码**：`baofu2026`（登录后 7 天免登录；修改请搜索 `app.js` 中的 `PASSWORD` 常量改值后重新部署）

📱 **手机更好用**：用浏览器打开链接 → 点「分享 / 添加到主屏幕」，即可像 App 一样安装，支持系统通知。

## 🗂 文件清单

| 文件 | 用途 |
|---|---|
| `index.html` | 页面结构 + 登录门 + PWA meta |
| `style.css` | 紫色系 + 毛玻璃 + 移动优先响应式 + 睡眠闹钟样式 |
| `app.js` | 6 个模块 + localStorage 数据 + 登录逻辑 + 睡眠闹钟 + Service Worker 注册 |
| `manifest.webmanifest` | PWA 安装清单 |
| `sw.js` | Service Worker（network-first 缓存，保证更新即时生效） |
| `icon-192.png` / `icon-512.png` | PWA 图标（由 `tools/gen_icon.py` 生成） |
| `tools/gen_icon.py` | 图标生成脚本（纯标准库，无需 Pillow） |

## ⚙️ 功能模块

1. **每日计划** — 日期切换（‹ 日期 › 今天）、圆环进度条、非今日只读
2. **每日花费** — 月份切换、月度累计/笔数/日均、按日期筛选
3. **灵感记录** — 累积展示，每条带日期时间戳
4. **锻炼身体** — 6 种快捷按钮（跑步/俯卧撑/深蹲/平板支撑/跳绳/瑜伽）+ 自定义
5. **每日阅读** — 累积记录书名/作者/页数/笔记
6. **睡眠闹钟** — 90 分钟睡眠周期法：以当前时间为起点，列出第 1–10 周期对应醒来时间（含 15 分钟入睡缓冲），点选设闹钟，到点系统通知 + 振动 + 提示音
7. **重置今日** — 底部按钮，仅清空今日计划

## ⏰ 睡眠闹钟说明

依据 R90 睡眠周期理论（Nick Littlehales《睡眠革命》）：

- 一个睡眠周期 ≈ 90 分钟，顺次走完 浅睡 → 深睡 → REM
- **在周期交界（浅睡）醒来最清爽**，深睡被叫醒会昏沉
- 一晚通常 **4–6 个周期**，最推荐 **5 个（约 7.5 小时）**
- 计算：`醒来时间 = 现在 + N×90分钟 + 15分钟（入睡缓冲）`

⚠️ **浏览器限制**：网页闹钟依赖本页面 / 已安装 App 在后台运行才能响铃，锁屏或关闭页面后可能不响。重要起床请同时设手机自带闹钟兜底。

## 🔐 数据存储

- 业务数据存于 `localStorage`，键名 `baofu_workbench_v1`
- 计划按日期分键（`plans['YYYY-MM-DD']`），其余模块按时间戳累积
- 登录状态存 `baofu_auth_v1`（7 天有效期）
- 睡眠闹钟存 `baofu_sleep_alarm_v1`
- 数据全部仅在本机，不上传服务器

## 🛠 技术栈

- 纯 HTML + CSS + JavaScript（无构建工具、无依赖）
- CSS 变量 + 媒体查询 + `backdrop-filter`（毛玻璃）
- 原生 ES6+，无框架
- PWA：`manifest.webmanifest` + `sw.js`（network-first）

## 🚀 重新部署

```bash
cd "G:\自己的工作台"
git add index.html style.css app.js manifest.webmanifest sw.js icon-192.png icon-512.png README.md tools/gen_icon.py
git commit -m "update: 描述改动"
git push origin main
# GitHub Pages 约 30 秒后自动重新构建
```

重新生成图标：

```bash
python tools/gen_icon.py
```

## 🎨 配色

| 用途 | 色值 |
|---|---|
| 主色 | `#7C5CFC` |
| 主色渐变 | `#7C5CFC → #9d83ff` |
| 背景渐变 | `#15102e → #241a52 → #2e1f63` |
| 卡片背景 | `rgba(255,255,255,0.92)` + blur(18px) |

## 📝 修订记录

- **v1.1**（2026-09-02）· 新增睡眠闹钟 + PWA 安装
  - 新增「睡眠闹钟」模块（90 分钟周期法，1–10 周期点选）
  - 新增 PWA 支持（manifest + service worker + 图标），可添加到主屏幕
  - 导航新增第 6 个入口，移动端布局适配 6 按钮
- **v1.0**（2026-08-18）· 首版上线
  - 5 个核心模块 + 登录密码门
  - 移动优先 + 毛玻璃视觉
  - localStorage 本地留存

---

Made with 💜 by 暴富
