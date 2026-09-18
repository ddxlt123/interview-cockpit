# 跨设备自动同步配置

应用已经包含邮箱登录、离线记录、自动同步和冲突合并逻辑。完成下面一次性配置后，电脑与手机用同一邮箱登录即可共享收藏和熟练度。

## 1. 创建 Supabase 项目

在 Supabase 控制台新建项目。进入 **SQL Editor**，执行：

`supabase/migrations/202609190001_cloud_progress.sql`

这段迁移会创建学习进度表、行级访问策略和原子合并函数。每个登录用户只能读写自己的记录。

## 2. 配置登录回跳地址

在 **Authentication → URL Configuration** 中设置：

- Site URL：`https://ddxlt123.github.io/interview-cockpit/`
- Redirect URLs：
  - `https://ddxlt123.github.io/interview-cockpit/`
  - `http://127.0.0.1:5173/`
  - `http://localhost:5173/`

应用使用邮箱 Magic Link，不需要保存密码。

## 3. 配置前端环境变量

复制示例文件：

```bash
cp .env.example .env.local
```

在 Supabase 控制台的 **Project Settings → API** 中取得 Project URL 和 publishable key，填写：

```text
VITE_SUPABASE_URL=https://你的项目.supabase.co
VITE_SUPABASE_PUBLISHABLE_KEY=sb_publishable_...
```

publishable key 本来就用于浏览器，可以随前端发布。不要把 `service_role` 或 secret key 放进任何 `VITE_` 环境变量，也不要提交 `.env.local`。

## 4. 验证并发布

```bash
npm test
npm run deploy
```

`npm run deploy` 会依次检查两个云端参数、按 GitHub Pages 路径构建，然后更新 `gh-pages` 分支。如果参数缺失、网址格式不正确，或误用了非 publishable key，命令会在发布前停止，现有在线网站不会被覆盖。

本地验证时运行 `npm run dev`，在同步窗口输入邮箱并点击邮件链接。登录后修改一题的收藏或熟练度，再用另一台设备以同一邮箱登录；两端应自动得到合并后的最新进度。

## 合并规则

- 每道题的“收藏”和“熟练度”分别比较更新时间，较新的操作胜出。
- 两台设备各自新增的题目记录都会保留。
- 离线操作先留在浏览器，恢复网络后自动同步。
- 云端只保存题目标识、收藏、熟练度及更新时间，不上传题干、提示和答案。
- JSON 导入/导出继续保留，可用于额外备份。
