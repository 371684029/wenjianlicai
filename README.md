# wenjianlicai · 稳健理财产品推荐平台

聚合 **平安 / 招商 / 建设 / 网商 / 微众** 的理财与存款信息，按「**利率高优先 + 稳健优先**」推荐。
脚本定时拉数据入库（SQLite），后端（TS/Express）提供 API，前端（Vue3）展示。

> 详细方案见 [`docs/PLAN.md`](docs/PLAN.md)。

## 技术栈

- 后端：TypeScript + Express + better-sqlite3（`server/`）
- 前端：Vue 3 + Vite + Element Plus（`web/`）
- 爬虫：TypeScript + axios + cheerio（适配器框架 + 中国理财网 best-effort + 示例种子数据）
- 单仓多包：npm workspaces

## 快速开始

```bash
npm install          # 安装全部依赖（含 server / web 子包）
npm run crawl        # 抓取数据入库（真实数据为空时回退示例数据）
npm run dev          # 同时启动后端(:3001) 与 前端(:5173)
```

打开 http://localhost:5173 查看。

### 常用脚本

| 命令 | 说明 |
| --- | --- |
| `npm run crawl` | 运行爬虫，数据写入 `server/data/licai.db` |
| `npm run seed` | 只写入示例数据 |
| `npm run dev` | 前后端并行开发模式（热更新） |
| `npm run build` | 构建前端 + 编译后端 |
| `npm start` | 生产模式启动 Node 服务（托管 `web/dist` + API，单进程） |
| `npm run lint` | 前后端 lint |

## 部署（无 Docker）

1. 服务器装 Node ≥ 20；`npm install && npm run build`。
2. `npm start` 起 Node 服务（用 PM2 / systemd 守护）。
3. `cron` 定时执行 `npm run crawl` 更新数据。

## 免责声明

数据来自公开渠道，仅供参考，以各银行官方为准；理财非存款、不保本；存款类受《存款保险条例》保障。本平台不提供投资建议。

