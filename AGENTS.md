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
- 真实抓取数据为空时(中国理财网为动态渲染/反爬,静态抓取通常拿不到),`npm run crawl` 会**自动回退写入示例数据**(界面标注「示例」),保证可演示。

### 开发模式注意
- `npm run dev` 用 `concurrently` 同时起后端(`tsx watch`)与前端(`vite`)。后端改 `server/src` 会热重载;但**爬虫只在手动 `npm run crawl` 时运行**,不随 dev 自动刷新数据。
- 重新 `npm run crawl` 后,前端需刷新页面才能看到新数据(无 WebSocket 推送)。

### 数据库 schema 初始化
- `server/src/db.ts` 在模块加载时即调用 `initSchema()` 建表。这是因为 `repo.ts` 在顶层 `prepare` 预编译语句,必须保证表已存在——新增依赖建表的模块时注意保持「先建表后 prepare」。

### 生产/部署(无 Docker)
- `npm run build` 后 `npm start`:Node 单进程在 `3001` 同时托管前端构建产物 `web/dist` 与 `/api`(见 `server/src/index.ts`,仅当 `web/dist` 存在时启用静态托管)。
- 定时更新数据用服务器 `cron` 调 `npm run crawl`。

### 用户偏好(务必遵守)
- 业务代码里接口返回的异常不要再 toast Error。
- 变量/字段名尽量与接口文档出入参一致,不要随意延伸或新造参数名。
- 提交代码作者统一使用 `wll <371684029@qq.com>`(仓库已配置 local git config)。
- 不要擅自创建 `.cmd`/`.ps1` 等脚本文件,需先询问。
