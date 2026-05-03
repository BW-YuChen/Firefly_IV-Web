将图片放置在此目录 `public/images` 下，以便在构建及 Vercel 部署时作为静态资源被直接托管。

使用方法（在 Markdown 中）：

- 绝对路径： `![描述](/images/your.png)`  —— 推荐，简单且稳定。
- HTML 标签： `<img src="/images/your.png" alt="描述" />` —— 可控制宽度/样式。

注意事项：
- 将图片存于 `public/images` 可以保证在 Next.js 构建与 Vercel 部署时静态可访问，URL 为 `/images/文件名`。
- 如果使用 `next/image`，无需额外远程配置，`/images/*` 下的资源可直接作为本地图片使用。
