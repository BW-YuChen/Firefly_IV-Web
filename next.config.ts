import { withContentCollections } from "@content-collections/next";
import type { NextConfig } from "next";

const nextConfig: NextConfig = {
	turbopack: {
		root: process.cwd(),
	},
	images: {
		// 优先 AVIF（比 WebP 小约 20%），不支持的浏览器自动回退 WebP
		formats: ["image/avif", "image/webp"],
		// 设备尺寸断点，next/image 据此生成响应式 srcset
		deviceSizes: [640, 750, 828, 1080, 1200, 1920],
		imageSizes: [16, 32, 48, 64, 96, 128, 256, 384],
		// 允许的 quality 值列表（背景图使用 90 保持视觉无损）
		qualities: [75, 90],
		// AVIF 编码略慢但只算一次，缓存 1 小时
		minimumCacheTTL: 3600,
	},
};

export default withContentCollections(nextConfig);
