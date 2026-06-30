# AGENTS

稳健理财产品推荐平台。技术栈与命令以 `README.md`、`docs/PLAN.md` 和各 `package.json` 的 `scripts` 为准,本文件只记录不显而易见的注意事项。

## Cursor Cloud specific instructions

### 工程结构与服务
- npm workspaces 单仓多包:`server/`(TS + Express + better-sqlite3,API + 爬虫)、`web/`(Vue3 + Vite + Element Plus)。
- 后端 API 端口 `3001`;前端 Vite dev 端口 `5173`,并把 `/api` 代理到 `3001`(见 `web/vite.config.ts`)。
- 命令清单见 `README.md` 的脚本表;不重复。

### 启动顺序(重要)
- 首次或新克隆后,数据库为空,**必须先 `npm run crawl`(或 `npm run seed`)再 `npm run dev`**,否则页面无数据。
- SQLite 文件在 `server/data/licai.db`,已被 gitignore;`server/data/` 目录不入库,故每个新环境都需先跑一次 `crawl`。
- 抓取主流程为「真实优先 + 按产品回退示例」(`run.ts`):汇总各真实适配器数据,再用示例补齐**真实未覆盖**的产品(按 `dedupeKey` 去重),保证五家银行都有内容。每轮抓取前会 `deleteRealData()` + `deleteSamples()` 全量刷新,避免下架/改版残留。
- 真实数据源现状(五家均已建适配器并注册到 `run.ts`):
  - **招商** `adapters/cmb.ts`:官网 JSON 接口,定期存款真实(可靠「高」)。
  - **建设** `adapters/ccb.ts`:官网利率页 iframe(`#detail__`)静态表格解析,定期存款真实(可靠「高」,数据日期以官网为准,可能滞后)。
  - **平安/网商/微众** `adapters/{pingan,mybank,webank}.ts`:best-effort,官网 SPA/反爬静态抓不到,返回空→回退示例(可靠「低」)。
  - 新增/完善真实源:实现 `SourceAdapter` 并在 `run.ts` 的 `ADAPTERS` 注册,产品 `code` 与示例一致即自动去重合并。动态渲染站点可逆向数据接口或引入 Playwright。

### 开发模式注意
- `npm run dev` 用 `concurrently` 同时起后端(`tsx watch`)与前端(`vite`)。后端改 `server/src` 会热重载;但**爬虫只在手动 `npm run crawl` 时运行**,不随 dev 自动刷新数据。
- 重新 `npm run crawl` 后,前端需刷新页面才能看到新数据(无 WebSocket 推送)。

### 数据库 schema 初始化
- `server/src/db.ts` 在模块加载时即调用 `initSchema()` 建表。这是因为 `repo.ts` 在顶层 `prepare` 预编译语句,必须保证表已存在——新增依赖建表的模块时注意保持「先建表后 prepare」。

### 生产/部署(无 Docker)
- `npm run build` 后 `npm start`:Node 单进程在 `3001` 同时托管前端构建产物 `web/dist` 与 `/api`(见 `server/src/index.ts`,仅当 `web/dist` 存在时启用静态托管)。
- 定时更新数据用服务器 `cron` 调 `npm run crawl`(数据更新脚本,与网站常驻进程相互独立)。约定排程为**每周一 00:00**(`0 0 * * 1`);完整 crontab 配置(含 PATH/绝对路径/日志)见 `README.md` 的「定时任务」章节。
- `npm run crawl` 写示例前会先清空旧示例(`deleteSamples`),保证幂等;改动示例 code 也不会残留旧行。

### 用户偏好(务必遵守)
- 业务代码里接口返回的异常不要再 toast Error。
- 变量/字段名尽量与接口文档出入参一致,不要随意延伸或新造参数名。
- 提交作者**永远跟随 git 当前账号**,不要用仓库 local 覆盖 `user.name/user.email`(早前的 wll local 覆盖已移除,以全局/当前配置为准)。
- 不要擅自创建 `.cmd`/`.ps1` 等脚本文件,需先询问。
