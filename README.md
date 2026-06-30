# wenjianlicai · 稳健理财产品推荐平台

聚合 **平安 / 招商 / 建设 / 网商 / 微众** 五家银行的理财与存款信息，按「**利率高优先 + 稳健优先**」推荐。
定时脚本拉取数据入库（SQLite），后端（TypeScript / Express）提供 API，前端（Vue 3）展示，**支持手机端浏览**。

> 设计方案详见 [`docs/PLAN.md`](docs/PLAN.md)。

---

## 目录

- [功能特性](#功能特性)
- [技术栈](#技术栈)
- [目录结构](#目录结构)
- [环境要求](#环境要求)
- [安装](#安装)
- [数据脚本（爬虫）](#数据脚本爬虫)
- [本地开发](#本地开发)
- [生产构建与部署](#生产构建与部署无-docker)
- [定时任务：每周一午夜运行脚本](#定时任务每周一午夜运行脚本)
- [API 接口](#api-接口)
- [脚本命令一览](#脚本命令一览)
- [数据可靠性与状态说明](#数据可靠性与状态说明)
- [免责声明](#免责声明)

---

## 功能特性

- **推荐榜单**：综合「收益 0.6 + 稳健 0.3 + 数据新鲜度 0.1」打分，默认只收录「存款 / R1 / R2」低风险产品。
- **存款利率一览**：各银行 1 年 / 2 年 / 3 年 / 5 年整存整取定期 + 大额存单利率对比表，每列最高（在售）利率高亮。
- **在售状态**：在售产品优先；不可买（售罄 / 已下架 / 待售）排序靠后并标记、置灰。
- **数据可靠性**：每条数据标注「数据年份」与「可靠等级」（高 = 官方源，中 = 第三方，低 = 示例）。
- **筛选排序**：按银行 / 类型 / 风险筛选，按综合 / 收益 / 期限排序，可切换「仅稳健」「仅在售」。
- **移动端适配**：手机访问自动切换为卡片式布局（列表与利率均为卡片）。

---

## 技术栈

| 层 | 选型 |
| --- | --- |
| 前端 | Vue 3 + Vite + Element Plus + Vue Router（`web/`） |
| 后端 | TypeScript + Express + better-sqlite3（`server/`） |
| 爬虫 | TypeScript + axios + cheerio（适配器框架 + 中国理财网 best-effort + 示例种子数据） |
| 工程 | npm workspaces 单仓多包 |

---

## 目录结构

```
wenjianlicai/
├─ server/                 # 后端 + 爬虫（TypeScript）
│  ├─ src/
│  │  ├─ index.ts          # 服务入口（API + 生产环境托管前端）
│  │  ├─ db.ts             # SQLite 初始化与建表/迁移
│  │  ├─ repo.ts           # 数据仓储（查询/打分/利率矩阵）
│  │  ├─ routes.ts         # REST API 路由
│  │  ├─ scoring.ts        # 推荐打分
│  │  ├─ types.ts          # 领域类型与枚举
│  │  └─ crawler/          # 爬虫
│  │     ├─ run.ts         # 抓取主流程（cron 调用入口）
│  │     ├─ seed.ts        # 仅写入示例数据
│  │     ├─ adapter.ts     # 数据源适配器接口
│  │     ├─ sampleData.ts  # 示例/参考数据
│  │     └─ adapters/      # 各数据源适配器（如中国理财网）
│  └─ data/                # SQLite 数据库文件（自动生成，已 gitignore）
├─ web/                    # 前端（Vue 3）
│  └─ src/
│     ├─ views/            # 页面：Home / Rates / Products
│     ├─ components/       # 组件：ProductTable（桌面表格 / 移动卡片）
│     ├─ api.ts            # 接口封装
│     └─ useIsMobile.ts    # 移动端判断
├─ docs/PLAN.md            # 设计方案
└─ package.json            # 根（npm workspaces + 编排脚本）
```

---

## 环境要求

- **Node.js ≥ 20**（建议 20 LTS 或 22）
- npm ≥ 10（随 Node 安装）
- 操作系统：Linux / macOS（服务器推荐 Ubuntu）

确认版本：

```bash
node -v
npm -v
```

---

## 安装

在仓库根目录执行一次即可（npm workspaces 会同时安装 `server` 与 `web` 的依赖）：

```bash
npm install
```

> 后端 `better-sqlite3` 为原生模块，`npm install` 会自动编译；如失败请确认系统已装 C++ 构建工具（Ubuntu：`sudo apt-get install -y build-essential python3`）。

---

## 数据脚本（爬虫）

数据来自爬虫脚本，写入 SQLite 文件 `server/data/licai.db`。

**首次运行或新部署，必须先跑一次爬虫，否则页面无数据：**

```bash
npm run crawl
```

行为说明：

- 依次运行各数据源适配器（当前含「中国理财网」best-effort 适配器）。
- 真实数据为空时（官网多为动态渲染 / 有反爬，静态抓取通常拿不到），**自动回退写入「示例数据」**，界面会标注「示例」，保证平台可用。
- 写入采用「按 `dedupeKey` 去重 upsert」，重复运行不会产生重复数据；写示例前会先清理旧示例，保持幂等。

只想灌示例数据（不跑真实抓取）：

```bash
npm run seed
```

---

## 本地开发

一键启动前后端（热更新）：

```bash
npm run dev
```

- 后端 API：<http://localhost:3001/api>
- 前端页面：<http://localhost:5173>（Vite 已将 `/api` 代理到后端 3001）

> 注意：爬虫只在手动执行 `npm run crawl` 时运行，不随 dev 自动刷新数据；重新抓取后刷新浏览器即可看到新数据。

单独启动：

```bash
npm run dev:server   # 仅后端
npm run dev:web      # 仅前端
```

代码检查：

```bash
npm run lint
```

---

## 生产构建与部署（无 Docker）

1. 服务器安装 Node ≥ 20，拉取代码后安装依赖并构建：

   ```bash
   npm install
   npm run build          # 构建前端 web/dist + 编译后端 server/dist
   ```

2. 首次灌入数据：

   ```bash
   npm run crawl
   ```

3. 启动服务（**单进程**同时对外提供网站 + API，默认端口 3001）：

   ```bash
   npm start
   ```

   打开 `http://<服务器IP>:3001` 即可访问。

4. 进程守护（推荐 PM2，开机自启、崩溃重启）：

   ```bash
   npm install -g pm2
   pm2 start "npm start" --name licai
   pm2 save
   pm2 startup            # 按提示执行输出的命令以开机自启
   ```

5. （可选）用 Nginx 反向代理到 80/443 端口并配置域名 / HTTPS。

> `PORT` 环境变量可改端口，例如 `PORT=8080 npm start`。

---

## 定时任务：每周一午夜运行脚本

需求：**每周一夜里 12 点（午夜 00:00）自动跑一次爬虫更新数据**。用系统 `cron` 实现（无需常驻进程）。

### 1. 找到 npm 的绝对路径

cron 的环境变量很精简，必须用绝对路径调用 npm：

```bash
which npm        # 例如输出 /usr/bin/npm 或 /root/.nvm/versions/node/v22.x/bin/npm
which node       # 记下 node 所在目录，下一步要加入 PATH
```

### 2. 编辑 crontab

```bash
crontab -e
```

加入下面两行（把路径换成你机器上的实际路径、仓库换成实际目录）：

```cron
# 让 cron 能找到 node/npm（换成 `which node` 输出的目录）
PATH=/usr/local/bin:/usr/bin:/bin:/root/.nvm/versions/node/v22.22.2/bin

# 每周一 00:00 运行爬虫，日志追加到 crawl.log
0 0 * * 1 cd /path/to/wenjianlicai && npm run crawl >> /path/to/wenjianlicai/crawl.log 2>&1
```

> cron 表达式 `0 0 * * 1` 含义：分 0、时 0、每月每天、星期一 → **每周一 00:00**。
>
> 「周一夜里 12 点」如指**周一深夜（即进入周二的那个午夜）**，请改用 `0 0 * * 2`（每周二 00:00）。

### 3. 验证

```bash
crontab -l                 # 查看已配置的定时任务
# 手动模拟一次 cron 调用，确认命令本身可跑通：
cd /path/to/wenjianlicai && npm run crawl
tail -f /path/to/wenjianlicai/crawl.log   # 到点后查看日志
```

> 说明：`npm start` 起的是网站服务（常驻），`npm run crawl` 是一次性数据更新脚本，二者独立；cron 只负责定时跑 `crawl`，无需重启网站，前端刷新即可看到新数据。

---

## API 接口

基础路径 `/api`：

| 方法 | 路径 | 说明 |
| --- | --- | --- |
| GET | `/api/health` | 健康检查 |
| GET | `/api/meta` | 银行/类型/风险枚举、总数、最近更新时间 |
| GET | `/api/products` | 产品列表，支持查询参数（见下） |
| GET | `/api/products/:id` | 单个产品详情 |
| GET | `/api/recommend?limit=10` | 推荐榜单（稳健优先、在售优先） |
| GET | `/api/rates` | 存款利率矩阵（定期存款 + 大额存单） |

`/api/products` 查询参数：`bank`、`category`、`riskLevel`、`stableOnly=true`、`availableOnly=true`、`sort=score|yield|term`、`limit`。

示例：

```bash
curl http://localhost:3001/api/recommend?limit=5
curl "http://localhost:3001/api/products?bank=网商&sort=yield&availableOnly=true"
curl http://localhost:3001/api/rates
```

---

## 脚本命令一览

| 命令 | 说明 |
| --- | --- |
| `npm install` | 安装全部依赖（server + web） |
| `npm run crawl` | 运行爬虫，数据写入 `server/data/licai.db`（cron 调用此命令） |
| `npm run seed` | 仅写入示例数据 |
| `npm run dev` | 前后端并行开发模式（热更新） |
| `npm run dev:server` / `npm run dev:web` | 单独启动后端 / 前端 |
| `npm run build` | 构建前端 + 编译后端 |
| `npm start` | 生产模式启动 Node 服务（单进程托管前端 + API） |
| `npm run lint` | 前后端代码检查 |

---

## 数据可靠性与状态说明

- **可靠等级**：`高`＝官方权威源（中国理财网 / 银行官网）、`中`＝第三方聚合、`低`＝示例 / 参考数据。
- **数据年份**：每条数据标注采集 / 有效日期的年份，便于判断时效。
- **在售状态**：`在售`（可买，优先展示）、`售罄` / `已下架` / `待售`（当前不可买，靠后并置灰标记）。
- 当前默认展示为**示例数据**（界面标注「示例」、可靠等级「低」）；接入真实抓取后会替换为更高可靠等级的数据，适配器接口已就绪（见 `server/src/crawler/adapters/`）。

---

## 免责声明

数据来自公开渠道，仅供参考，以各银行官方为准；理财非存款、不保本，过往业绩不代表未来收益；存款类受《存款保险条例》保障（50 万元以内本息全额偿付）。本平台仅做信息聚合与排序，不提供投资建议。
