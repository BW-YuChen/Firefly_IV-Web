"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

// Giscus iframe 的源站点，用于校验 message 事件来源
const GISCUS_ORIGIN = "https://giscus.app";

/**
 * 评论数组件：消息图标 + 数字
 *
 * 实现方式：监听 Giscus iframe 通过 postMessage 推送的 discussion 元数据
 * （对应 CommentBox 中 data-emit-metadata="1" 的配置）
 *
 * 优势：
 * - 不再发起额外的 fetch 请求到 giscus.app，避免跨域/网络错误（net::ERR_FAILED）
 * - 复用已加载的 Giscus iframe 数据，减少网络开销
 * - 与 CommentBox 的懒加载协同：iframe 加载完成后自动推送评论数
 *
 * 行为：
 * - 加载中（iframe 尚未加载）或无评论时不显示
 * - 评论数在用户滚动到评论区附近（懒加载触发）后才出现
 */
export function CommentCount({ slug }: { slug: string }) {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        // slug 变化时重置，避免显示上一篇文章的评论数
        setCount(null);

        const handler = (event: MessageEvent) => {
            // 严格校验来源，忽略非 Giscus iframe 的消息
            if (event.origin !== GISCUS_ORIGIN) return;
            const data = event.data;
            // Giscus emit-metadata 格式：{ giscus: { discussion: { totalCommentCount, ... } } }
            // discussion 为 null 表示该 term 尚无讨论（文章未被评论）
            if (data?.giscus?.discussion) {
                setCount(data.giscus.discussion.totalCommentCount ?? 0);
            }
        };

        window.addEventListener("message", handler);
        return () => window.removeEventListener("message", handler);
    }, [slug]);

    // 加载中或无评论时不显示，避免布局抖动
    if (count === null || count === 0) return null;

    return (
        <span className="wiki-comment-count" title="评论数">
            <MessageCircle size={14} className="wiki-comment-icon" />
            <span>{count}</span>
        </span>
    );
}
