"use client";

import { useEffect, useRef } from "react";
import { MessageCircle } from "lucide-react";

// ============================================================
// Giscus 配置
// 部署前替换 REPO_ID 和 CATEGORY_ID：
// 1. 启用 GitHub Discussions（仓库 Settings → Features）
// 2. 在 Discussions 中创建 Announcements 分类
// 3. 安装 Giscus App：https://github.com/apps/giscus
// 4. 访问 https://giscus.app 获取 repo-id 和 category-id
// ============================================================
const GISCUS_REPO = "BW-YuChen/Firefly_IV-Web";
const GISCUS_REPO_ID = "R_kgDOSO-siQ";
const GISCUS_CATEGORY = "Announcements";
const GISCUS_CATEGORY_ID = "DIC_kwDOSO-sic4DCOcg";

/**
 * 评论框组件：Giscus（GitHub Discussions）
 * - 每篇文章 slug 唯一映射到一条 Discussion
 * - 首次评论时自动创建 Discussion
 * - 支持暗色/亮色主题动态切换（通过 postMessage 通知 iframe）
 * - 评论提交频率由 GitHub 原生限制，无需额外客户端限流
 */
export function CommentBox({ slug }: { slug: string }) {
    const containerRef = useRef<HTMLDivElement | null>(null);
    const themeAppliedRef = useRef<string>("");

    // 初始化 Giscus
    useEffect(() => {
        if (!containerRef.current) return;

        const currentTheme = document.documentElement.dataset.theme || "light";

        const script = document.createElement("script");
        script.src = "https://giscus.app/client.js";
        script.async = true;
        script.crossOrigin = "anonymous";

        script.setAttribute("data-repo", GISCUS_REPO);
        script.setAttribute("data-repo-id", GISCUS_REPO_ID);
        script.setAttribute("data-category", GISCUS_CATEGORY);
        script.setAttribute("data-category-id", GISCUS_CATEGORY_ID);
        script.setAttribute("data-mapping", "specific");
        script.setAttribute("data-term", slug);
        script.setAttribute("data-strict", "0");
        script.setAttribute("data-reactions-enabled", "1");
        script.setAttribute("data-emit-metadata", "0");
        script.setAttribute("data-input-position", "top");
        script.setAttribute("data-theme", currentTheme === "dark" ? "dark" : "light");
        script.setAttribute("data-lang", "zh-CN");

        // 清空容器并重新加载（slug 变化时重建评论框）
        containerRef.current.innerHTML = "";
        containerRef.current.appendChild(script);
        themeAppliedRef.current = currentTheme;
    }, [slug]);

    // 监听主题变化，动态切换 Giscus 主题
    useEffect(() => {
        const observer = new MutationObserver(() => {
            const newTheme = document.documentElement.dataset.theme || "light";
            if (newTheme === themeAppliedRef.current) return;

            themeAppliedRef.current = newTheme;
            const iframe = containerRef.current?.querySelector<HTMLIFrameElement>(
                "iframe.giscus-frame"
            );
            if (iframe) {
                iframe.contentWindow?.postMessage(
                    {
                        giscus: {
                            setConfig: {
                                theme: newTheme === "dark" ? "dark" : "light",
                            },
                        },
                    },
                    "https://giscus.app"
                );
            }
        });

        observer.observe(document.documentElement, {
            attributes: true,
            attributeFilter: ["data-theme"],
        });

        return () => observer.disconnect();
    }, []);

    return (
        <div className="wiki-comment-box">
            <h3 className="wiki-comment-title">
                <MessageCircle size={18} />
                <span>评论</span>
            </h3>
            <div ref={containerRef} className="wiki-comment-giscus" />
        </div>
    );
}
