# 火炬修仙转

单机 · 一命 · 年历行动 · 火炬无限英雄/天赋/功法 × 《凡人修仙传》境界

设计文档：[`docs/GAME_DESIGN.md`](docs/GAME_DESIGN.md)

## 在线试玩

GitHub Pages（推送 `main` 后自动部署）：

**https://100cm.github.io/tli-xiuxian/**

首次部署后需在仓库 **Settings → Pages** 确认 Source 为 **GitHub Actions**。

## 本地运行

```bash
cd web
npm install
npm run dev
```

浏览器打开终端提示的本地地址（默认 `http://localhost:5173`）。

本地模拟 Pages 子路径构建：

```bash
cd web
GITHUB_PAGES=1 npm run build
npx vite preview
```

## 本局流程

1. 选英雄（wiki 全形态 26 位，带头像）
2. 选出身
3. 查看随机天赋盘（不可重掷）
4. 立炼气主修功法
5. 年历行动：闭关、双修、专修、探险、PK、坊市、疗伤、突破……
6. 境界：炼气 → 筑基 → 结丹 → 元婴 → **化神证道**
7. 身死 / 寿尽 / 通关均结束本局（无轮回）

## 技术

- Vite + React + TypeScript
- Zustand 状态 + localStorage 单槽进行中存档
- GitHub Actions → GitHub Pages 自动部署

## 部署说明

| 项 | 说明 |
| --- | --- |
| 工作流 | [`.github/workflows/deploy-pages.yml`](.github/workflows/deploy-pages.yml) |
| 构建目录 | `web/dist` |
| 站点 base | `/tli-xiuxian/`（仅 CI 开启） |
| 触发 | push 到 `main` 或手动 `workflow_dispatch` |
