"use client";

import { useEffect, useState } from "react";
import { MessageCircle } from "lucide-react";

// Giscus 配置（部署前替换为真实值）
const GISCUS_REPO = "BW-YuChen/Firefly_IV-Web";
const GISCUS_CATEGORY = "Announcements";

/**
 * 评论数组件：消息图标 + 数字
 * 通过 Giscus API 异步获取 GitHub Discussions 的评论数量
 * - 加载中不显示，避免布局抖动
 * - 请求失败时不显示（降级处理）
 * - 与 ViewCount 组件风格一致
 */
export function CommentCount({ slug }: { slug: string }) {
    const [count, setCount] = useState<number | null>(null);

    useEffect(() => {
        // Giscus API：按 term（slug）搜索对应的 Discussion
        const url = `https://giscus.app/api/discussions?repo=${GISCUS_REPO}&category=${GISCUS_CATEGORY}&term=${encodeURIComponent(slug)}`;

        fetch(url, { headers: { Accept: "application/json" } })
            .then((res) => res.json())
            .then((data) => {
                if (data && data.discussion) {
                    setCount(data.discussion.totalCommentCount ?? 0);
                } else {
                    setCount(0);
                }
            })
            .catch(() => setCount(null));
    }, [slug]);

    // 加载中或请求失败时不显示
    if (count === null) return null;

    return (
        <span className="wiki-comment-count" title="评论数">
            <MessageCircle size={14} className="wiki-comment-icon" />
            <span>{count}</span>
        </span>
    );
}
