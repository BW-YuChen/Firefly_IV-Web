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

// 自定义主题：通过 jsDelivr CDN 加载（不经过 Cloudflare，避免 Giscus 跨域请求被 ERR_ABORTED）
// jsDelivr 直接从 GitHub 仓库拉取，CORS 默认允许 *，且 @main 跟踪最新提交
const GISCUS_LIGHT_THEME = "https://cdn.jsdelivr.net/gh/BW-YuChen/Firefly_IV-Web@main/public/giscus-light.css";
const GISCUS_DARK_THEME = "https://cdn.jsdelivr.net/gh/BW-YuChen/Firefly_IV-Web@main/public/giscus-dark.css";

/**
 * 评论框组件：Giscus（GitHub Discussions）
 * - 每篇文章 slug 唯一映射到一条 Discussion
 * - 首次评论时自动创建 Discussion
 * - 支持暗色/亮色主题动态切换（通过 postMessage 通知 iframe）
 * - 懒加载：滚动到评论区附近才加载 Giscus iframe，减少首屏请求
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
        // 启用元数据推送：iframe 加载完成后通过 postMessage 推送 discussion 元数据
        // 父页面的 CommentCount 组件监听 message 事件获取评论数，避免额外的 fetch 请求
        script.setAttribute("data-emit-metadata", "1");
        script.setAttribute("data-input-position", "top");
        // 使用自定义主题 URL：与站点配色融合
        script.setAttribute("data-theme", currentTheme === "dark" ? GISCUS_DARK_THEME : GISCUS_LIGHT_THEME);
        script.setAttribute("data-lang", "zh-CN");
        // 懒加载：滚动到评论区附近才加载 iframe，减少首屏请求
        script.setAttribute("data-loading", "lazy");

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
                                theme: newTheme === "dark" ? GISCUS_DARK_THEME : GISCUS_LIGHT_THEME,
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
            {/* 预连接 Giscus 与 GitHub 头像域名，加速 iframe 与头像加载
                React 19 会自动把 <link rel=preconnect/dns-prefetch> 提升到 <head> */}
            <link rel="preconnect" href="https://giscus.app" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://giscus.app" />
            <link rel="preconnect" href="https://avatars.githubusercontent.com" crossOrigin="anonymous" />
            <link rel="dns-prefetch" href="https://avatars.githubusercontent.com" />
            <link rel="preconnect" href="https://github.com" />
            <link rel="dns-prefetch" href="https://github.com" />
            <h3 className="wiki-comment-title">
                <MessageCircle size={18} />
                <span>评论</span>
            </h3>
            <div ref={containerRef} className="wiki-comment-giscus" />
        </div>
    );
}
